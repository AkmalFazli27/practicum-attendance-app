import React, { useMemo } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { PembayaranRow } from '@/components/praktikan/PembayaranRow';
import {
  PEMBAYARAN_STUB,
  TAGIHAN_STUB,
} from '@/components/praktikan/tagihanStub';
import { EmptyState, Tombol } from '@/components/ui';
import { isFirebaseConfigured } from '@/config/firebase';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Pembayaran, Sesi, Tagihan } from '@/data/dummy';
import {
  layout,
  radius,
  spacing,
  type,
} from '@/theme/tokens';

function waktu(iso: string): number {
  const nilai = new Date(iso).getTime();
  return Number.isNaN(nilai) ? 0 : nilai;
}

export default function RiwayatPembayaranScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const {
    pembayaran,
    tagihan,
    sesi,
    currentUser,
    loading,
    error,
    retrySync,
  } = useSession();

  const { transaksi, tagihanMap, sesiMap } = useMemo(() => {
    const uid = currentUser?.id;
    const sMap = new Map<string, Sesi>(sesi.map((item) => [item.id, item]));

    if (!uid) {
      return {
        transaksi: [] as Pembayaran[],
        tagihanMap: new Map<string, Tagihan>(),
        sesiMap: sMap,
      };
    }

    const memakaiStub =
      !isFirebaseConfigured && pembayaran.length === 0 && tagihan.length === 0;

    // Mode dummy: tampilkan contoh transaksi agar alur baca bisa diuji.
    // Mode Firebase tidak pernah memakai stub supaya riwayat asli & empty state terlihat.
    const sumberPembayaran: Pembayaran[] = memakaiStub
      ? PEMBAYARAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : pembayaran;
    const sumberTagihan: Tagihan[] = memakaiStub
      ? TAGIHAN_STUB.map((item) => ({ ...item, praktikanId: uid }))
      : tagihan;

    const tMap = new Map<string, Tagihan>(
      sumberTagihan
        .filter((item) => item.praktikanId === uid)
        .map((item) => [item.id, item]),
    );

    const daftarTransaksi = sumberPembayaran
      .filter((item) => item.praktikanId === uid)
      .sort((a, b) => waktu(b.dibuatPada) - waktu(a.dibuatPada));

    return {
      transaksi: daftarTransaksi,
      tagihanMap: tMap,
      sesiMap: sMap,
    };
  }, [currentUser?.id, pembayaran, tagihan, sesi]);

  const bukaDetailTagihan = (tagihanId: string) => {
    router.push({
      pathname: '/(praktikan)/tagihan/[id]',
      params: { id: tagihanId },
    } as any);
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: themeColors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Back' : 'Kembali'}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              borderColor: themeColors.border,
              backgroundColor: pressed
                ? themeColors.surfaceMuted
                : themeColors.surface,
            },
          ]}
        >
          <ChevronLeft size={20} color={themeColors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
            {isEn ? 'PAYMENT' : 'PEMBAYARAN'}
          </Text>
          <Text
            style={[styles.title, { color: themeColors.textPrimary }]}
            numberOfLines={1}
          >
            {isEn ? 'Payment history' : 'Riwayat Pembayaran'}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && transaksi.length > 0}
            onRefresh={retrySync}
            tintColor={themeColors.textSecondary}
          />
        }
      >
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
          {isEn
            ? 'All of your late-attendance fine transactions.'
            : 'Semua transaksi denda keterlambatanmu.'}
        </Text>

        {error && transaksi.length > 0 ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: themeColors.errorBg,
                borderColor: themeColors.dangerBorder,
              },
            ]}
          >
            <Text style={[styles.errorBannerText, { color: themeColors.errorFg }]}>
              {error}
            </Text>
            <Tombol variant="sekunder" onPress={retrySync}>
              {isEn ? 'Try again' : 'Coba lagi'}
            </Tombol>
          </View>
        ) : null}

        {error && transaksi.length === 0 ? (
          <EmptyState
            judul={
              isEn
                ? 'Failed to load payment history'
                : 'Gagal memuat riwayat pembayaran'
            }
            pesan={error}
            aksi={{
              label: isEn ? 'Try again' : 'Coba lagi',
              onPress: retrySync,
            }}
          />
        ) : loading && transaksi.length === 0 ? (
          <EmptyState
            judul={
              isEn
                ? 'Loading payment history…'
                : 'Memuat riwayat pembayaran…'
            }
            pesan={isEn ? 'Please wait a moment.' : 'Mohon tunggu sebentar.'}
          />
        ) : transaksi.length === 0 ? (
          <EmptyState
            judul={isEn ? 'No transactions yet' : 'Belum ada transaksi'}
            pesan={
              isEn
                ? 'Bill payments will appear here.'
                : 'Pembayaran tagihan akan muncul di sini.'
            }
          />
        ) : (
          <View style={styles.list}>
            {transaksi.map((p) => {
              const tagihanTerkait = tagihanMap.get(p.tagihanId);
              const sesiTerkait = tagihanTerkait
                ? sesiMap.get(tagihanTerkait.sesiId)
                : undefined;
              const namaSesi =
                sesiTerkait?.namaPraktikum ??
                (isEn ? 'Practicum session' : 'Sesi praktikum');
              const tanggalTagihan = tagihanTerkait?.dibuatPada ?? p.dibuatPada;

              return (
                <PembayaranRow
                  key={p.id}
                  pembayaran={p}
                  namaSesi={namaSesi}
                  tanggalTagihan={tanggalTagihan}
                  onPress={() => bukaDetailTagihan(p.tagihanId)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.s2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    ...type.micro,
    letterSpacing: 1.1,
  },
  title: {
    ...type.h2,
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s5,
    paddingBottom: layout.tabContentBottomPadding,
    gap: spacing.s4,
  },
  subtitle: {
    ...type.caption,
  },
  errorBanner: {
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    gap: spacing.s3,
  },
  errorBannerText: {
    ...type.caption,
  },
  list: {
    gap: spacing.s3,
  },
});
