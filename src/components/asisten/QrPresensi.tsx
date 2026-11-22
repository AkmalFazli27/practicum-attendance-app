import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Clock3,
  Copy,
  KeyRound,
  RefreshCw,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';

import { Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Sesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { QR_TTL_MS, waktuSelesaiMs } from '@/utils/statusSesi';

export interface QrPresensiProps {
  sesi: Sesi;
}

const UKURAN_QR = 200;

function formatCountdown(ms: number): string {
  const totalDetik = Math.max(0, Math.ceil(ms / 1000));
  const menit = Math.floor(totalDetik / 60);
  const detik = totalDetik % 60;
  return `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;
}

/**
 * QR & Kode Presensi sisi asisten (opsional FR-19).
 * QR & kode berlaku maksimal 15 menit (atau mengikuti sisa waktu praktikum jika < 15 menit).
 * Setelah kedaluwarsa, asisten dapat memperbarui QR & kode selama sesi masih berlangsung.
 */
export function QrPresensi({ sesi }: QrPresensiProps) {
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const { renewSessionQr } = useSession();
  const isEn = language === 'en';

  const [now, setNow] = useState<number>(() => Date.now());
  const [memperbarui, setMemperbarui] = useState(false);
  const autoInitRef = useRef<string | null>(null);

  // Perbarui countdown setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selesaiMs = waktuSelesaiMs(sesi);
  const sisaSesiMs = Math.max(0, selesaiMs - now);
  const sesiBerakhir = sisaSesiMs <= 0;

  const effectiveExpiresAt =
    typeof sesi.qrExpiresAt === 'number'
      ? Math.min(sesi.qrExpiresAt, selesaiMs)
      : 0;
  const sisaQrMs = Math.max(0, effectiveExpiresAt - now);
  const isExpired =
    sesiBerakhir || !sesi.qrToken || !sesi.qrExpiresAt || sisaQrMs <= 0;
  const mendekatiHabis = !isExpired && sisaQrMs <= 2 * 60 * 1000;
  const terbatasSisaSesi =
    !isExpired && effectiveExpiresAt === selesaiMs && sisaSesiMs < QR_TTL_MS;

  // Inisialisasi otomatis QR & kode untuk sesi yang sudah dibuka sebelum fitur token aktif
  useEffect(() => {
    if (
      !sesi.qrToken &&
      !sesi.qrExpiresAt &&
      !sesiBerakhir &&
      autoInitRef.current !== sesi.id
    ) {
      autoInitRef.current = sesi.id;
      void renewSessionQr(sesi.id);
    }
  }, [sesi.id, sesi.qrToken, sesi.qrExpiresAt, sesiBerakhir, renewSessionQr]);

  const kodePresensi = (sesi.qrToken ?? '').toUpperCase();
  const qrPayload = kodePresensi
    ? `tapin://presensi/${sesi.id}?token=${encodeURIComponent(kodePresensi)}`
    : `tapin://presensi/${sesi.id}`;

  const handleRenewQr = async () => {
    if (memperbarui || sesiBerakhir) return;
    setMemperbarui(true);
    const hasil = await renewSessionQr(sesi.id);
    setMemperbarui(false);
    setNow(Date.now());

    if (!hasil.ok) {
      showToast(
        hasil.alasan === 'WAKTU_HABIS'
          ? isEn
            ? 'Session time has ended. QR cannot be renewed.'
            : 'Waktu praktikum telah berakhir. QR tidak dapat diperbarui.'
          : isEn
            ? 'Failed to renew QR & code. Please try again.'
            : 'Gagal memperbarui QR & kode. Silakan coba lagi.',
      );
      return;
    }

    const sisaMenit = Math.min(
      15,
      Math.max(1, Math.ceil((selesaiMs - Date.now()) / 60000)),
    );
    showToast(
      isEn
        ? `QR & code renewed (valid for ${sisaMenit} min).`
        : `QR & kode diperbarui (berlaku ${sisaMenit} menit).`,
    );
  };

  const handleSalinKode = async () => {
    if (isExpired || !kodePresensi) {
      showToast(
        isEn
          ? 'Code has expired. Renew it first.'
          : 'Kode sudah kedaluwarsa. Perbarui terlebih dahulu.',
      );
      return;
    }

    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(kodePresensi);
          showToast(
            isEn
              ? `Attendance code ${kodePresensi} copied.`
              : `Kode presensi ${kodePresensi} berhasil disalin.`,
          );
          return;
        }
      } catch {
        // fallback toast
      }
      showToast(
        isEn
          ? `Attendance code: ${kodePresensi}`
          : `Kode presensi: ${kodePresensi}`,
      );
      return;
    }

    try {
      await Share.share({
        message: isEn
          ? `TapIn attendance code for ${sesi.namaPraktikum} (${sesi.kelas}): ${kodePresensi}`
          : `Kode presensi TapIn untuk ${sesi.namaPraktikum} (${sesi.kelas}): ${kodePresensi}`,
      });
    } catch {
      // Pengguna membatalkan share sheet
    }
  };

  const badgeBg = isExpired
    ? themeColors.errorBg
    : mendekatiHabis
      ? themeColors.gpsOffBg
      : themeColors.sesiDibukaBg;
  const badgeFg = isExpired
    ? themeColors.errorFg
    : mendekatiHabis
      ? themeColors.gpsOffFg
      : themeColors.sesiDibukaFg;

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: themeColors.border,
          backgroundColor: themeColors.surface,
        },
      ]}
    >
      {/* Header + Live Countdown Pill */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'ATTENDANCE QR' : 'QR PRESENSI'}
          </Text>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {isEn ? 'Show to students' : 'Tunjukkan ke praktikan'}
          </Text>
        </View>

        <View style={[styles.timerPill, { backgroundColor: badgeBg }]}>
          <Clock3 size={13} color={badgeFg} />
          <Text style={[styles.timerText, { color: badgeFg }]}>
            {isExpired
              ? isEn
                ? 'Expired'
                : 'Kedaluwarsa'
              : formatCountdown(sisaQrMs)}
          </Text>
        </View>
      </View>

      {/* Area QR Code (latar putih kontras tinggi agar mudah dipindai kamera di mode gelap) */}
      <View
        style={[
          styles.qrWrap,
          {
            borderColor: isExpired
              ? themeColors.dangerBorder
              : themeColors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={isExpired ? styles.qrDimmed : undefined}>
          <QRCode
            value={qrPayload}
            size={UKURAN_QR}
            color={colors.graphite}
            backgroundColor={colors.surface}
            quietZone={12}
          />
        </View>

        {isExpired && (
          <View style={styles.expiredOverlay}>
            <View
              style={[
                styles.expiredBadge,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.dangerBorder,
                },
              ]}
            >
              <Clock3 size={20} color={themeColors.errorFg} />
              <Text
                style={[styles.expiredTitle, { color: themeColors.errorFg }]}
              >
                {sesiBerakhir
                  ? isEn
                    ? 'Session Ended'
                    : 'Waktu Sesi Habis'
                  : isEn
                    ? 'QR Expired'
                    : 'QR Kedaluwarsa'}
              </Text>
              <Text
                style={[styles.expiredSub, { color: themeColors.textSecondary }]}
              >
                {sesiBerakhir
                  ? isEn
                    ? 'Practicum schedule has ended.'
                    : 'Jadwal praktikum telah berakhir.'
                  : isEn
                    ? 'Renew QR & code to continue attendance.'
                    : 'Perbarui QR & kode untuk melanjutkan presensi.'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Info Masa Berlaku / Tombol Perbarui QR */}
      {isExpired ? (
        !sesiBerakhir ? (
          <Tombol
            variant="primer"
            loading={memperbarui}
            icon={<RefreshCw size={17} color={colors.onPrimary} />}
            onPress={handleRenewQr}
            style={styles.renewBtn}
          >
            {isEn ? 'Renew QR & Code' : 'Perbarui QR & Kode'}
          </Tombol>
        ) : (
          <Text style={[styles.hint, { color: themeColors.errorFg }]}>
            {isEn
              ? 'Practicum time has ended. QR & code can no longer be renewed.'
              : 'Waktu praktikum telah berakhir. QR & kode tidak dapat diperbarui lagi.'}
          </Text>
        )
      ) : (
        <Text style={[styles.hint, { color: themeColors.textMuted }]}>
          {terbatasSisaSesi
            ? isEn
              ? 'Valid until the end of this practicum session. Attendance is still verified by location and session time.'
              : 'Berlaku mengikuti sisa waktu praktikum. Presensi tetap diperiksa berdasarkan lokasi dan waktu sesi.'
            : isEn
              ? 'Valid for 15 minutes. Students can scan this QR or enter the attendance code below.'
              : 'Berlaku selama 15 menit. Praktikan dapat memindai QR ini atau memasukkan kode presensi di bawah.'}
        </Text>
      )}

      {/* Alternatif Presensi via Kode */}
      <View
        style={[
          styles.codeSection,
          { borderTopColor: themeColors.border },
        ]}
      >
        <View style={styles.codeHeaderRow}>
          <KeyRound size={14} color={themeColors.textMuted} />
          <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>
            {isEn ? 'OR ENTER ATTENDANCE CODE' : 'ATAU MASUKKAN KODE PRESENSI'}
          </Text>
        </View>

        <View
          style={[
            styles.codeBox,
            {
              backgroundColor: themeColors.background,
              borderColor: isExpired
                ? themeColors.dangerBorder
                : themeColors.border,
              opacity: isExpired ? 0.5 : 1,
            },
          ]}
        >
          <Text
            selectable={!isExpired}
            style={[
              styles.codeValue,
              {
                color: isExpired
                  ? themeColors.textMuted
                  : themeColors.textPrimary,
              },
            ]}
          >
            {isExpired ? '— — — — — —' : kodePresensi.split('').join(' ')}
          </Text>
        </View>

        <Tombol
          variant="sekunder"
          disabled={isExpired}
          icon={<Copy size={16} color={themeColors.textPrimary} />}
          onPress={handleSalinKode}
          style={styles.copyBtn}
        >
          {Platform.OS === 'web'
            ? isEn
              ? 'Copy attendance code'
              : 'Salin kode presensi'
            : isEn
              ? 'Share attendance code'
              : 'Bagikan kode presensi'}
        </Tombol>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  headerTextWrap: {
    flex: 1,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  title: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  timerText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  qrWrap: {
    marginTop: spacing.s4,
    padding: spacing.s2,
    borderRadius: radius.card,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  qrDimmed: {
    opacity: 0.14,
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.s3,
  },
  expiredBadge: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    maxWidth: 196,
  },
  expiredTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  expiredSub: {
    ...type.micro,
    textAlign: 'center',
    lineHeight: 16,
  },
  renewBtn: {
    width: '100%',
    marginTop: spacing.s4,
  },
  hint: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.s3,
    lineHeight: 18,
  },
  codeSection: {
    width: '100%',
    marginTop: spacing.s4,
    paddingTop: spacing.s4,
    borderTopWidth: 1,
    gap: spacing.s3,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  codeLabel: {
    ...type.micro,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
  },
  codeBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3 + 2,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  codeValue: {
    fontSize: 24,
    fontFamily: fontFamily.extrabold,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  copyBtn: {
    width: '100%',
  },
});
