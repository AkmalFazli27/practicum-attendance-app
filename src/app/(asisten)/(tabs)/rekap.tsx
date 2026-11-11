import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { EmptyState } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { getTileTanggal } from '@/utils/format';

export default function RekapScreen() {
  const router = useRouter();
  const { currentUser, sesi, getKehadiranSesi, getIzinSesi } = useSession();

  const sesiSaya = useMemo(
    () =>
      sesi
        .filter((s) => s.asistenId === currentUser?.id)
        .sort((a, b) =>
          `${a.tanggal} ${a.jamMulai}`.localeCompare(`${b.tanggal} ${b.jamMulai}`),
        ),
    [sesi, currentUser?.id],
  );

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={styles.kicker}>MONITOR</Text>
          <Text style={styles.h1}>Rekap kehadiran</Text>
          <Text style={styles.sub}>
            Ringkasan kehadiran dan izin seluruh sesi.
          </Text>
        </View>

        {sesiSaya.length === 0 ? (
          <EmptyState
            judul="Belum ada sesi"
            pesan="Sesi yang kamu kelola akan tampil di sini."
          />
        ) : (
          <View style={styles.recapList}>
            {sesiSaya.map((session) => {
              const countHadir = getKehadiranSesi(session.id).length;
              const countIzin = getIzinSesi(session.id).filter(
                (iz) => iz.status === 'DITERIMA',
              ).length;
              const tile = getTileTanggal(session.tanggal);

              return (
                <Pressable
                  key={session.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Rekap ${session.namaPraktikum}, ${countHadir} hadir`}
                  onPress={() => bukaDetail(session.id)}
                  style={({ pressed }) => [
                    styles.recapRow,
                    pressed && styles.recapRowPressed,
                  ]}
                >
                  <View style={styles.recapDateTile}>
                    <Text style={styles.recapDateDay}>{tile.hari}</Text>
                    <Text style={styles.recapDateMonth}>{tile.bulan}</Text>
                  </View>

                  <View style={styles.recapMain}>
                    <Text style={styles.recapName} numberOfLines={1}>
                      {session.namaPraktikum}
                    </Text>
                    <Text style={styles.recapMeta} numberOfLines={1}>
                      {session.kelas} · {session.lab}
                      {countIzin > 0 ? ` · ${countIzin} izin` : ''}
                    </Text>
                  </View>

                  <View style={styles.recapTotal}>
                    <Text style={styles.recapCount}>{countHadir}</Text>
                    <Text style={styles.recapCountLabel}>hadir</Text>
                  </View>

                  <ChevronRight size={18} color={colors.textSecondary} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
    gap: spacing.s5,
  },
  pageTitle: {
    gap: 2,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.15,
    marginBottom: 4,
  },
  h1: {
    ...type.h1,
    color: colors.textPrimary,
  },
  sub: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 5,
  },
  recapList: {
    gap: 10,
  },
  recapRow: {
    minHeight: 77,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  recapRowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  recapDateTile: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapDateDay: {
    fontSize: 18,
    lineHeight: 21,
    fontFamily: fontFamily.extrabold,
    color: colors.onGraphite,
  },
  recapDateMonth: {
    ...type.micro,
    color: colors.primary,
  },
  recapMain: {
    flex: 1,
    gap: 4,
  },
  recapName: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  recapMeta: {
    ...type.caption,
    color: colors.textMuted,
  },
  recapTotal: {
    alignItems: 'flex-end',
  },
  recapCount: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamily.extrabold,
    color: colors.textPrimary,
  },
  recapCountLabel: {
    ...type.micro,
    color: colors.textMuted,
  },
});
