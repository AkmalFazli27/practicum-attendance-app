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
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import {
  getActiveLanguage,
  usePreferences,
} from '@/context/PreferencesContext';
import {
  IZIN_SEED,
  KEHADIRAN_SEED,
  LABS_SEED,
  SESI_SEED,
  USERS,
  type HasilAksi,
  type Izin,
  type Kehadiran,
  type Koordinat,
  type Lab,
  type Keanggotaan,
  type Tagihan,
  type Pembayaran,
  type HasilBulk,
  type Peran,
  type Sesi,
  type SesiInput,
  type StatusIzin,
  type StatusSesi,
  type User,
} from '@/data/dummy';
import { klasifikasikanAlasanIzin } from '@/services/ai';
import {
  notifyJadwalBerubah,
  notifyKeputusanIzin,
  notifySesiDibuka,
} from '@/services/notifications';
import { nowLocalISO } from '@/utils/format';
import { koordinatValid } from '@/utils/geo';
import { cariBentrokJadwal } from '@/utils/bentrokJadwal';
import { evaluasiPresensi } from '@/utils/presensi';
import {
  alasanTidakBisaDibuka,
  buatQrToken,
  getStatusEfektif as hitungStatusEfektif,
  hitungQrExpiresAt,
  sudahLewat,
  validasiJadwal,
} from '@/utils/statusSesi';

export type { SesiInput };

export type HasilSimpan =
  | { ok: true; sesi?: Sesi; notifGagal?: boolean }
  | { ok: false; alasan: string };

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
  errorAksi: string | null;
  clearErrorAksi: () => void;
  retrySync: () => void;
  users: User[];
  currentUser: User | null;
  labs: Lab[];
  updateLab: (
    labId: string,
    data: { lat: number; lng: number; radius: number },
  ) => Promise<boolean>;
  savePushToken: (token: string) => Promise<void>;
  getStatusEfektif: (sesi: Sesi) => StatusSesi;
  sesi: Sesi[];
  kehadiran: Kehadiran[];
  izin: Izin[];
  login: (userId: string) => void;
  loginWithEmail: (email: string, password: string) => Promise<AuthResult>;
  registerUser: (payload: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<LogoutResult>;
  openSession: (sesiId: string) => Promise<HasilAksi>;
  closeSession: (sesiId: string) => Promise<boolean>;
  reopenSession: (sesiId: string) => Promise<HasilAksi>;
  renewSessionQr: (sesiId: string) => Promise<HasilAksi>;
  createSession: (input: SesiInput) => Promise<HasilSimpan>;
  updateSession: (
    sesiId: string,
    input: Partial<SesiInput>,
  ) => Promise<HasilSimpan>;
  deleteSession: (sesiId: string) => Promise<boolean>;
  markAttendance: (
    sesiId: string,
    koordinat: Koordinat | null,
  ) => Promise<HasilAksi>;
  submitIzin: (sesiId: string, alasan: string) => Promise<IzinResult>;
  reviewIzin: (
    izinId: string,
    status: Exclude<StatusIzin, 'MENUNGGU'>,
  ) => Promise<HasilSimpan>;
  getSesiById: (sesiId: string) => Sesi | undefined;
  getKehadiranSesi: (sesiId: string) => Kehadiran[];
  getKehadiranPraktikan: (praktikanId: string) => Kehadiran[];
  sudahPresensi: (sesiId: string, praktikanId: string) => Kehadiran | undefined;
  getIzinSesi: (sesiId: string) => Izin[];
  getIzinPraktikan: (praktikanId: string) => Izin[];
  getIzinBySesiPraktikan: (
    sesiId: string,
    praktikanId: string,
  ) => Izin | undefined;
  keanggotaanLab: Keanggotaan[];
  tagihan: Tagihan[];
  pembayaran: Pembayaran[];
  createLab: (input: Omit<Lab, 'id'>) => Promise<{ ok: true; labId: string } | { ok: false; alasan: string }>;
  createLabsBulk: (mataKuliah: string, baris: Omit<Lab, 'id'>[]) => Promise<HasilBulk>;
  addAnggotaBulk: (labId: string, peran: Keanggotaan['peran'], baris: { nim?: string; email?: string }[]) => Promise<HasilBulk>;
  pindahAnggota: (uid: string, dariLabId: string, keLabId: string) => Promise<{ ok: true } | { ok: false; alasan: string }>;
  mulaiPembayaran: (tagihanId: string) => Promise<{ ok: true; redirectUrl: string; orderId: string } | { ok: false; alasan: string }>;
  sinkronPembayaran: (orderId: string) => Promise<void>;
};

const AUTH_LOAD_TIMEOUT_MS = 9000;

const msg = (idText: string, enText: string): string =>
  getActiveLanguage() === 'en' ? enText : idText;

/**
 * Menerjemahkan kode error Firestore / Firebase sesuai bahasa aktif
 * (default Bahasa Indonesia di perangkat baru, atau bahasa sesi terakhir jika pernah login).
 */
function terjemahkanErrorFirestore(
  err: any,
  pesanDefaultId: string,
  pesanDefaultEn?: string,
): string {
  const isEn = getActiveLanguage() === 'en';
  const rawCode = String(err?.code || '').toLowerCase();
  const code = rawCode.replace(/^(firestore|auth)\//, '');

  switch (code) {
    case 'permission-denied':
    case 'unauthenticated':
      return isEn
        ? 'Access denied by server. Make sure your account role is valid and your session is active.'
        : 'Akses ditolak oleh server. Pastikan peran akun Anda sesuai dan sesi masih aktif.';
    case 'unavailable':
    case 'network-request-failed':
      return isEn
        ? 'Service is currently unreachable. Check your internet connection and try again.'
        : 'Layanan tidak dapat dijangkau saat ini. Periksa koneksi internet Anda lalu coba lagi.';
    case 'failed-precondition':
      return isEn
        ? 'Operation cannot be completed because data prerequisites are not met.'
        : 'Operasi tidak dapat dijalankan karena prasyarat data belum terpenuhi.';
    case 'resource-exhausted':
    case 'too-many-requests':
      return isEn
        ? 'Request quota reached. Please wait a moment and try again.'
        : 'Batas kuota permintaan tercapai. Silakan tunggu beberapa saat lalu coba lagi.';
    case 'deadline-exceeded':
      return isEn
        ? 'Server connection timed out. Check your network and try again.'
        : 'Waktu koneksi ke server habis. Periksa jaringan Anda lalu coba lagi.';
    case 'not-found':
      return isEn
        ? 'The requested data was not found on the server.'
        : 'Data yang diminta tidak ditemukan di server.';
    case 'already-exists':
      return isEn
        ? 'This record already exists.'
        : 'Data tersebut sudah tercatat sebelumnya.';
    default:
      return isEn && pesanDefaultEn ? pesanDefaultEn : pesanDefaultId;
  }
}

async function aman(kirim: () => Promise<boolean>): Promise<boolean> {
  try {
    return await kirim();
  } catch {
    return false;
  }
}

function mapSesi(id: string, d: Record<string, any>): Sesi {
  return {
    id,
    namaPraktikum: d.namaPraktikum || '',
    topik: d.topik || '',
    kelas: d.kelas || '',
    lab: d.lab || '',
    labId: d.labId || undefined,
    tanggal: d.tanggal || '',
    jamMulai: d.jamMulai || '',
    jamSelesai: d.jamSelesai || '',
    kapasitas: typeof d.kapasitas === 'number' ? d.kapasitas : 30,
    asistenId: d.asistenId || '',
    status: d.status || 'TERJADWAL',
    deskripsi: d.deskripsi || '',
    qrToken: typeof d.qrToken === 'string' ? d.qrToken : undefined,
    qrExpiresAt: typeof d.qrExpiresAt === 'number' ? d.qrExpiresAt : undefined,
  };
}

function mapLab(id: string, d: Record<string, any>): Lab {
  return {
    id,
    nama: d.nama || '',
    alamat: d.alamat || '',
    lat: Number(d.lat),
    lng: Number(d.lng),
    radius: Number(d.radius),
  };
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { markLoggedIn } = usePreferences();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorAksi, setErrorAksi] = useState<string | null>(null);
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
  const [labs, setLabs] = useState<Lab[]>(
    isFirebaseConfigured ? [] : LABS_SEED,
  );
  const [tick, setTick] = useState<number>(0);
  const serverOffsetRef = useRef<number>(0);
  const sekarang = () => Date.now() + serverOffsetRef.current;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // Tandai perangkat pernah login agar bahasa sesi terakhir tetap diingat saat buka ulang
  useEffect(() => {
    if (currentUser?.id) {
      void markLoggedIn();
    }
  }, [currentUser?.id, markLoggedIn]);

  // Menyimpan profil sementara saat proses registrasi berlangsung untuk mencegah
  // race condition antara createUserWithEmailAndPassword dan onAuthStateChanged
  const pendingRegisterUserRef = useRef<User | null>(null);

  // Token generasi autentikasi untuk mencegah ghost user race condition
  // ketika hasil getDoc lama baru selesai setelah logout atau ganti akun
  const authGenRef = useRef<number>(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearErrorAksi = useCallback(() => {
    setErrorAksi(null);
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
          msg(
            'Waktu muat sesi habis. Periksa koneksi internet Anda lalu coba lagi.',
            'Session loading timed out. Check your internet connection and try again.',
          ),
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
            if (!['asisten', 'praktikan', 'aslab'].includes(data.peran)) {
              await signOut(auth);
              setCurrentUser(null);
              setError(
                msg(
                  'Profil pengguna tidak ditemukan.',
                  'User profile not found.',
                ),
              );
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
            setError(
              msg(
                'Profil pengguna tidak ditemukan.',
                'User profile not found.',
              ),
            );
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
                  'Failed to load user profile from server.',
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
        const liveSesi: Sesi[] = snapshot.docs.map((docSnap) =>
          mapSesi(docSnap.id, docSnap.data()),
        );
        setSesi(liveSesi);
        sesiReady = true;
        checkReady();
      },
      (err) => {
        if (cancelled) return;
        setError(
          terjemahkanErrorFirestore(
            err,
            'Gagal memuat jadwal sesi praktikum.',
            'Failed to load practicum session schedule.',
          ),
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
  // 2. LISTENER KOLEKSI TERAUTENTIKASI (`users`, `labs`, `kehadiran`, `izin`)
  // Dipasang hanya setelah pengguna login & disesuaikan perannya (privasi rules)
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    if (!currentUser?.id) {
      setKehadiran([]);
      setIzin([]);
      setUsers([]);
      setLabs([]);
      return;
    }

    const uid = currentUser.id;
    const isAsistenRole = currentUser.peran === 'asisten' || currentUser.peran === 'aslab';

    // Sinkronisasi dokumen profil pengguna aktif secara real-time
    const unsubscribeSelf = onSnapshot(
      doc(db, 'users', uid),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const d = docSnap.data();
        if (!['asisten', 'praktikan', 'aslab'].includes(d.peran)) return;
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
      () => { },
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
              peran: d.peran === 'asisten' || d.peran === 'aslab' ? d.peran : 'praktikan',
              pushToken: d.pushToken || undefined,
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

    const unsubscribeLabs = onSnapshot(
      collection(db, 'labs'),
      (snapshot) => {
        setLabs(
          snapshot.docs
            .map((d) => mapLab(d.id, d.data()))
            .sort((a, b) => a.nama.localeCompare(b.nama)),
        );
      },
      (err) => {
        setError(
          terjemahkanErrorFirestore(err, 'Gagal memuat data laboratorium.'),
        );
      },
    );

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
            lat: typeof d.lat === 'number' ? d.lat : undefined,
            lng: typeof d.lng === 'number' ? d.lng : undefined,
            jarak: typeof d.jarak === 'number' ? d.jarak : undefined,
            akurasi: typeof d.akurasi === 'number' ? d.akurasi : undefined,
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
      unsubscribeLabs();
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
  ): Promise<AuthResult> => {
    const cleanEmail = emailInput.trim().toLowerCase();
    // Jangan trim password agar spasi yang disengaja di awal/akhir tidak berubah diam-diam
    const rawPassword = passwordInput;

    if (!cleanEmail || rawPassword.length === 0) {
      return {
        ok: false,
        alasan: msg(
          'Email dan kata sandi tidak boleh kosong.',
          'Email and password cannot be empty.',
        ),
      };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          rawPassword,
        );
        const fbUid = userCredential.user.uid;

        const userDoc = await getDoc(doc(db, 'users', fbUid));

        // Cegah ghost user apabila sesi sudah berganti saat menunggu getDoc.
        // Jangan bandingkan authGenRef di sini: onAuthStateChanged juga
        // menaikkan generasi untuk sign-in ini, sehingga login akan menolak
        // keberhasilannya sendiri ("Sesi autentikasi berubah"). Pengecekan uid
        // sudah menutup kasus logout dan ganti akun saat getDoc berjalan.
        if (auth.currentUser?.uid !== fbUid) {
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
        if (!['asisten', 'praktikan', 'aslab'].includes(d.peran)) {
          await signOut(auth);
          setCurrentUser(null);
          return {
            ok: false,
            alasan: 'Profil pengguna tidak ditemukan.',
          };
        }

        const peranAkun: Peran = d.peran;

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
        let pesan = msg(
          'Gagal masuk. Periksa kembali email dan kata sandi Anda.',
          'Sign in failed. Please check your email and password.',
        );
        if (
          err?.code === 'auth/invalid-credential' ||
          err?.code === 'auth/invalid-login-credentials' ||
          err?.code === 'auth/wrong-password' ||
          err?.code === 'auth/user-not-found'
        ) {
          pesan = msg(
            'Email atau kata sandi salah.',
            'Incorrect email or password.',
          );
        } else if (
          err?.code === 'auth/invalid-email' ||
          err?.code === 'auth/missing-email'
        ) {
          pesan = msg(
            'Format alamat email tidak valid.',
            'Invalid email address format.',
          );
        } else if (err?.code === 'auth/too-many-requests') {
          pesan = msg(
            'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
            'Too many attempts. Please try again later.',
          );
        } else if (err?.code === 'auth/user-disabled') {
          pesan = msg(
            'Akun ini telah dinonaktifkan.',
            'This account has been disabled.',
          );
        } else if (err?.code === 'auth/network-request-failed') {
          pesan = msg(
            'Tidak dapat terhubung ke server Firebase. Periksa koneksi internetmu.',
            'Cannot connect to Firebase server. Please check your internet connection.',
          );
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / lokal (ketika .env belum dikonfigurasi)
    const userDitemukan = users.find(
      (u) => u.email?.toLowerCase() === cleanEmail,
    );

    // Samakan dengan mode Firebase: jangan bedakan email tidak dikenal dari
    // kata sandi salah agar keberadaan akun tidak bisa ditebak.
    if (!userDitemukan) {
      return {
        ok: false,
        alasan: msg(
          'Email atau kata sandi salah.',
          'Incorrect email or password.',
        ),
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
      return {
        ok: false,
        alasan: msg(
          'Nama, email, dan kata sandi wajib diisi.',
          'Name, email, and password are required.',
        ),
      };
    }

    if (payload.peran === 'praktikan' && (!cleanNim || !cleanKelas)) {
      return {
        ok: false,
        alasan: msg(
          'NIM dan Kelas wajib diisi untuk praktikan.',
          'Student ID (NIM) and Class are required for students.',
        ),
      };
    }

    if (rawPassword.length < 6) {
      return {
        ok: false,
        alasan: msg(
          'Kata sandi minimal 6 karakter.',
          'Password must be at least 6 characters.',
        ),
      };
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
            } catch { }
          }

          const isPermissionDenied = String(firestoreErr?.code || '')
            .toLowerCase()
            .includes('permission-denied');
          if (isPermissionDenied && payload.peran === 'asisten') {
            return {
              ok: false,
              alasan: msg(
                'Pendaftaran mandiri hanya untuk Praktikan. Akun Asisten dibuat melalui Admin/Console.',
                'Self-registration is only for Students. Assistant accounts are provisioned via Admin/Console.',
              ),
            };
          }

          return {
            ok: false,
            alasan: terjemahkanErrorFirestore(
              firestoreErr,
              'Gagal menyimpan profil pengguna ke database. Silakan coba lagi.',
              'Failed to save user profile to database. Please try again.',
            ),
          };
        }

        pendingRegisterUserRef.current = null;
        setCurrentUser(userObj);
        setError(null);
        return { ok: true, user: userObj };
      } catch (err: any) {
        pendingRegisterUserRef.current = null;
        let pesan = msg(
          'Gagal mendaftarkan akun.',
          'Failed to register account.',
        );
        if (err?.code === 'auth/email-already-in-use') {
          pesan = msg(
            'Email ini sudah terdaftar. Silakan masuk.',
            'This email is already registered. Please sign in.',
          );
        } else if (err?.code === 'auth/invalid-email') {
          pesan = msg(
            'Format alamat email tidak valid.',
            'Invalid email address format.',
          );
        } else if (err?.code === 'auth/weak-password') {
          pesan = msg(
            'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.',
            'Password is too weak. Use at least 6 characters.',
          );
        } else if (err?.code === 'auth/network-request-failed') {
          pesan = msg(
            'Tidak dapat terhubung ke server. Periksa koneksi internetmu.',
            'Cannot connect to server. Please check your internet connection.',
          );
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / lokal
    const sudahAda = users.some((u) => u.email?.toLowerCase() === cleanEmail);
    if (sudahAda) {
      return {
        ok: false,
        alasan: msg(
          'Email ini sudah terdaftar. Silakan masuk.',
          'This email is already registered. Please sign in.',
        ),
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
          'Failed to log out. Check your internet connection.',
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

  const getStatusEfektif = (s: Sesi): StatusSesi =>
    hitungStatusEfektif(s, sekarang());

  const bacaSesi = async (sesiId: string): Promise<Sesi | undefined> => {
    if (!isFirebaseConfigured) return sesi.find((s) => s.id === sesiId);
    const snap = await getDoc(doc(db, 'sesi', sesiId));
    return snap.exists() ? mapSesi(snap.id, snap.data()) : undefined;
  };

  const openSession = async (sesiId: string): Promise<HasilAksi> => {
    try {
      const target = await bacaSesi(sesiId);
      if (!target) return { ok: false, alasan: 'SESI_TIDAK_DIBUKA' };
      const now = sekarang();
      const alasan = alasanTidakBisaDibuka(target, now);
      if (alasan) return { ok: false, alasan };
      const qrToken = buatQrToken();
      const qrExpiresAt = hitungQrExpiresAt(target, now);
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'sesi', sesiId), {
          status: 'DIBUKA',
          qrToken,
          qrExpiresAt,
        });
      } else {
        setSesi((prev) =>
          prev.map((s) =>
            s.id === sesiId
              ? { ...s, status: 'DIBUKA', qrToken, qrExpiresAt }
              : s,
          ),
        );
      }
      const notifOk = target.status === 'DIBUKA' ? true : await aman(() => notifySesiDibuka({ ...target, status: 'DIBUKA', qrToken, qrExpiresAt }));
      return { ok: true, notifGagal: !notifOk };
    } catch (err: any) {
      setError(terjemahkanErrorFirestore(err, 'Gagal membuka sesi praktikum.'));
      return { ok: false, alasan: 'JARINGAN' };
    }
  };

  const renewSessionQr = async (sesiId: string): Promise<HasilAksi> => {
    if (!currentUser || currentUser.peran !== 'asisten') {
      return { ok: false, alasan: 'TIDAK_BERHAK' };
    }
    try {
      const target = await bacaSesi(sesiId);
      if (!target) return { ok: false, alasan: 'SESI_TIDAK_DIBUKA' };
      const now = sekarang();
      if (target.status === 'SELESAI') {
        return { ok: false, alasan: 'SESI_SUDAH_DITUTUP' };
      }
      if (sudahLewat(target, now)) {
        return { ok: false, alasan: 'WAKTU_HABIS' };
      }
      if (hitungStatusEfektif(target, now) !== 'DIBUKA') {
        return { ok: false, alasan: 'SESI_TIDAK_DIBUKA' };
      }
      const qrToken = buatQrToken();
      const qrExpiresAt = hitungQrExpiresAt(target, now);
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'sesi', sesiId), { qrToken, qrExpiresAt });
      } else {
        setSesi((prev) =>
          prev.map((s) =>
            s.id === sesiId ? { ...s, qrToken, qrExpiresAt } : s,
          ),
        );
      }
      return { ok: true };
    } catch (err: any) {
      setError(
        terjemahkanErrorFirestore(err, 'Gagal memperbarui QR presensi.'),
      );
      return { ok: false, alasan: 'JARINGAN' };
    }
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

  const reopenSession = async (sesiId: string): Promise<HasilAksi> => {
    try {
      const target = await bacaSesi(sesiId);
      if (!target) return { ok: false, alasan: 'SESI_TIDAK_DIBUKA' };
      if (hitungStatusEfektif(target, sekarang()) === 'SELESAI') {
        return { ok: false, alasan: 'SESI_SUDAH_DITUTUP' };
      }
      return openSession(sesiId);
    } catch (err: any) {
      setError(
        terjemahkanErrorFirestore(err, 'Gagal membuka kembali sesi praktikum.'),
      );
      return { ok: false, alasan: 'JARINGAN' };
    }
  };

  const createSession = async (input: SesiInput): Promise<HasilSimpan> => {
    if (!currentUser || currentUser.peran !== 'asisten') {
      return { ok: false, alasan: 'Hanya asisten yang dapat menambahkan sesi.' };
    }

    setErrorAksi(null);

    const cek = validasiJadwal(input, sekarang());
    if (!cek.ok) {
      return { ok: false, alasan: cek.alasan };
    }

    const labDipilih = labs.find((l) => l.id === input.labId);

    const bentrok = cariBentrokJadwal(
      {
        tanggal: input.tanggal.trim(),
        jamMulai: input.jamMulai.trim(),
        jamSelesai: input.jamSelesai.trim(),
        kelas: input.kelas,
        labId: input.labId,
        lab: labDipilih?.nama ?? input.lab,
        asistenId: currentUser.id,
      },
      sesi,
    );
    if (!bentrok.ok) {
      return { ok: false, alasan: bentrok.alasan };
    }

    const sesiBaruData = {
      namaPraktikum: input.namaPraktikum.trim(),
      topik: (input.topik || '').trim(),
      kelas: input.kelas.trim().toUpperCase(),
      lab: labDipilih?.nama ?? (input.lab ?? '').trim(),
      labId: input.labId || '',
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
        return { ok: true, sesi: { id: docRef.id, ...sesiBaruData } };
      } catch (err: any) {
        return {
          ok: false,
          alasan: terjemahkanErrorFirestore(
            err,
            'Gagal menambahkan sesi praktikum baru. Periksa koneksi Anda.',
          ),
        };
      }
    }

    const sesiBaru: Sesi = {
      id: `sesi-${Date.now()}`,
      ...sesiBaruData,
    };
    setSesi((prev) => [sesiBaru, ...prev]);
    return { ok: true, sesi: sesiBaru };
  };

  const updateSession = async (
    sesiId: string,
    input: Partial<SesiInput>,
  ): Promise<HasilSimpan> => {
    setErrorAksi(null);
    const target = sesi.find((s) => s.id === sesiId);
    const patch: Record<string, any> = {};
    if (typeof input.namaPraktikum === 'string') {
      patch.namaPraktikum = input.namaPraktikum.trim();
    }
    if (typeof input.topik === 'string') patch.topik = input.topik.trim();
    if (typeof input.kelas === 'string') {
      patch.kelas = input.kelas.trim().toUpperCase();
    }
    if (typeof input.tanggal === 'string') patch.tanggal = input.tanggal.trim();
    if (typeof input.jamMulai === 'string') {
      patch.jamMulai = input.jamMulai.trim();
    }
    if (typeof input.jamSelesai === 'string') {
      patch.jamSelesai = input.jamSelesai.trim();
    }
    if (typeof input.deskripsi === 'string') {
      patch.deskripsi = input.deskripsi.trim();
    }
    if (typeof input.kapasitas === 'number') patch.kapasitas = input.kapasitas;
    if (typeof input.lab === 'string') patch.lab = input.lab.trim();
    if (typeof input.labId === 'string') {
      patch.labId = input.labId;
      const l = labs.find((x) => x.id === input.labId);
      if (l) patch.lab = l.nama;
    }

    const kunciJadwal = ['tanggal', 'jamMulai', 'jamSelesai'] as const;
    const jadwalBerubah =
      !!target && kunciJadwal.some((k) => k in patch && patch[k] !== target[k]);
    if (target && jadwalBerubah) {
      const cek = validasiJadwal({ ...target, ...patch }, sekarang());
      if (!cek.ok) {
        return { ok: false, alasan: cek.alasan };
      }
    }

    const kunciBentrok = ['tanggal', 'jamMulai', 'jamSelesai', 'kelas', 'lab', 'labId'] as const;
    const bentrokBerubah =
      !!target && kunciBentrok.some((k) => k in patch && patch[k] !== target[k]);
    if (target && bentrokBerubah) {
      const bentrok = cariBentrokJadwal({ ...target, ...patch }, sesi, sesiId);
      if (!bentrok.ok) {
        return { ok: false, alasan: bentrok.alasan };
      }
    }

    try {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'sesi', sesiId), patch);
      } else {
        setSesi((prev) =>
          prev.map((s) => (s.id === sesiId ? { ...s, ...patch } : s)),
        );
      }
    } catch (err: any) {
      return {
        ok: false,
        alasan: terjemahkanErrorFirestore(
          err,
          'Gagal memperbarui data sesi praktikum. Periksa koneksi Anda.',
        ),
      };
    }

    const notifOk =
      jadwalBerubah && target
        ? await aman(() => notifyJadwalBerubah({ ...target, ...patch }))
        : true;
    return { ok: true, notifGagal: !notifOk };
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

  const markAttendance = async (
    sesiId: string,
    koordinat: Koordinat | null,
  ): Promise<HasilAksi> => {
    if (!currentUser) return { ok: false, alasan: 'TIDAK_BERHAK' };
    const user = currentUser;
    const docId = `${sesiId}_${user.id}`;
    const now = sekarang();

    if (!isFirebaseConfigured) {
      const target = sesi.find((s) => s.id === sesiId) ?? null;
      const hasil = evaluasiPresensi({
        sesi: target,
        lab: labs.find((l) => l.id === target?.labId) ?? null,
        user,
        koordinat,
        sudahHadir: kehadiran.some((k) => k.id === docId),
        sudahIzin: izin.some((i) => i.id === docId),
        now,
      });
      if (!hasil.ok) return hasil;
      const k = koordinat as Koordinat;
      setKehadiran((prev) => [
        ...prev,
        {
          id: docId,
          sesiId,
          praktikanId: user.id,
          namaPraktikan: user.nama,
          nimPraktikan: user.nim || '',
          kelasPraktikan: user.kelas || '',
          waktuHadir: nowLocalISO(),
          lat: k.lat,
          lng: k.lng,
          jarak: hasil.jarak,
          akurasi: k.akurasi,
        },
      ]);
      return hasil;
    }

    try {
      return await runTransaction<HasilAksi>(db, async (tx) => {
        const sesiSnap = await tx.get(doc(db, 'sesi', sesiId));
        const sesiData = sesiSnap.exists()
          ? mapSesi(sesiSnap.id, sesiSnap.data())
          : null;
        const labSnap = sesiData?.labId
          ? await tx.get(doc(db, 'labs', sesiData.labId))
          : null;
        const hadirSnap = await tx.get(doc(db, 'kehadiran', docId));
        const izinSnap = await tx.get(doc(db, 'izin', docId));

        const hasil = evaluasiPresensi({
          sesi: sesiData,
          lab: labSnap?.exists() ? mapLab(labSnap.id, labSnap.data()) : null,
          user,
          koordinat,
          sudahHadir: hadirSnap.exists(),
          sudahIzin: izinSnap.exists(),
          now,
        });
        if (!hasil.ok) return hasil;

        const k = koordinat as Koordinat;
        tx.set(doc(db, 'kehadiran', docId), {
          sesiId,
          praktikanId: user.id,
          namaPraktikan: user.nama,
          nimPraktikan: user.nim || '',
          kelasPraktikan: user.kelas || '',
          waktuHadir: nowLocalISO(),
          lat: k.lat,
          lng: k.lng,
          jarak: hasil.jarak,
          akurasi: k.akurasi ?? null,
        });
        return hasil;
      });
    } catch (err: any) {
      const code = String(err?.code || '').replace(/^firestore\//, '');
      if (code === 'permission-denied') {
        return { ok: false, alasan: 'SESI_TIDAK_DIBUKA' };
      }
      return { ok: false, alasan: 'JARINGAN' };
    }
  };

  // ===========================================================================
  // FUNGSI PENGAJUAN & PEMERIKSAAN IZIN (BERBANTUAN MODEL AI)
  // ===========================================================================

  const submitIzin = async (
    sesiId: string,
    alasanInput: string,
  ): Promise<IzinResult> => {
    if (!currentUser) {
      return {
        ok: false,
        alasan: msg('Pengguna belum masuk.', 'User is not signed in.'),
      };
    }
    if (currentUser.peran !== 'praktikan') {
      return {
        ok: false,
        alasan: msg(
          'Hanya praktikan yang dapat mengajukan izin.',
          'Only students can submit leave requests.',
        ),
      };
    }

    const sesiTarget = sesi.find((s) => s.id === sesiId);
    if (!sesiTarget) {
      return {
        ok: false,
        alasan: msg(
          'Sesi praktikum tidak ditemukan.',
          'Practicum session not found.',
        ),
      };
    }
    if (getStatusEfektif(sesiTarget) === 'SELESAI') {
      return {
        ok: false,
        alasan: msg(
          'Tidak dapat mengajukan izin pada sesi yang sudah selesai.',
          'Cannot submit a leave request for a completed session.',
        ),
      };
    }

    const sudahHadir = kehadiran.find(
      (k) => k.sesiId === sesiId && k.praktikanId === currentUser.id,
    );
    if (sudahHadir) {
      return {
        ok: false,
        alasan: msg(
          'Kamu sudah tercatat hadir pada sesi ini.',
          'You are already marked present for this session.',
        ),
      };
    }

    const izinLama = izin.find(
      (i) => i.sesiId === sesiId && i.praktikanId === currentUser.id,
    );
    if (izinLama) {
      return {
        ok: false,
        alasan: msg(
          'Kamu sudah mengajukan izin untuk sesi ini.',
          'You have already submitted a leave request for this session.',
        ),
      };
    }

    const teksAlasan = alasanInput.trim();
    if (teksAlasan.length < 10) {
      return {
        ok: false,
        alasan: msg(
          'Alasan izin minimal 10 karakter.',
          'Leave reason must be at least 10 characters.',
        ),
      };
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
  ): Promise<HasilSimpan> => {
    if (!currentUser || currentUser.peran !== 'asisten') {
      return { ok: false, alasan: 'Hanya asisten yang dapat memeriksa izin.' };
    }

    const izinTarget = izin.find((item) => item.id === izinId);
    if (izinTarget && izinTarget.status !== 'MENUNGGU') {
      return { ok: false, alasan: 'Pengajuan izin ini sudah diputuskan.' };
    }
    const waktuKeputusan = nowLocalISO();
    const patch = {
      status,
      reviewedAt: waktuKeputusan,
      reviewedBy: currentUser.id,
    };

    try {
      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'izin', izinId), patch);
      } else {
        setIzin((prev) =>
          prev.map((item) =>
            item.id === izinId ? { ...item, ...patch, waktuKeputusan } : item,
          ),
        );
      }
    } catch (err: any) {
      const pesan = terjemahkanErrorFirestore(
        err,
        'Gagal menyimpan keputusan pemeriksaan izin.',
      );
      setError(pesan);
      return { ok: false, alasan: pesan };
    }

    const notifOk = izinTarget
      ? await aman(() => notifyKeputusanIzin({ ...izinTarget, ...patch }, status))
      : true;
    return { ok: true, notifGagal: !notifOk };
  };

  // ===========================================================================
  // LAB & PUSH TOKEN
  // ===========================================================================

  const updateLab = async (
    labId: string,
    data: { lat: number; lng: number; radius: number },
  ): Promise<boolean> => {
    if (!currentUser || currentUser.peran !== 'asisten') return false;
    if (!(data.radius > 0) || !koordinatValid(data)) {
      setError(
        msg(
          'Koordinat atau radius lab tidak valid.',
          'Invalid lab coordinates or radius.',
        ),
      );
      return false;
    }
    const patch = { lat: data.lat, lng: data.lng, radius: data.radius };
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'labs', labId), patch);
        return true;
      } catch (err: any) {
        setError(
          terjemahkanErrorFirestore(err, 'Gagal menyimpan data laboratorium.'),
        );
        return false;
      }
    }
    setLabs((prev) =>
      prev.map((l) => (l.id === labId ? { ...l, ...patch } : l)),
    );
    return true;
  };

  const savePushToken = async (token: string): Promise<void> => {
    if (!currentUser || !token) return;
    if (!isFirebaseConfigured) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id ? { ...u, pushToken: token } : u,
        ),
      );
      return;
    }
    try {
      await updateDoc(doc(db, 'users', currentUser.id), { pushToken: token });
    } catch { }
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

  // STUB Sprint 4
  const BELUM = { ok: false as const, alasan: 'BELUM_TERSEDIA' };
  const createLab = async () => BELUM;
  const createLabsBulk = async (): Promise<HasilBulk> => ({ berhasil: 0, gagal: [] });
  const addAnggotaBulk = async (): Promise<HasilBulk> => ({ berhasil: 0, gagal: [] });
  const pindahAnggota = async () => BELUM;
  const mulaiPembayaran = async () => BELUM;
  const sinkronPembayaran = async () => { };

  const value = useMemo<SessionContextValue>(
    () => ({
      isLiveFirebase: isFirebaseConfigured,
      loading,
      error,
      clearError,
      errorAksi,
      clearErrorAksi,
      retrySync,
      users: mergedUsers,
      currentUser,
      labs,
      sesi,
      kehadiran,
      izin,
      updateLab,
      savePushToken,
      getStatusEfektif,
      login,
      loginWithEmail,
      registerUser,
      logout,
      openSession,
      closeSession,
      reopenSession,
      renewSessionQr,
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
      keanggotaanLab: [],
      tagihan: [],
      pembayaran: [],
      createLab,
      createLabsBulk,
      addAnggotaBulk,
      pindahAnggota,
      mulaiPembayaran,
      sinkronPembayaran,
    }),
    [
      loading,
      error,
      clearError,
      errorAksi,
      clearErrorAksi,
      retrySync,
      mergedUsers,
      currentUser,
      sesi,
      kehadiran,
      izin,
      labs,
      tick,
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