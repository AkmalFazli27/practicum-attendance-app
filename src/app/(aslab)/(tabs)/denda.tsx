import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { Clock, Receipt, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import {
  EmptyState,
  FilterChip,
  FilterRentang,
  MetricCard,
  SectionHeading,
  StatusPembayaranBadge,
  type RentangDashboard,
} from '@/components/ui';
import { hitungRingkasan } from '@/components/aslab/dashboard/ringkasan';
import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Tagihan } from '@/data/dummy';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';
import { formatTanggalSingkat } from '@/utils/format';

const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

type FilterStatusTagihan = 'ALL' | Tagihan['status'];

/**
 * Tab Denda & Keuangan Aslab (dipisahkan dari Beranda ke Navbar utama).
 */
export default function DendaAslabScreen() {
  const { t } = useTranslation();
  const { themeColors: tc } = usePreferences();

  const {
    currentUser,
    labs,
    users,
    tagihan,
    pembayaran,
    loading,
    error,
    retrySync,
  } = useSession();
  const { sesiAll, keanggotaanAll } = useAslabStore();

  const [rentang, setRentang] = useState<RentangDashboard>('bulan');
  const [filterStatus, setFilterStatus] = useState<FilterStatusTagihan>('ALL');
  const s = useMemo(() => makeStyles(tc), [tc]);

  const data = useMemo(
    () =>
      hitungRingkasan({
        rentang,
        labs,
        sesi: sesiAll,
        users,
        keanggotaanLab: keanggotaanAll,
        tagihan,
      }),
    [rentang, labs, sesiAll, users, keanggotaanAll, tagihan],
  );

  const barisTerfilter = useMemo(() => {
    if (filterStatus === 'ALL') return data.keuangan.baris;
    return data.keuangan.baris.filter((b) => b.tagihan.status === filterStatus);
  }, [data.keuangan.baris, filterStatus]);

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
          judul={t('common.error')}
          pesan={error}
          aksi={{ label: t('common.retry'), onPress: retrySync }}
        />
      </View>
    );
  }

  const opsiFilter: { key: FilterStatusTagihan; label: string }[] = [
    { key: 'ALL', label: t('aslab.filterAll') },
    { key: 'UNPAID', label: t('aslab.filterUnpaid') },
    { key: 'PENDING', label: t('aslab.filterPending') },
    { key: 'PAID', label: t('aslab.filterPaid') },
    { key: 'DIBEBASKAN', label: t('aslab.filterWaived') },
  ];

  return (
    <View style={s.layar}>
      <ScrollView
        contentContainerStyle={s.isi}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.judul}>{t('aslab.finesTitle')}</Text>

        <FilterRentang value={rentang} onChange={setRentang} />

        {/* Ringkasan Nominal */}
        <View style={s.baris}>
          <MetricCard
            icon={<Wallet size={20} color={tc.textPrimary} />}
            value={rupiah(data.keuangan.totalTerbayar)}
            label={t('aslab.paidMetric')}
          />
          <MetricCard
            dark
            icon={<Clock size={20} color={tc.onPrimary} />}
            value={rupiah(data.keuangan.totalTertunggak)}
            label={t('aslab.outstandingMetric')}
          />
        </View>

        {/* Filter Status Tagihan */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterRow}
        >
          {opsiFilter.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              aktif={filterStatus === f.key}
              onPress={() => setFilterStatus(f.key)}
            />
          ))}
        </ScrollView>

        <SectionHeading title={t('aslab.invoicesHeading')} />

        {barisTerfilter.length === 0 ? (
          <EmptyState
            judul={t('aslab.noFinesTitle')}
            pesan={t('aslab.noFinesBody')}
          />
        ) : (
          barisTerfilter.map(({ tagihan: tg, namaPraktikan, namaSesi }) => (
            <View key={tg.id} style={s.kartu}>
              <View style={s.barisSpasi}>
                <Text style={[s.kartuJudul, { flex: 1 }]} numberOfLines={1}>
                  {namaPraktikan}
                </Text>
                <StatusPembayaranBadge status={tg.status} />
              </View>
              <Text style={s.teks}>
                {namaSesi} · {rupiah(tg.nominal)}
              </Text>
              <Text style={s.metaTeks}>
                {t('aslab.lateMinutesLine', { menit: tg.menitTerlambat })} ·{' '}
                {formatTanggalSingkat(tg.dibuatPada.slice(0, 10))}
              </Text>
            </View>
          ))
        )}

        {pembayaran.length > 0 ? (
          <>
            <SectionHeading title={t('aslab.paymentLogsHeading')} />
            {pembayaran.map((p) => {
              const mhs = users.find((u) => u.id === p.praktikanId);
              return (
                <View key={p.id} style={s.kartu}>
                  <View style={s.barisSpasi}>
                    <View style={s.rowLeft}>
                      <Receipt size={16} color={tc.textSecondary} />
                      <Text style={s.kartuJudul} numberOfLines={1}>
                        {mhs?.nama ?? p.praktikanId}
                      </Text>
                    </View>
                    <Text style={s.nominalTeks}>{rupiah(p.nominal)}</Text>
                  </View>
                  <Text style={s.metaTeks}>
                    {p.metode ?? 'Midtrans'} · {p.status.toUpperCase()} ·{' '}
                    {formatTanggalSingkat(p.diperbaruiPada.slice(0, 10))}
                  </Text>
                </View>
              );
            })}
          </>
        ) : null}
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
    kicker: {
      ...tipe.micro,
      fontFamily: fontFamily.bold,
      letterSpacing: 1.1,
      color: tc.textMuted,
    },
    judul: { ...tipe.h1, color: tc.textPrimary },
    subjudul: {
      ...tipe.caption,
      color: tc.textSecondary,
      lineHeight: 18,
    },
    baris: { flexDirection: 'row', gap: spacing.s3 },
    filterRow: { gap: spacing.s2 },
    barisSpasi: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.s2,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      flex: 1,
    },
    kartu: {
      backgroundColor: tc.surface,
      borderRadius: radius.card,
      padding: spacing.s4,
      borderWidth: 1,
      borderColor: tc.border,
      gap: 4,
    },
    kartuJudul: { ...tipe.cardTitle, color: tc.textPrimary },
    teks: { ...tipe.body, color: tc.textSecondary },
    nominalTeks: {
      ...tipe.body,
      fontFamily: fontFamily.bold,
      color: tc.textPrimary,
    },
    metaTeks: { ...tipe.micro, color: tc.textMuted },
  });
