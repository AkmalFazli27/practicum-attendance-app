import React, {
  createContext,
  useContext,
  useEffect,
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
    peranFallback?: Peran,
  ) => Promise<AuthResult> | AuthResult;
  registerUser: (payload: RegisterPayload) => Promise<AuthResult> | AuthResult;
  logout: () => Promise<void> | void;
  openSession: (sesiId: string) => Promise<void> | void;
  closeSession: (sesiId: string) => Promise<void> | void;
  reopenSession: (sesiId: string) => Promise<void> | void;
  createSession: (input: SesiInput) => Promise<Sesi | null> | Sesi | null;
  updateSession: (
    sesiId: string,
    input: Partial<SesiInput>,
  ) => Promise<boolean> | boolean;
  deleteSession: (sesiId: string) => Promise<boolean> | boolean;
  markAttendance: (sesiId: string) => Promise<PresensiResult> | PresensiResult;
  submitIzin: (sesiId: string, alasan: string) => Promise<IzinResult> | IzinResult;
  reviewIzin: (
    izinId: string,
    status: Exclude<StatusIzin, 'MENUNGGU'>,
  ) => Promise<boolean> | boolean;
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
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sesi, setSesi] = useState<Sesi[]>(SESI_SEED);
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>(KEHADIRAN_SEED);
  const [izin, setIzin] = useState<Izin[]>(IZIN_SEED);

  // ===========================================================================
  // SINKRONISASI FIREBASE REAL-TIME (JIKA DIKONFIGURASI)
  // ===========================================================================
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1. Auth state listener
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setCurrentUser({
              id: fbUser.uid,
              nama: data.nama || fbUser.displayName || 'Pengguna TapIn',
              email: fbUser.email || '',
              nim: data.nim || '',
              kelas: data.kelas || '',
              peran: data.peran || 'praktikan',
            });
          } else {
            setCurrentUser({
              id: fbUser.uid,
              nama: fbUser.displayName || fbUser.email?.split('@')[0] || 'Pengguna TapIn',
              email: fbUser.email || '',
              peran: 'praktikan',
            });
          }
        } catch {
          // Fallback user jika dokumen users belum terbaca
          setCurrentUser({
            id: fbUser.uid,
            nama: fbUser.email?.split('@')[0] || 'Pengguna TapIn',
            email: fbUser.email || '',
            peran: 'praktikan',
          });
        } finally {
          setLoading(false);
        }
      },
    );

    // 2. Sesi real-time listener
    const sesiQuery = query(collection(db, 'sesi'));
    const unsubscribeSesi = onSnapshot(
      sesiQuery,
      (snapshot) => {
        if (!snapshot.empty) {
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
              kapasitas: d.kapasitas || 30,
              asistenId: d.asistenId || '',
              status: d.status || 'TERJADWAL',
              deskripsi: d.deskripsi || '',
            };
          });
          setSesi(liveSesi);
        }
      },
      () => {},
    );

    // 3. Kehadiran real-time listener
    const kehadiranQuery = query(collection(db, 'kehadiran'));
    const unsubscribeKehadiran = onSnapshot(
      kehadiranQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveKehadiran: Kehadiran[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              sesiId: d.sesiId || '',
              praktikanId: d.praktikanId || '',
              waktuHadir: d.waktuHadir || '',
            };
          });
          setKehadiran(liveKehadiran);
        }
      },
      () => {},
    );

    // 4. Izin real-time listener
    const izinQuery = query(collection(db, 'izin'));
    const unsubscribeIzin = onSnapshot(
      izinQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const liveIzin: Izin[] = snapshot.docs.map((docSnap) => {
            const d = docSnap.data();
            return {
              id: docSnap.id,
              sesiId: d.sesiId || '',
              praktikanId: d.praktikanId || '',
              namaPraktikan: d.namaPraktikan || '',
              nimPraktikan: d.nimPraktikan || '',
              kelasPraktikan: d.kelasPraktikan || '',
              alasan: d.alasan || '',
              kategoriAi: d.kategoriAi || 'Belum Terklasifikasi',
              ringkasanAi: d.ringkasanAi || '',
              status: d.status || 'MENUNGGU',
              waktuPengajuan: d.waktuPengajuan || '',
              waktuKeputusan: d.waktuKeputusan || undefined,
            };
          });
          setIzin(liveIzin);
        }
      },
      () => {},
    );

    return () => {
      unsubscribeAuth();
      unsubscribeSesi();
      unsubscribeKehadiran();
      unsubscribeIzin();
    };
  }, []);

  // ===========================================================================
  // FUNGSI AUTENTIKASI
  // ===========================================================================

  const login = (userId: string) => {
    const userDitemukan = users.find((u) => u.id === userId);
    if (userDitemukan) {
      setCurrentUser(userDitemukan);
    }
  };

  const loginWithEmail = async (
    emailInput: string,
    passwordInput: string,
    peranFallback: Peran = 'praktikan',
  ): Promise<AuthResult> => {
    const cleanEmail = emailInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanEmail || !cleanPassword) {
      return { ok: false, alasan: 'Email dan password tidak boleh kosong.' };
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
        let userProfil: User;
        if (userDoc.exists()) {
          const d = userDoc.data();
          userProfil = {
            id: fbUid,
            nama: d.nama || userCredential.user.displayName || 'Pengguna',
            email: cleanEmail,
            nim: d.nim || '',
            kelas: d.kelas || '',
            peran: d.peran || peranFallback,
          };
        } else {
          userProfil = {
            id: fbUid,
            nama: userCredential.user.displayName || cleanEmail.split('@')[0],
            email: cleanEmail,
            peran: peranFallback,
          };
        }
        setCurrentUser(userProfil);
        return { ok: true, user: userProfil };
      } catch (err: any) {
        let pesan = 'Gagal masuk. Periksa kembali email dan password Anda.';
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          pesan = 'Email atau password yang Anda masukkan salah.';
        } else if (err.code === 'auth/user-not-found') {
          pesan = 'Akun dengan email tersebut tidak ditemukan.';
        } else if (err.code === 'auth/invalid-email') {
          pesan = 'Format email tidak valid.';
        } else if (err.code === 'auth/network-request-failed') {
          pesan = 'Gagal terhubung ke server Firebase. Periksa koneksi internet.';
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / offline
    const userDitemukan = users.find(
      (u) => u.email?.toLowerCase() === cleanEmail.toLowerCase(),
    );

    if (userDitemukan) {
      setCurrentUser(userDitemukan);
      return { ok: true, user: userDitemukan };
    }

    const userBaru: User = {
      id: `user-${Date.now()}`,
      nama: cleanEmail.split('@')[0].toUpperCase(),
      email: cleanEmail,
      peran: peranFallback,
      nim: peranFallback === 'praktikan' ? '2310512999' : '2210512999',
      kelas: peranFallback === 'praktikan' ? 'IF-2A' : undefined,
    };

    setUsers((prev) => [...prev, userBaru]);
    setCurrentUser(userBaru);
    return { ok: true, user: userBaru };
  };

  const registerUser = async (payload: RegisterPayload): Promise<AuthResult> => {
    const cleanNama = payload.nama.trim();
    const cleanEmail = payload.email.trim();
    const cleanPassword = payload.password.trim();
    const cleanNim = (payload.nim || '').trim();
    const cleanKelas = (payload.kelas || '').trim();

    if (!cleanNama || !cleanEmail || !cleanPassword) {
      return { ok: false, alasan: 'Nama, email, dan password wajib diisi.' };
    }

    if (payload.peran === 'praktikan' && (!cleanNim || !cleanKelas)) {
      return { ok: false, alasan: 'NIM dan Kelas wajib diisi untuk praktikan.' };
    }

    if (cleanPassword.length < 6) {
      return { ok: false, alasan: 'Password minimal 6 karakter.' };
    }

    if (isFirebaseConfigured) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          cleanPassword,
        );
        const fbUid = userCredential.user.uid;

        const dataDoc = {
          nama: cleanNama,
          email: cleanEmail,
          peran: payload.peran,
          nim: cleanNim,
          kelas: payload.peran === 'praktikan' ? cleanKelas : '',
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', fbUid), dataDoc);

        const userObj: User = {
          id: fbUid,
          nama: cleanNama,
          email: cleanEmail,
          peran: payload.peran,
          nim: cleanNim,
          kelas: payload.peran === 'praktikan' ? cleanKelas : undefined,
        };

        setCurrentUser(userObj);
        return { ok: true, user: userObj };
      } catch (err: any) {
        let pesan = 'Gagal mendaftarkan akun.';
        if (err.code === 'auth/email-already-in-use') {
          pesan = 'Email sudah terdaftar. Silakan masuk menggunakan email ini.';
        } else if (err.code === 'auth/invalid-email') {
          pesan = 'Format email tidak valid.';
        } else if (err.code === 'auth/weak-password') {
          pesan = 'Password terlalu lemah.';
        }
        return { ok: false, alasan: pesan };
      }
    }

    // Fallback mode dummy / offline
    const idBaru = `user-${Date.now()}`;
    const userBaru: User = {
      id: idBaru,
      nama: cleanNama,
      email: cleanEmail,
      peran: payload.peran,
      nim: cleanNim,
      kelas: payload.peran === 'praktikan' ? cleanKelas : undefined,
    };

    setUsers((prev) => [...prev, userBaru]);
    setCurrentUser(userBaru);
    return { ok: true, user: userBaru };
  };

  const logout = async () => {
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

  const openSession = async (sesiId: string) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'DIBUKA' });
      } catch {}
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'DIBUKA' } : s)),
    );
  };

  const closeSession = async (sesiId: string) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'SELESAI' });
      } catch {}
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'SELESAI' } : s)),
    );
  };

  const reopenSession = async (sesiId: string) => {
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), { status: 'DIBUKA' });
      } catch {}
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, status: 'DIBUKA' } : s)),
    );
  };

  const createSession = async (input: SesiInput): Promise<Sesi | null> => {
    const sesiBaruData = {
      namaPraktikum: input.namaPraktikum.trim(),
      topik: (input.topik || '').trim(),
      kelas: input.kelas.trim(),
      lab: input.lab.trim(),
      tanggal: input.tanggal.trim(),
      jamMulai: input.jamMulai.trim(),
      jamSelesai: input.jamSelesai.trim(),
      kapasitas: input.kapasitas || 30,
      asistenId: currentUser?.id || 'asisten-1',
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
    if (isFirebaseConfigured) {
      try {
        await updateDoc(doc(db, 'sesi', sesiId), input);
      } catch {
        return false;
      }
    }
    setSesi((prev) =>
      prev.map((s) => (s.id === sesiId ? { ...s, ...input } : s)),
    );
    return true;
  };

  const deleteSession = async (sesiId: string): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'sesi', sesiId));
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
      return { ok: false, alasan: 'Presensi hanya dapat dilakukan saat sesi berstatus DIBUKA.' };
    }

    // Guard izin
    const izinAda = izin.find(
      (i) => i.sesiId === sesiId && i.praktikanId === currentUser.id,
    );
    if (izinAda) {
      return {
        ok: false,
        alasan: `Anda sudah mengajukan izin untuk sesi ini (status: ${izinAda.status}).`,
      };
    }

    // Guard presensi ganda
    const presensiLama = kehadiran.find(
      (k) => k.sesiId === sesiId && k.praktikanId === currentUser.id,
    );
    if (presensiLama) {
      return {
        ok: false,
        alasan: `Presensi sudah tercatat pada pukul ${formatJam(presensiLama.waktuHadir)}.`,
      };
    }

    const waktuHadir = nowLocalISO();
    const docId = `${sesiId}_${currentUser.id}`;

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
      } catch (err: any) {
        return {
          ok: false,
          alasan: `Gagal menyimpan presensi ke database: ${err?.message || 'Gangguan koneksi'}`,
        };
      }
    }

    setKehadiran((prev) => [
      ...prev,
      {
        id: docId,
        sesiId,
        praktikanId: currentUser.id,
        waktuHadir,
      },
    ]);

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

    const teksAlasan = alasanInput.trim();
    if (teksAlasan.length < 10) {
      return { ok: false, alasan: 'Alasan izin minimal 10 karakter.' };
    }

    // Panggil service integrasi API AI pengajar (dengan timeout & fallback aman)
    const hasilAi = await klasifikasikanAlasanIzin(teksAlasan);

    const waktuPengajuan = nowLocalISO();
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
        const docRef = await addDoc(collection(db, 'izin'), izinBaruData);
        const izinTersimpan: Izin = { id: docRef.id, ...izinBaruData };
        return { ok: true, izin: izinTersimpan };
      } catch (err: any) {
        return {
          ok: false,
          alasan: `Gagal menyimpan izin ke Firestore: ${err?.message || 'Gangguan koneksi'}`,
        };
      }
    }

    const izinBaru: Izin = {
      id: `izin-${Date.now()}`,
      ...izinBaruData,
    };

    setIzin((prev) => [izinBaru, ...prev]);
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
    users,
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

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession harus dipakai di dalam SessionProvider.');
  }
  return context;
}
