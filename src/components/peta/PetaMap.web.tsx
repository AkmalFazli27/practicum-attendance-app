import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Map as MapIcon, Navigation } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import { hitungJarak } from '@/utils/geo';
import { getLabMarkerStyle } from './labMarkerStyle';
import { labPunyaKoordinat } from './region';
import { teksPeta } from './teks';
import type { PetaMapProps } from './types';

/**
 * Fallback web: react-native-maps tidak mendukung web.
 * Daftar lab tetap dapat dipilih agar sheet aktivitas bisa diuji di browser.
 */
export function PetaMap({
  labs,
  labDipilih,
  onPilihLab,
  pengguna,
}: PetaMapProps) {
  const { themeColors, language } = usePreferences();
  const teks = teksPeta(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  return (
    <View style={styles.root}>
      <View style={styles.notice}>
        <MapIcon size={18} color={themeColors.textMuted} />
        <Text style={styles.noticeText}>{teks.petaWebNotice}</Text>
      </View>

      {pengguna ? (
        <View style={styles.lokasiRow}>
          <Navigation size={16} color={themeColors.textPrimary} />
          <Text style={styles.lokasiText}>
            {teks.posisiKamu(
              pengguna.lat.toFixed(5),
              pengguna.lng.toFixed(5),
              typeof pengguna.akurasi === 'number' && pengguna.akurasi > 0
                ? String(Math.round(pengguna.akurasi))
                : '',
            )}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {labs.map((lab, idx) => {
          const aktif = labDipilih?.id === lab.id;
          const { Icon, bg, fg } = getLabMarkerStyle(lab, idx);
          const jarak =
            pengguna && labPunyaKoordinat(lab)
              ? hitungJarak(pengguna, { lat: lab.lat, lng: lab.lng })
              : null;
          return (
            <Pressable
              key={lab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: aktif }}
              onPress={() => onPilihLab(lab)}
              style={({ pressed }) => [
                styles.row,
                aktif && styles.rowAktif,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={[styles.iconTile, { backgroundColor: bg }]}>
                <Icon size={18} color={fg} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.nama}>{lab.nama}</Text>
                <Text style={styles.alamat}>{lab.alamat}</Text>
                {jarak !== null ? (
                  <Text style={styles.jarak}>
                    {jarak < 1000
                      ? teks.jarakMeter(Math.round(jarak))
                      : teks.jarakKm((jarak / 1000).toFixed(1))}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: w.surfaceMuted,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
      margin: spacing.s4,
      padding: spacing.s3,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    noticeText: {
      ...type.caption,
      fontFamily: fontFamily.regular,
      color: w.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    lokasiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      marginHorizontal: spacing.s4,
      marginBottom: spacing.s3,
      padding: spacing.s3,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.primarySoft,
    },
    lokasiText: {
      ...type.caption,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
      flex: 1,
    },
    list: {
      paddingHorizontal: spacing.s4,
      paddingBottom: spacing.s8,
      gap: spacing.s2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
      padding: spacing.s3,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    rowAktif: {
      borderColor: w.graphite,
    },
    rowPressed: {
      backgroundColor: w.surfaceMuted,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: radius.button,
      backgroundColor: w.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    nama: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    alamat: {
      ...type.caption,
      color: w.textMuted,
    },
    jarak: {
      ...type.caption,
      color: w.textSecondary,
    },
  });
