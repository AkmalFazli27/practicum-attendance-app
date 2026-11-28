import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SinkronGuard } from '@/components/asisten/SyncState';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { useSesiAsprak } from '@/components/asisten/useSesiAsprak';
import { useStatusSesi } from '@/components/asisten/useStatusSesi';
import { EmptyState, SessionCard, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, layout, spacing, type } from '@/theme/tokens';

export default function SesiAsistenScreen() {
  const router = useRouter();
  const { currentUser, getKehadiranSesi, getIzinSesi } = useSession();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const { mulai, sheet } = useAksiSesi();
  const { statusEfektif, aksiUtama } = useStatusSesi();
  const { sesiSaya } = useSesiAsprak();

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitle}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'MANAGE' : 'KELOLA'}
          </Text>
          <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
            {isEn ? 'Practicum sessions' : 'Sesi praktikum'}
          </Text>
          <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
            {isEn
              ? 'Open, close, and monitor every session.'
              : 'Buka, tutup, dan pantau setiap sesi.'}
          </Text>
        </View>

        <SinkronGuard adaData={sesiSaya.length > 0}>
          {sesiSaya.length === 0 ? (
            <EmptyState
              judul={isEn ? 'No sessions yet' : 'Belum ada sesi'}
              pesan={
                isEn
                  ? 'Sessions scheduled by the lab assistant will appear here.'
                  : 'Sesi yang dijadwalkan oleh Aslab akan tampil di sini.'
              }
            />
          ) : (
            <View style={styles.list}>
              {sesiSaya.map((s) => {
                const hadir = getKehadiranSesi(s.id).length;
                const pendingIzin = getIzinSesi(s.id).filter(
                  (iz) => iz.status === 'MENUNGGU',
                ).length;

                const aksi = aksiUtama(s);

                return (
                  <View key={s.id} style={styles.cardGroup}>
                    <SessionCard
                      session={{ ...s, status: statusEfektif(s) }}
                      assistant
                      attendance={hadir}
                      attendanceTotal={s.kapasitas ?? 32}
                      pendingIzinCount={pendingIzin}
                      onPress={() => bukaDetail(s.id)}
                    />
                    <View style={styles.quickActions}>
                      {aksi.jenis === 'buka' && !aksi.aktif && (
                        <Text style={styles.hint}>{aksi.keterangan}</Text>
                      )}
                      {aksi.jenis === 'buka' && (
                        <Tombol
                          variant="sekunder"
                          style={styles.smallBtn}
                          disabled={!aksi.aktif}
                          onPress={() => mulai(s.id, 'buka')}
                        >
                          {isEn ? 'Open' : 'Buka'}
                        </Tombol>
                      )}
                      {aksi.jenis === 'tutup' && (
                        <Tombol
                          variant="danger"
                          style={styles.smallBtn}
                          onPress={() => mulai(s.id, 'tutup')}
                        >
                          {isEn ? 'Close' : 'Tutup'}
                        </Tombol>
                      )}
                      <Tombol
                        variant="sekunder"
                        style={styles.smallBtn}
                        onPress={() => bukaDetail(s.id)}
                      >
                        Detail
                      </Tombol>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </SinkronGuard>
      </ScrollView>

      {sheet}
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
    marginBottom: 6,
  },
  h1: {
    ...type.h1,
    color: colors.textPrimary,
  },
  sub: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 6,
  },
  list: {
    gap: spacing.s4,
  },
  cardGroup: {
    gap: spacing.s2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s2,
  },
  hint: {
    ...type.micro,
    color: colors.textMuted,
    flex: 1,
    alignSelf: 'center',
  },
  smallBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.s4,
  },
});
