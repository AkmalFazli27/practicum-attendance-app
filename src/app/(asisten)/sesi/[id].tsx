import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Lock,
  MapPin,
  Play,
  Users,
} from 'lucide-react-native';

import { BadgeKehadiran } from '@/components/asisten/BadgeKehadiran';
import { formatJarak } from '@/components/asisten/formatJarak';
import { IzinPanel } from '@/components/asisten/IzinPanel';
import { QrPresensi } from '@/components/asisten/QrPresensi';
import { hitungPresensiSesi } from '@/components/asisten/ringkasanPresensi';
import { ErrorBlock, LoadingBlock } from '@/components/asisten/SyncState';
import { useAksiSesi } from '@/components/asisten/useAksiSesi';
import { useSesiAsprak } from '@/components/asisten/useSesiAsprak';
import { useStatusSesi } from '@/components/asisten/useStatusSesi';
import {
  EmptyState,
  StatusBadge,
  Tombol,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, layout, radius, spacing, type } from '@/theme/tokens';
import { formatJam, formatTanggalSingkat, titikJam } from '@/utils/format';

export default function DetailSesiScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    currentUser,
    users,
    sesi,
    kehadiran,
    izin,
    keanggotaanLab,
    getKehadiranSesi,
    loading,
    error,
    retrySync,
  } = useSession();
  const { bolehKelola } = useSesiAsprak();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const { mulai, sheet } = useAksiSesi();
  const { statusEfektif, aksiUtama } = useStatusSesi();

  const s = sesi.find((item) => item.id === id);

  const petaUser = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  if (!currentUser) return null;

  if (!s) {
    if (loading) {
      return (
        <View style={[styles.root, { backgroundColor: themeColors.background }]}>
          <LoadingBlock
            pesan={isEn ? 'Loading session...' : 'Memuat detail sesi...'}
          />
        </View>
      );
    }
    if (error) {
      return (
        <View style={[styles.root, { backgroundColor: themeColors.background }]}>
          <ErrorBlock pesan={error} onRetry={retrySync} />
        </View>
      );
    }
    return (
      <View style={[styles.root, styles.centerPad, { backgroundColor: themeColors.background }]}>
        <EmptyState
          judul={isEn ? 'Session not found' : 'Sesi tidak ditemukan'}
          pesan={
            isEn
              ? 'The session may have been deleted or belongs to another lab.'
              : 'Sesi mungkin sudah dihapus atau berasal dari lab lain.'
          }
          aksi={{
            label: isEn ? 'Back' : 'Kembali',
            onPress: () => router.back(),
          }}
        />
      </View>
    );
  }

  if (!bolehKelola(s)) {
    return (
      <View style={[styles.root, styles.centerPad, { backgroundColor: themeColors.background }]}>
        <EmptyState
          judul={isEn ? 'Access denied' : 'Akses dibatasi'}
          pesan={
            isEn
              ? 'You are not registered as an assistant for this lab.'
              : 'Kamu tidak terdaftar sebagai asisten pada laboratorium sesi ini.'
          }
          aksi={{
            label: isEn ? 'Back' : 'Kembali',
            onPress: () => router.back(),
          }}
        />
      </View>
    );
  }

  const status = statusEfektif(s);
  const aksi = aksiUtama(s);
  const daftarHadir = getKehadiranSesi(s.id)
    .slice()
    .sort((a, b) => a.waktuHadir.localeCompare(b.waktuHadir));
  const ringkasan = hitungPresensiSesi({
    sesi: s,
    users,
    kehadiran,
    izin,
    keanggotaanLab,
  });

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Tombol Kembali */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Back' : 'Kembali'}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
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

        {/* Kartu Info Utama Sesi */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <View style={styles.heroTop}>
            <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
              {s.kelas} · {s.lab}
            </Text>
            <StatusBadge status={status} />
          </View>

          <Text style={[styles.title, { color: themeColors.textPrimary }]}>
            {s.namaPraktikum}
          </Text>

          {s.topik ? (
            <Text style={[styles.topic, { color: themeColors.textSecondary }]}>
              {s.topik}
            </Text>
          ) : null}

          <View style={[styles.metaList, { borderTopColor: themeColors.border }]}>
            <View style={styles.metaRow}>
              <Calendar size={15} color={themeColors.textMuted} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {formatTanggalSingkat(s.tanggal)}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={15} color={themeColors.textMuted} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {titikJam(s.jamMulai)}–{titikJam(s.jamSelesai)} WIB
              </Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={15} color={themeColors.textMuted} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {s.lab} · {s.kelas}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Users size={15} color={themeColors.textMuted} />
              <Text style={[styles.metaText, { color: themeColors.textSecondary }]}>
                {daftarHadir.length}/{s.kapasitas ?? 32}{' '}
                {isEn ? 'students attended' : 'praktikan hadir'}
              </Text>
            </View>
          </View>

          {s.deskripsi ? (
            <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
              {s.deskripsi}
            </Text>
          ) : null}

          {/* Aksi Utama Sesi */}
          {aksi.jenis !== 'selesai' && (
            <View style={styles.primaryActions}>
              {aksi.jenis === 'buka' && (
                <>
                  <Tombol
                    variant="primer"
                    disabled={!aksi.aktif}
                    icon={<Play size={16} color={themeColors.onPrimary} />}
                    onPress={() => mulai(s.id, 'buka')}
                  >
                    {isEn ? 'Open session' : 'Buka sesi'}
                  </Tombol>
                  {!aksi.aktif && aksi.keterangan ? (
                    <Text style={[styles.actionHint, { color: themeColors.textMuted }]}>
                      {aksi.keterangan}
                    </Text>
                  ) : null}
                </>
              )}

              {aksi.jenis === 'tutup' && (
                <Tombol
                  variant="danger"
                  icon={<Lock size={16} color={themeColors.errorFg} />}
                  onPress={() => mulai(s.id, 'tutup')}
                >
                  {isEn ? 'Close session' : 'Tutup sesi'}
                </Tombol>
              )}
            </View>
          )}
        </View>

        {/* QR & Kode Presensi saat sesi sedang dibuka */}
        {status === 'DIBUKA' && <QrPresensi sesi={s} />}

        {/* Ringkasan Kehadiran Real-time */}
        <View
          style={[
            styles.panel,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'ATTENDANCE SUMMARY' : 'RINGKASAN PRESENSI'}
          </Text>
          <Text style={[styles.panelTitle, { color: themeColors.textPrimary }]}>
            {isEn
              ? `Present (${daftarHadir.length}/${s.kapasitas ?? 32})`
              : `Daftar hadir (${daftarHadir.length}/${s.kapasitas ?? 32})`}
          </Text>

          <View style={styles.statGrid}>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.statVal, { color: themeColors.kehadiranTepatWaktuFg }]}>
                {ringkasan.tepatWaktu}
              </Text>
              <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>
                {isEn ? 'On time' : 'Tepat waktu'}
              </Text>
            </View>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.statVal, { color: themeColors.kehadiranTerlambatFg }]}>
                {ringkasan.terlambat}
              </Text>
              <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>
                {isEn ? 'Late' : 'Terlambat'}
              </Text>
            </View>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.statVal, { color: themeColors.textPrimary }]}>
                {ringkasan.izin}
              </Text>
              <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>
                {isEn ? 'Excused' : 'Izin'}
              </Text>
            </View>
            <View
              style={[
                styles.statBox,
                {
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.statVal, { color: themeColors.textPrimary }]}>
                {ringkasan.belumHadir}
              </Text>
              <Text style={[styles.statLbl, { color: themeColors.textMuted }]}>
                {isEn ? 'Absent' : 'Belum hadir'}
              </Text>
            </View>
          </View>

          {daftarHadir.length === 0 ? (
            <Text
              style={[
                styles.emptyText,
                {
                  borderTopColor: themeColors.border,
                  color: themeColors.textMuted,
                },
              ]}
            >
              {isEn
                ? 'No students have checked in for this session yet.'
                : 'Belum ada praktikan yang melakukan presensi pada sesi ini.'}
            </Text>
          ) : (
            <View style={styles.attendeeList}>
              {daftarHadir.map((k) => {
                const user = petaUser.get(k.praktikanId);
                const nama = k.namaPraktikan || user?.nama || 'Praktikan';
                const nim = k.nimPraktikan || user?.nim || '-';
                return (
                  <View
                    key={k.id}
                    style={[
                      styles.attendeeRow,
                      { borderTopColor: themeColors.border },
                    ]}
                  >
                    <View style={styles.attendeeInfo}>
                      <Text
                        style={[
                          styles.attendeeName,
                          { color: themeColors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {nama}
                      </Text>
                      <Text
                        style={[
                          styles.attendeeMeta,
                          { color: themeColors.textMuted },
                        ]}
                      >
                        {nim} · {titikJam(formatJam(k.waktuHadir))}
                        {k.jarak !== undefined ? ` · ${formatJarak(k.jarak)}` : ''}
                      </Text>
                    </View>
                    <BadgeKehadiran
                      status={k.statusKehadiran ?? 'TEPAT_WAKTU'}
                      menit={k.menitTerlambat}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Panel Izin & AI */}
        <IzinPanel sesiId={s.id} />
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
  centerPad: {
    justifyContent: 'center',
    padding: layout.screenPadding,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: spacing.s8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s3,
  },
  heroCard: {
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.s2,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
  },
  title: {
    ...type.h1,
  },
  topic: {
    ...type.body,
  },
  metaList: {
    marginTop: spacing.s2,
    paddingTop: spacing.s3,
    borderTopWidth: 1,
    gap: spacing.s2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  metaText: {
    ...type.caption,
  },
  desc: {
    ...type.caption,
    lineHeight: 18,
    marginTop: spacing.s1,
  },
  primaryActions: {
    marginTop: spacing.s3,
    gap: spacing.s2,
  },
  actionHint: {
    ...type.micro,
    textAlign: 'center',
  },
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  panelTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    marginTop: 2,
    marginBottom: spacing.s3,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.s2,
    marginBottom: spacing.s3,
  },
  statBox: {
    flex: 1,
    paddingVertical: spacing.s2 + 2,
    paddingHorizontal: spacing.s2,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontSize: 16,
    fontFamily: fontFamily.extrabold,
  },
  statLbl: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  emptyText: {
    borderTopWidth: 1,
    paddingTop: spacing.s3,
    ...type.caption,
  },
  attendeeList: {
    marginTop: spacing.s1,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
    borderTopWidth: 1,
    paddingVertical: spacing.s2 + 2,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
  attendeeMeta: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    marginTop: 2,
  },
});