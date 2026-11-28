import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { SesiFormSheet } from '@/components/asisten/SesiFormSheet';
import { SinkronGuard } from '@/components/asisten/SyncState';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { useSesiAsprak } from '@/components/asisten/useSesiAsprak';
import { useStatusSesi } from '@/components/asisten/useStatusSesi';
import { EmptyState, SessionCard, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, layout, spacing, type } from '@/theme/tokens';

export default function SesiAsistenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentUser, getKehadiranSesi, getIzinSesi } = useSession();
  const { sesiSaya } = useSesiAsprak();
  const { themeColors } = usePreferences();
  const { mulai, sheet } = useAksiSesi();
  const { statusEfektif, aksiUtama } = useStatusSesi();

  const [formVisible, setFormVisible] = useState(false);
  const [sesiDiedit, setSesiDiedit] = useState<Sesi | null>(null);

  if (!currentUser) return null;

  const bukaDetail = (id: string) =>
    router.push({ pathname: '/(asisten)/sesi/[id]', params: { id } } as any);

  const bukaTambah = () => {
    setSesiDiedit(null);
    setFormVisible(true);
  };

  const bukaEdit = (item: Sesi) => {
    setSesiDiedit(item);
    setFormVisible(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.pageTitle}>
            <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
              {t('asprak.manageKicker')}
            </Text>
            <Text style={[styles.h1, { color: themeColors.textPrimary }]}>
              {t('asprak.sessionsTitle')}
            </Text>
            <Text style={[styles.sub, { color: themeColors.textSecondary }]}>
              {t('asprak.sessionsSub')}
            </Text>
          </View>
          <Tombol
            variant="primer"
            icon={<Plus size={18} color={themeColors.onPrimary} />}
            onPress={bukaTambah}
            style={styles.addBtn}
          >
            {t('asprak.addBtn')}
          </Tombol>
        </View>

        <SinkronGuard adaData={sesiSaya.length > 0}>
          {sesiSaya.length === 0 ? (
            <EmptyState
              judul={t('asprak.emptySessionsTitle')}
              pesan={t('asprak.emptyManageBody')}
              aksi={{
                label: t('asprak.addNewSessionBtn'),
                onPress: bukaTambah,
              }}
            />
          ) : (
            <View style={styles.list}>
              {sesiSaya.map((s) => {
                const hadir = getKehadiranSesi(s.id).length;
                const pendingIzin = getIzinSesi(s.id).filter(
                  (iz) => iz.status === 'MENUNGGU',
                ).length;

                const aksi = aksiUtama(s);
                const sesiSelesai = statusEfektif(s) === 'SELESAI';

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
                          {t('asprak.openBtn')}
                        </Tombol>
                      )}
                      {aksi.jenis === 'tutup' && (
                        <Tombol
                          variant="danger"
                          style={styles.smallBtn}
                          onPress={() => mulai(s.id, 'tutup')}
                        >
                          {t('asprak.closeBtn')}
                        </Tombol>
                      )}
                      {!sesiSelesai && (
                        <Tombol
                          variant="sekunder"
                          style={styles.smallBtn}
                          onPress={() => bukaEdit(s)}
                        >
                          {t('asprak.editBtn')}
                        </Tombol>
                      )}
                      <Tombol
                        variant="sekunder"
                        style={styles.smallBtn}
                        onPress={() => bukaDetail(s.id)}
                      >
                        {t('asprak.detailBtn')}
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

      <SesiFormSheet
        visible={formVisible}
        initialSesi={sesiDiedit}
        onClose={() => setFormVisible(false)}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.s3,
  },
  pageTitle: {
    flex: 1,
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
  addBtn: {
    minHeight: 42,
    paddingHorizontal: spacing.s4,
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