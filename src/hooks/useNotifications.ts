import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';

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
 * - Menangani notifikasi yang masuk serta navigasi ke detail sesi saat notifikasi diketuk.
 * - Tidak menerima parameter dan tidak menulis langsung ke Firestore.
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

  // 2. Tangani notifikasi yang diketuk pengguna untuk membuka detail sesi terkait
  useEffect(() => {
    if (Platform.OS === 'web' || !currentUser) return;

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
          arahkanKeSesi(lastResponse);
        }
      })
      .catch(() => {});

    const subTap = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        arahkanKeSesi(response);
      },
    );

    return () => {
      subTap.remove();
    };
  }, [currentUser, router]);
}
