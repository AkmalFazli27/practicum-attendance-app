import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
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
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
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
  type SesiInput,
  type StatusIzin,
  type User,
} from '@/data/dummy';
import { klasifikasikanAlasanIzin } from '@/services/ai';
import { formatJam, nowLocalISO } from '@/utils/format';

export type PresensiResult =
  | { ok: true; waktuHadir: string }
  | { ok: false; alasan: string };

export type AuthResult =
  | { ok: true; user: User }
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
  logout: () => Promise<void>;
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

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState<boolean>(true);
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

  // ===========================================================================
  // 1. LISTENER AUTH & KOLEKSI PUBLIK (`sesi`)
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let authReady = false;
    let sesiReady = false;

    const checkReady = () => {
      if (authReady && sesiReady) {
        setLoading(false);
      }
    };

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          pendingRegisterUserRef.current = null;
          setCurrentUser(null);
          authReady = true;
          checkReady();
          return;
        }

        // Jika sedang dalam proses registrasi dan profil sudah disiapkan di ref,
        // gunakan profil tersebut agar tidak tertimpa fallback sebelum setDoc selesai
        const pendingUser = pendingRegisterUserRef.current;
        if (pendingUser && pendingUser.id === fbUser.uid) {
          setCurrentUser(pendingUser);
          authReady = true;
          checkReady();
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: fbUser.uid,
              nama: data.nama || fbUser.displayName || 'Pengguna TapIn',
              email: data.email || fbUser.email || '',
              nim: data.nim || undefined,
              kelas: data.kelas || undefined,
              peran: data.peran === 'asisten' ? 'asisten' : 'praktikan',
            });
          } else if (
            pendingRegisterUserRef.current &&
            pendingRegisterUserRef.current.id === fbUser.uid
          ) {
            setCurrentUser(pendingRegisterUserRef.current);
          } else {
            setCurrentUser({
              id: fbUser.uid,
              nama:
                fbUser.displayName ||
                fbUser.email?.split('@')[0] ||
                'Pengguna TapIn',
              email: fbUser.email || '',
              peran: 'praktikan',
            });
          }
        } catch {
          if (
            pendingRegisterUserRef.current &&
            pendingRegisterUserRef.current.id === fbUser.uid
          ) {
            setCurrentUser(pendingRegisterUserRef.current);
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
      () => {
        sesiReady = true;
        checkReady();
      },
    );

    return () => {
      unsubscribeAuth();
      unsubscribeSesi();
    };
  }, []);

  // ===========================================================================
  // 2. LISTENER KOLEKSI TERAUTENTIKASI (`users`, `kehadiran`, `izin`)
  // Dipasang hanya ketika pengguna sudah login agar tidak terkena permission-denied
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    if (!currentUser?.id) {
      setUsers([]);
      setKehadiran([]);
      setIzin([]);
      return;
    }

    // Pantau profil pengguna aktif secara real-time
    const unsubscribeMyDoc = onSnapshot(
      doc(db, 'users', currentUser.id),
      (docSnap) => {
        if (!docSnap.exists()) return;
        const d = docSnap.data();
        setCurrentUser((prev) => {
          if (!prev || prev.id !== docSnap.id) return prev;
          return {
            id: docSnap.id,
            nama: d.nama || prev.nama,
            email: d.email || prev.email,
            nim: d.nim || undefined,
            kelas: d.kelas || undefined,
            peran: d.peran === 'asisten' ? 'asisten' : 'praktikan',
          };
        });
      },
      () => {},
    );

    // Pantau daftar seluruh pengguna (untuk resolusi nama & NIM praktikan di sisi asisten)
    const unsubscribeUsers = onSnapshot(
      query(collection(db, 'users')),
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
      () => {},
    );

    // Pantau daftar kehadiran real-time
    const unsubscribeKehadiran = onSnapshot(
      query(collection(db, 'kehadiran')),
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
      () => {},
    );

    // Pantau daftar pengajuan izin real-time
    const unsubscribeIzin = onSnapshot(
      query(collection(db, 'izin')),
      (snapshot) => {
        const liveIzin: Izin[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            sesiId: d.sesiId || '',
            praktikanId: d.praktikanId || '',
            namaPraktikan: d.namaPraktikan || undefined,
            nimPraktikan: d.nimPraktikan || undefined,
            kelasPraktikan: d.kelasPraktikan || undefined,
            alasan: d.alasan || '',
            kategoriAi: d.kategoriAi || 'Belum Terklasifikasi',
            ringkasanAi: d.ringkasanAi || '',
            status: d.status || 'MENUNGGU',
            waktuPengajuan: d.waktuPengajuan || '',
            waktuKeputusan: d.waktuKeputusan || undefined,
            reviewedBy: d.reviewedBy || undefined,
          };
        });
        setIzin(liveIzin);
      },
      () => {},
    );

    return () => {
      unsubscribeMyDoc();
      unsubscribeUsers();
      unsubscribeKehadiran();
      unsubscribeIzin();
    };
  }, [currentUser?.id]);

  // Gabungkan daftar users dengan data denormalisasi pada kehadiran & izin
  // agar asisten selalu melihat nama & NIM praktikan meskipun dokumen users belum termuat
  const mergedUsers = useMemo<User[]>(() => {
    const map = new Map<string, User>();
    for (const u of users) {
      map.set(u.id, u);
    }
    if (currentUser && !map.has(currentUser.id)) {
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
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      return { ok: false, alasan: 'Email dan kata sandi tidak boleh kosong.' };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );
        const fbUid = userCredential.user.uid;

        const userDoc = await getDoc(doc(db, 'users', fbUid));
        if (!userDoc.exists()) {
          await signOut(auth);
          setCurrentUser(null);
          return {
            ok: false,
            alasan: 'Profil akun tidak ditemukan di database. Silakan daftar ulang.',
          };
        }

        const d = userDoc.data();
        const peranAkun: Peran = d.peran === 'asisten' ? 'asisten' : 'praktikan';

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
          pesan = 'Tidak dapat terhubung ke server Firebase. Periksa koneksi internetmu.';
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
        alasan: 'Akun dengan email ini tidak ditemukan. Silakan daftar akun terlebih dahulu.',
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

  const registerUser = async (payload: RegisterPayload): Promise<AuthResult> => {
    const cleanNama = payload.nama.trim();
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPassword = payload.password.trim();
    const cleanNim = (payload.nim || '').trim();
    const cleanKelas = (payload.kelas || '').trim().toUpperCase();

    if (!cleanNama || !cleanEmail || !cleanPassword) {
      return { ok: false, alasan: 'Nama, email, dan kata sandi wajib diisi.' };
    }

    if (payload.peran === 'praktikan' && (!cleanNim || !cleanKelas)) {
      return { ok: false, alasan: 'NIM dan Kelas wajib diisi untuk praktikan.' };
    }

    if (cleanPassword.length < 6) {
      return { ok: false, alasan: 'Kata sandi minimal 6 karakter.' };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
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
        setCurrentUser(userObj);

        const dataDoc = {
          nama: cleanNama,
          email: cleanEmail,
          peran: payload.peran,
          nim: cleanNim,
          kelas: payload.peran === 'praktikan' ? cleanKelas : '',
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', fbUid), dataDoc);
        pendingRegisterUserRef.current = null;

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
          pesan = 'Tidak dapat terhubung ke server. Periksa koneksi internetmu.';
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

  const logout = async () => {
    pendingRegisterUserRef.current = null;
    if (isFirebaseConfigured) {
      try {
        await signOut(auth);
      } catch {}
    }
    setCurrentUser(null);
  };

  // ===========================================================================
  // FUNGSI KELOLA SESI PRAKTIKUM (CRUD ASISTEN)
  // ===========================================================================

  const openSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'DIBUKA' });
        return true;
      } catch {
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
      } catch {
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
      } catch {
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
      } catch {
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
      } catch {
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
        await deleteDoc(doc(db, 'sesi', sesiId));
        return true;
      } catch {
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
      return { ok: false, alasan: 'Hanya praktikan yang dapat melakukan presensi.' };
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
          alasan: `Gagal menyimpan presensi ke database: ${err?.message || 'Gangguan koneksi'}`,
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

    // Panggil service integrasi API AI pengajar (dengan timeout & fallback aman)
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
          alasan: `Gagal menyimpan izin ke Firestore: ${err?.message || 'Gangguan koneksi'}`,
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
    const waktuKeputusan = nowLocalISO();

    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'izin', izinId), {
          status,
          waktuKeputusan,
          reviewedBy: currentUser?.id || 'asisten',
        });
        return true;
      } catch {
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

  const value: SessionContextValue = {
    isLiveFirebase: isFirebaseConfigured,
    loading,
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
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession harus dipakai di dalam SessionProvider.');
  }
  return context;
}
