import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabInfoSheet } from '@/components/peta/LabInfoSheet';
import { PetaHeader } from '@/components/peta/PetaHeader';
import { PetaMap } from '@/components/peta/PetaMap';
import {
  bannerLokasiDari,
  bannerPrioritas,
  handlerBanner,
} from '@/components/peta/bannerLokasi';
import {
  hitungRegion,
  lokasiPunyaKoordinat,
  statusTungguLabs,
} from '@/components/peta/region';
import { EmptyState, FilterChip, PermissionBanner } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { usePreferences } from '@/context/PreferencesContext';
import type { Lab } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import { layout, radius, spacing, type, type ThemeColors } from '@/theme/tokens';

const JEDA_TUNGGU_LABS_MS = 4000;
/** Durasi animasi tutup sheet; data lab baru dikosongkan setelahnya. */
const JEDA_TUTUP_SHEET_MS = 280;

/**
 * Guard dipecah dari isi layar supaya `useLocation()` hanya berjalan setelah
 * pengguna terautentikasi. Kalau tidak, deep link saat logged-out sempat
 * memunculkan dialog izin lokasi sebelum redirect.
 */
export default function PetaScreen() {
  const { currentUser, loading } = useSession();
  const { themeColors } = usePreferences();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  if (loading) {
    return (
      <View style={styles.root}>
        <PetaHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.graphite} />
          <Text style={styles.centerText}>Memuat peta laboratorium…</Text>
        </View>
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/" />;
  }

  return <PetaContent />;
}

function PetaContent() {
  const { labs, error, retrySync } = useSession();
  const { themeColors } = usePreferences();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const { status: statusLokasi, koordinat, pesanError, mintaIzin, coba } =
    useLocation();
  const insets = useSafeAreaInsets();
  const [labIdDipilih, setLabIdDipilih] = useState<string | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [jedaLabsHabis, setJedaLabsHabis] = useState(false);
  const timerTutup = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simpan id, bukan objek: listener labs bisa memperbarui nama/radius saat
  // sheet terbuka dan objek lama akan menampilkan data basi.
  const labDipilih = useMemo(
    () => labs.find((lab) => lab.id === labIdDipilih) ?? null,
    [labs, labIdDipilih],
  );

  // Lokasi pengguna hanya dipakai bila benar-benar valid, sehingga marker lab
  // tetap tampil normal saat izin ditolak atau GPS mati.
  const pengguna = lokasiPunyaKoordinat(koordinat) ? koordinat : null;

  const region = useMemo(() => hitungRegion(labs, pengguna), [labs, pengguna]);

  const bannerLokasi = bannerLokasiDari(statusLokasi, pesanError);
  const banner = bannerPrioritas(error, bannerLokasi);

  // `loading` hanya mencakup auth + koleksi sesi. Koleksi labs punya listener
  // sendiri, jadi beri jeda singkat sebelum menyimpulkan bahwa datanya kosong.
  useEffect(() => {
    if (labs.length > 0 || error) return;
    const id = setTimeout(() => setJedaLabsHabis(true), JEDA_TUNGGU_LABS_MS);
    return () => clearTimeout(id);
  }, [labs.length, error]);

  const menungguLabs =
    statusTungguLabs(false, labs.length, error, jedaLabsHabis) === 'menunggu';

  useEffect(
    () => () => {
      if (timerTutup.current) clearTimeout(timerTutup.current);
    },
    [],
  );

  const bukaLab = useCallback((lab: Lab) => {
    if (timerTutup.current) {
      clearTimeout(timerTutup.current);
      timerTutup.current = null;
    }
    setLabIdDipilih(lab.id);
    setSheetTerbuka(true);
  }, []);

  const tutupSheet = useCallback(() => {
    if (timerTutup.current !== null) {
      clearTimeout(timerTutup.current);
      timerTutup.current = null;
    }
    setSheetTerbuka(false);
    timerTutup.current = setTimeout(() => {
      setLabIdDipilih(null);
      timerTutup.current = null;
    }, JEDA_TUTUP_SHEET_MS);
  }, []);

  return (
    <View style={styles.root}>
      <PetaHeader onRefresh={retrySync} />

      {labs.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {labs.map((lab) => (
            <FilterChip
              key={lab.id}
              label={lab.nama}
              aktif={labDipilih?.id === lab.id}
              onPress={() => bukaLab(lab)}
            />
          ))}
        </ScrollView>
      ) : null}

      {banner ? (
        <View style={styles.bannerWrap}>
          <PermissionBanner
            jenis={banner.jenis}
            pesan={banner.pesan}
            onAksi={handlerBanner(banner, { mintaIzin, coba, retrySync })}
          />
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <PetaMap
          labs={labs}
          labDipilih={labDipilih}
          onPilihLab={bukaLab}
          region={region}
          pengguna={pengguna}
        />

        {labs.length === 0 ? (
          <View
            style={[
              styles.emptyOverlay,
              { bottom: Math.max(insets.bottom, spacing.s5) },
            ]}
          >
            {menungguLabs ? (
              <View style={styles.menungguCard}>
                <ActivityIndicator size="small" color={themeColors.graphite} />
                <Text style={styles.centerText}>
                  Memuat data laboratorium…
                </Text>
              </View>
            ) : (
              <EmptyState
                judul="Belum ada data laboratorium"
                pesan={
                  error
                    ? 'Data lab belum bisa dimuat. Periksa koneksi internet lalu coba lagi.'
                    : 'Data lab belum tersedia. Hubungi asisten praktikum atau coba lagi nanti.'
                }
                aksi={{ label: 'Coba lagi', onPress: retrySync }}
                style={styles.emptyCard}
              />
            )}
          </View>
        ) : null}
      </View>

      <LabInfoSheet
        lab={labDipilih}
        visible={sheetTerbuka}
        onClose={tutupSheet}
      />
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: w.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s3,
      padding: spacing.s5,
    },
    centerText: {
      ...type.caption,
      color: w.textMuted,
      textAlign: 'center',
    },
    chipScroll: {
      flexGrow: 0,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    chipRow: {
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.s3,
      gap: spacing.s2,
    },
    bannerWrap: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s3,
    },
    mapWrap: {
      flex: 1,
      marginTop: spacing.s3,
      overflow: 'hidden',
    },
    emptyOverlay: {
      position: 'absolute',
      left: layout.screenPadding,
      right: layout.screenPadding,
    },
    menungguCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s2,
      padding: spacing.s4,
      borderRadius: radius.cardLg,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    emptyCard: {
      paddingVertical: spacing.s4,
    },
  });
