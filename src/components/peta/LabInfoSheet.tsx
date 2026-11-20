import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CalendarClock, MapPin } from 'lucide-react-native';

import { SheetModal, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import type { Lab, Sesi, StatusSesi } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export interface LabInfoSheetProps {
  lab: Lab | null;
  visible: boolean;
  onClose: () => void;
}

function BarisSesi({
  sesi,
  status,
  denganTanggal,
}: {
  sesi: Sesi;
  status: StatusSesi;
  denganTanggal: boolean;
}) {
  const waktu = denganTanggal
    ? `${formatHariTanggalSingkat(sesi.tanggal)}, ${titikJam(sesi.jamMulai)}–${titikJam(sesi.jamSelesai)}`
    : `${titikJam(sesi.jamMulai)}–${titikJam(sesi.jamSelesai)}`;

  return (
    <View style={styles.sesiRow}>
      <View style={styles.sesiCopy}>
        <Text style={styles.sesiNama} numberOfLines={2}>
          {sesi.namaPraktikum}
        </Text>
        <Text style={styles.sesiKelas}>Kelas {sesi.kelas || '-'}</Text>
        <View style={styles.waktuRow}>
          <CalendarClock size={13} color={colors.textMuted} />
          <Text style={styles.sesiWaktu}>{waktu}</Text>
        </View>
      </View>
      <StatusBadge status={status} />
    </View>
  );
}

export function LabInfoSheet({ lab, visible, onClose }: LabInfoSheetProps) {
  const { sesi, getStatusEfektif, loading, error, retrySync } = useSession();

  const sesiLab = lab
    ? sesi.filter(
        (item) => item.labId === lab.id || (!item.labId && item.lab === lab.nama),
      )
    : [];

  const berlangsung = sesiLab.filter(
    (item) => getStatusEfektif(item) === 'DIBUKA',
  );

  const berikutnya = sesiLab
    .filter((item) => getStatusEfektif(item) === 'TERJADWAL')
    .sort((a, b) =>
      `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
    )
    .slice(0, 3);

  return (
    <SheetModal
      visible={visible && Boolean(lab)}
      kicker="LABORATORIUM"
      judul={lab?.nama ?? ''}
      onClose={onClose}
    >
      {lab ? (
        <>
          <View style={styles.lokasiRow}>
            <MapPin size={16} color={colors.textMuted} />
            <View style={styles.lokasiCopy}>
              <Text style={styles.lokasiAlamat}>{lab.alamat}</Text>
              <Text style={styles.lokasiRadius}>
                Radius presensi {lab.radius} meter
              </Text>
            </View>
          </View>

          {loading && sesi.length === 0 ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.graphite} />
              <Text style={styles.statusText}>Memuat aktivitas lab…</Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Tombol variant="sekunder" onPress={retrySync}>
                Coba lagi
              </Tombol>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionKicker}>SEDANG BERLANGSUNG</Text>
            {berlangsung.length === 0 ? (
              <Text style={styles.emptyText}>
                Tidak ada praktikum yang sedang berlangsung.
              </Text>
            ) : (
              berlangsung.map((item) => (
                <BarisSesi
                  key={item.id}
                  sesi={item}
                  status="DIBUKA"
                  denganTanggal={false}
                />
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionKicker}>BERIKUTNYA</Text>
            {berikutnya.length === 0 ? (
              <Text style={styles.emptyText}>
                Belum ada jadwal berikutnya.
              </Text>
            ) : (
              berikutnya.map((item) => (
                <BarisSesi
                  key={item.id}
                  sesi={item}
                  status={getStatusEfektif(item)}
                  denganTanggal
                />
              ))
            )}
          </View>
        </>
      ) : null}
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  lokasiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2,
  },
  lokasiCopy: {
    flex: 1,
    gap: 2,
  },
  lokasiAlamat: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  lokasiRadius: {
    ...type.caption,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingVertical: spacing.s2,
  },
  statusText: {
    ...type.caption,
    color: colors.textMuted,
  },
  errorBox: {
    gap: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.errorBg,
  },
  errorText: {
    ...type.caption,
    color: colors.errorFg,
  },
  section: {
    gap: spacing.s2,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionKicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  emptyText: {
    ...type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  sesiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sesiCopy: {
    flex: 1,
    gap: 3,
  },
  sesiNama: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  sesiKelas: {
    ...type.caption,
    color: colors.textSecondary,
  },
  waktuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sesiWaktu: {
    ...type.caption,
    color: colors.textMuted,
    flex: 1,
  },
});
