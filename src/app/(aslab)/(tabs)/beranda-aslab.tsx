import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Building2 } from 'lucide-react-native';

import {
  EmptyState,
  FilterRentang,
  SectionHeading,
  type RentangDashboard,
} from '@/components/ui';
import {
  hitungRingkasan,
  type StatusKegiatan,
} from '@/components/aslab/dashboard/ringkasan';
import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Sesi } from '@/data/dummy';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';
import { formatTanggalSingkat, titikJam } from '@/utils/format';

function warnaStatus(tc: ThemeColors, s: StatusKegiatan) {
  switch (s) {
    case 'BERLANGSUNG':
      return {
        fg: tc.sesiDibukaFg,
        bg: tc.sesiDibukaBg,
        iconBg: tc.primary,
        iconFg: tc.onPrimary,
      };
    case 'TERJADWAL':
      return {
        fg: tc.pembayaranPendingFg,
        bg: tc.pembayaranPendingBg,
        iconBg: tc.pembayaranPendingBg,
        iconFg: tc.pembayaranPendingFg,
      };
    case 'SELESAI':
      return {
        fg: tc.sesiSelesaiFg,
        bg: tc.sesiSelesaiBg,
        iconBg: tc.surfaceMuted,
        iconFg: tc.textSecondary,
      };
    default:
      return {
        fg: tc.textMuted,
        bg: tc.surfaceMuted,
        iconBg: tc.surfaceMuted,
        iconFg: tc.textMuted,
      };
  }
}

export default function BerandaAslabScreen() {
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const {
    currentUser,
    labs,
    users,
    tagihan,
    loading,
    error,
    retrySync,
  } = useSession();
  const { ruanganLabs, sesiAll, keanggotaanAll } = useAslabStore();

  const [rentang, setRentang] = useState<RentangDashboard>('hari');
  const s = useMemo(() => makeStyles(tc), [tc]);

  // Gabungkan ruangan fisik agar kartu operasional selalu konsisten
  const labsGabungan = useMemo(
    () =>
      ruanganLabs.length > 0
        ? ruanganLabs.map((r) => ({
            id: r.id,
            nama: r.nama,
            alamat: r.alamat,
            lat: r.lat,
            lng: r.lng,
            radius: r.radius,
          }))
        : labs,
    [ruanganLabs, labs],
  );

  const data = useMemo(
    () =>
      hitungRingkasan({
        rentang,
        labs: labsGabungan,
        sesi: sesiAll,
        users,
        keanggotaanLab: keanggotaanAll,
        tagihan,
      }),
    [rentang, labsGabungan, sesiAll, users, keanggotaanAll, tagihan],
  );

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  if (loading) {
    return (
      <View style={s.tengah}>
        <ActivityIndicator color={tc.textMuted} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.tengah}>
        <EmptyState
          judul={tx('Terjadi kesalahan', 'Something went wrong')}
          pesan={error}
          aksi={{ label: tx('Coba lagi', 'Try again'), onPress: retrySync }}
        />
      </View>
    );
  }

  const namaDepan =
    currentUser?.nama?.trim().split(/\s+/)[0] || tx('Aslab', 'Aslab');
  const namaLab = (id?: string, fallback?: string) =>
    labsGabungan.find((l) => l.id === id)?.nama ?? fallback ?? '-';

  const labelStatus: Record<StatusKegiatan, string> = {
    BERLANGSUNG: tx('Berlangsung', 'Ongoing'),
    TERJADWAL: tx('Terjadwal', 'Scheduled'),
    SELESAI: tx('Selesai', 'Finished'),
    TANPA_KEGIATAN: tx('Kosong', 'Idle'),
  };

  const renderSesi = (x: Sesi, tampilJam = true) => (
    <View key={x.id} style={s.kartu}>
      <Text style={s.kartuJudul}>
        {x.namaPraktikum} {x.kelas ? `· ${x.kelas}` : ''}
      </Text>
      <Text style={s.teks}>
        {namaLab(x.labId, x.lab)} · {formatTanggalSingkat(x.tanggal)}
        {tampilJam ? ` · ${titikJam(x.jamMulai)}–${titikJam(x.jamSelesai)}` : ''}
      </Text>
    </View>
  );

  return (
    <View style={s.layar}>
      <ScrollView
        contentContainerStyle={s.isi}
        showsVerticalScrollIndicator={false}
      >
        {/* Sapaan Clean */}
        <View style={s.titleWrap}>
          <Text style={s.sapaanKecil}>
            {tx('Halo,', 'Hello,')}
          </Text>
          <Text style={s.judul}>{namaDepan} 👋</Text>
        </View>

        <FilterRentang value={rentang} onChange={setRentang} />

        {/* Hero Operasional Lab */}
        <View style={s.heroCard}>
          <View style={s.heroTopRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.heroKicker}>
                {tx('OPERASIONAL LAB', 'LAB OPERATIONS')}
              </Text>
              <Text style={s.heroTitle}>
                {data.berlangsung.length > 0
                  ? tx('Sesi sedang aktif', 'Sessions running')
                  : tx('Semua terkendali', 'All under control')}
              </Text>
            </View>
            <View style={s.heroPill}>
              <View style={s.heroDot} />
              <Text style={s.heroPillText}>{tx('Aktif', 'Live')}</Text>
            </View>
          </View>

          <View style={s.heroDivider} />

          <View style={s.heroStatsRow}>
            <View style={s.heroStatCol}>
              <Text style={s.heroStatNum}>{data.jumlahLab}</Text>
              <Text style={s.heroStatLabel}>
                {tx('Laboratorium', 'Laboratories')}
              </Text>
            </View>
            <View style={s.heroVertLine} />
            <View style={s.heroStatCol}>
              <Text style={s.heroStatNum}>{data.jumlahPraktikan}</Text>
              <Text style={s.heroStatLabel}>
                {tx('Praktikan aktif', 'Active students')}
              </Text>
            </View>
            <View style={s.heroVertLine} />
            <View style={s.heroStatCol}>
              <Text style={s.heroStatNum}>{data.berlangsung.length}</Text>
              <Text style={s.heroStatLabel}>
                {tx('Sesi berjalan', 'Running sessions')}
              </Text>
            </View>
          </View>
        </View>

        {/* Aktivitas Laboratorium Real-Time */}
        <View style={s.liveHeaderRow}>
          <Text style={s.liveTitle}>
            {tx('Aktivitas Lab', 'Lab Activity')}
          </Text>
          <View style={s.liveBadge}>
            <View style={s.liveBadgeDot} />
            <Text style={s.liveBadgeText}>Live</Text>
          </View>
        </View>

        {data.perLab.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada lab', 'No labs yet')}
            pesan={tx(
              'Data laboratorium akan tampil di sini.',
              'Laboratories will appear here.',
            )}
          />
        ) : (
          <View style={s.groupedLabBox}>
            {data.perLab.map(({ lab, status }, idx) => {
              const w = warnaStatus(tc, status);
              const sesiTerkait = sesiAll.find(
                (ss) =>
                  ss.labId === lab.id ||
                  ss.lab.trim().toLowerCase() === lab.nama.trim().toLowerCase(),
              );
              const badgeTeks =
                status === 'TERJADWAL' && sesiTerkait
                  ? titikJam(sesiTerkait.jamMulai)
                  : labelStatus[status];

              return (
                <View
                  key={lab.id}
                  style={[
                    s.labRowItem,
                    idx > 0 && { borderTopWidth: 1, borderTopColor: tc.border },
                  ]}
                >
                  <View style={[s.labIconBox, { backgroundColor: w.iconBg }]}>
                    <Building2 size={18} color={w.iconFg} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.kartuJudul} numberOfLines={1}>
                      {lab.nama}
                    </Text>
                    <Text style={s.labSubTeks} numberOfLines={1}>
                      {sesiTerkait?.namaPraktikum ?? lab.alamat}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: w.bg }]}>
                    <Text style={[s.teksBadge, { color: w.fg }]}>
                      {badgeTeks}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <SectionHeading title={tx('Akan datang', 'Upcoming')} />
        {data.akanDatang.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada jadwal', 'No schedule yet')}
            pesan={tx(
              'Tidak ada jadwal akan datang pada rentang ini.',
              'No upcoming schedule in this range.',
            )}
          />
        ) : (
          data.akanDatang.slice(0, 5).map((x) => renderSesi(x))
        )}

        <SectionHeading title={tx('Riwayat kegiatan', 'Activity history')} />
        {data.riwayatKegiatan.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada riwayat', 'No history yet')}
            pesan={tx(
              'Belum ada kegiatan selesai pada rentang ini.',
              'No finished activity in this range.',
            )}
          />
        ) : (
          data.riwayatKegiatan.slice(0, 5).map((x) => renderSesi(x))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (tc: ThemeColors) =>
  StyleSheet.create({
    layar: { flex: 1, backgroundColor: tc.background },
    isi: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s5,
      paddingBottom: layout.tabContentBottomPadding,
      gap: spacing.s4,
    },
    tengah: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.s6,
      backgroundColor: tc.background,
    },
    titleWrap: { gap: 3 },
    sapaanKecil: {
      ...tipe.body,
      color: tc.textSecondary,
    },
    judul: {
      ...tipe.h1,
      fontSize: 30,
      lineHeight: 35,
      color: tc.textPrimary,
    },
    subjudul: {
      ...tipe.caption,
      color: tc.textMuted,
      marginTop: 2,
    },
    heroCard: {
      backgroundColor: tc.graphite,
      borderRadius: radius.cardLg + 2,
      padding: spacing.s5,
      gap: spacing.s4,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s3,
    },
    heroKicker: {
      ...tipe.micro,
      fontFamily: fontFamily.bold,
      letterSpacing: 1.1,
      color: tc.primary,
    },
    heroTitle: {
      ...tipe.h2,
      color: tc.onGraphite,
    },
    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: tc.graphiteSurface,
      borderWidth: 1,
      borderColor: 'rgba(196, 241, 91, 0.35)',
    },
    heroDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: tc.primary,
    },
    heroPillText: {
      ...tipe.caption,
      fontFamily: fontFamily.bold,
      color: tc.primary,
    },
    heroDivider: {
      height: 1,
      backgroundColor: tc.graphiteSurface,
    },
    heroStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroStatCol: {
      flex: 1,
      gap: 2,
    },
    heroVertLine: {
      width: 1,
      height: 36,
      backgroundColor: tc.graphiteSurface,
      marginHorizontal: spacing.s3,
    },
    heroStatNum: {
      fontSize: 24,
      fontFamily: fontFamily.extrabold,
      color: tc.onGraphite,
    },
    heroStatLabel: {
      ...tipe.micro,
      color: tc.textOnDarkMuted,
    },
    liveHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: spacing.s1,
    },
    liveKicker: {
      ...tipe.micro,
      letterSpacing: 1,
      color: tc.textMuted,
    },
    liveTitle: {
      ...tipe.h2,
      color: tc.textPrimary,
      marginTop: 2,
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: tc.sesiDibukaBg,
    },
    liveBadgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: tc.sesiDibukaFg,
    },
    liveBadgeText: {
      ...tipe.caption,
      fontFamily: fontFamily.bold,
      color: tc.sesiDibukaFg,
    },
    groupedLabBox: {
      backgroundColor: tc.surface,
      borderRadius: radius.cardLg,
      borderWidth: 1,
      borderColor: tc.border,
      overflow: 'hidden',
    },
    labRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
      paddingHorizontal: spacing.s4,
      paddingVertical: spacing.s3 + 2,
    },
    labIconBox: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    labSubTeks: {
      ...tipe.caption,
      color: tc.textMuted,
    },
    kartu: {
      backgroundColor: tc.surface,
      borderRadius: radius.card,
      padding: spacing.s4,
      borderWidth: 1,
      borderColor: tc.border,
      gap: spacing.s1,
    },
    kartuJudul: { ...tipe.cardTitle, color: tc.textPrimary },
    teks: { ...tipe.body, color: tc.textSecondary },
    badge: {
      paddingVertical: 5,
      paddingHorizontal: 11,
      borderRadius: radius.pill,
    },
    teksBadge: {
      ...tipe.micro,
      fontFamily: fontFamily.bold,
    },
  });
