import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Clock, FlaskConical, Users, Wallet } from 'lucide-react-native';

import {
  EmptyState,
  FilterRentang,
  MetricCard,
  SectionHeading,
  StatusPembayaranBadge,
  type RentangDashboard,
} from '@/components/ui';
import {
  hitungRingkasan,
  type StatusKegiatan,
} from '@/components/aslab/dashboard/ringkasan';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Sesi } from '@/data/dummy';
import { layout, radius, spacing, type as tipe, type ThemeColors } from '@/theme/tokens';
import { formatTanggalSingkat, titikJam } from '@/utils/format';

const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

function warnaStatus(tc: ThemeColors, s: StatusKegiatan) {
  switch (s) {
    case 'BERLANGSUNG':
      return { fg: tc.sesiDibukaFg, bg: tc.sesiDibukaBg };
    case 'TERJADWAL':
      return { fg: tc.sesiTerjadwalFg, bg: tc.sesiTerjadwalBg };
    default:
      return { fg: tc.sesiSelesaiFg, bg: tc.sesiSelesaiBg };
  }
}

export default function BerandaAslabScreen() {
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  // Satu pintu teks dua bahasa. Saat i18n siap, ganti isinya menjadi t(kunci, id).
  const tx = (id: string, en: string) => (isEn ? en : id);

  const {
    currentUser, labs, sesi, users, keanggotaanLab, tagihan,
    loading, error, retrySync,
  } = useSession();
  const [rentang, setRentang] = useState<RentangDashboard>('minggu');
  const s = useMemo(() => makeStyles(tc), [tc]);

  const data = useMemo(
    () => hitungRingkasan({ rentang, labs, sesi, users, keanggotaanLab, tagihan }),
    [rentang, labs, sesi, users, keanggotaanLab, tagihan],
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

  const namaLab = (id?: string) => labs.find((l) => l.id === id)?.nama ?? '-';

  const labelStatus: Record<StatusKegiatan, string> = {
    BERLANGSUNG: tx('Berlangsung', 'Ongoing'),
    TERJADWAL: tx('Terjadwal', 'Scheduled'),
    SELESAI: tx('Selesai', 'Finished'),
    TANPA_KEGIATAN: tx('Tanpa kegiatan', 'No activity'),
  };

  const renderSesi = (x: Sesi, tampilJam = true) => (
    <View key={x.id} style={s.kartu}>
      <Text style={s.kartuJudul}>{x.namaPraktikum}</Text>
      <Text style={s.teks}>
        {namaLab(x.labId)} · {formatTanggalSingkat(x.tanggal)}
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
        <View style={s.titleWrap}>
          <Text style={s.kicker}>{tx('AREA ASLAB', 'ASLAB AREA')}</Text>
          <Text style={s.judul}>{tx('Beranda Aslab', 'Aslab dashboard')}</Text>
        </View>

        <FilterRentang value={rentang} onChange={setRentang} />

        <View style={s.baris}>
          <MetricCard
            icon={<FlaskConical size={20} color={tc.textPrimary} />}
            value={data.jumlahLab}
            label={tx('Lab', 'Labs')}
          />
          <MetricCard
            icon={<Users size={20} color={tc.textPrimary} />}
            value={data.jumlahPraktikan}
            label={tx('Praktikan', 'Students')}
          />
        </View>

        <SectionHeading title={tx('Status kegiatan lab', 'Lab activity status')} />
        {data.perLab.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada lab', 'No labs yet')}
            pesan={tx('Lab akan tampil setelah dibuat.', 'Labs will appear once created.')}
          />
        ) : (
          data.perLab.map(({ lab, status, jumlahPraktikan }) => {
            const w = warnaStatus(tc, status);
            return (
              <View key={lab.id} style={s.kartu}>
                <View style={s.barisSpasi}>
                  <Text style={[s.kartuJudul, { flex: 1 }]}>{lab.nama}</Text>
                  <View style={[s.badge, { backgroundColor: w.bg }]}>
                    <Text style={[s.teksBadge, { color: w.fg }]}>{labelStatus[status]}</Text>
                  </View>
                </View>
                <Text style={s.teks}>{lab.alamat}</Text>
                <Text style={s.teks}>
                  {jumlahPraktikan} {tx('praktikan', 'students')}
                </Text>
              </View>
            );
          })
        )}

        <SectionHeading title={tx('Sedang berlangsung', 'Ongoing')} />
        {data.berlangsung.length === 0 ? (
          <EmptyState
            judul={tx('Tidak ada kegiatan berlangsung', 'No ongoing activity')}
            pesan={tx('Tidak ada sesi aktif pada rentang ini.', 'No active sessions in this range.')}
          />
        ) : (
          data.berlangsung.map((x) => renderSesi(x))
        )}

        <SectionHeading title={tx('Akan datang', 'Upcoming')} />
        {data.akanDatang.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada jadwal', 'No schedule yet')}
            pesan={tx('Tidak ada jadwal akan datang pada rentang ini.', 'No upcoming schedule in this range.')}
          />
        ) : (
          data.akanDatang.map((x) => renderSesi(x))
        )}

        <SectionHeading title={tx('Riwayat kegiatan', 'Activity history')} />
        {data.riwayatKegiatan.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada riwayat', 'No history yet')}
            pesan={tx('Belum ada kegiatan selesai pada rentang ini.', 'No finished activity in this range.')}
          />
        ) : (
          data.riwayatKegiatan.map((x) => renderSesi(x, false))
        )}

        <SectionHeading title={tx('Riwayat keuangan denda', 'Fine payment history')} />
        <View style={s.baris}>
          <MetricCard
            icon={<Wallet size={20} color={tc.textPrimary} />}
            value={rupiah(data.keuangan.totalTerbayar)}
            label={tx('Terbayar', 'Paid')}
          />
          <MetricCard
            dark
            icon={<Clock size={20} color={tc.onPrimary} />}
            value={rupiah(data.keuangan.totalTertunggak)}
            label={tx('Tertunggak', 'Outstanding')}
          />
        </View>
        {data.keuangan.baris.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada denda', 'No fines yet')}
            pesan={tx('Denda keterlambatan akan tampil di sini.', 'Late fines will appear here.')}
          />
        ) : (
          data.keuangan.baris.map(({ tagihan: tg, namaPraktikan, namaSesi }) => (
            <View key={tg.id} style={s.kartu}>
              <View style={s.barisSpasi}>
                <Text style={[s.kartuJudul, { flex: 1 }]}>{namaPraktikan}</Text>
                <StatusPembayaranBadge status={tg.status} />
              </View>
              <Text style={s.teks}>
                {namaSesi} · {rupiah(tg.nominal)}
              </Text>
            </View>
          ))
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
    tengah: { flex: 1, justifyContent: 'center', padding: spacing.s6, backgroundColor: tc.background },
    titleWrap: { gap: 2 },
    kicker: { ...tipe.micro, letterSpacing: 1.1, color: tc.textMuted },
    judul: { ...tipe.h1, color: tc.textPrimary },
    baris: { flexDirection: 'row', gap: spacing.s3 },
    barisSpasi: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.s2 },
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
    badge: { paddingVertical: 3, paddingHorizontal: spacing.s2 + 2, borderRadius: radius.badge },
    teksBadge: { ...tipe.caption },
  });