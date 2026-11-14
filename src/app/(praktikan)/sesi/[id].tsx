import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { IzinSheet } from '@/components/praktikan/IzinSheet';
import { PresensiSheet } from '@/components/praktikan/PresensiSheet';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    getSesiById,
    sudahPresensi,
    getIzinBySesiPraktikan,
    loading,
  } = useSession();

  const [presensiBuka, setPresensiBuka] = useState(false);
  const [izinBuka, setIzinBuka] = useState(false);

  const s = getSesiById(id);

  if (
    !currentUser ||
    !s ||
    (currentUser.kelas &&
      s.kelas.trim().toUpperCase() !== currentUser.kelas.trim().toUpperCase())
  ) {
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
            judul={loading ? 'Memuat sesi…' : 'Sesi tidak ditemukan'}
            pesan={
              loading
                ? 'Mohon tunggu sebentar.'
                : 'Sesi ini tidak tersedia untuk kelasmu.'
            }
          />
        </View>
      </View>
    );
  }

  const hadir = sudahPresensi(s.id, currentUser.id);
  const waktuHadir = hadir ? titikJam(formatJam(hadir.waktuHadir)) : null;
  const izinSaya = getIzinBySesiPraktikan(s.id, currentUser.id);

  // Sama dengan aturan di context: izin apa pun (termasuk DITOLAK) memblokir presensi.
  const bisaPresensi = s.status === 'DIBUKA' && !hadir && !izinSaya;
  const bisaAjukanIzin = !hadir && !izinSaya && s.status !== 'SELESAI';

  const actionLabel = hadir
    ? `Hadir · ${waktuHadir}`
    : izinSaya?.status === 'DITERIMA'
      ? 'Izin telah diterima'
      : izinSaya?.status === 'MENUNGGU'
        ? 'Izin menunggu keputusan'
        : izinSaya?.status === 'DITOLAK'
          ? 'Izin ditolak'
          : s.status === 'DIBUKA'
            ? 'Tap untuk presensi'
            : s.status === 'SELESAI'
              ? 'Sesi telah ditutup'
              : 'Presensi belum tersedia';

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

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + spacing.s6, spacing.s8) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Topik */}
        <View style={styles.statusRow}>
          <StatusBadge status={s.status} />
          {s.topik ? <Text style={styles.topikText}>{s.topik}</Text> : null}
        </View>

        <Text style={styles.description}>{s.deskripsi}</Text>

        {/* Grid 2x2 */}
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

        {/* Status Pengajuan Izin (FR-15 & FR-16) */}
        {izinSaya && (
          <View style={styles.izinStatusCard}>
            <View style={styles.izinHeaderRow}>
              <View>
                <Text style={styles.kicker}>STATUS PENGAJUAN IZIN</Text>
                <Text style={styles.izinTitle}>
                  Diajukan pukul {titikJam(formatJam(izinSaya.waktuPengajuan))}
                </Text>
              </View>
              <StatusBadge status={izinSaya.status} />
            </View>

            <Text style={styles.izinAlasan}>"{izinSaya.alasan}"</Text>

            <View style={styles.aiBadgeBox}>
              <Sparkles size={14} color={colors.sesiDibukaFg} />
              <Text style={styles.aiBadgeText}>
                Kategori AI: {izinSaya.kategoriAi}
              </Text>
            </View>
          </View>
        )}

        {/* Tombol Aksi */}
        <View style={styles.actionsGroup}>
          <Tombol
            variant="primer"
            disabled={!bisaPresensi}
            icon={
              hadir ? (
                <CheckCircle2 size={19} color={colors.disabledText} />
              ) : undefined
            }
            rightIcon={
              bisaPresensi ? (
                <ArrowRight size={19} color={colors.onPrimary} />
              ) : undefined
            }
            onPress={() => setPresensiBuka(true)}
          >
            {actionLabel}
          </Tombol>

          {bisaAjukanIzin && (
            <Tombol
              variant="sekunder"
              icon={<FileText size={17} color={colors.textPrimary} />}
              onPress={() => setIzinBuka(true)}
            >
              Berhalangan hadir? Ajukan izin
            </Tombol>
          )}
        </View>
      </ScrollView>

      <PresensiSheet
        sesi={presensiBuka ? s : null}
        onClose={() => setPresensiBuka(false)}
      />

      <IzinSheet
        sesi={izinBuka ? s : null}
        onClose={() => setIzinBuka(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
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
  headerCenter: { flex: 1 },
  headerTitle: { ...type.h2, color: colors.textPrimary },
  headerSpacer: { width: 42 },
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
  iconBtnPressed: { opacity: 0.75 },
  emptyWrap: { padding: layout.screenPadding },
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
  gridCopy: { flex: 1, gap: 3 },
  gridLabel: { ...type.micro, color: colors.textMuted },
  gridValue: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  izinStatusCard: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.s2 + 2,
  },
  izinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  izinTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  izinAlasan: {
    ...type.caption,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aiBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  actionsGroup: { marginTop: spacing.s5, gap: spacing.s3 },
});