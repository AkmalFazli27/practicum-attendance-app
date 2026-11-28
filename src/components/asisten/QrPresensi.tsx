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
import { useTranslation } from 'react-i18next';

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

export function QrPresensi({ sesi }: QrPresensiProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const { renewSessionQr } = useSession();

  const [now, setNow] = useState<number>(() => Date.now());
  const [memperbarui, setMemperbarui] = useState(false);
  const autoInitRef = useRef<string | null>(null);

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
          ? t('asprak.qrRenewEndedError')
          : t('asprak.qrRenewFailedError'),
      );
      return;
    }

    const sisaMenit = Math.min(
      15,
      Math.max(1, Math.ceil((selesaiMs - Date.now()) / 60000)),
    );
    showToast(t('asprak.qrRenewToast', { menit: sisaMenit }));
  };

  const handleSalinKode = async () => {
    if (isExpired || !kodePresensi) {
      showToast(t('asprak.qrCopyExpiredError'));
      return;
    }

    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(kodePresensi);
          showToast(t('asprak.qrCopiedToast', { kode: kodePresensi }));
          return;
        }
      } catch {
        // fallback toast
      }
      showToast(t('asprak.qrCodeFallbackToast', { kode: kodePresensi }));
      return;
    }

    try {
      await Share.share({
        message: t('asprak.qrShareMessage', {
          praktikum: sesi.namaPraktikum,
          kelas: sesi.kelas,
          kode: kodePresensi,
        }),
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
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {t('asprak.qrKicker')}
          </Text>
          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {t('asprak.qrTitle')}
          </Text>
        </View>

        <View style={[styles.timerPill, { backgroundColor: badgeBg }]}>
          <Clock3 size={13} color={badgeFg} />
          <Text style={[styles.timerText, { color: badgeFg }]}>
            {isExpired ? t('asprak.qrExpired') : formatCountdown(sisaQrMs)}
          </Text>
        </View>
      </View>

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
                  ? t('asprak.qrSessionEndedTitle')
                  : t('asprak.qrExpiredTitle')}
              </Text>
              <Text
                style={[styles.expiredSub, { color: themeColors.textSecondary }]}
              >
                {sesiBerakhir
                  ? t('asprak.qrSessionEndedSub')
                  : t('asprak.qrExpiredSub')}
              </Text>
            </View>
          </View>
        )}
      </View>

      {isExpired ? (
        !sesiBerakhir ? (
          <Tombol
            variant="primer"
            loading={memperbarui}
            icon={<RefreshCw size={17} color={colors.onPrimary} />}
            onPress={handleRenewQr}
            style={styles.renewBtn}
          >
            {t('asprak.qrRenewBtn')}
          </Tombol>
        ) : (
          <Text style={[styles.hint, { color: themeColors.errorFg }]}>
            {t('asprak.qrSessionEndedHint')}
          </Text>
        )
      ) : (
        <Text style={[styles.hint, { color: themeColors.textMuted }]}>
          {terbatasSisaSesi
            ? t('asprak.qrLimitedHint')
            : t('asprak.qrValidHint')}
        </Text>
      )}

      <View
        style={[
          styles.codeSection,
          { borderTopColor: themeColors.border },
        ]}
      >
        <View style={styles.codeHeaderRow}>
          <KeyRound size={14} color={themeColors.textMuted} />
          <Text style={[styles.codeLabel, { color: themeColors.textMuted }]}>
            {t('asprak.qrCodeDivider')}
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
            ? t('asprak.qrCopyCode')
            : t('asprak.qrShareCode')}
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