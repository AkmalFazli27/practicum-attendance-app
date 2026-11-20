import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Map as MapIcon, MapPin } from 'lucide-react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import type { PetaMapProps } from './types';

/**
 * Fallback web: react-native-maps tidak mendukung web.
 * Daftar lab tetap dapat dipilih agar sheet aktivitas bisa diuji di browser.
 */
export function PetaMap({
  labs,
  labDipilih,
  onPilihLab,
}: PetaMapProps) {
  return (
    <View style={styles.root}>
      <View style={styles.notice}>
        <MapIcon size={18} color={colors.textMuted} />
        <Text style={styles.noticeText}>
          Peta interaktif tersedia di aplikasi mobile. Pilih lab dari daftar
          berikut.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {labs.map((lab) => {
          const aktif = labDipilih?.id === lab.id;
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
              <View style={styles.iconTile}>
                <MapPin size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.nama}>{lab.nama}</Text>
                <Text style={styles.alamat}>{lab.alamat}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s2,
    margin: spacing.s4,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeText: {
    ...type.caption,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowAktif: {
    borderColor: colors.graphite,
  },
  rowPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.button,
    backgroundColor: colors.primarySoft,
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
    color: colors.textPrimary,
  },
  alamat: {
    ...type.caption,
    color: colors.textMuted,
  },
});
