import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Edit3,
  MapPin,
  Trash2,
  Users,
} from 'lucide-react-native';

import { formatJarak } from '@/components/asisten/formatJarak';
import { IzinPanel } from '@/components/asisten/IzinPanel';
import { SesiFormSheet } from '@/components/asisten/SesiFormSheet';
import {
  ErrorBlock,
  LoadingBlock,
} from '@/components/asisten/SyncState';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { useStatusSesi } from '@/components/asisten/useStatusSesi';
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
    loading,
    error,
    retrySync,
    getSesiById,
    getKehadiranSesi,
    deleteSession,
  } = useSession();
  const { showToast } = useToast();
  const { mulai, sheet } = useAksiSesi(() => router.back());
  const { statusEfektif, aksiUtama } = useStatusSesi();

  const [editVisible, setEditVisible] = useState(false);
  const [hapusVisible, setHapusVisible] = useState(false);
  const [menghapus, setMenghapus] = useState(false);

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
          {!s && loading ? (
            <LoadingBlock pesan="Memuat sesi..." />
          ) : !s && error ? (
            <ErrorBlock pesan={error} onRetry={retrySync} />
          ) : (
            <EmptyState
              judul="Sesi tidak ditemukan"
              pesan="Sesi ini sudah dihapus atau bukan milik akun asistenmu."
            />
          )}
        </View>
      </View>
    );
  }

  const kapasitas = s.kapasitas ?? 32;
  const aksi = aksiUtama(s);
  const daftarHadir = getKehadiranSesi(s.id)
    .slice()
    .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir));
  const getPraktikan = (praktikanId: string, nama?: string, nim?: string) => {
    const user = users.find((u) => u.id === praktikanId);
    return {
      nama: nama || user?.nama || 'Praktikan',
      nim: nim || user?.nim || '-',
    };
  };

  const handleKonfirmasiHapus = async () => {
    if (menghapus) return;
    setMenghapus(true);
    const berhasil = await deleteSession(s.id);
    setMenghapus(false);
    setHapusVisible(false);
    if (!berhasil) {
      showToast('Gagal menghapus sesi praktikum. Silakan coba lagi.');
      return;
    }
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
          <StatusBadge status={statusEfektif(s)} />
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
          {aksi.jenis === 'buka' && (
            <>
              <Tombol
                variant="primer"
                icon={<ArrowRight size={19} color={colors.onPrimary} />}
                disabled={!aksi.aktif}
                onPress={() => mulai(s.id, 'buka')}
              >
                Buka sesi
              </Tombol>
              {!aksi.aktif && <Text style={styles.actionHint}>{aksi.keterangan}</Text>}
            </>
          )}
          {aksi.jenis === 'tutup' && (
            <Tombol
              variant="danger"
              icon={<ArrowRight size={19} color={colors.errorFg} />}
              onPress={() => mulai(s.id, 'tutup')}
            >
              Tutup sesi
            </Tombol>
          )}
          {aksi.jenis === 'selesai' && (
            <Text style={styles.actionHint}>
              Sesi sudah selesai dan tidak dapat dibuka lagi.
            </Text>
          )}
        </View>

        {/* Panel Pemeriksaan Izin & Klasifikasi AI (FR-16 & FR-17) */}
        <IzinPanel sesiId={s.id} />

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
                const mhs = getPraktikan(item.praktikanId, item.namaPraktikan, item.nimPraktikan);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.miniAvatar,
                      idx > 0 && { marginLeft: -8 },
                    ]}
                  >
                    <Text style={styles.miniAvatarText}>
                      {inisialNama(mhs.nama)[0]}
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
                const mhs = getPraktikan(item.praktikanId, item.namaPraktikan, item.nimPraktikan);
                return (
                  <View key={item.id} style={styles.attendeeRow}>
                    <View>
                      <Text style={styles.attendeeName}>
                        {mhs.nama}
                      </Text>
                      <Text style={styles.attendeeNim}>{mhs.nim}</Text>
                    </View>
                    <View style={styles.attendeeRight}>
                      <Text style={styles.attendeeTime}>
                        {titikJam(formatJam(item.waktuHadir))}
                      </Text>
                      {item.jarak !== undefined && (
                        <Text style={styles.attendeeJarak}>
                          {formatJarak(item.jarak)}
                        </Text>
                      )}
                    </View>
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
        loading={menghapus}
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
    gap: spacing.s2,
  },
  actionHint: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
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
  attendeeRight: {
    alignItems: 'flex-end',
  },
  attendeeJarak: {
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
});
