import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';

export interface NotifikasiRiwayatItem {
  id: string;
  judul: string;
  pesan: string;
  waktu: string;
  sesiId?: string;
}

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
  try {
    const lama = await bacaRiwayatNotifikasi(uid);
    const tanpaDuplikat = lama.filter((x) => x.id !== item.id);
    const baru = [item, ...tanpaDuplikat]
      .sort((a, b) => (b.waktu || '').localeCompare(a.waktu || ''))
      .slice(0, 50);
    await AsyncStorage.setItem(keyRiwayat(uid), JSON.stringify(baru));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

export async function hapusRiwayatNotifikasi(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyRiwayat(uid));
    kabariRiwayatBerubah();
  } catch {
    // Abaikan kegagalan storage lokal
  }
}

function ubahKeItemRiwayat(
  notification: Notifications.Notification,
): NotifikasiRiwayatItem {
  const content = notification.request.content;
  const rawData = content.data as Record<string, unknown> | undefined;
  const sesiId = ekstrakSesiId(rawData) ?? undefined;
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
    sesiId,
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
      Notifications.getPresentedNotificationsAsync().catch(() => []),
      Notifications.getLastNotificationResponseAsync().catch(() => null),
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
  Notifications.setNotificationHandler({
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

function ekstrakSesiId(
  data: Record<string, unknown> | undefined | null,
): string | null {
  if (!data || typeof data !== 'object') return null;
  const kandidat = data.sesiId ?? data.sessionId ?? data.id;
  if (typeof kandidat === 'string' && kandidat.trim().length > 0) {
    return kandidat.trim();
  }
  return null;
}

/**
 * Hook klien push notification (FR-24 & FR-25).
 * - Meminta izin notifikasi saat pengguna login.
 * - Mendaftarkan Expo Push Token melalui `savePushToken` dari `useSession()`.
 * - Mencatat setiap notifikasi yang muncul (foreground, background, ditekan maupun tidak)
 *   ke riwayat notifikasi lokal.
 * - Menangani navigasi ke detail sesi saat notifikasi diketuk.
 */
export function useNotifications(): void {
  const router = useRouter();
  const { currentUser, savePushToken } = useSession();
  const { showToast } = useToast();

  const lastRegisteredKeyRef = useRef<string | null>(null);
  const warnedDeniedUidRef = useRef<string | null>(null);
  const handledResponseIdRef = useRef<string | null>(null);

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
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Notifikasi Praktikum TapIn',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
          });
        }

        const izinAwal = await Notifications.getPermissionsAsync();
        let diizinkan =
          izinAwal.granted ||
          izinAwal.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL;

        if (!diizinkan && izinAwal.canAskAgain) {
          const hasilMinta = await Notifications.requestPermissionsAsync();
          diizinkan =
            hasilMinta.granted ||
            hasilMinta.ios?.status ===
              Notifications.IosAuthorizationStatus.PROVISIONAL;
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
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        const tokenRes = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();

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

    const arahkanKeSesi = (
      response: Notifications.NotificationResponse | null,
    ) => {
      if (!response) return;
      const identifier = response.notification.request.identifier;
      if (identifier && handledResponseIdRef.current === identifier) {
        return;
      }

      const rawData = response.notification.request.content.data as
        | Record<string, unknown>
        | undefined;
      const sesiId = ekstrakSesiId(rawData);
      if (!sesiId) return;

      if (identifier) {
        handledResponseIdRef.current = identifier;
      }

      const pathname =
        currentUser.peran === 'asisten'
          ? '/(asisten)/sesi/[id]'
          : '/(praktikan)/sesi/[id]';

      router.push({ pathname, params: { id: sesiId } } as any);
    };

    Notifications.getLastNotificationResponseAsync()
      .then((lastResponse) => {
        if (lastResponse) {
          void simpanRiwayatNotifikasi(
            uid,
            ubahKeItemRiwayat(lastResponse.notification),
          );
          arahkanKeSesi(lastResponse);
        }
      })
      .catch(() => {});

    const subReceived = Notifications.addNotificationReceivedListener(
      (notification) => {
        void simpanRiwayatNotifikasi(uid, ubahKeItemRiwayat(notification));
      },
    );

    const subTap = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        void simpanRiwayatNotifikasi(
          uid,
          ubahKeItemRiwayat(response.notification),
        );
        arahkanKeSesi(response);
      },
    );

    return () => {
      subAppState.remove();
      subReceived.remove();
      subTap.remove();
    };
  }, [currentUser, router]);
}
