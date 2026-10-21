import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  KEHADIRAN_SEED,
  SESI_SEED,
  USERS,
  type Kehadiran,
  type Sesi,
  type User,
} from '@/data/dummy';
import { formatJam, nowLocalISO } from '@/utils/format';

export type PresensiResult =
  | { ok: true; waktuHadir: string }
  | { ok: false; alasan: string };

type SessionContextValue = {
  users: User[];
  currentUser: User | null;
  sesi: Sesi[];
  kehadiran: Kehadiran[];
  login: (userId: string) => void;
  logout: () => void;
  openSession: (sesiId: string) => void;
  closeSession: (sesiId: string) => void;
  reopenSession: (sesiId: string) => void;
  markAttendance: (sesiId: string) => PresensiResult;
  getSesiById: (sesiId: string) => Sesi | undefined;
  getKehadiranSesi: (sesiId: string) => Kehadiran[];
  getKehadiranPraktikan: (praktikanId: string) => Kehadiran[];
  sudahPresensi: (sesiId: string, praktikanId: string) => Kehadiran | undefined;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sesi, setSesi] = useState<Sesi[]>(SESI_SEED);
  const [kehadiran, setKehadiran] = useState<Kehadiran[]>(KEHADIRAN_SEED);

  function login(userId: string) {
    const user = USERS.find((item) => item.id === userId);
    if (user) {
      setCurrentUser(user);
    }
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

  const value: SessionContextValue = {
    users: USERS,
    currentUser,
    sesi,
    kehadiran,
    login,
    logout,
    openSession,
    closeSession,
    reopenSession,
    markAttendance,
    getSesiById,
    getKehadiranSesi,
    getKehadiranPraktikan,
    sudahPresensi,
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
