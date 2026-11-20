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
import { LocationBanner } from '@/components/peta/LocationBanner';
import { PetaHeader } from '@/components/peta/PetaHeader';
import { PetaMap } from '@/components/peta/PetaMap';
import { hitungRegion } from '@/components/peta/region';
import { EmptyState, FilterChip } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import type { Lab } from '@/data/dummy';
import { colors, layout, radius, spacing, type } from '@/theme/tokens';

const JEDA_TUNGGU_LABS_MS = 4000;

export default function PetaScreen() {
  const { currentUser, loading, labs, error, retrySync } = useSession();
  const insets = useSafeAreaInsets();
  const [labDipilih, setLabDipilih] = useState<Lab | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const [menungguLabs, setMenungguLabs] = useState(true);
  const timerTutup = useRef<ReturnType<typeof setTimeout> | null>(null);

  const region = useMemo(() => hitungRegion(labs), [labs]);

  // `loading` hanya mencakup auth + koleksi sesi. Koleksi labs punya listener
  // sendiri, jadi beri jeda singkat sebelum menyimpulkan bahwa datanya kosong.
  useEffect(() => {
    if (loading) {
      setMenungguLabs(true);
      return;
    }
    if (labs.length > 0 || error) {
      setMenungguLabs(false);
      return;
    }
    setMenungguLabs(true);
    const id = setTimeout(() => setMenungguLabs(false), JEDA_TUNGGU_LABS_MS);
    return () => clearTimeout(id);
  }, [loading, labs.length, error]);

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
    setLabDipilih(lab);
    setSheetTerbuka(true);
  }, []);

  const tutupSheet = useCallback(() => {
    if (timerTutup.current !== null) {
      clearTimeout(timerTutup.current);
      timerTutup.current = null;
    }
    setSheetTerbuka(false);
    timerTutup.current = setTimeout(() => {
      setLabDipilih(null);
      timerTutup.current = null;
    }, 280);
  }, []);

  if (loading) {
    return (
      <View style={styles.root}>
        <PetaHeader />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.graphite} />
          <Text style={styles.centerText}>Memuat peta laboratorium…</Text>
        </View>
      </View>
    );
  }

  if (!currentUser) {
    return <Redirect href="/" />;
  }

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

      {error ? (
        <View style={styles.bannerWrap}>
          <LocationBanner
            jenis="jaringan"
            pesan={error}
            onRetry={retrySync}
          />
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <PetaMap
          labs={labs}
          labDipilih={labDipilih}
          onPilihLab={bukaLab}
          region={region}
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
                <ActivityIndicator size="small" color={colors.graphite} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textMuted,
    textAlign: 'center',
  },
  chipScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyCard: {
    paddingVertical: spacing.s4,
  },
});
