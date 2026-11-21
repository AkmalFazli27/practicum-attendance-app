import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import {
  Bell,
  Camera as CameraIcon,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export type StatusIzinItem =
  | 'memuat'
  | 'aktif'
  | 'gps-mati'
  | 'ditolak'
  | 'belum-diatur';

export interface StatusIzinPerangkatProps {
  style?: StyleProp<ViewStyle>;
  onStatusChange?: (status: {
    lokasi: StatusIzinItem;
    notifikasi: StatusIzinItem;
    kamera: StatusIzinItem;
  }) => void;
}

export function StatusIzinPerangkat({
  style,
  onStatusChange,
}: StatusIzinPerangkatProps) {
  const { themeColors, t } = usePreferences();
  const [statusLokasi, setStatusLokasi] = useState<StatusIzinItem>('memuat');
  const [statusNotif, setStatusNotif] = useState<StatusIzinItem>('memuat');
  const [statusKamera, setStatusKamera] = useState<StatusIzinItem>('memuat');

  const periksaSemua = useCallback(async () => {
    let hasilLokasi: StatusIzinItem = 'ditolak';
    let hasilNotif: StatusIzinItem = 'ditolak';
    let hasilKamera: StatusIzinItem = 'belum-diatur';

    try {
      const izinLok = await Location.getForegroundPermissionsAsync();
      if (izinLok.granted) {
        const gpsHidup = await Location.hasServicesEnabledAsync().catch(
          () => true,
        );
        hasilLokasi = gpsHidup ? 'aktif' : 'gps-mati';
      } else if (izinLok.status === 'undetermined') {
        hasilLokasi = 'belum-diatur';
      } else {
        hasilLokasi = 'ditolak';
      }
    } catch {
      hasilLokasi = 'ditolak';
    }

    try {
      const izinNotif = await Notifications.getPermissionsAsync();
      if (
        izinNotif.granted ||
        izinNotif.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL
      ) {
        hasilNotif = 'aktif';
      } else if (izinNotif.status === 'undetermined') {
        hasilNotif = 'belum-diatur';
      } else {
        hasilNotif = 'ditolak';
      }
    } catch {
      hasilNotif = 'belum-diatur';
    }

    try {
      const izinCam = await Camera.getCameraPermissionsAsync();
      if (izinCam.granted) {
        hasilKamera = 'aktif';
      } else if (izinCam.status === 'undetermined') {
        hasilKamera = 'belum-diatur';
      } else {
        hasilKamera = 'ditolak';
      }
    } catch {
      hasilKamera = 'belum-diatur';
    }

    setStatusLokasi(hasilLokasi);
    setStatusNotif(hasilNotif);
    setStatusKamera(hasilKamera);
    onStatusChange?.({
      lokasi: hasilLokasi,
      notifikasi: hasilNotif,
      kamera: hasilKamera,
    });
  }, [onStatusChange]);

  useEffect(() => {
    void periksaSemua();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void periksaSemua();
      }
    });
    return () => sub.remove();
  }, [periksaSemua]);

  const bukaPengaturan = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Linking.openSettings();
      }
    } catch {
      // Abaikan jika perangkat tidak mendukung openSettings
    }
  };

  const handleAksiLokasi = async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      if (!res.granted) {
        if (!res.canAskAgain) {
          await bukaPengaturan();
        }
      } else {
        const gpsHidup = await Location.hasServicesEnabledAsync().catch(
          () => true,
        );
        if (!gpsHidup && Platform.OS === 'android') {
          await Location.enableNetworkProviderAsync().catch(() =>
            bukaPengaturan(),
          );
        } else if (!gpsHidup) {
          await bukaPengaturan();
        }
      }
    } catch {
      await bukaPengaturan();
    } finally {
      await periksaSemua();
    }
  };

  const handleAksiNotif = async () => {
    try {
      const res = await Notifications.requestPermissionsAsync();
      if (!res.granted && !res.canAskAgain) {
        await bukaPengaturan();
      }
    } catch {
      await bukaPengaturan();
    } finally {
      await periksaSemua();
    }
  };

  const konfirmasiNonaktifkan = (namaIzin: string) => {
    const pesan = t('perm_disable_msg');
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`${pesan}\n\n${t('perm_open_settings')}?`)
      ) {
        void bukaPengaturan();
      }
      return;
    }
    Alert.alert(`${t('perm_disable_title')} ${namaIzin}`, pesan, [
      { text: t('perm_cancel'), style: 'cancel' },
      { text: t('perm_open_settings'), onPress: bukaPengaturan },
    ]);
  };

  const handleToggleLokasi = async (nextVal: boolean) => {
    if (nextVal) {
      await handleAksiLokasi();
    } else {
      konfirmasiNonaktifkan(t('perm_loc_title'));
    }
  };

  const handleToggleNotif = async (nextVal: boolean) => {
    if (nextVal) {
      await handleAksiNotif();
    } else {
      konfirmasiNonaktifkan(t('perm_notif_title'));
    }
  };

  const handleAksiKamera = async () => {
    try {
      const res = await Camera.requestCameraPermissionsAsync();
      if (!res.granted && !res.canAskAgain) {
        await bukaPengaturan();
      }
    } catch {
      await bukaPengaturan();
    } finally {
      await periksaSemua();
    }
  };

  const handleToggleKamera = async (nextVal: boolean) => {
    if (nextVal) {
      await handleAksiKamera();
    } else {
      konfirmasiNonaktifkan(t('perm_cam_title'));
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: themeColors.border,
          backgroundColor: themeColors.surface,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
          {t('perm_card_kicker')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('perm_refresh')}
          onPress={periksaSemua}
          hitSlop={8}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: themeColors.surfaceMuted },
            pressed && styles.btnPressed,
          ]}
        >
          <RefreshCw size={14} color={themeColors.textSecondary} />
          <Text
            style={[styles.refreshText, { color: themeColors.textSecondary }]}
          >
            {t('perm_refresh')}
          </Text>
        </Pressable>
      </View>

      {/* Baris 1: Lokasi & GPS */}
      <View style={styles.itemRow}>
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          <MapPin size={18} color={themeColors.textPrimary} />
        </View>
        <View style={styles.itemCopy}>
          <Text style={[styles.itemTitle, { color: themeColors.textPrimary }]}>
            {t('perm_loc_title')}
          </Text>
          <Text style={[styles.itemSub, { color: themeColors.textSecondary }]}>
            {t('perm_loc_sub')}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Switch
            value={statusLokasi === 'aktif'}
            onValueChange={handleToggleLokasi}
            disabled={statusLokasi === 'memuat'}
            trackColor={{
              false: themeColors.disabledBg,
              true: themeColors.primary,
            }}
            thumbColor={
              Platform.OS === 'android'
                ? statusLokasi === 'aktif'
                  ? themeColors.graphite
                  : themeColors.surface
                : undefined
            }
            ios_backgroundColor={themeColors.disabledBg}
            accessibilityLabel={t('perm_loc_title')}
          />
          {statusLokasi === 'gps-mati' ? (
            <Pressable onPress={handleAksiLokasi} hitSlop={4}>
              <Text
                style={[styles.hintWarning, { color: themeColors.gpsOffFg }]}
              >
                {t('perm_gps_off')}
              </Text>
            </Pressable>
          ) : statusLokasi === 'ditolak' ? (
            <Pressable onPress={bukaPengaturan} hitSlop={4}>
              <Text
                style={[styles.hintMuted, { color: themeColors.textMuted }]}
              >
                {t('perm_settings_link')}
              </Text>
            </Pressable>
          ) : statusLokasi === 'memuat' ? (
            <Text style={[styles.hintMuted, { color: themeColors.textMuted }]}>
              {t('perm_checking')}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Baris 2: Push Notification */}
      <View
        style={[
          styles.itemRow,
          styles.itemRowBorder,
          { borderTopColor: themeColors.border },
        ]}
      >
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Bell size={18} color={themeColors.textPrimary} />
        </View>
        <View style={styles.itemCopy}>
          <Text style={[styles.itemTitle, { color: themeColors.textPrimary }]}>
            {t('perm_notif_title')}
          </Text>
          <Text style={[styles.itemSub, { color: themeColors.textSecondary }]}>
            {t('perm_notif_sub')}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Switch
            value={statusNotif === 'aktif'}
            onValueChange={handleToggleNotif}
            disabled={statusNotif === 'memuat'}
            trackColor={{
              false: themeColors.disabledBg,
              true: themeColors.primary,
            }}
            thumbColor={
              Platform.OS === 'android'
                ? statusNotif === 'aktif'
                  ? themeColors.graphite
                  : themeColors.surface
                : undefined
            }
            ios_backgroundColor={themeColors.disabledBg}
            accessibilityLabel={t('perm_notif_title')}
          />
          {statusNotif === 'ditolak' ? (
            <Pressable onPress={bukaPengaturan} hitSlop={4}>
              <Text
                style={[styles.hintMuted, { color: themeColors.textMuted }]}
              >
                {t('perm_settings_link')}
              </Text>
            </Pressable>
          ) : statusNotif === 'memuat' ? (
            <Text style={[styles.hintMuted, { color: themeColors.textMuted }]}>
              {t('perm_checking')}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Baris 3: Kamera (QR Presensi) */}
      <View
        style={[
          styles.itemRow,
          styles.itemRowBorder,
          { borderTopColor: themeColors.border },
        ]}
      >
        <View
          style={[
            styles.iconTile,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          <CameraIcon size={18} color={themeColors.textPrimary} />
        </View>
        <View style={styles.itemCopy}>
          <Text style={[styles.itemTitle, { color: themeColors.textPrimary }]}>
            {t('perm_cam_title')}
          </Text>
          <Text style={[styles.itemSub, { color: themeColors.textSecondary }]}>
            {t('perm_cam_sub')}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Switch
            value={statusKamera === 'aktif'}
            onValueChange={handleToggleKamera}
            disabled={statusKamera === 'memuat'}
            trackColor={{
              false: themeColors.disabledBg,
              true: themeColors.primary,
            }}
            thumbColor={
              Platform.OS === 'android'
                ? statusKamera === 'aktif'
                  ? themeColors.graphite
                  : themeColors.surface
                : undefined
            }
            ios_backgroundColor={themeColors.disabledBg}
            accessibilityLabel={t('perm_cam_title')}
          />
          {statusKamera === 'ditolak' ? (
            <Pressable onPress={bukaPengaturan} hitSlop={4}>
              <Text
                style={[styles.hintMuted, { color: themeColors.textMuted }]}
              >
                {t('perm_settings_link')}
              </Text>
            </Pressable>
          ) : statusKamera === 'memuat' ? (
            <Text style={[styles.hintMuted, { color: themeColors.textMuted }]}>
              {t('perm_checking')}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.s4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3 + 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s2,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  refreshText: {
    ...type.micro,
    color: colors.textSecondary,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    paddingVertical: spacing.s3,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCopy: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  itemSub: {
    ...type.micro,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 52,
    gap: 2,
  },
  hintWarning: {
    ...type.micro,
    fontFamily: fontFamily.bold,
    color: colors.gpsOffFg,
  },
  hintMuted: {
    ...type.micro,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  btnPressed: {
    opacity: 0.75,
  },
});
