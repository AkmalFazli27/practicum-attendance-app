import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Compass,
  FileText,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { IzinSheet } from '@/components/praktikan/IzinSheet';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { KATEGORI_FALLBACK } from '@/services/ai';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';
import { sudahLewat, sudahMulai } from '@/utils/statusSesi';

const TICK_WAKTU_MS = 15_000;

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    currentUser,
    labs,
    getSesiById,
    getStatusEfektif,
    sudahPresensi,
    getIzinBySesiPraktikan,
    loading,
  } = useSession();

  const [izinBuka, setIzinBuka] = useState(false);
  const [, setTick] = useState(0);

  // Periksa ulang waktu secara berkala setiap 15 detik agar tombol & status otomatis mengikuti PB-06
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), TICK_WAKTU_MS);
    return () => clearInterval(timer);
  }, []);

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

  const now = Date.now();
  const statusEfektif = getStatusEfektif(s);
  const belumMulai = !sudahMulai(s, now);
  const waktuHabis = sudahLewat(s, now);

  const labSesi = s.labId ? labs.find((l) => l.id === s.labId) : undefined;
  const namaLabTampil = labSesi?.nama || s.lab;

  const hadir = sudahPresensi(s.id, currentUser.id);
  const waktuHadir = hadir ? titikJam(formatJam(hadir.waktuHadir)) : null;
  const izinSaya = getIzinBySesiPraktikan(s.id, currentUser.id);

  // Sama dengan aturan di context: izin apa pun (termasuk DITOLAK) memblokir presensi.
  const bisaPresensi =
    statusEfektif === 'DIBUKA' && !belumMulai && !waktuHabis && !hadir && !izinSaya;
  const bisaAjukanIzin = !hadir && !izinSaya && statusEfektif !== 'SELESAI';

  const actionLabel = hadir
    ? `Hadir · ${waktuHadir}`
    : izinSaya?.status === 'DITERIMA'
      ? 'Izin telah diterima'
      : izinSaya?.status === 'MENUNGGU'
        ? 'Izin menunggu keputusan'
        : izinSaya?.status === 'DITOLAK'
          ? 'Izin ditolak'
          : waktuHabis
            ? 'Waktu presensi telah berakhir'
            : s.status === 'SELESAI' || statusEfektif === 'SELESAI'
              ? 'Sesi telah ditutup'
              : belumMulai
                ? 'Sesi belum dimulai'
                : statusEfektif === 'DIBUKA'
                  ? 'Tap untuk presensi'
                  : 'Sesi belum dibuka asisten';

  const aiTidakTersedia =
    !izinSaya?.kategoriAi ||
    izinSaya.kategoriAi === KATEGORI_FALLBACK ||
    /fallback/i.test(izinSaya.ringkasanAi ?? '');

  const bukaHalamanPresensi = () => {
    router.push({
      pathname: '/(praktikan)/presensi/[id]',
      params: { id: s.id },
    } as any);
  };

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
        {/* Status & Topik (PB-06: menggunakan statusEfektif) */}
        <View style={styles.statusRow}>
          <StatusBadge status={statusEfektif} />
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
                {namaLabTampil}
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

        {/* Kartu Bukti Presensi & Jarak ke Lab (FR-20) */}
        {hadir ? (
          <View style={styles.hadirCard}>
            <View style={styles.hadirTopRow}>
              <CheckCircle2 size={18} color={colors.radiusInsideFg} />
              <Text style={styles.hadirTitle}>
                Presensi tercatat pukul {waktuHadir} WIB
              </Text>
            </View>
            {typeof hadir.jarak === 'number' ? (
              <View style={styles.hadirDistanceRow}>
                <Compass size={14} color={colors.radiusInsideFg} />
                <Text style={styles.hadirDistanceText}>
                  Jarak ke laboratorium saat presensi: {Math.round(hadir.jarak)} m
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Status Pengajuan Izin & Badge Klasifikasi AI (FR-15, FR-16, PB-02) */}
        {izinSaya ? (
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

            <View
              style={[
                styles.aiBadgeBox,
                aiTidakTersedia && styles.aiBadgeBoxMuted,
              ]}
            >
              <View style={styles.aiBadgeHeader}>
                <Sparkles
                  size={14}
                  color={
                    aiTidakTersedia ? colors.gpsOffFg : colors.sesiDibukaFg
                  }
                />
                <Text
                  style={[
                    styles.aiBadgeText,
                    aiTidakTersedia && styles.aiBadgeTextMuted,
                  ]}
                >
                  {aiTidakTersedia
                    ? izinSaya.kategoriAi &&
                      izinSaya.kategoriAi !== KATEGORI_FALLBACK
                      ? `AI (Fallback): ${izinSaya.kategoriAi}`
                      : 'AI tidak tersedia · Belum terklasifikasi'
                    : `Kategori AI: ${izinSaya.kategoriAi}`}
                </Text>
              </View>
              {izinSaya.ringkasanAi ? (
                <Text style={styles.aiSummaryText}>
                  {izinSaya.ringkasanAi}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

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
            onPress={bukaHalamanPresensi}
          >
            {actionLabel}
          </Tombol>

          {!bisaPresensi && !hadir && !izinSaya && statusEfektif === 'DIBUKA' ? (
            <Tombol
              variant="sekunder"
              onPress={bukaHalamanPresensi}
              icon={<MapPin size={17} color={colors.textPrimary} />}
            >
              Periksa halaman lokasi & presensi
            </Tombol>
          ) : null}

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
  hadirCard: {
    marginTop: spacing.s4,
    padding: spacing.s3 + 2,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.radiusInsideBorder,
    backgroundColor: colors.radiusInsideBg,
    gap: 6,
  },
  hadirTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hadirTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.radiusInsideFg,
  },
  hadirDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hadirDistanceText: {
    ...type.caption,
    color: colors.radiusInsideFg,
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
    gap: 4,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.radiusInsideBorder,
  },
  aiBadgeBoxMuted: {
    backgroundColor: colors.gpsOffBg,
    borderColor: colors.gpsOffBorder,
  },
  aiBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  aiBadgeTextMuted: {
    color: colors.gpsOffFg,
  },
  aiSummaryText: {
    ...type.micro,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  actionsGroup: { marginTop: spacing.s5, gap: spacing.s3 },
});
