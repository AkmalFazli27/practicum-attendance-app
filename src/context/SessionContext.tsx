import { createContext, useContext, useState, type ReactNode } from 'react';

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

type SessionContextValue = {
  users: User[];
  currentUser: User | null;
  sesi: Sesi[];
  kehadiran: Kehadiran[];
  izin: Izin[];
  login: (userId: string) => void;
  loginWithEmail: (email: string, password: string, peranFallback?: Peran) => AuthResult;
  registerUser: (payload: RegisterPayload) => AuthResult;
  logout: () => void;
  openSession: (sesiId: string) => void;
  closeSession: (sesiId: string) => void;
  reopenSession: (sesiId: string) => void;
  createSession: (input: SesiInput) => Sesi | null;
  updateSession: (sesiId: string, input: Partial<SesiInput>) => boolean;
  deleteSession: (sesiId: string) => boolean;
  markAttendance: (sesiId: string) => PresensiResult;
  submitIzin: (sesiId: string, alasan: string) => IzinResult;
  reviewIzin: (izinId: string, status: Exclude<StatusIzin, 'MENUNGGU'>) => boolean;
  getSesiById: (sesiId: string) => Sesi | undefined;
  getKehadiranSesi: (sesiId: string) => Kehadiran[];
  getKehadiranPraktikan: (praktikanId: string) => Kehadiran[];
  sudahPresensi: (sesiId: string, praktikanId: string) => Kehadiran | undefined;
  getIzinSesi: (sesiId: string) => Izin[];
  getIzinPraktikan: (praktikanId: string) => Izin[];
  getIzinBySesiPraktikan: (sesiId: string, praktikanId: string) => Izin | undefined;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Klasifikasi heuristik ringan sebagai placeholder UI sebelum dihubungkan
 * ke endpoint API Model AI pengajar pada Sprint 2.
 */
function klasifikasiAlasanAiPlaceholder(alasan: string): {
  kategoriAi: string;
  ringkasanAi: string;
} {
  const teks = alasan.toLowerCase();
  if (
    teks.includes('sakit') ||
    teks.includes('demam') ||
    teks.includes('dokter') ||
    teks.includes('klinik') ||
    teks.includes('rumah sakit') ||
    teks.includes('medis')
  ) {
    return {
      kategoriAi: 'Sakit / Medis',
      ringkasanAi: 'Terdeteksi kata kunci kondisi kesehatan atau pemeriksaan medis.',
    };
  }
  if (
    teks.includes('lomba') ||
    teks.includes('delegasi') ||
    teks.includes('seminar') ||
    teks.includes('dekanat') ||
    teks.includes('kampus') ||
    teks.includes('akademik')
  ) {
    return {
      kategoriAi: 'Kegiatan Akademik / Delegasi',
      ringkasanAi: 'Terdeteksi kegiatan akademik, kompetisi, atau penugasan institusi.',
    };
  }
  if (
    teks.includes('keluarga') ||
    teks.includes('duka') ||
    teks.includes('orang tua') ||
    teks.includes('acara keluarga')
  ) {
    return {
      kategoriAi: 'Urusan Keluarga',
      ringkasanAi: 'Terdeteksi keperluan mendesak keluarga.',
    };
  }
  return {
    kategoriAi: 'Keperluan Lainnya',
    ringkasanAi: 'Perlu peninjauan manual alasan ketidakhadiran oleh asisten.',
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sesi, setSesi] = useState<Sesi[]>(SESI_SEED);
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>(KEHADIRAN_SEED);
  const [izin, setIzin] = useState<Izin[]>(IZIN_SEED);

  function login(userId: string) {
    const user = users.find((item) => item.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }

  function loginWithEmail(
    emailInput: string,
    passwordInput: string,
    peranFallback: Peran = 'praktikan',
  ): AuthResult {
    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return { ok: false, alasan: 'Masukkan alamat email yang valid.' };
    }
    if (passwordInput.trim().length < 6) {
      return { ok: false, alasan: 'Kata sandi minimal 6 karakter.' };
    }

    const existing = users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );
    if (existing) {
      setCurrentUser(existing);
      return { ok: true, user: existing };
    }

    // Jika belum dihubungkan ke Firebase Auth oleh P1, gunakan akun sesuai peran
    // atau buat sesi pengguna berdasarkan email agar alur UI dapat langsung diuji.
    const defaultRoleUser = users.find((u) => u.peran === peranFallback);
    if (defaultRoleUser) {
      setCurrentUser(defaultRoleUser);
      return { ok: true, user: defaultRoleUser };
    }

    return { ok: false, alasan: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' };
  }

  function registerUser(payload: RegisterPayload): AuthResult {
    const nama = payload.nama.trim();
    const email = payload.email.trim().toLowerCase();
    const nim = payload.nim?.trim();
    const kelas = payload.kelas?.trim().toUpperCase();

    if (!nama) {
      return { ok: false, alasan: 'Nama lengkap wajib diisi.' };
    }
    if (!email || !email.includes('@')) {
      return { ok: false, alasan: 'Alamat email tidak valid.' };
    }
    if (payload.password.trim().length < 6) {
      return { ok: false, alasan: 'Kata sandi minimal 6 karakter.' };
    }
    if (!nim) {
      return { ok: false, alasan: 'NIM / ID wajib diisi.' };
    }
    if (payload.peran === 'praktikan' && !kelas) {
      return { ok: false, alasan: 'Kelas wajib diisi untuk praktikan.' };
    }

    const emailSudahAda = users.some((u) => u.email?.toLowerCase() === email);
    if (emailSudahAda) {
      return { ok: false, alasan: 'Email sudah terdaftar. Silakan masuk.' };
    }

    const newUser: User = {
      id: `${payload.peran === 'asisten' ? 'a' : 'p'}-${Date.now()}`,
      nama,
      email,
      nim,
      peran: payload.peran,
      kelas: payload.peran === 'praktikan' ? kelas : undefined,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return { ok: true, user: newUser };
  }

  function logout() {
    setCurrentUser(null);
  }

  function updateStatus(sesiId: string, status: Sesi['status']) {
    setSesi((prev) =>
      prev.map((item) => (item.id === sesiId ? { ...item, status } : item)),
    );
  }

  function openSession(sesiId: string) {
    updateStatus(sesiId, 'DIBUKA');
  }

  function closeSession(sesiId: string) {
    updateStatus(sesiId, 'SELESAI');
  }

  function reopenSession(sesiId: string) {
    updateStatus(sesiId, 'DIBUKA');
  }

  function createSession(input: SesiInput): Sesi | null {
    if (!currentUser || currentUser.peran !== 'asisten') return null;
    const sesiBaru: Sesi = {
      id: `ses-${Date.now()}`,
      namaPraktikum: input.namaPraktikum.trim(),
      topik: input.topik?.trim() || 'Materi Praktikum',
      kelas: input.kelas.trim().toUpperCase(),
      lab: input.lab.trim(),
      tanggal: input.tanggal.trim(),
      jamMulai: input.jamMulai.trim(),
      jamSelesai: input.jamSelesai.trim(),
      deskripsi: input.deskripsi.trim(),
      kapasitas: input.kapasitas ?? 32,
      asistenId: currentUser.id,
      status: 'TERJADWAL',
    };
    setSesi((prev) => [sesiBaru, ...prev]);
    return sesiBaru;
  }

  function updateSession(sesiId: string, input: Partial<SesiInput>): boolean {
    const existing = sesi.find((item) => item.id === sesiId);
    if (!existing) return false;
    setSesi((prev) =>
      prev.map((item) =>
        item.id === sesiId
          ? {
              ...item,
              ...input,
              namaPraktikum: input.namaPraktikum?.trim() ?? item.namaPraktikum,
              topik: input.topik?.trim() ?? item.topik,
              kelas: input.kelas?.trim().toUpperCase() ?? item.kelas,
              lab: input.lab?.trim() ?? item.lab,
              tanggal: input.tanggal?.trim() ?? item.tanggal,
              jamMulai: input.jamMulai?.trim() ?? item.jamMulai,
              jamSelesai: input.jamSelesai?.trim() ?? item.jamSelesai,
              deskripsi: input.deskripsi?.trim() ?? item.deskripsi,
              kapasitas: input.kapasitas ?? item.kapasitas,
            }
          : item,
      ),
    );
    return true;
  }

  function deleteSession(sesiId: string): boolean {
    const existing = sesi.find((item) => item.id === sesiId);
    if (!existing) return false;
    setSesi((prev) => prev.filter((item) => item.id !== sesiId));
    setKehadiran((prev) => prev.filter((item) => item.sesiId !== sesiId));
    setIzin((prev) => prev.filter((item) => item.sesiId !== sesiId));
    return true;
  }

  function markAttendance(sesiId: string): PresensiResult {
    if (!currentUser || currentUser.peran !== 'praktikan') {
      return { ok: false, alasan: 'Hanya praktikan yang dapat melakukan presensi.' };
    }

    const sesiDipilih = sesi.find((item) => item.id === sesiId);
    if (!sesiDipilih) {
      return { ok: false, alasan: 'Sesi tidak ditemukan.' };
    }
    if (sesiDipilih.status !== 'DIBUKA') {
      return { ok: false, alasan: 'Sesi belum dibuka atau sudah ditutup.' };
    }

    const presensiSebelumnya = kehadiran.find(
      (item) => item.sesiId === sesiId && item.praktikanId === currentUser.id,
    );
    if (presensiSebelumnya) {
      return {
        ok: false,
        alasan: `Kamu sudah presensi pukul ${formatJam(presensiSebelumnya.waktuHadir)}.`,
      };
    }

    const waktuHadir = nowLocalISO();
    setKehadiran((prev) => [
      ...prev,
      {
        id: `kehadiran-${sesiId}-${currentUser.id}`,
        sesiId,
        praktikanId: currentUser.id,
        waktuHadir,
      },
    ]);

    return { ok: true, waktuHadir };
  }

  function submitIzin(sesiId: string, alasanInput: string): IzinResult {
    if (!currentUser || currentUser.peran !== 'praktikan') {
      return { ok: false, alasan: 'Hanya praktikan yang dapat mengajukan izin.' };
    }
    const alasan = alasanInput.trim();
    if (alasan.length < 10) {
      return {
        ok: false,
        alasan: 'Tuliskan alasan ketidakhadiran dengan jelas (minimal 10 karakter).',
      };
    }

    const sudahHadir = kehadiran.find(
      (item) => item.sesiId === sesiId && item.praktikanId === currentUser.id,
    );
    if (sudahHadir) {
      return {
        ok: false,
        alasan: 'Kamu sudah tercatat hadir pada sesi ini.',
      };
    }

    const izinSebelumnya = izin.find(
      (item) => item.sesiId === sesiId && item.praktikanId === currentUser.id,
    );
    if (izinSebelumnya) {
      return {
        ok: false,
        alasan: 'Kamu sudah mengajukan izin untuk sesi ini.',
      };
    }

    const { kategoriAi, ringkasanAi } = klasifikasiAlasanAiPlaceholder(alasan);
    const izinBaru: Izin = {
      id: `izin-${sesiId}-${currentUser.id}`,
      sesiId,
      praktikanId: currentUser.id,
      alasan,
      kategoriAi,
      ringkasanAi,
      status: 'MENUNGGU',
      waktuPengajuan: nowLocalISO(),
    };

    setIzin((prev) => [izinBaru, ...prev]);
    return { ok: true, izin: izinBaru };
  }

  function reviewIzin(
    izinId: string,
    status: Exclude<StatusIzin, 'MENUNGGU'>,
  ): boolean {
    const target = izin.find((item) => item.id === izinId);
    if (!target) return false;
    setIzin((prev) =>
      prev.map((item) =>
        item.id === izinId
          ? {
              ...item,
              status,
              waktuKeputusan: nowLocalISO(),
            }
          : item,
      ),
    );
    return true;
  }

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
