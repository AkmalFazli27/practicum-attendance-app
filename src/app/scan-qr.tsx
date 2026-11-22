import React, { useEffect, useRef, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import {
  Camera as CameraIcon,
  ChevronsLeft,
  MapPin,
  Minus,
  Plus,
  Zap,
  ZapOff,
} from 'lucide-react-native';

import { Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import {
  colors,
  fontFamily,
  radius,
  spacing,
  type,
} from '@/theme/tokens';

export default function ScanQrScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sesi, currentUser, getStatusEfektif } = useSession();
  const { showToast } = useToast();
  const { themeColors, t } = usePreferences();

  const [permission, requestPermission] = useCameraPermissions();
  const { koordinat } = useLocation();

  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const scannedLock = useRef(false);

  // Minta izin kamera otomatis saat pertama kali membuka layar Scan QR
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleAdjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0, Math.min(1, next));
    });
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scannedLock.current) return;
    scannedLock.current = true;

    const unlockLater = () => {
      setTimeout(() => {
        scannedLock.current = false;
      }, 2200);
    };

    const raw = (result.data ?? '').trim();
    const normKelas = (k?: string) => (k ?? '').trim().toUpperCase();
    const kelasSaya = normKelas(currentUser?.kelas);
    const isEn = t('qr_title') === 'Scan QR Code' && t('tab_home') === 'Home';

    // 1. Cari sesi yang dirujuk langsung oleh QR (format tapin://presensi/<id> atau ID sesi langsung)
    const matchPath = raw.match(/presensi\/([^/?#\s]+)/i);
    const kandidatId = matchPath?.[1] ?? raw;
    const sesiDitemukan = sesi.find((s) => s.id === kandidatId);

    if (sesiDitemukan) {
      // Validasi kelas praktikan: tolak jika QR milik kelas lain
      if (kelasSaya && normKelas(sesiDitemukan.kelas) !== kelasSaya) {
        showToast(
          isEn
            ? `This QR code is for class ${sesiDitemukan.kelas}, not your class (${currentUser?.kelas}).`
            : `Kode QR ini untuk kelas ${sesiDitemukan.kelas}, bukan kelasmu (${currentUser?.kelas}).`,
        );
        unlockLater();
        return;
      }

      // Validasi waktu efektif sesi (PB-06)
      const statusEfektif = getStatusEfektif(sesiDitemukan);
      if (statusEfektif === 'SELESAI') {
        showToast(
          isEn
            ? 'Attendance time for this session has ended.'
            : 'Waktu presensi untuk sesi ini telah berakhir.',
        );
        unlockLater();
        return;
      }
      if (statusEfektif !== 'DIBUKA') {
        showToast(
          isEn
            ? 'This practicum session has not been opened yet.'
            : 'Sesi praktikum ini belum dibuka oleh asisten.',
        );
        unlockLater();
        return;
      }

      router.replace({
        pathname: '/(praktikan)/presensi/[id]',
        params: { id: sesiDitemukan.id },
      } as any);
      return;
    }

    // 2. Jika QR memuat info kelas lain (misal "IF-2B") yang bukan kelas praktikan, tolak eksplisit
    const sesiKelasLain = sesi.find(
      (s) =>
        kelasSaya &&
        normKelas(s.kelas) !== kelasSaya &&
        (raw.toUpperCase().includes(normKelas(s.kelas)) ||
          raw.toLowerCase().includes(s.namaPraktikum.toLowerCase())),
    );
    if (sesiKelasLain) {
      showToast(
        isEn
          ? `This QR code belongs to ${sesiKelasLain.namaPraktikum} (${sesiKelasLain.kelas}), not your class.`
          : `Kode QR ini milik ${sesiKelasLain.namaPraktikum} kelas ${sesiKelasLain.kelas}, bukan kelasmu.`,
      );
      unlockLater();
      return;
    }

    // 3. Fallback aman hanya untuk QR berformat TapIn yang cocok dengan sesi aktif kelas sendiri (PB-06)
    const isTapInQr = /^tapin:\/\//i.test(raw);
    if (isTapInQr && currentUser) {
      const sesiDibuka = sesi.find(
        (s) =>
          getStatusEfektif(s) === 'DIBUKA' &&
          (!kelasSaya || normKelas(s.kelas) === kelasSaya),
      );
      if (sesiDibuka) {
        router.replace({
          pathname: '/(praktikan)/presensi/[id]',
          params: { id: sesiDibuka.id },
        } as any);
        return;
      }
    }

    showToast(
      isEn
        ? 'QR code is not recognized or not for your active class.'
        : 'Kode QR tidak dikenali atau bukan untuk sesi aktif kelasmu.',
    );
    unlockLater();
  };

  const handleRequestOrSettings = async () => {
    if (permission && !permission.canAskAgain && Platform.OS !== 'web') {
      await Linking.openSettings().catch(() => {});
      return;
    }
    await requestPermission();
  };

  // Tampilan saat izin kamera belum diberikan
  if (!permission || !permission.granted) {
    return (
      <View
        style={[
          styles.permRoot,
          {
            backgroundColor: themeColors.background,
            paddingTop: insets.top + spacing.s3,
            paddingBottom: Math.max(insets.bottom, spacing.s6),
          },
        ]}
      >
        <View style={styles.permHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.permBackBtn,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ChevronsLeft size={22} color={themeColors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.permHeaderTitle, { color: themeColors.textPrimary }]}
          >
            {t('qr_title')}
          </Text>
          <View style={styles.permBackSpacer} />
        </View>

        <View style={styles.permBody}>
          <View
            style={[
              styles.permIconCircle,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <CameraIcon size={36} color={themeColors.textPrimary} />
          </View>
          <Text style={[styles.permTitle, { color: themeColors.textPrimary }]}>
            {t('qr_perm_title')}
          </Text>
          <Text style={[styles.permSub, { color: themeColors.textSecondary }]}>
            {t('qr_perm_sub')}
          </Text>
          <Tombol
            variant="primer"
            onPress={handleRequestOrSettings}
            style={{ width: '100%', marginTop: spacing.s3 }}
          >
            {permission && !permission.canAskAgain
              ? t('perm_open_settings')
              : t('qr_perm_btn')}
          </Tombol>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        zoom={zoom}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Overlay UI mirip referensi screenshot */}
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + spacing.s3,
            paddingBottom: Math.max(insets.bottom, spacing.s6) + spacing.s4,
          },
        ]}
      >
        {/* Top Bar: Back, Pill Title, Torch */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.circleGlassBtn,
              pressed && styles.pressed,
            ]}
          >
            <ChevronsLeft size={22} color={colors.onGraphite} />
          </Pressable>

          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>{t('qr_title')}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle Flash"
            onPress={() => setTorchOn((v) => !v)}
            style={({ pressed }) => [
              styles.circleGlassBtn,
              torchOn && styles.circleGlassBtnActive,
              pressed && styles.pressed,
            ]}
          >
            {torchOn ? (
              <Zap size={20} color={colors.onPrimary} />
            ) : (
              <ZapOff size={20} color={colors.onGraphite} />
            )}
          </Pressable>
        </View>

        {/* Center Frame dengan 4 sudut membulat */}
        <View style={styles.frameWrap}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom Controls: Live GPS Pill, Zoom - / % / +, Instructions */}
        <View style={styles.bottomWrap}>
          <View style={styles.gpsPill}>
            <MapPin size={15} color={colors.primary} />
            <Text style={styles.gpsText}>
              {koordinat
                ? `${koordinat.lat.toFixed(6)}, ${koordinat.lng.toFixed(6)}`
                : t('qr_loc_loading')}
            </Text>
          </View>

          <View style={styles.zoomRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Perkecil zoom"
              onPress={() => handleAdjustZoom(-0.1)}
              style={({ pressed }) => [
                styles.zoomBtn,
                pressed && styles.pressed,
              ]}
            >
              <Minus size={18} color={colors.onGraphite} />
            </Pressable>

            <View style={styles.zoomPill}>
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Perbesar zoom"
              onPress={() => handleAdjustZoom(0.1)}
              style={({ pressed }) => [
                styles.zoomBtn,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={18} color={colors.onGraphite} />
            </Pressable>
          </View>

          <View style={styles.instructionWrap}>
            <Text style={styles.instructionTitle}>
              {t('qr_instruction_title')}
            </Text>
            <Text style={styles.instructionSub}>{t('qr_instruction_sub')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 34;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  cameraRoot: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 26, 26, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGlassBtnActive: {
    backgroundColor: colors.primary,
  },
  titlePill: {
    paddingHorizontal: spacing.s5,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.62)',
  },
  titlePillText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 16,
  },
  bottomWrap: {
    alignItems: 'center',
    gap: spacing.s4,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.s4,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
  },
  gpsText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.onGraphite,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPill: {
    minWidth: 58,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s3,
  },
  zoomText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  instructionWrap: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s3,
  },
  instructionTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
    textAlign: 'center',
  },
  instructionSub: {
    ...type.caption,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  // Permission fallback view
  permRoot: {
    flex: 1,
    paddingHorizontal: spacing.s5,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permHeaderTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  permBackSpacer: {
    width: 42,
  },
  permBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
  },
  permIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s2,
  },
  permTitle: {
    ...type.h2,
    textAlign: 'center',
  },
  permSub: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
