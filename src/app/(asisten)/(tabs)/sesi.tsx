import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';

import { SesiFormSheet } from '@/components/asisten/SesiFormSheet';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { EmptyState, SessionCard, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Sesi } from '@/data/dummy';
import { colors, layout, spacing, type } from '@/theme/tokens';

export default function SesiAsistenScreen() {
  const router = useRouter();
  const { currentUser, sesi, getKehadiranSesi, getIzinSesi } = useSession();
  const { mulai, sheet } = useAksiSesi();

  const [formVisible, setFormVisible] = useState(false);
  const [sesiDiedit, setSesiDiedit] = useState<Sesi | null>(null);

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

  const bukaTambah = () => {
    setSesiDiedit(null);
    setFormVisible(true);
  };

  const bukaEdit = (item: Sesi) => {
    setSesiDiedit(item);
    setFormVisible(true);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Title + Tombol Tambah Sesi */}
        <View style={styles.headerRow}>
          <View style={styles.pageTitle}>
            <Text style={styles.kicker}>KELOLA</Text>
            <Text style={styles.h1}>Sesi praktikum</Text>
            <Text style={styles.sub}>
              Buka, tutup, ubah, dan pantau setiap sesi.
            </Text>
          </View>
          <Tombol
            variant="primer"
            icon={<Plus size={18} color={colors.onPrimary} />}
            onPress={bukaTambah}
            style={styles.addBtn}
          >
            Tambah
          </Tombol>
        </View>

        {sesiSaya.length === 0 ? (
          <EmptyState
            judul="Belum ada sesi"
            pesan="Sesi yang kamu kelola akan tampil di sini."
            aksi={{ label: 'Tambah Sesi Baru', onPress: bukaTambah }}
          />
        ) : (
          <View style={styles.list}>
            {sesiSaya.map((s) => {
              const hadir = getKehadiranSesi(s.id).length;
              const pendingIzin = getIzinSesi(s.id).filter(
                (iz) => iz.status === 'MENUNGGU',
              ).length;

              return (
                <View key={s.id} style={styles.cardGroup}>
                  <SessionCard
                    session={s}
                    assistant
                    attendance={hadir}
                    attendanceTotal={s.kapasitas ?? 32}
                    pendingIzinCount={pendingIzin}
                    onPress={() => bukaDetail(s.id)}
                  />
                  <View style={styles.quickActions}>
                    {s.status === 'TERJADWAL' && (
                      <Tombol
                        variant="sekunder"
                        style={styles.smallBtn}
                        onPress={() => mulai(s.id, 'buka')}
                      >
                        Buka
                      </Tombol>
                    )}
                    {s.status === 'DIBUKA' && (
                      <Tombol
                        variant="danger"
                        style={styles.smallBtn}
                        onPress={() => mulai(s.id, 'tutup')}
                      >
                        Tutup
                      </Tombol>
                    )}
                    <Tombol
                      variant="sekunder"
                      style={styles.smallBtn}
                      onPress={() => bukaEdit(s)}
                    >
                      Ubah
                    </Tombol>
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
  smallBtn: {
    minHeight: 40,
    paddingHorizontal: spacing.s4,
  },
});
