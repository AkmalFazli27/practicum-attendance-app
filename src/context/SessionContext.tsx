import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import {
  IZIN_SEED,
  KEHADIRAN_SEED,
  SESI_SEED,
  USERS,
  type Izin,
  type Kehadiran,
  type Peran,
  type Sesi,
  type StatusIzin,
  type User,
} from '@/data/dummy';
import { klasifikasikanAlasanIzin } from '@/services/ai';
import { formatJam, nowLocalISO } from '@/utils/format';

export type PresensiResult =
  | { ok: true; waktuHadir: string }
  | { ok: false; alasan: string };

export type SesiInput = {
  namaPraktikum: string;
  topik?: string;
  kelas: string;
  lab: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  kapasitas?: number;
  deskripsi: string;
};

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; alasan: string };

export type LogoutResult =
  | { ok: true }
  | { ok: false; alasan: string };

export type RegisterPayload = {
  nama: string;
  email: string;
  password: string;
  peran: Peran;
  nim?: string;
  kelas?: string;
};

export type IzinResult =
  | { ok: true; izin: Izin }
  | { ok: false; alasan: string };

export type SessionContextValue = {
  isLiveFirebase: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  retrySync: () => void;
  users: User[];
  currentUser: User | null;
  sesi: Sesi[];
  kehadiran: Kehadiran[];
  izin: Izin[];
  login: (userId: string) => void;
  loginWithEmail: (
    email: string,
    password: string,
    peranExpected?: Peran,
  ) => Promise<AuthResult>;
  registerUser: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<LogoutResult>;
  openSession: (sesiId: string) => Promise<boolean>;
  closeSession: (sesiId: string) => Promise<boolean>;
  reopenSession: (sesiId: string) => Promise<boolean>;
  createSession: (input: SesiInput) => Promise<Sesi | null>;
  updateSession: (sesiId: string, input: Partial<SesiInput>) => Promise<boolean>;
  deleteSession: (sesiId: string) => Promise<boolean>;
  markAttendance: (sesiId: string) => Promise<PresensiResult>;
  submitIzin: (sesiId: string, alasan: string) => Promise<IzinResult>;
  reviewIzin: (
    izinId: string,
    status: Exclude<StatusIzin, 'MENUNGGU'>,
  ) => Promise<boolean>;
  getSesiById: (sesiId: string) => Sesi | undefined;
  getKehadiranSesi: (sesiId: string) => Kehadiran[];
  getKehadiranPraktikan: (praktikanId: string) => Kehadiran[];
  sudahPresensi: (sesiId: string, praktikanId: string) => Kehadiran | undefined;
  getIzinSesi: (sesiId: string) => Izin[];
  getIzinPraktikan: (praktikanId: string) => Izin[];
  getIzinBySesiPraktikan: (sesiId: string, praktikanId: string) => Izin | undefined;
};

const AUTH_LOAD_TIMEOUT_MS = 9000;

/**
 * Menerjemahkan kode error Firestore / Firebase ke Bahasa Indonesia yang ramah pengguna
 * agar pesan error mentah berbahasa Inggris tidak bocor ke antarmuka.
 */
function terjemahkanErrorFirestore(err: any, pesanDefault: string): string {
  const rawCode = String(err?.code || '').toLowerCase();
  const code = rawCode.replace(/^(firestore|auth)\//, '');

  switch (code) {
    case 'permission-denied':
    case 'unauthenticated':
      return 'Akses ditolak oleh server. Pastikan peran akun Anda sesuai dan sesi masih aktif.';
    case 'unavailable':
    case 'network-request-failed':
      return 'Layanan tidak dapat dijangkau saat ini. Periksa koneksi internet Anda lalu coba lagi.';
    case 'failed-precondition':
      return 'Operasi tidak dapat dijalankan karena prasyarat data belum terpenuhi.';
    case 'resource-exhausted':
    case 'too-many-requests':
      return 'Batas kuota permintaan tercapai. Silakan tunggu beberapa saat lalu coba lagi.';
    case 'deadline-exceeded':
      return 'Waktu koneksi ke server habis. Periksa jaringan Anda lalu coba lagi.';
    case 'not-found':
      return 'Data yang diminta tidak ditemukan di server.';
    case 'already-exists':
      return 'Data tersebut sudah tercatat sebelumnya.';
    default:
      return pesanDefault;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [syncVersion, setSyncVersion] = useState<number>(0);

  const [users, setUsers] = useState<User[]>(
    isFirebaseConfigured ? [] : USERS,
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sesi, setSesi] = useState<Sesi[]>(
    isFirebaseConfigured ? [] : SESI_SEED,
  );
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>(
    isFirebaseConfigured ? [] : KEHADIRAN_SEED,
  );
  const [izin, setIzin] = useState<Izin[]>(
    isFirebaseConfigured ? [] : IZIN_SEED,
  );

  // Menyimpan profil sementara saat proses registrasi berlangsung untuk mencegah
  // race condition antara createUserWithEmailAndPassword dan onAuthStateChanged
  const pendingRegisterUserRef = useRef<User | null>(null);

  // Token generasi autentikasi untuk mencegah ghost user race condition
  // ketika hasil getDoc lama baru selesai setelah logout atau ganti akun
  const authGenRef = useRef<number>(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const retrySync = useCallback(() => {
    setError(null);
    setSyncVersion((v) => v + 1);
  }, []);

  // ===========================================================================
  // 1. LISTENER AUTH & KOLEKSI PUBLIK (`sesi`) DENGAN TIMEOUT (9 DETIK)
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    let authReady = false;
    let sesiReady = false;

    const timeoutId = setTimeout(() => {
      if (!cancelled && (!authReady || !sesiReady)) {
        authReady = true;
        sesiReady = true;
        setError(
          'Waktu muat sesi habis. Periksa koneksi internet Anda lalu coba lagi.',
        );
        setLoading(false);
      }
    }, AUTH_LOAD_TIMEOUT_MS);

    const checkReady = () => {
      if (!cancelled && authReady && sesiReady) {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        const myGen = ++authGenRef.current;

        if (!fbUser) {
          pendingRegisterUserRef.current = null;
          if (!cancelled && authGenRef.current === myGen) {
            setCurrentUser(null);
          }
          authReady = true;
          checkReady();
          return;
        }

        // Jika sedang dalam proses registrasi dan profil sudah disiapkan di ref,
        // gunakan profil tersebut selama setDoc sedang berjalan
        const pendingUser = pendingRegisterUserRef.current;
        if (pendingUser && pendingUser.id === fbUser.uid) {
          if (!cancelled && authGenRef.current === myGen) {
            setCurrentUser(pendingUser);
          }
          authReady = true;
          checkReady();
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));

          // Cegah ghost user: pastikan tidak ada perubahan auth state selama await getDoc
          if (
            cancelled ||
            authGenRef.current !== myGen ||
            auth.currentUser?.uid !== fbUser.uid
          ) {
            return;
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.peran !== 'asisten' && data.peran !== 'praktikan') {
              await signOut(auth);
              setCurrentUser(null);
              setError('Profil pengguna tidak ditemukan.');
            } else {
              setCurrentUser({
                id: fbUser.uid,
                nama: data.nama || fbUser.displayName || 'Pengguna TapIn',
                email: data.email || fbUser.email || '',
                nim: data.nim || undefined,
                kelas: data.kelas || undefined,
                peran: data.peran,
              });
              setError(null);
            }
          } else if (
            pendingRegisterUserRef.current &&
            pendingRegisterUserRef.current.id === fbUser.uid
          ) {
            setCurrentUser(pendingRegisterUserRef.current);
          } else {
            // Fail closed: akun Auth tanpa dokumen profil di koleksi `users` ditolak
            await signOut(auth);
            setCurrentUser(null);
            setError('Profil pengguna tidak ditemukan.');
          }
        } catch (err: any) {
          if (
            !cancelled &&
            authGenRef.current === myGen &&
            auth.currentUser?.uid === fbUser.uid
          ) {
            if (
              pendingRegisterUserRef.current &&
              pendingRegisterUserRef.current.id === fbUser.uid
            ) {
              setCurrentUser(pendingRegisterUserRef.current);
            } else {
              setError(
                terjemahkanErrorFirestore(
                  err,
                  'Gagal memuat profil pengguna dari server.',
                ),
              );
            }
          }
        } finally {
          authReady = true;
          checkReady();
        }
      },
    );

    // Sesi praktikum bersifat public read di firestore.rules
    const sesiQuery = query(collection(db, 'sesi'));
    const unsubscribeSesi = onSnapshot(
      sesiQuery,
      (snapshot) => {
        if (cancelled) return;
        const liveSesi: Sesi[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            namaPraktikum: d.namaPraktikum || '',
            topik: d.topik || '',
            kelas: d.kelas || '',
            lab: d.lab || '',
            tanggal: d.tanggal || '',
            jamMulai: d.jamMulai || '',
            jamSelesai: d.jamSelesai || '',
            kapasitas: typeof d.kapasitas === 'number' ? d.kapasitas : 30,
            asistenId: d.asistenId || '',
            status: d.status || 'TERJADWAL',
            deskripsi: d.deskripsi || '',
          };
        });
        setSesi(liveSesi);
        sesiReady = true;
        checkReady();
      },
      (err) => {
        if (cancelled) return;
        setError(
          terjemahkanErrorFirestore(err, 'Gagal memuat jadwal sesi praktikum.'),
        );
        sesiReady = true;
        checkReady();
      },
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsubscribeAuth();
      unsubscribeSesi();
    };
  }, [syncVersion]);

  // ===========================================================================
  // 2. LISTENER KOLEKSI TERAUTENTIKASI (`users`, `kehadiran`, `izin`)
  // Dipasang hanya setelah pengguna login & disesuaikan perannya (privasi rules)
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    if (!currentUser?.id) {
      setKehadiran([]);
      setIzin([]);
      setUsers([]);
      return;
    }

    const uid = currentUser.id;
    const isAsistenRole = currentUser.peran === 'asisten';

    // Sinkronisasi dokumen profil pengguna aktif secara real-time
    const unsubscribeSelf = onSnapshot(
      doc(db, 'users', uid),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const d = docSnap.data();
        if (d.peran !== 'asisten' && d.peran !== 'praktikan') return;
        setCurrentUser((prev) => {
          if (!prev || prev.id !== uid) return prev;
          return {
            id: uid,
            nama: d.nama || prev.nama,
            email: d.email || prev.email,
            nim: d.nim || undefined,
            kelas: d.kelas || undefined,
            peran: d.peran,
          };
        });
      },
      () => {},
    );

    // Asisten membaca daftar pengguna untuk kebutuhan rekap; praktikan hanya membaca profilnya sendiri
    let unsubscribeUsers: (() => void) | null = null;
    if (isAsistenRole) {
      const usersQuery = query(collection(db, 'users'));
      unsubscribeUsers = onSnapshot(
        usersQuery,
        (snapshot) => {
          const liveUsers: User[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              nama: d.nama || 'Pengguna TapIn',
              email: d.email || '',
              nim: d.nim || undefined,
              kelas: d.kelas || undefined,
              peran: d.peran === 'asisten' ? 'asisten' : 'praktikan',
            };
          });
          setUsers(liveUsers);
        },
        (err) => {
          setError(
            terjemahkanErrorFirestore(
              err,
              'Gagal menyinkronkan daftar pengguna.',
            ),
          );
        },
      );
    } else {
      setUsers([currentUser]);
    }

    // Asisten menyinkronkan seluruh kehadiran; praktikan hanya menyinkronkan kehadirannya sendiri
    const kehadiranQuery = isAsistenRole
      ? query(collection(db, 'kehadiran'))
      : query(collection(db, 'kehadiran'), where('praktikanId', '==', uid));

    const unsubscribeKehadiran = onSnapshot(
      kehadiranQuery,
      (snapshot) => {
        const liveKehadiran: Kehadiran[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            sesiId: d.sesiId || '',
            praktikanId: d.praktikanId || '',
            namaPraktikan: d.namaPraktikan || undefined,
            nimPraktikan: d.nimPraktikan || undefined,
            kelasPraktikan: d.kelasPraktikan || undefined,
            waktuHadir: d.waktuHadir || '',
          };
        });
        setKehadiran(liveKehadiran);
      },
      (err) => {
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal menyinkronkan data kehadiran secara real-time.',
          ),
        );
      },
    );

    // Asisten menyinkronkan seluruh izin; praktikan hanya menyinkronkan izinnya sendiri
    const izinQuery = isAsistenRole
      ? query(collection(db, 'izin'))
      : query(collection(db, 'izin'), where('praktikanId', '==', uid));

    const unsubscribeIzin = onSnapshot(
      izinQuery,
      (snapshot) => {
        const liveIzin: Izin[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          const waktuKeputusan = d.waktuKeputusan || d.reviewedAt || undefined;
          return {
            id: docSnap.id,
            sesiId: d.sesiId || '',
            praktikanId: d.praktikanId || '',
            namaPraktikan: d.namaPraktikan || undefined,
            nimPraktikan: d.nimPraktikan || undefined,
            kelasPraktikan: d.kelasPraktikan || undefined,
            alasan: d.alasan || '',
            kategoriAi: d.kategoriAi || 'Belum Terklasifikasi',
            ringkasanAi: d.ringkasanAi || undefined,
            status: d.status || 'MENUNGGU',
            waktuPengajuan: d.waktuPengajuan || '',
            waktuKeputusan,
            reviewedAt: d.reviewedAt || waktuKeputusan,
            reviewedBy: d.reviewedBy || undefined,
          };
        });
        setIzin(liveIzin);
      },
      (err) => {
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal menyinkronkan data perizinan secara real-time.',
          ),
        );
      },
    );

    return () => {
      unsubscribeSelf();
      if (unsubscribeUsers) unsubscribeUsers();
      unsubscribeKehadiran();
      unsubscribeIzin();
    };
  }, [currentUser?.id, currentUser?.peran, syncVersion]);

  // Gabungkan daftar users dari koleksi `users` dengan fallback denormalisasi
  // dari dokumen `kehadiran` & `izin` agar tampilan Asisten tidak pernah kehilangan nama/NIM
  const mergedUsers = useMemo<User[]>(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      map.set(u.id, u);
    }
    if (currentUser) {
      map.set(currentUser.id, currentUser);
    }
    for (const k of kehadiran) {
      if (k.praktikanId && !map.has(k.praktikanId) && k.namaPraktikan) {
        map.set(k.praktikanId, {
          id: k.praktikanId,
          nama: k.namaPraktikan,
          nim: k.nimPraktikan,
          kelas: k.kelasPraktikan,
          peran: 'praktikan',
        });
      }
    }
    for (const i of izin) {
      if (i.praktikanId && !map.has(i.praktikanId) && i.namaPraktikan) {
        map.set(i.praktikanId, {
          id: i.praktikanId,
          nama: i.namaPraktikan,
          nim: i.nimPraktikan,
          kelas: i.kelasPraktikan,
          peran: 'praktikan',
        });
      }
    }
    return Array.from(map.values());
  }, [users, currentUser, kehadiran, izin]);

  // ===========================================================================
  // FUNGSI AUTENTIKASI
  // ===========================================================================

  const login = (userId: string) => {
    const userDitemukan = mergedUsers.find((u) => u.id === userId);
    if (userDitemukan) {
      setCurrentUser(userDitemukan);
    }
  };

  const loginWithEmail = async (
    emailInput: string,
    passwordInput: string,
    peranExpected?: Peran,
  ): Promise<AuthResult> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    // Jangan trim password agar spasi yang disengaja di awal/akhir tidak berubah diam-diam
    const rawPassword = passwordInput;

    if (!cleanEmail || rawPassword.length === 0) {
      return { ok: false, alasan: 'Email dan kata sandi tidak boleh kosong.' };
    }

    if (isFirebaseConfigured) {
      const myGen = ++authGenRef.current;
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          rawPassword,
        );
        const fbUid = userCredential.user.uid;

        const userDoc = await getDoc(doc(db, 'users', fbUid));

        // Cegah ghost user apabila sesi sudah berganti saat menunggu getDoc
        if (auth.currentUser?.uid !== fbUid || authGenRef.current !== myGen) {
          return {
            ok: false,
            alasan: 'Sesi autentikasi berubah. Silakan coba masuk kembali.',
          };
        }

        // Fail closed jika dokumen profil users/{uid} tidak ada atau peran tidak valid
        if (!userDoc.exists()) {
          await signOut(auth);
          setCurrentUser(null);
          return {
            ok: false,
            alasan: 'Profil pengguna tidak ditemukan.',
          };
        }

        const d = userDoc.data();
        if (d.peran !== 'asisten' && d.peran !== 'praktikan') {
          await signOut(auth);
          setCurrentUser(null);
          return {
            ok: false,
            alasan: 'Profil pengguna tidak ditemukan.',
          };
        }

        const peranAkun: Peran = d.peran;

        if (peranExpected && peranAkun !== peranExpected) {
          await signOut(auth);
          setCurrentUser(null);
          return {
            ok: false,
            alasan: `Akun ini terdaftar sebagai ${peranAkun}, bukan ${peranExpected}.`,
          };
        }

        const userProfil: User = {
          id: fbUid,
          nama: d.nama || userCredential.user.displayName || 'Pengguna TapIn',
          email: d.email || cleanEmail,
          nim: d.nim || undefined,
          kelas: d.kelas || undefined,
          peran: peranAkun,
        };

        setCurrentUser(userProfil);
        setError(null);
        return { ok: true, user: userProfil };
      } catch (err: any) {
        let pesan = 'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
        if (
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/invalid-login-credentials' ||
          err?.code === 'auth/wrong-password'
        ) {
          pesan = 'Email atau kata sandi salah.';
        } else if (err?.code === 'auth/user-not-found') {
          pesan = 'Akun dengan email ini tidak ditemukan.';
        } else if (
          err?.code === 'auth/invalid-email' ||
          err?.code === 'auth/missing-email'
        ) {
          pesan = 'Format alamat email tidak valid.';
        } else if (err?.code === 'auth/too-many-requests') {
          pesan = 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
        } else if (err?.code === 'auth/user-disabled') {
          pesan = 'Akun ini telah dinonaktifkan.';
        } else if (err?.code === 'auth/network-request-failed') {
          pesan =
            'Tidak dapat terhubung ke server Firebase. Periksa koneksi internetmu.';
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / lokal (ketika .env belum dikonfigurasi)
    const userDitemukan = users.find(
      (u) => u.email?.toLowerCase() === cleanEmail,
    );

    if (!userDitemukan) {
      return {
        ok: false,
        alasan: 'Profil pengguna tidak ditemukan.',
      };
    }

    if (peranExpected && userDitemukan.peran !== peranExpected) {
      return {
        ok: false,
        alasan: `Akun ini terdaftar sebagai ${userDitemukan.peran}, bukan ${peranExpected}.`,
      };
    }

    setCurrentUser(userDitemukan);
    return { ok: true, user: userDitemukan };
  };

  const registerUser = async (
    payload: RegisterPayload,
  ): Promise<AuthResult> => {
    const cleanNama = payload.nama.trim();
    const cleanEmail = payload.email.trim().toLowerCase();
    // Jangan trim password agar karakter spasi pengguna tidak terpotong diam-diam
    const rawPassword = payload.password;
    const cleanNim = (payload.nim || '').trim();
    const cleanKelas = (payload.kelas || '').trim().toUpperCase();

    if (!cleanNama || !cleanEmail || rawPassword.length === 0) {
      return { ok: false, alasan: 'Nama, email, dan kata sandi wajib diisi.' };
    }

    if (payload.peran === 'praktikan' && (!cleanNim || !cleanKelas)) {
      return {
        ok: false,
        alasan: 'NIM dan Kelas wajib diisi untuk praktikan.',
      };
    }

    if (rawPassword.length < 6) {
      return { ok: false, alasan: 'Kata sandi minimal 6 karakter.' };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          rawPassword,
        );
        const fbUid = userCredential.user.uid;

        const userObj: User = {
          id: fbUid,
          nama: cleanNama,
          email: cleanEmail,
          peran: payload.peran,
          nim: cleanNim || undefined,
          kelas: payload.peran === 'praktikan' ? cleanKelas : undefined,
        };

        // Simpan ke ref terlebih dahulu agar onAuthStateChanged tidak menimpa
        // peran pengguna sebelum dokumen Firestore selesai ditulis
        pendingRegisterUserRef.current = userObj;

        const dataDoc = {
          nama: cleanNama,
          email: cleanEmail,
          peran: payload.peran,
          nim: cleanNim,
          kelas: payload.peran === 'praktikan' ? cleanKelas : '',
          createdAt: serverTimestamp(),
        };

        try {
          await setDoc(doc(db, 'users', fbUid), dataDoc);
        } catch (firestoreErr: any) {
          // Rollback akun Firebase Auth yatim (orphan) jika penulisan profil ke Firestore gagal
          pendingRegisterUserRef.current = null;
          setCurrentUser(null);
          try {
            await deleteUser(userCredential.user);
          } catch {
            try {
              await signOut(auth);
            } catch {}
          }

          const isPermissionDenied = String(firestoreErr?.code || '')
            .toLowerCase()
            .includes('permission-denied');
          if (isPermissionDenied && payload.peran === 'asisten') {
            return {
              ok: false,
              alasan:
                'Pendaftaran mandiri hanya untuk Praktikan. Akun Asisten dibuat melalui Admin/Console.',
            };
          }

          return {
            ok: false,
            alasan: terjemahkanErrorFirestore(
              firestoreErr,
              'Gagal menyimpan profil pengguna ke database. Silakan coba lagi.',
            ),
          };
        }

        pendingRegisterUserRef.current = null;
        setCurrentUser(userObj);
        setError(null);
        return { ok: true, user: userObj };
      } catch (err: any) {
        pendingRegisterUserRef.current = null;
        let pesan = 'Gagal mendaftarkan akun.';
        if (err?.code === 'auth/email-already-in-use') {
          pesan = 'Email ini sudah terdaftar. Silakan masuk.';
        } else if (err?.code === 'auth/invalid-email') {
          pesan = 'Format alamat email tidak valid.';
        } else if (err?.code === 'auth/weak-password') {
          pesan = 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
        } else if (err?.code === 'auth/network-request-failed') {
          pesan =
            'Tidak dapat terhubung ke server. Periksa koneksi internetmu.';
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / lokal
    const sudahAda = users.some((u) => u.email?.toLowerCase() === cleanEmail);
    if (sudahAda) {
      return {
        ok: false,
        alasan: 'Email ini sudah terdaftar. Silakan masuk.',
      };
    }

    const idBaru = `user-${Date.now()}`;
    const userBaru: User = {
      id: idBaru,
      nama: cleanNama,
      email: cleanEmail,
      peran: payload.peran,
      nim: cleanNim || undefined,
      kelas: payload.peran === 'praktikan' ? cleanKelas : undefined,
    };

    setUsers((prev) => [...prev, userBaru]);
    setCurrentUser(userBaru);
    return { ok: true, user: userBaru };
  };

  const logout = async (): Promise<LogoutResult> => {
    pendingRegisterUserRef.current = null;
    authGenRef.current += 1;
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch (err: any) {
        const alasan = terjemahkanErrorFirestore(
          err,
          'Gagal keluar dari akun. Periksa koneksi internet Anda.',
        );
        setError(alasan);
        return { ok: false, alasan };
      }
    }
    setCurrentUser(null);
    setError(null);
    return { ok: true };
  };

  // ===========================================================================
  // FUNGSI KELOLA SESI PRAKTIKUM (CRUD ASISTEN)
  // ===========================================================================

  const openSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'DIBUKA' });
        return true;
      } catch (err: any) {
        setError(terjemahkanErrorFirestore(err, 'Gagal membuka sesi praktikum.'));
        return false;
      }
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'DIBUKA' } : s)),
    );
    return true;
  };

  const closeSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'SELESAI' });
        return true;
      } catch (err: any) {
        setError(terjemahkanErrorFirestore(err, 'Gagal menutup sesi praktikum.'));
        return false;
      }
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'SELESAI' } : s)),
    );
    return true;
  };

  const reopenSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'DIBUKA' });
        return true;
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(err, 'Gagal membuka kembali sesi praktikum.'),
        );
        return false;
      }
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'DIBUKA' } : s)),
    );
    return true;
  };

  const createSession = async (input: SesiInput): Promise<Sesi | null> => {
    if (!currentUser || currentUser.peran !== 'asisten') {
      return null;
    }

    const sesiBaruData = {
      namaPraktikum: input.namaPraktikum.trim(),
      topik: (input.topik || '').trim(),
      kelas: input.kelas.trim().toUpperCase(),
      lab: input.lab.trim(),
      tanggal: input.tanggal.trim(),
      jamMulai: input.jamMulai.trim(),
      jamSelesai: input.jamSelesai.trim(),
      kapasitas: input.kapasitas || 30,
      asistenId: currentUser.id,
      status: 'TERJADWAL' as const,
      deskripsi: input.deskripsi.trim(),
    };

    if (isFirebaseConfigured) {
      try {
        const docRef = await addDoc(collection(db, 'sesi'), sesiBaruData);
        return { id: docRef.id, ...sesiBaruData };
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal menambahkan sesi praktikum baru.',
          ),
        );
        return null;
      }
    }

    const sesiBaru: Sesi = {
      id: `sesi-${Date.now()}`,
      ...sesiBaruData,
    };
    setSesi((prev) => [sesiBaru, ...prev]);
    return sesiBaru;
  };

  const updateSession = async (
    sesiId: string,
    input: Partial<SesiInput>,
  ): Promise<boolean> => {
    const cleanPatch: Record<string, any> = {};
    if (typeof input.namaPraktikum === 'string') {
      cleanPatch.namaPraktikum = input.namaPraktikum.trim();
    }
    if (typeof input.topik === 'string') {
      cleanPatch.topik = input.topik.trim();
    }
    if (typeof input.kelas === 'string') {
      cleanPatch.kelas = input.kelas.trim().toUpperCase();
    }
    if (typeof input.lab === 'string') {
      cleanPatch.lab = input.lab.trim();
    }
    if (typeof input.tanggal === 'string') {
      cleanPatch.tanggal = input.tanggal.trim();
    }
    if (typeof input.jamMulai === 'string') {
      cleanPatch.jamMulai = input.jamMulai.trim();
    }
    if (typeof input.jamSelesai === 'string') {
      cleanPatch.jamSelesai = input.jamSelesai.trim();
    }
    if (typeof input.deskripsi === 'string') {
      cleanPatch.deskripsi = input.deskripsi.trim();
    }
    if (typeof input.kapasitas === 'number') {
      cleanPatch.kapasitas = input.kapasitas;
    }

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), cleanPatch);
        return true;
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal memperbarui data sesi praktikum.',
          ),
        );
        return false;
      }
    }

    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, ...cleanPatch } : s)),
    );
    return true;
  };

  const deleteSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        // Hapus seluruh dokumen anak (kehadiran & izin) beserta dokumen sesi dalam satu batch
        const [kehadiranSnap, izinSnap] = await Promise.all([
          getDocs(
            query(collection(db, 'kehadiran'), where('sesiId', '==', sesiId)),
          ),
          getDocs(query(collection(db, 'izin'), where('sesiId', '==', sesiId))),
        ]);

        const batch = writeBatch(db);
        kehadiranSnap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        izinSnap.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        batch.delete(doc(db, 'sesi', sesiId));

        await batch.commit();
        return true;
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(err, 'Gagal menghapus sesi praktikum.'),
        );
        return false;
      }
    }
    setSesi((prev) => prev.filter((s) => s.id !== sesiId));
    setKehadiran((prev) => prev.filter((k) => k.sesiId !== sesiId));
    setIzin((prev) => prev.filter((i) => i.sesiId !== sesiId));
    return true;
  };

  // ===========================================================================
  // FUNGSI PRESENSI PRAKTIKAN
  // ===========================================================================

  const markAttendance = async (sesiId: string): Promise<PresensiResult> => {
    if (!currentUser) {
      return { ok: false, alasan: 'Pengguna belum masuk.' };
    }
    if (currentUser.peran !== 'praktikan') {
      return {
        ok: false,
        alasan: 'Hanya praktikan yang dapat melakukan presensi.',
      };
    }

    const sesiTarget = sesi.find((s) => s.id === sesiId);
    if (!sesiTarget) {
      return { ok: false, alasan: 'Sesi praktikum tidak ditemukan.' };
    }
    if (sesiTarget.status !== 'DIBUKA') {
      return {
        ok: false,
        alasan: 'Presensi hanya dapat dilakukan saat sesi berstatus DIBUKA.',
      };
    }

    // Guard kelas praktikan
    if (
      currentUser.kelas &&
      sesiTarget.kelas.trim().toUpperCase() !==
        currentUser.kelas.trim().toUpperCase()
    ) {
      return {
        ok: false,
        alasan: 'Sesi ini bukan untuk kelas praktikum kamu.',
      };
    }

    // Guard izin pada sesi yang sama
    const izinAda = izin.find(
      (i) => i.sesiId === sesiId && i.praktikanId === currentUser.id,
    );
    if (izinAda) {
      return {
        ok: false,
        alasan: `Kamu sudah mengajukan izin untuk sesi ini (status: ${izinAda.status}).`,
      };
    }

    // Guard presensi ganda
    const presensiLama = kehadiran.find(
      (k) => k.sesiId === sesiId && k.praktikanId === currentUser.id,
    );
    if (presensiLama) {
      return {
        ok: false,
        alasan: `Kamu sudah presensi pada pukul ${formatJam(presensiLama.waktuHadir)}.`,
      };
    }

    const waktuHadir = nowLocalISO();
    const docId = `${sesiId}_${currentUser.id}`;
    const catatanBaru: Kehadiran = {
      id: docId,
      sesiId,
      praktikanId: currentUser.id,
      namaPraktikan: currentUser.nama,
      nimPraktikan: currentUser.nim || '',
      kelasPraktikan: currentUser.kelas || '',
      waktuHadir,
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'kehadiran', docId), {
          sesiId,
          praktikanId: currentUser.id,
          namaPraktikan: currentUser.nama,
          nimPraktikan: currentUser.nim || '',
          kelasPraktikan: currentUser.kelas || '',
          waktuHadir,
        });
        return { ok: true, waktuHadir };
      } catch (err: any) {
        return {
          ok: false,
          alasan: terjemahkanErrorFirestore(
            err,
            'Gagal menyimpan presensi ke server. Periksa koneksi internet Anda.',
          ),
        };
      }
    }

    setKehadiran((prev) =>
      prev.some((k) => k.id === docId) ? prev : [...prev, catatanBaru],
    );
    return { ok: true, waktuHadir };
  };

  // ===========================================================================
  // FUNGSI PENGAJUAN & PEMERIKSAAN IZIN (BERBANTUAN MODEL AI)
  // ===========================================================================

  const submitIzin = async (
    sesiId: string,
    alasanInput: string,
  ): Promise<IzinResult> => {
    if (!currentUser) {
      return { ok: false, alasan: 'Pengguna belum masuk.' };
    }
    if (currentUser.peran !== 'praktikan') {
      return { ok: false, alasan: 'Hanya praktikan yang dapat mengajukan izin.' };
    }

    const sesiTarget = sesi.find((s) => s.id === sesiId);
    if (!sesiTarget) {
      return { ok: false, alasan: 'Sesi praktikum tidak ditemukan.' };
    }
    if (sesiTarget.status === 'SELESAI') {
      return {
        ok: false,
        alasan: 'Tidak dapat mengajukan izin pada sesi yang sudah selesai.',
      };
    }

    const sudahHadir = kehadiran.find(
      (k) => k.sesiId === sesiId && k.praktikanId === currentUser.id,
    );
    if (sudahHadir) {
      return {
        ok: false,
        alasan: 'Kamu sudah tercatat hadir pada sesi ini.',
      };
    }

    const izinLama = izin.find(
      (i) => i.sesiId === sesiId && i.praktikanId === currentUser.id,
    );
    if (izinLama) {
      return {
        ok: false,
        alasan: 'Kamu sudah mengajukan izin untuk sesi ini.',
      };
    }

    const teksAlasan = alasanInput.trim();
    if (teksAlasan.length < 10) {
      return { ok: false, alasan: 'Alasan izin minimal 10 karakter.' };
    }

    // Panggil service integrasi API AI pengajar (dengan timeout & fallback "Belum Terklasifikasi")
    const hasilAi = await klasifikasikanAlasanIzin(teksAlasan);

    const waktuPengajuan = nowLocalISO();
    const docId = `${sesiId}_${currentUser.id}`;
    const izinBaruData = {
      sesiId,
      praktikanId: currentUser.id,
      namaPraktikan: currentUser.nama,
      nimPraktikan: currentUser.nim || '',
      kelasPraktikan: currentUser.kelas || '',
      alasan: teksAlasan,
      kategoriAi: hasilAi.kategori,
      ringkasanAi: hasilAi.keterangan || 'Hasil klasifikasi inferensi AI',
      status: 'MENUNGGU' as const,
      waktuPengajuan,
    };

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'izin', docId), izinBaruData);
        const izinTersimpan: Izin = { id: docId, ...izinBaruData };
        return { ok: true, izin: izinTersimpan };
      } catch (err: any) {
        return {
          ok: false,
          alasan: terjemahkanErrorFirestore(
            err,
            'Gagal menyimpan pengajuan izin ke server. Periksa koneksi internet Anda.',
          ),
        };
      }
    }

    const izinBaru: Izin = {
      id: docId,
      ...izinBaruData,
    };

    setIzin((prev) =>
      prev.some((i) => i.id === docId) ? prev : [izinBaru, ...prev],
    );
    return { ok: true, izin: izinBaru };
  };

  const reviewIzin = async (
    izinId: string,
    status: Exclude<StatusIzin, 'MENUNGGU'>,
  ): Promise<boolean> => {
    if (!currentUser || currentUser.peran !== 'asisten') {
      return false;
    }

    const izinTarget = izin.find((item) => item.id === izinId);
    if (izinTarget && izinTarget.status !== 'MENUNGGU') {
      return false;
    }

    const waktuKeputusan = nowLocalISO();

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'izin', izinId), {
          status,
          waktuKeputusan,
          reviewedAt: waktuKeputusan,
          reviewedBy: currentUser.id,
        });
        return true;
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal menyimpan keputusan pemeriksaan izin.',
          ),
        );
        return false;
      }
    }

    setIzin((prev) =>
      prev.map((item) =>
        item.id === izinId
          ? {
              ...item,
              status,
              waktuKeputusan,
              reviewedAt: waktuKeputusan,
              reviewedBy: currentUser.id,
            }
          : item,
      ),
    );
    return true;
  };

  // Helper getters
  function getSesiById(sesiId: string) {
    return sesi.find((item) => item.id === sesiId);
  }

  function getKehadiranSesi(sesiId: string) {
    return kehadiran.filter((item) => item.sesiId === sesiId);
  }

  function getKehadiranPraktikan(praktikanId: string) {
    return kehadiran.filter((item) => item.praktikanId === praktikanId);
  }

  function sudahPresensi(sesiId: string, praktikanId: string) {
    return kehadiran.find(
      (item) => item.sesiId === sesiId && item.praktikanId === praktikanId,
    );
  }

  function getIzinSesi(sesiId: string) {
    return izin.filter((item) => item.sesiId === sesiId);
  }

  function getIzinPraktikan(praktikanId: string) {
    return izin.filter((item) => item.praktikanId === praktikanId);
  }

  function getIzinBySesiPraktikan(sesiId: string, praktikanId: string) {
    return izin.find(
      (item) => item.sesiId === sesiId && item.praktikanId === praktikanId,
    );
  }

  const value = useMemo<SessionContextValue>(
    () => ({
      isLiveFirebase: isFirebaseConfigured,
      loading,
      error,
      clearError,
      retrySync,
      users: mergedUsers,
      currentUser,
      sesi,
      kehadiran,
      izin,
      login,
      loginWithEmail,
      registerUser,
      logout,
      openSession,
      closeSession,
      reopenSession,
      createSession,
      updateSession,
      deleteSession,
      markAttendance,
      submitIzin,
      reviewIzin,
      getSesiById,
      getKehadiranSesi,
      getKehadiranPraktikan,
      sudahPresensi,
      getIzinSesi,
      getIzinPraktikan,
      getIzinBySesiPraktikan,
    }),
    [
      loading,
      error,
      clearError,
      retrySync,
      mergedUsers,
      currentUser,
      sesi,
      kehadiran,
      izin,
    ],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession harus dipakai di dalam <SessionProvider>');
  }
  return ctx;
}
