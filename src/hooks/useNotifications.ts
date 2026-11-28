import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import expoConstants from 'expo-constants';
import * as Device from 'expo-device';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  AndroidImportance,
  dismissAllNotificationsAsync,
  getExpoPushTokenAsync,
  getLastNotificationResponseAsync,
  getPermissionsAsync,
  getPresentedNotificationsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type Notification,
  type NotificationResponse,
} from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useToast } from '@/components/ui';
import { getActiveLanguage } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Peran } from '@/data/dummy';

export type JenisNotifikasiRiwayat =
  | 'SESI_DIBUKA'
  | 'JADWAL_BERUBAH'
  | 'KEPUTUSAN_IZIN'
  | 'TAGIHAN_BARU'
  | 'PEMBAYARAN_BERHASIL'
  | 'PEMBAYARAN_GAGAL'
  | 'AKSI_SESI';

export interface NotifikasiRiwayatItem {
  id: string;
  judul: string;
  pesan: string;
  waktu: string;
  jenis?: JenisNotifikasiRiwayat;
  sesiId?: string;
  tagihanId?: string;
  orderId?: string;
  dibaca?: boolean;
}

export type TujuanNotifikasi =
  | { pathname: '/(praktikan)/tagihan/[id]'; params: { id: string } }
  | { pathname: '/(praktikan)/riwayat-pembayaran'; params?: undefined }
  | { pathname: '/(praktikan)/sesi/[id]'; params: { id: string } }
  | { pathname: '/(asisten)/sesi/[id]'; params: { id: string } }
  | { pathname: '/(aslab)/(tabs)/beranda-aslab'; params?: undefined }
  | null;

const JENIS_VALID: readonly JenisNotifikasiRiwayat[] = [
  'SESI_DIBUKA',
  'JADWAL_BERUBAH',
  'KEPUTUSAN_IZIN',
  'TAGIHAN_BARU',
  'PEMBAYARAN_BERHASIL',
  'PEMBAYARAN_GAGAL',
  'AKSI_SESI',
];

const keyRiwayat = (uid: string) => `@tapin_notif_history_${uid}`;

const listenersRiwayat = new Set<() => void>();

export function subscribeRiwayatNotifikasi(cb: () => void): () => void {
  listenersRiwayat.add(cb);
  return () => {
    listenersRiwayat.delete(cb);
  };
}

function kabariRiwayatBerubah() {
  listenersRiwayat.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

function ekstrakString(
  data: Record<string, unknown> | undefined | null,
  key: string,
): string | null {
  if (!data || typeof data !== 'object') return null;
  const value = data[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function ekstrakTagihanId(
  data: Record<string, unknown> | undefined | null,
): string | null {
  return ekstrakString(data, 'tagihanId');
}

function ekstrakOrderId(
  data: Record<string, unknown> | undefined | null,
): string | null {
  return ekstrakString(data, 'orderId');
}

function ekstrakJenis(
  data: Record<string, unknown> | undefined | null,
): JenisNotifikasiRiwayat | undefined {
  const kandidat = ekstrakString(data, 'jenis');
  if (!kandidat) return undefined;
  return JENIS_VALID.includes(kandidat as JenisNotifikasiRiwayat)
    ? (kandidat as JenisNotifikasiRiwayat)
    : undefined;
}

function ekstrakSesiId(
  data: Record<string, unknown> | undefined | null,
): string | null {
  if (!data || typeof data !== 'object') return null;
  const langsung =
    ekstrakString(data, 'sesiId') ?? ekstrakString(data, 'sessionId');
  if (langsung) return langsung;
  if (ekstrakTagihanId(data) || ekstrakOrderId(data)) return null;
  return ekstrakString(data, 'id');
}

export function tujuanNotifikasi(
  item: Pick<NotifikasiRiwayatItem, 'tagihanId' | 'orderId' | 'sesiId'>,
  peran: Peran,
): TujuanNotifikasi {
  if (item.tagihanId && peran === 'praktikan') {
    return {
      pathname: '/(praktikan)/tagihan/[id]',
      params: { id: item.tagihanId },
    };
  }
  if (item.orderId && peran === 'praktikan') {
    return { pathname: '/(praktikan)/riwayat-pembayaran' };
  }
  if (item.sesiId) {
    if (peran === 'asisten') {
      return {
        pathname: '/(asisten)/sesi/[id]',
        params: { id: item.sesiId },
      };
    }
    if (peran === 'praktikan') {
      return {
        pathname: '/(praktikan)/sesi/[id]',
        params: { id: item.sesiId },
      };
    }
    if (peran === 'aslab') {
      return { pathname: '/(aslab)/(tabs)/beranda-aslab' };
    }
  }
  return null;
}

export async function bacaRiwayatNotifikasi(
  uid: string,
): Promise<NotifikasiRiwayatItem[]> {
  try {
    const raw = await AsyncStorage.getItem(keyRiwayat(uid));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function simpanRiwayatNotifikasi(
  uid: string,
  item: NotifikasiRiwayatItem,
): Promise<void> {
  if (!uid) return;
  try {
    const lama = await bacaRiwayatNotifikasi(uid);
    const existing = lama.find((x) => x.id === item.id);
    const itemBaru: NotifikasiRiwayatItem = {
      ...existing,
      ...item,
      // Jangan kembalikan notifikasi yang sudah dibaca menjadi belum dibaca saat tray sync.
      dibaca: existing?.dibaca ? true : (item.dibaca ?? false),
    };
    const tanpaDuplikat = lama.filter((x) => x.id !== item.id);
    const baru = [itemBaru, ...tanpaDuplikat]
      .sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''))
      .slice(0, 50);
    await AsyncStorage.setItem(keyRiwayat(uid), JSON.stringify(baru));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

export async function tandaiSemuaNotifikasiDibaca(uid: string): Promise<void> {
  if (!uid) return;
  try {
    const lama = await bacaRiwayatNotifikasi(uid);
    if (lama.length === 0) return;
    if (lama.every((item) => item.dibaca === true)) return;
    const baru = lama.map((item) => ({ ...item, dibaca: true }));
    await AsyncStorage.setItem(keyRiwayat(uid), JSON.stringify(baru));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

export async function tandaiNotifikasiDibaca(
  uid: string,
  id: string,
): Promise<void> {
  if (!uid || !id) return;
  try {
    const lama = await bacaRiwayatNotifikasi(uid);
    const target = lama.find((item) => item.id === id);
    if (!target || target.dibaca === true) return;
    const baru = lama.map((item) =>
      item.id === id ? { ...item, dibaca: true } : item,
    );
    await AsyncStorage.setItem(keyRiwayat(uid), JSON.stringify(baru));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

export async function hapusRiwayatNotifikasi(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await AsyncStorage.removeItem(keyRiwayat(uid));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

export async function catatHasilAksiSesi(
  uid: string,
  input: {
    aksi: 'BUKA' | 'TUTUP';
    berhasil: boolean;
    sesiId: string;
    namaSesi: string;
    pesan?: string;
  },
): Promise<void> {
  if (!uid) return;
  const isEn = getActiveLanguage() === 'en';

  const judul =
    input.aksi === 'BUKA'
      ? input.berhasil
        ? isEn
          ? 'Session opened'
          : 'Sesi dibuka'
        : isEn
          ? 'Failed to open session'
          : 'Gagal membuka sesi'
      : input.berhasil
        ? isEn
          ? 'Session closed'
          : 'Sesi ditutup'
        : isEn
          ? 'Failed to close session'
          : 'Gagal menutup sesi';

  const defaultPesan =
    input.aksi === 'BUKA'
      ? input.berhasil
        ? isEn
          ? `Session ${input.namaSesi} was opened.`
          : `Sesi ${input.namaSesi} berhasil dibuka.`
        : isEn
          ? `Failed to open session ${input.namaSesi}.`
          : `Gagal membuka sesi ${input.namaSesi}.`
      : input.berhasil
        ? isEn
          ? `Session ${input.namaSesi} was closed.`
          : `Sesi ${input.namaSesi} berhasil ditutup.`
        : isEn
          ? `Failed to close session ${input.namaSesi}.`
          : `Gagal menutup sesi ${input.namaSesi}.`;

  await simpanRiwayatNotifikasi(uid, {
    id: `aksi-sesi-${input.aksi}-${input.sesiId}-${Date.now()}`,
    judul,
    pesan: input.pesan ?? defaultPesan,
    waktu: new Date().toISOString(),
    jenis: 'AKSI_SESI',
    sesiId: input.sesiId,
    dibaca: false,
  });
}

export function useUnreadNotificationCount(uid?: string): number {
  const [state, setState] = useState<{ uid?: string; jumlah: number }>({
    jumlah: 0,
  });

  useEffect(() => {
    if (!uid) return;
    let aktif = true;
    const muat = async () => {
      const items = await bacaRiwayatNotifikasi(uid);
      if (!aktif) return;
      // Item lama tanpa field dibaca tidak dihitung belum dibaca.
      setState({
        uid,
        jumlah: items.filter((x) => x.dibaca === false).length,
      });
    };
    void muat();
    const unsub = subscribeRiwayatNotifikasi(() => void muat());
    return () => {
      aktif = false;
      unsub();
    };
  }, [uid]);

  return uid && state.uid === uid ? state.jumlah : 0;
}

function ubahKeItemRiwayat(notification: Notification): NotifikasiRiwayatItem {
  const content = notification.request.content;
  const rawData = content.data as Record<string, unknown> | undefined;
  const jenis = ekstrakJenis(rawData);
  const sesiId = ekstrakSesiId(rawData) ?? undefined;
  const tagihanId = ekstrakTagihanId(rawData) ?? undefined;
  const orderId = ekstrakOrderId(rawData) ?? undefined;
  const rawDate = notification.date;
  // iOS mengirim detik, Android mengirim milidetik
  const ms =
    typeof rawDate === 'number' && Number.isFinite(rawDate)
      ? rawDate < 1e12
        ? rawDate * 1000
        : rawDate
      : Date.now();
  return {
    id:
      notification.request.identifier ||
      `notif-${ms}-${content.title ?? ''}-${content.body ?? ''}`,
    judul: content.title || 'Notifikasi TapIn',
    pesan: content.body || '',
    waktu: new Date(ms).toISOString(),
    ...(jenis ? { jenis } : {}),
    ...(sesiId ? { sesiId } : {}),
    ...(tagihanId ? { tagihanId } : {}),
    ...(orderId ? { orderId } : {}),
    dibaca: false,
  };
}

/**
 * Menyinkronkan seluruh notifikasi yang sudah tampil di tray HP (termasuk yang
 * masuk saat aplikasi di background/tertutup dan tidak ditekan) ke riwayat lokal.
 */
export async function sinkronkanNotifikasiTerkirim(uid: string): Promise<void> {
  if (Platform.OS === 'web' || !uid) return;
  try {
    const [disajikan, responTerakhir] = await Promise.all([
      getPresentedNotificationsAsync().catch(() => []),
      getLastNotificationResponseAsync().catch(() => null),
    ]);

    const kandidat: NotifikasiRiwayatItem[] = [];
    for (const notif of disajikan) {
      kandidat.push(ubahKeItemRiwayat(notif));
    }
    if (responTerakhir?.notification) {
      kandidat.push(ubahKeItemRiwayat(responTerakhir.notification));
    }
    if (kandidat.length === 0) return;

    const lama = await bacaRiwayatNotifikasi(uid);
    const peta = new Map<string, NotifikasiRiwayatItem>();
    for (const item of lama) {
      peta.set(item.id, item);
    }
    let berubah = false;
    for (const item of kandidat) {
      if (!peta.has(item.id)) {
        peta.set(item.id, item);
        berubah = true;
      }
    }
    if (!berubah) return;

    const gabung = Array.from(peta.values())
      .sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''))
      .slice(0, 50);
    await AsyncStorage.setItem(keyRiwayat(uid), JSON.stringify(gabung));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan sinkronisasi native
  }
}

try {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // Abaikan bila dijalankan di lingkungan yang tidak mendukung handler native
}

/**
 * Hook klien push notification (FR-24, FR-25, FR-39, FR-42 s.d. FR-45).
 * - Meminta izin notifikasi saat pengguna login.
 * - Mendaftarkan Expo Push Token melalui `savePushToken` dari `useSession()`.
 * - Mencatat setiap notifikasi yang muncul ke riwayat notifikasi per akun (`uid`).
 * - Mengarahkan ketukan notifikasi ke tagihan, pembayaran, atau sesi sesuai peran.
 */
export function useNotifications(): void {
  const router = useRouter();
  const { currentUser, savePushToken } = useSession();
  const { showToast } = useToast();

  const lastRegisteredKeyRef = useRef<string | null>(null);
  const warnedDeniedUidRef = useRef<string | null>(null);
  const handledResponseIdRef = useRef<string | null>(null);

  // Isolasi antar akun: bersihkan ref & tray saat logout tanpa menghapus riwayat akun lama.
  useEffect(() => {
    if (currentUser) return;
    lastRegisteredKeyRef.current = null;
    handledResponseIdRef.current = null;
    warnedDeniedUidRef.current = null;
    if (Platform.OS !== 'web') {
      void dismissAllNotificationsAsync().catch(() => {});
    }
  }, [currentUser]);

  // 1. Registrasi izin & Expo Push Token ketika pengguna terautentikasi
  useEffect(() => {
    if (!currentUser?.id) {
      lastRegisteredKeyRef.current = null;
      return;
    }

    if (Platform.OS === 'web') {
      return;
    }

    let cancelled = false;
    const uid = currentUser.id;

    const siapkanNotifikasi = async () => {
      try {
        if (Platform.OS === 'android') {
          await setNotificationChannelAsync('default', {
            name: 'Notifikasi Praktikum TapIn',
            importance: AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const izinAwal = await getPermissionsAsync();
        let diizinkan =
          izinAwal.granted ||
          izinAwal.ios?.status === IosAuthorizationStatus.PROVISIONAL;

        if (!diizinkan && izinAwal.canAskAgain) {
          const hasilMinta = await requestPermissionsAsync();
          diizinkan =
            hasilMinta.granted ||
            hasilMinta.ios?.status === IosAuthorizationStatus.PROVISIONAL;
        }

        if (cancelled) return;

        if (!diizinkan) {
          if (warnedDeniedUidRef.current !== uid) {
            warnedDeniedUidRef.current = uid;
            showToast(
              'Izin notifikasi ditolak. Aktifkan di pengaturan perangkat agar menerima info sesi & izin.',
            );
          }
          return;
        }

        if (!Device.isDevice) {
          return;
        }

        const projectId =
          expoConstants?.expoConfig?.extra?.eas?.projectId ??
          expoConstants?.easConfig?.projectId;

        const tokenRes = projectId
          ? await getExpoPushTokenAsync({ projectId })
          : await getExpoPushTokenAsync();

        if (cancelled) return;

        const token = tokenRes?.data?.trim();
        if (!token) return;

        const registrationKey = `${uid}:${token}`;
        if (lastRegisteredKeyRef.current === registrationKey) return;

        await savePushToken(token);
        if (!cancelled) {
          lastRegisteredKeyRef.current = registrationKey;
        }
      } catch {
        // Jangan membuat aplikasi crash bila berjalan di Expo Go / emulator tanpa kredensial FCM
      }
    };

    void siapkanNotifikasi();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, savePushToken, showToast]);

  // 2. Tangani notifikasi yang masuk (foreground/background) & yang diketuk pengguna
  useEffect(() => {
    if (Platform.OS === 'web' || !currentUser) return;

    const uid = currentUser.id;

    // Sinkronkan notifikasi popup yang muncul saat aplikasi di background/tertutup
    void sinkronkanNotifikasiTerkirim(uid);

    const subAppState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void sinkronkanNotifikasiTerkirim(uid);
      }
    });

    const arahkanKeTujuan = (response: NotificationResponse | null) => {
      if (!response) return;
      const identifier = response.notification.request.identifier;
      if (identifier && handledResponseIdRef.current === identifier) {
        return;
      }

      const item = ubahKeItemRiwayat(response.notification);
      const tujuan = tujuanNotifikasi(item, currentUser.peran);
      if (!tujuan) return;

      if (identifier) {
        handledResponseIdRef.current = identifier;
      }

      void tandaiNotifikasiDibaca(uid, item.id);
      router.push(tujuan as any);
    };

    getLastNotificationResponseAsync()
      .then(async (lastResponse) => {
        if (lastResponse) {
          await simpanRiwayatNotifikasi(
            uid,
            ubahKeItemRiwayat(lastResponse.notification),
          );
          arahkanKeTujuan(lastResponse);
        }
      })
      .catch(() => {});

    const subReceived = addNotificationReceivedListener((notification) => {
      void simpanRiwayatNotifikasi(uid, ubahKeItemRiwayat(notification));
    });

    const subTap = addNotificationResponseReceivedListener(async (response) => {
      await simpanRiwayatNotifikasi(
        uid,
        ubahKeItemRiwayat(response.notification),
      );
      arahkanKeTujuan(response);
    });

    return () => {
      subAppState.remove();
      subReceived.remove();
      subTap.remove();
    };
  }, [currentUser, router]);
}
