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

import { LabInfoSheet } from '@/components/peta/LabInfoSheet';
import { LocationBanner } from '@/components/peta/LocationBanner';
import { PetaHeader } from '@/components/peta/PetaHeader';
import { PetaMap } from '@/components/peta/PetaMap';
import { hitungRegion } from '@/components/peta/region';
import { EmptyState, FilterChip } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import type { Lab } from '@/data/dummy';
import { colors, layout, spacing, type } from '@/theme/tokens';

export default function PetaScreen() {
  const { currentUser, loading, labs, error, retrySync } = useSession();
  const [labDipilih, setLabDipilih] = useState<Lab | null>(null);
  const [sheetTerbuka, setSheetTerbuka] = useState(false);
  const timerTutup = useRef<ReturnType<typeof setTimeout> | null>(null);

  const region = useMemo(() => hitungRegion(labs), [labs]);

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
          <View style={styles.emptyOverlay}>
            <EmptyState
              judul="Belum ada data laboratorium"
              pesan="Data lab belum tersedia. Periksa koneksi internet lalu coba lagi."
              aksi={{ label: 'Coba lagi', onPress: retrySync }}
              style={styles.emptyCard}
            />
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
    bottom: spacing.s5,
  },
  emptyCard: {
    paddingVertical: spacing.s4,
  },
});
