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
  ReceiptText,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { formatRupiah } from '@/components/praktikan/formatTagihan';
import {
  formatSentimenAi,
  labelStatusIzin,
  resolveSentimenAi,
} from '@/components/praktikan/formatIzin';
import { IzinSheet } from '@/components/praktikan/IzinSheet';
import { EmptyState, StatusBadge, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { formatLabelKategoriAi } from '@/services/ai';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, formatJam, titikJam } from '@/utils/format';
import { sudahLewat, sudahMulai } from '@/utils/statusSesi';

const TICK_WAKTU_MS = 15_000;

export default function DetailSesiPraktikan() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const {
    currentUser,
    labs,
    tagihan,
    getSesiById,
    getStatusEfektif,
    sudahPresensi,
    getIzinBySesiPraktikan,
    loading,
  } = useSession();

  const [izinBuka, setIzinBuka] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  // Periksa ulang waktu secara berkala setiap 15 detik agar tombol & status otomatis mengikuti PB-06
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), TICK_WAKTU_MS);
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
      <View
        style={[
          styles.root,
          { backgroundColor: themeColors.background, paddingTop: insets.top },
        ]}
      >
        <View
          style={[
            styles.topHeader,
            { borderBottomColor: themeColors.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            onPress={() => router.back()}
            style={[
              styles.iconBtn,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <ArrowLeft size={20} color={themeColors.textPrimary} />
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

  const statusEfektif = getStatusEfektif(s);
  const belumMulai = !sudahMulai(s, now);
  const waktuHabis = sudahLewat(s, now);

  const labSesi = s.labId ? labs.find((l) => l.id === s.labId) : undefined;
  const namaLabTampil = labSesi?.nama || s.lab;

  const hadir = sudahPresensi(s.id, currentUser.id);
  const waktuHadir = hadir ? titikJam(formatJam(hadir.waktuHadir)) : null;
  const statusKehadiranTampil = hadir?.statusKehadiran;
  const terlambatHadir = statusKehadiranTampil === 'TERLAMBAT';
  const tagihanIdTampil = hadir?.tagihanId;
  const tagihanTerkait = tagihanIdTampil
    ? tagihan.find((t) => t.id === tagihanIdTampil)
    : undefined;
  const nominalDendaTampil = tagihanTerkait?.nominal ?? labSesi?.dendaNominal;
  const izinSaya = getIzinBySesiPraktikan(s.id, currentUser.id);

  // Hanya izin DITERIMA yang memblokir presensi; MENUNGGU/DITOLAK tetap boleh presensi.
  const izinDiterima = izinSaya?.status === 'DITERIMA';
  const bisaPresensi =
    statusEfektif === 'DIBUKA' &&
    !belumMulai &&
    !waktuHabis &&
    !hadir &&
    !izinDiterima;
  const bisaAjukanIzin = !hadir && !izinSaya && statusEfektif !== 'SELESAI';

  const actionLabel = hadir
    ? isEn
      ? `Checked in · ${waktuHadir}`
      : `Hadir · ${waktuHadir}`
    : izinDiterima
      ? isEn
        ? 'Leave approved'
        : 'Izin diterima'
      : waktuHabis
        ? isEn
          ? 'Attendance time has ended'
          : 'Waktu presensi telah berakhir'
        : s.status === 'SELESAI' || statusEfektif === 'SELESAI'
          ? isEn
            ? 'Session closed'
            : 'Sesi telah ditutup'
          : belumMulai
            ? isEn
              ? 'Session has not started'
              : 'Sesi belum dimulai'
            : statusEfektif !== 'DIBUKA'
              ? isEn
                ? 'Session not opened yet'
                : 'Sesi belum dibuka asisten'
              : izinSaya?.status === 'MENUNGGU'
                ? isEn
                  ? 'Leave pending · you can still check in'
                  : 'Izin menunggu · tetap bisa presensi'
                : isEn
                  ? 'Tap to check in'
                  : 'Tap untuk presensi';

  const infoAi = formatLabelKategoriAi(
    izinSaya?.kategoriAi,
    izinSaya?.ringkasanAi,
    isEn,
  );
  const aiTidakTersedia =
    !infoAi.terklasifikasi || !(izinSaya?.ringkasanAi ?? '').trim();
  const sentimenEfektif = resolveSentimenAi(
    izinSaya?.sentimenAi,
    izinSaya?.alasan,
    infoAi.terklasifikasi,
  );
  const sentimenInfo = formatSentimenAi(sentimenEfektif, isEn);
  const statusIzinInfo = izinSaya
    ? labelStatusIzin(izinSaya.status, isEn)
    : null;

  const bukaKameraPresensi = () => {
    router.push({
      pathname: '/scan-qr',
      params: { sesiId: s.id },
    } as any);
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      {/* Sheet-style Header */}
      <View
        style={[styles.topHeader, { borderBottomColor: themeColors.border }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.iconBtn,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <ArrowLeft size={20} color={themeColors.textPrimary} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'SESSION DETAIL' : 'DETAIL SESI'}
          </Text>
          <Text
            style={[styles.headerTitle, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
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
          {s.topik ? (
            <Text
              style={[styles.topikText, { color: themeColors.textSecondary }]}
            >
              {s.topik}
            </Text>
          ) : null}
        </View>

        <Text
          style={[styles.description, { color: themeColors.textSecondary }]}
        >
          {s.deskripsi}
        </Text>

        {/* Grid 2x2 */}
        <View style={styles.detailGrid}>
          <View
            style={[
              styles.gridCell,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <CalendarDays size={18} color={themeColors.textMuted} />
            <View style={styles.gridCopy}>
              <Text
                style={[styles.gridLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Date' : 'Tanggal'}
              </Text>
              <Text
                style={[styles.gridValue, { color: themeColors.textPrimary }]}
              >
                {formatHariTanggalSingkat(s.tanggal)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.gridCell,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <Clock3 size={18} color={themeColors.textMuted} />
            <View style={styles.gridCopy}>
              <Text
                style={[styles.gridLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Time' : 'Waktu'}
              </Text>
              <Text
                style={[styles.gridValue, { color: themeColors.textPrimary }]}
              >
                {titikJam(s.jamMulai)}–{titikJam(s.jamSelesai)}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.gridCell,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <MapPin size={18} color={themeColors.textMuted} />
            <View style={styles.gridCopy}>
              <Text
                style={[styles.gridLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Location' : 'Lokasi'}
              </Text>
              <Text
                style={[styles.gridValue, { color: themeColors.textPrimary }]}
                numberOfLines={1}
              >
                {namaLabTampil}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.gridCell,
              {
                borderColor: themeColors.border,
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <Users size={18} color={themeColors.textMuted} />
            <View style={styles.gridCopy}>
              <Text
                style={[styles.gridLabel, { color: themeColors.textMuted }]}
              >
                {isEn ? 'Class' : 'Kelas'}
              </Text>
              <Text
                style={[styles.gridValue, { color: themeColors.textPrimary }]}
              >
                {s.kelas}
              </Text>
            </View>
          </View>
        </View>

        {/* Kartu Bukti Presensi, Status Keterlambatan & Jarak ke Lab (FR-20, FR-36) */}
        {hadir ? (
          <View
            style={[
              styles.hadirCard,
              {
                backgroundColor: terlambatHadir
                  ? themeColors.kehadiranTerlambatBg
                  : themeColors.radiusInsideBg,
                borderColor: terlambatHadir
                  ? themeColors.gpsOffBorder
                  : themeColors.radiusInsideBorder,
              },
            ]}
          >
            <View style={styles.hadirTopRow}>
              <CheckCircle2
                size={18}
                color={
                  terlambatHadir
                    ? themeColors.kehadiranTerlambatFg
                    : themeColors.radiusInsideFg
                }
              />
              <Text
                style={[
                  styles.hadirTitle,
                  {
                    color: terlambatHadir
                      ? themeColors.kehadiranTerlambatFg
                      : themeColors.radiusInsideFg,
                  },
                ]}
              >
                {isEn
                  ? `Checked in at ${waktuHadir} WIB`
                  : `Presensi tercatat pukul ${waktuHadir} WIB`}
              </Text>
              {statusKehadiranTampil ? (
                <StatusBadge status={statusKehadiranTampil} />
              ) : null}
            </View>

            {statusKehadiranTampil ? (
              <View
                style={[
                  styles.hadirStatusBox,
                  {
                    borderTopColor: terlambatHadir
                      ? themeColors.gpsOffBorder
                      : themeColors.radiusInsideBorder,
                  },
                ]}
              >
                {terlambatHadir ? (
                  <>
                    {typeof hadir.menitTerlambat === 'number' &&
                    hadir.menitTerlambat > 0 ? (
                      <Text
                        style={[
                          styles.hadirDistanceText,
                          { color: themeColors.kehadiranTerlambatFg },
                        ]}
                      >
                        {isEn
                          ? `Late by ${hadir.menitTerlambat} minutes.`
                          : `Terlambat ${hadir.menitTerlambat} menit.`}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.hadirFineText,
                        { color: themeColors.kehadiranTerlambatFg },
                      ]}
                    >
                      {typeof nominalDendaTampil === 'number' &&
                      nominalDendaTampil > 0
                        ? isEn
                          ? `Fine ${formatRupiah(nominalDendaTampil)}`
                          : `Denda ${formatRupiah(nominalDendaTampil)}`
                        : isEn
                          ? 'Fine according to lab rules.'
                          : 'Denda sesuai ketentuan lab.'}
                    </Text>
                    {tagihanIdTampil ? (
                      <Tombol
                        variant="sekunder"
                        icon={
                          <ReceiptText
                            size={16}
                            color={themeColors.textPrimary}
                          />
                        }
                        rightIcon={
                          <ArrowRight
                            size={16}
                            color={themeColors.textPrimary}
                          />
                        }
                        onPress={() =>
                          router.push({
                            pathname: '/(praktikan)/tagihan/[id]',
                            params: { id: tagihanIdTampil },
                          } as any)
                        }
                      >
                        {isEn ? 'View bill' : 'Lihat tagihan'}
                      </Tombol>
                    ) : null}
                  </>
                ) : (
                  <Text
                    style={[
                      styles.hadirDistanceText,
                      { color: themeColors.radiusInsideFg },
                    ]}
                  >
                    {isEn ? 'No fine.' : 'Tanpa denda.'}
                  </Text>
                )}
              </View>
            ) : null}

            {typeof hadir.jarak === 'number' ? (
              <View style={styles.hadirDistanceRow}>
                <Compass
                  size={14}
                  color={
                    terlambatHadir
                      ? themeColors.kehadiranTerlambatFg
                      : themeColors.radiusInsideFg
                  }
                />
                <Text
                  style={[
                    styles.hadirDistanceText,
                    {
                      color: terlambatHadir
                        ? themeColors.kehadiranTerlambatFg
                        : themeColors.radiusInsideFg,
                    },
                  ]}
                >
                  {isEn
                    ? `Distance to lab at check-in: ${Math.round(hadir.jarak)} m`
                    : `Jarak ke laboratorium saat presensi: ${Math.round(hadir.jarak)} m`}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Status Pengajuan Izin & Badge Klasifikasi AI (FR-15, FR-16, PB-02) */}
        {izinSaya ? (
          <View
            style={[
              styles.izinStatusCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.izinHeaderRow}>
              <View>
                <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
                  STATUS PENGAJUAN IZIN
                </Text>
                <Text
                  style={[styles.izinTitle, { color: themeColors.textPrimary }]}
                >
                  Diajukan pukul {titikJam(formatJam(izinSaya.waktuPengajuan))}
                </Text>
              </View>
              <StatusBadge status={izinSaya.status} />
            </View>

            <Text
              style={[styles.izinAlasan, { color: themeColors.textSecondary }]}
            >
              {`"${izinSaya.alasan}"`}
            </Text>

            <View
              style={[
                styles.izinNoticeBox,
                {
                  backgroundColor:
                    izinSaya.status === 'DITERIMA'
                      ? themeColors.sesiDibukaBg
                      : izinSaya.status === 'DITOLAK'
                        ? themeColors.surfaceMuted
                        : themeColors.izinBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.izinNoticeTitle,
                  {
                    color:
                      izinSaya.status === 'DITERIMA'
                        ? themeColors.sesiDibukaFg
                        : izinSaya.status === 'DITOLAK'
                          ? themeColors.textSecondary
                          : themeColors.izinFg,
                  },
                ]}
              >
                {izinSaya.status === 'DITERIMA'
                  ? isEn
                    ? 'Excused absence · no fine'
                    : 'Tidak hadir dengan izin · bebas denda'
                  : izinSaya.status === 'DITOLAK'
                    ? isEn
                      ? 'Leave rejected · normal attendance'
                      : 'Izin ditolak · presensi normal'
                    : isEn
                      ? 'Leave pending · you can still check in'
                      : 'Izin menunggu · kamu masih bisa presensi'}
              </Text>
              <Text
                style={[
                  styles.izinNoticeSub,
                  {
                    color:
                      izinSaya.status === 'DITERIMA'
                        ? themeColors.sesiDibukaFg
                        : izinSaya.status === 'DITOLAK'
                          ? themeColors.textSecondary
                          : themeColors.izinFg,
                  },
                ]}
              >
                {izinSaya.status === 'DITERIMA'
                  ? isEn
                    ? 'Attendance is not required for this session and no fine applies.'
                    : 'Presensi tidak diperlukan untuk sesi ini dan tidak ada denda.'
                  : statusIzinInfo?.keterangan}
              </Text>
            </View>

            <View
              style={[
                styles.aiBadgeBox,
                {
                  backgroundColor: aiTidakTersedia
                    ? themeColors.gpsOffBg
                    : themeColors.primarySoft,
                  borderColor: aiTidakTersedia
                    ? themeColors.gpsOffBorder
                    : themeColors.radiusInsideBorder,
                },
              ]}
            >
              <View style={styles.aiBadgeHeader}>
                <Sparkles
                  size={14}
                  color={
                    aiTidakTersedia
                      ? themeColors.gpsOffFg
                      : themeColors.sesiDibukaFg
                  }
                />
                <Text
                  style={[
                    styles.aiBadgeText,
                    {
                      color: aiTidakTersedia
                        ? themeColors.gpsOffFg
                        : themeColors.sesiDibukaFg,
                    },
                  ]}
                >
                  {aiTidakTersedia
                    ? isEn
                      ? 'AI analysis unavailable'
                      : 'Analisis AI tidak tersedia'
                    : isEn
                      ? `AI Label: ${infoAi.label}`
                      : `Label AI: ${infoAi.label}`}
                </Text>
              </View>
              {!aiTidakTersedia ? (
                <Text
                  style={[
                    styles.aiSentimentText,
                    {
                      color: sentimenInfo.tersedia
                        ? themeColors.sesiDibukaFg
                        : themeColors.gpsOffFg,
                    },
                  ]}
                >
                  {sentimenInfo.tersedia
                    ? `${isEn ? 'AI Sentiment' : 'Sentimen AI'}: ${sentimenInfo.label}`
                    : isEn
                      ? 'Sentiment unavailable'
                      : 'Sentimen tidak tersedia'}
                </Text>
              ) : null}
              {!aiTidakTersedia && izinSaya.ringkasanAi ? (
                <Text
                  style={[
                    styles.aiSummaryText,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {izinSaya.ringkasanAi}
                </Text>
              ) : null}
              <Text
                style={[styles.aiFootnote, { color: themeColors.textMuted }]}
              >
                {isEn
                  ? 'Supporting information — decision is made by the assistant.'
                  : 'Informasi pendukung — keputusan ditetapkan oleh asisten.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Tombol Aksi */}
        <View style={styles.actionsGroup}>
          {!izinDiterima ? (
            <Tombol
              variant="primer"
              disabled={!bisaPresensi}
              icon={
                hadir ? (
                  <CheckCircle2 size={19} color={themeColors.disabledText} />
                ) : undefined
              }
              rightIcon={
                bisaPresensi ? (
                  <ArrowRight size={19} color={themeColors.onPrimary} />
                ) : undefined
              }
              onPress={bukaKameraPresensi}
            >
              {actionLabel}
            </Tombol>
          ) : null}

          {bisaAjukanIzin && (
            <Tombol
              variant="sekunder"
              icon={<FileText size={17} color={themeColors.textPrimary} />}
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
    flex: 1,
  },
  hadirStatusBox: {
    gap: spacing.s2,
    paddingTop: spacing.s2,
    borderTopWidth: 1,
  },
  hadirFineText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
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
  izinNoticeBox: {
    gap: 2,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2 + 2,
    borderRadius: 10,
  },
  izinNoticeTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    lineHeight: 18,
  },
  izinNoticeSub: {
    ...type.micro,
    fontFamily: fontFamily.regular,
    lineHeight: 16,
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
  aiSentimentText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  aiFootnote: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
  },
  actionsGroup: { marginTop: spacing.s5, gap: spacing.s3 },
});
