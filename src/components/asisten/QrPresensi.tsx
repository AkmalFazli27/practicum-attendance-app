import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface QrPresensiProps {
  sesiId: string;
}

const UKURAN_QR = 200;

/**
 * QR presensi sisi asisten (opsional FR-19).
 * Isi QR mengikuti format yang dibaca scan-qr.tsx: tapin://presensi/<sesiId>.
 * QR hanya jalan pintas ke halaman Presensi; validasi waktu, lokasi, dan
 * radius tetap dilakukan markAttendance.
 */
export function QrPresensi({ sesiId }: QrPresensiProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>QR PRESENSI</Text>
      <Text style={styles.title}>Tunjukkan ke praktikan</Text>

      <View style={styles.qrWrap}>
        <QRCode
          value={`tapin://presensi/${sesiId}`}
          size={UKURAN_QR}
          color={colors.graphite}
          backgroundColor={colors.surface}
          quietZone={12}
        />
      </View>

      <Text style={styles.hint}>
        Praktikan memindai QR ini lewat menu Scan QR. Presensi tetap diperiksa
        berdasarkan lokasi dan waktu sesi.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
    alignSelf: 'flex-start',
  },
  title: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    alignSelf: 'flex-start',
  },
  qrWrap: {
    marginTop: spacing.s4,
    padding: spacing.s2,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  hint: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s3,
  },
});
