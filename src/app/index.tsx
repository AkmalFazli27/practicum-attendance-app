import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { type Sesi, type StatusSesi } from '@/data/dummy';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { formatTanggal } from '@/utils/format';
import {
  EmptyState,
  FilterChip,
  SheetModal,
  StatusBadge,
  Tombol,
} from '@/components/ui';

type FilterType = 'SEMUA' | StatusSesi;

export default function LandingScreen() {
  const router = useRouter();
  const { sesi, currentUser, users, logout } = useSession();

  const [filterAktif, setFilterAktif] = useState<FilterType>('SEMUA');
  const [sesiTerpilih, setSesiTerpilih] = useState<Sesi | null>(null);

  const daftarSesiTerfilter = useMemo(() => {
    if (filterAktif === 'SEMUA') return sesi;
    return sesi.filter((item) => item.status === filterAktif);
  }, [sesi, filterAktif]);

  const getAsistenNama = (asistenId: string) => {
    const asisten = users.find((u) => u.id === asistenId);
    return asisten ? asisten.nama : 'Asisten Lab';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={daftarSesiTerfilter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            {/* Top Bar Branding */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.logoText}>
                  Tap<Text style={styles.logoAccent}>In</Text>
                </Text>
                <Text style={styles.tagline}>Tap once. You're in.</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Halaman login"
                onPress={() => {
                  if (currentUser) {
                    logout();
                  }
                  router.push('/login');
                }}
                style={({ pressed }) => [
                  styles.loginNavBtn,
                  pressed && styles.loginNavBtnPressed,
                ]}
              >
                <Text style={styles.loginNavBtnText}>
                  {currentUser ? 'Ganti Akun' : 'Masuk'}
                </Text>
              </Pressable>
            </View>

            {/* Status Login Card (Hanya muncul jika sudah login) */}
            {currentUser && (
              <View style={styles.activeUserCard}>
                <View style={styles.activeUserRow}>
                  <View style={styles.userDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeUserTitle}>
                      Aktif: {currentUser.nama}
                    </Text>
                    <Text style={styles.activeUserSub}>
                      {currentUser.peran === 'praktikan'
                        ? `Praktikan • ${currentUser.kelas ?? 'IF-2A'}`
                        : 'Asisten Laboratorium'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={logout}
                    style={styles.logoutBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.logoutBtnText}>Keluar</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Section Header & Filters */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jadwal Praktikum</Text>
              <Text style={styles.sectionSubtitle}>
                Daftar sesi praktikum aktif dan terjadwal minggu ini.
              </Text>
            </View>

            <View style={styles.filterScroll}>
              <FilterChip
                label="Semua"
                aktif={filterAktif === 'SEMUA'}
                onPress={() => setFilterAktif('SEMUA')}
              />
              <FilterChip
                label="Dibuka"
                aktif={filterAktif === 'DIBUKA'}
                onPress={() => setFilterAktif('DIBUKA')}
              />
              <FilterChip
                label="Terjadwal"
                aktif={filterAktif === 'TERJADWAL'}
                onPress={() => setFilterAktif('TERJADWAL')}
              />
              <FilterChip
                label="Selesai"
                aktif={filterAktif === 'SELESAI'}
                onPress={() => setFilterAktif('SELESAI')}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Lihat detail praktikum ${item.namaPraktikum}`}
            onPress={() => setSesiTerpilih(item)}
            style={({ pressed }) => [
              styles.sessionCard,
              pressed && styles.sessionCardPressed,
            ]}
          >
            <View style={styles.sessionHeaderRow}>
              <Text style={styles.sessionTitle}>{item.namaPraktikum}</Text>
              <StatusBadge status={item.status} />
            </View>

            <View style={styles.sessionMetaGroup}>
              <Text style={styles.sessionMetaText}>
                {item.kelas} • {item.lab}
              </Text>
              <Text style={styles.sessionTimeText}>
                {formatTanggal(item.tanggal)} • {item.jamMulai}–{item.jamSelesai}
              </Text>
            </View>

            <View style={styles.sessionCardFooter}>
              <Text style={styles.sessionAsisten}>
                Asisten: {getAsistenNama(item.asistenId)}
              </Text>
              <Text style={styles.sessionActionText}>Lihat Detail ›</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState
            judul="Tidak Ada Sesi"
            pesan="Tidak ditemukan jadwal praktikum untuk kategori filter yang dipilih."
            aksi={{
              label: 'Tampilkan Semua Sesi',
              onPress: () => setFilterAktif('SEMUA'),
            }}
          />
        }
        ListFooterComponent={
          <View style={styles.footerInfo}>
            <Text style={styles.footerInfoText}>
              TapIn Sprint 1 • Antarmuka & Alur Praktikum
            </Text>
          </View>
        }
      />

      {/* Footer CTA jika belum login (posisi tetap di bawah, tidak ikut scroll) */}
      {!currentUser && (
        <View style={styles.footerCta}>
          <Text style={styles.footerCtaText}>
            Login untuk presensi atau kelola sesi.
          </Text>
          <Tombol
            variant="primer"
            onPress={() => router.push('/login')}
          >
            Masuk untuk lanjut
          </Tombol>
        </View>
      )}

      {/* Detail Sesi Bottom Sheet (FR-01, FR-10) */}
      <SheetModal
        visible={Boolean(sesiTerpilih)}
        judul={sesiTerpilih?.namaPraktikum ?? 'Detail Sesi'}
        onClose={() => setSesiTerpilih(null)}
        footer={
          <View style={styles.modalFooterActions}>
            <Tombol
              variant="primer"
              onPress={() => {
                const peran = currentUser?.peran;
                setSesiTerpilih(null);
                if (currentUser) {
                  router.push(
                    peran === 'praktikan'
                      ? ('/(praktikan)/(tabs)' as any)
                      : ('/(asisten)/(tabs)' as any),
                  );
                } else {
                  router.push('/login');
                }
              }}
            >
              {currentUser ? 'Buka Menu Praktikum' : 'Masuk untuk Presensi'}
            </Tombol>
          </View>
        }
      >
        {sesiTerpilih && (
          <View style={styles.sheetDetailContent}>
            <View style={styles.sheetBadgeRow}>
              <StatusBadge status={sesiTerpilih.status} />
              <Text style={styles.sheetKelasLab}>
                {sesiTerpilih.kelas} • {sesiTerpilih.lab}
              </Text>
            </View>

            <View style={styles.sheetMetaCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Waktu</Text>
                <Text style={styles.metaValue}>
                  {formatTanggal(sesiTerpilih.tanggal)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Jam</Text>
                <Text style={styles.metaValue}>
                  {sesiTerpilih.jamMulai} – {sesiTerpilih.jamSelesai} WIB
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Pengampu</Text>
                <Text style={styles.metaValue}>
                  {getAsistenNama(sesiTerpilih.asistenId)}
                </Text>
              </View>
            </View>

            <View style={styles.deskripsiContainer}>
              <Text style={styles.deskripsiTitle}>Materi / Pembahasan</Text>
              <Text style={styles.deskripsiText}>
                {sesiTerpilih.deskripsi}
              </Text>
            </View>

            <View style={styles.sheetNotice}>
              <Text style={styles.sheetNoticeText}>
                Presensi hanya dapat dilakukan oleh praktikan saat sesi berstatus
                DIBUKA.
              </Text>
            </View>
          </View>
        )}
      </SheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  headerContainer: {
    marginBottom: spacing.s2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s2,
    marginBottom: spacing.s3,
  },
  logoText: {
    ...type.h1,
    color: colors.textPrimary,
  },
  logoAccent: {
    color: colors.primaryPressed,
  },
  tagline: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loginNavBtn: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.button,
    backgroundColor: colors.graphite,
  },
  loginNavBtnPressed: {
    opacity: 0.8,
  },
  loginNavBtnText: {
    ...type.bodyStrong,
    fontSize: 13,
    color: colors.onGraphite,
  },

  // Active User Card
  activeUserCard: {
    backgroundColor: colors.surface,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
  },
  activeUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  userDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryPressed,
  },
  activeUserTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  activeUserSub: {
    ...type.caption,
    color: colors.textSecondary,
  },
  logoutBtn: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.badge,
    backgroundColor: colors.surfaceMuted,
  },
  logoutBtnText: {
    ...type.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  // Footer CTA
  footerCta: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.s2,
  },
  footerCtaText: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Section & Filter
  sectionHeader: {
    marginBottom: spacing.s3,
  },
  sectionTitle: {
    ...type.h2,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2,
    marginBottom: spacing.s3,
  },

  // Session Card
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s2,
  },
  sessionCardPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  sessionTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  sessionMetaGroup: {
    gap: 2,
  },
  sessionMetaText: {
    ...type.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sessionTimeText: {
    ...type.caption,
    color: colors.textMuted,
  },
  sessionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s1,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  sessionAsisten: {
    ...type.caption,
    color: colors.textSecondary,
  },
  sessionActionText: {
    ...type.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Footer info
  footerInfo: {
    paddingVertical: spacing.s6,
    alignItems: 'center',
  },
  footerInfoText: {
    ...type.caption,
    color: colors.textMuted,
  },

  // Sheet Detail
  sheetDetailContent: {
    gap: spacing.s3,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetKelasLab: {
    ...type.bodyStrong,
    color: colors.textSecondary,
  },
  sheetMetaCard: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.s3,
    borderRadius: radius.card,
    gap: spacing.s2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    ...type.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...type.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deskripsiContainer: {
    gap: spacing.s1,
  },
  deskripsiTitle: {
    ...type.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  deskripsiText: {
    ...type.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  sheetNotice: {
    backgroundColor: colors.primarySoft,
    padding: spacing.s3,
    borderRadius: radius.button,
  },
  sheetNoticeText: {
    ...type.caption,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  modalFooterActions: {
    paddingVertical: spacing.s2,
  },
});
