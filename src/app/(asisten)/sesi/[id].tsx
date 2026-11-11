import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  MapPin,
  RotateCcw,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';

import { SesiFormSheet } from '@/components/asisten/SesiFormSheet';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import {
  ConfirmSheet,
  EmptyState,
  StatusBadge,
  Tombol,
  useToast,
} from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import {
  formatHariTanggalSingkat,
  formatJam,
  inisialNama,
  titikJam,
} from '@/utils/format';

export default function DetailSesiAsisten() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    users,
    getSesiById,
    getKehadiranSesi,
    getIzinSesi,
    reviewIzin,
    deleteSession,
  } = useSession();
  const { showToast } = useToast();
  const { mulai, sheet } = useAksiSesi(() => router.back());

  const [editVisible, setEditVisible] = useState(false);
  const [hapusVisible, setHapusVisible] = useState(false);

  const s = getSesiById(id);

  if (!currentUser || !s || s.asistenId !== currentUser.id) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={styles.iconBtn}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.emptyWrap}>
          <EmptyState
            judul="Sesi tidak ditemukan"
            pesan="Sesi ini sudah dihapus atau bukan milik akun asistenmu."
          />
        </View>
      </View>
    );
  }

  const kapasitas = s.kapasitas ?? 32;
  const daftarHadir = getKehadiranSesi(s.id)
    .slice()
    .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir));
  const daftarIzin = getIzinSesi(s.id)
    .slice()
    .sort((a, b) => b.waktuPengajuan.localeCompare(a.waktuPengajuan));

  const getPraktikan = (praktikanId: string) =>
    users.find((u) => u.id === praktikanId);

  const handleKeputusanIzin = (
    izinId: string,
    keputusan: 'DITERIMA' | 'DITOLAK',
  ) => {
    reviewIzin(izinId, keputusan);
    showToast(
      keputusan === 'DITERIMA'
        ? 'Pengajuan izin praktikan diterima.'
        : 'Pengajuan izin praktikan ditolak.',
    );
  };

  const handleKonfirmasiHapus = () => {
    setHapusVisible(false);
    deleteSession(s.id);
    showToast('Sesi praktikum berhasil dihapus.');
    router.back();
  };

  const bukaRekap = () =>
    router.navigate({
      pathname: '/(asisten)/(tabs)/rekap',
      params: { sesiId: s.id, t: String(Date.now()) },
    } as any);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sheet-style Header */}
      <View style={styles.topHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.iconBtnPressed,
          ]}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.kicker}>DETAIL SESI</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {s.namaPraktikum}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit sesi"
            onPress={() => setEditVisible(true)}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Edit3 size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hapus sesi"
            onPress={() => setHapusVisible(true)}
            style={({ pressed }) => [
              styles.iconBtnDanger,
              pressed && styles.iconBtnPressed,
            ]}
          >
            <Trash2 size={18} color={colors.errorFg} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.s6, spacing.s8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Deskripsi */}
        <View style={styles.statusRow}>
          <StatusBadge status={s.status} />
          {s.topik && <Text style={styles.topikText}>{s.topik}</Text>}
        </View>

        <Text style={styles.description}>{s.deskripsi}</Text>

        {/* Grid 2x2 Info */}
        <View style={styles.detailGrid}>
          <View style={styles.gridCell}>
            <CalendarDays size={18} color={colors.textMuted} />
            <View style={styles.gridCopy}>
              <Text style={styles.gridLabel}>Tanggal</Text>
              <Text style={styles.gridValue}>
                {formatHariTanggalSingkat(s.tanggal)}
              </Text>
            </View>
          </View>

          <View style={styles.gridCell}>
            <Clock3 size={18} color={colors.textMuted} />
            <View style={styles.gridCopy}>
              <Text style={styles.gridLabel}>Waktu</Text>
              <Text style={styles.gridValue}>
                {titikJam(s.jamMulai)}–{titikJam(s.jamSelesai)}
              </Text>
            </View>
          </View>

          <View style={styles.gridCell}>
            <MapPin size={18} color={colors.textMuted} />
            <View style={styles.gridCopy}>
              <Text style={styles.gridLabel}>Lokasi</Text>
              <Text style={styles.gridValue} numberOfLines={1}>
                {s.lab}
              </Text>
            </View>
          </View>

          <View style={styles.gridCell}>
            <Users size={18} color={colors.textMuted} />
            <View style={styles.gridCopy}>
              <Text style={styles.gridLabel}>Kelas</Text>
              <Text style={styles.gridValue}>{s.kelas}</Text>
            </View>
          </View>
        </View>

        {/* Tombol Aksi Utama Sesi */}
        <View style={styles.mainActionWrap}>
          {s.status === 'TERJADWAL' && (
            <Tombol
              variant="primer"
              icon={<ArrowRight size={19} color={colors.onPrimary} />}
              onPress={() => mulai(s.id, 'buka')}
            >
              Buka sesi
            </Tombol>
          )}
          {s.status === 'DIBUKA' && (
            <Tombol
              variant="danger"
              icon={<ArrowRight size={19} color={colors.errorFg} />}
              onPress={() => mulai(s.id, 'tutup')}
            >
              Tutup sesi
            </Tombol>
          )}
          {s.status === 'SELESAI' && (
            <Tombol
              variant="primer"
              icon={<RotateCcw size={19} color={colors.onPrimary} />}
              onPress={() => mulai(s.id, 'bukaLagi')}
            >
              Buka sesi lagi
            </Tombol>
          )}
        </View>

        {/* Panel Pemeriksaan Izin & Klasifikasi AI (FR-16 & FR-17) */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.kicker}>PEMERIKSAAN IZIN & AI</Text>
              <Text style={styles.panelTitle}>
                Pengajuan izin ({daftarIzin.length})
              </Text>
            </View>
          </View>

          {daftarIzin.length === 0 ? (
            <Text style={styles.smallEmpty}>
              Belum ada pengajuan izin dari praktikan pada sesi ini.
            </Text>
          ) : (
            <View style={styles.izinList}>
              {daftarIzin.map((item) => {
                const mhs = getPraktikan(item.praktikanId);
                return (
                  <View key={item.id} style={styles.izinCard}>
                    <View style={styles.izinTopRow}>
                      <View style={styles.izinUserInfo}>
                        <Text style={styles.attendeeName}>
                          {mhs?.nama ?? 'Praktikan'}
                        </Text>
                        <Text style={styles.attendeeNim}>
                          {mhs?.nim ?? '-'} · Diajukan{' '}
                          {titikJam(formatJam(item.waktuPengajuan))}
                        </Text>
                      </View>
                      <StatusBadge status={item.status} />
                    </View>

                    <Text style={styles.izinAlasan}>"{item.alasan}"</Text>

                    {/* Badge & Informasi Pendukung Klasifikasi AI */}
                    <View style={styles.aiInsightBox}>
                      <View style={styles.aiBadgeRow}>
                        <Sparkles size={14} color={colors.sesiDibukaFg} />
                        <Text style={styles.aiBadgeTitle}>
                          Prediksi AI: {item.kategoriAi}
                        </Text>
                      </View>
                      {item.ringkasanAi && (
                        <Text style={styles.aiSummaryText}>
                          {item.ringkasanAi}
                        </Text>
                      )}
                      <Text style={styles.aiFootnote}>
                        Informasi pendukung — keputusan penerimaan ditetapkan oleh asisten.
                      </Text>
                    </View>

                    {/* Tombol Keputusan Asisten */}
                    {item.status === 'MENUNGGU' && (
                      <View style={styles.izinActions}>
                        <Tombol
                          variant="danger"
                          icon={<X size={16} color={colors.errorFg} />}
                          style={styles.izinBtn}
                          onPress={() =>
                            handleKeputusanIzin(item.id, 'DITOLAK')
                          }
                        >
                          Tolak
                        </Tombol>
                        <Tombol
                          variant="primer"
                          icon={<Check size={16} color={colors.onPrimary} />}
                          style={styles.izinBtn}
                          onPress={() =>
                            handleKeputusanIzin(item.id, 'DITERIMA')
                          }
                        >
                          Terima Izin
                        </Tombol>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Panel Kehadiran (FR-04) */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.kicker}>KEHADIRAN</Text>
              <Text style={styles.panelTitle}>
                {daftarHadir.length} dari {kapasitas} praktikan
              </Text>
            </View>

            <View style={styles.miniAvatars}>
              {daftarHadir.slice(0, 3).map((item, idx) => {
                const mhs = getPraktikan(item.praktikanId);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.miniAvatar,
                      idx > 0 && { marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.miniAvatarText}>
                      {inisialNama(mhs?.nama ?? 'P')[0]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {daftarHadir.length === 0 ? (
            <Text style={styles.smallEmpty}>
              Belum ada praktikan yang melakukan presensi.
            </Text>
          ) : (
            <View>
              {daftarHadir.map((item) => {
                const mhs = getPraktikan(item.praktikanId);
                return (
                  <View key={item.id} style={styles.attendeeRow}>
                    <View>
                      <Text style={styles.attendeeName}>
                        {mhs?.nama ?? 'Praktikan'}
                      </Text>
                      <Text style={styles.attendeeNim}>{mhs?.nim ?? '-'}</Text>
                    </View>
                    <Text style={styles.attendeeTime}>
                      {titikJam(formatJam(item.waktuHadir))}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={bukaRekap}
            style={styles.rekapLink}
          >
            <Text style={styles.rekapLinkText}>Lihat di tab Rekap ›</Text>
          </Pressable>
        </View>
      </ScrollView>

      {sheet}

      <SesiFormSheet
        visible={editVisible}
        initialSesi={s}
        onClose={() => setEditVisible(false)}
      />

      <ConfirmSheet
        visible={hapusVisible}
        title="Hapus sesi praktikum?"
        body="Seluruh data presensi dan pengajuan izin pada sesi ini akan ikut terhapus."
        danger
        confirmLabel="Ya, hapus sesi"
        summary={[
          { label: 'Praktikum', value: s.namaPraktikum },
          { label: 'Kelas', value: `${s.kelas} · ${s.lab}` },
        ]}
        onConfirm={handleKonfirmasiHapus}
        onClose={() => setHapusVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    minHeight: 68,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...type.h2,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: 0.75,
  },
  emptyWrap: {
    padding: layout.screenPadding,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s4,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  topikText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  description: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: spacing.s3 + 2,
    lineHeight: 19,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s2 + 1,
    marginTop: spacing.s4,
  },
  gridCell: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2 + 1,
    padding: spacing.s3,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  gridCopy: {
    flex: 1,
    gap: 3,
  },
  gridLabel: {
    ...type.micro,
    color: colors.textMuted,
  },
  gridValue: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  mainActionWrap: {
    marginTop: spacing.s4,
  },
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.s3,
  },
  panelTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  miniAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
  },
  smallEmpty: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    ...type.caption,
    color: colors.textMuted,
  },
  attendeeRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.s2,
  },
  attendeeName: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  attendeeNim: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  attendeeTime: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  rekapLink: {
    marginTop: spacing.s3,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
    alignItems: 'flex-end',
  },
  rekapLinkText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  izinList: {
    gap: spacing.s3,
  },
  izinCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    gap: spacing.s2 + 2,
  },
  izinTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  izinUserInfo: {
    flex: 1,
  },
  izinAlasan: {
    ...type.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aiInsightBox: {
    padding: spacing.s3,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadgeTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  aiSummaryText: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  aiFootnote: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  izinActions: {
    flexDirection: 'row',
    gap: spacing.s2,
    marginTop: 2,
  },
  izinBtn: {
    flex: 1,
    minHeight: 42,
  },
});
