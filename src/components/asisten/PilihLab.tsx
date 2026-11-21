import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Lab } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

export interface PilihLabProps {
  labs: Lab[];
  /** id lab yang dipilih; kosong bila belum memilih. */
  value: string;
  onChange: (lab: Lab) => void;
  disabled?: boolean;
}

export function PilihLab({ labs, value, onChange, disabled = false }: PilihLabProps) {
  const [terbuka, setTerbuka] = useState(false);
  const terpilih = labs.find((l) => l.id === value);

  return (
    <View style={styles.group}>
      <Text style={styles.label}>Laboratorium</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Laboratorium: ${terpilih?.nama ?? 'belum dipilih'}`}
        disabled={disabled}
        onPress={() => setTerbuka((v) => !v)}
        style={[styles.field, terbuka && styles.fieldAktif]}
      >
        <Text
          numberOfLines={1}
          style={[styles.fieldText, !terpilih && { color: colors.textMuted }]}
        >
          {terpilih?.nama ?? 'Pilih laboratorium'}
        </Text>
        <Text style={styles.caret}>{terbuka ? '▴' : '▾'}</Text>
      </Pressable>

      {terbuka && (
        <View style={styles.panel}>
          {labs.length === 0 ? (
            <Text style={styles.kosong}>Data laboratorium belum tersedia.</Text>
          ) : (
            labs.map((l, i) => {
              const aktif = l.id === value;
              return (
                <Pressable
                  key={l.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aktif }}
                  onPress={() => {
                    onChange(l);
                    setTerbuka(false);
                  }}
                  style={[styles.item, i > 0 && styles.itemGaris, aktif && styles.itemAktif]}
                >
                  <Text style={[styles.itemNama, aktif && styles.itemNamaAktif]}>{l.nama}</Text>
                  {!!l.alamat && (
                    <Text numberOfLines={1} style={styles.itemAlamat}>
                      {l.alamat}
                    </Text>
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6, flex: 1 },
  label: { ...type.caption, fontFamily: fontFamily.bold, color: colors.textPrimary },
  field: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s3 + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  fieldAktif: { borderColor: colors.primaryPressed },
  fieldText: { ...type.bodyStrong, color: colors.textPrimary, flex: 1 },
  caret: { color: colors.textMuted, fontSize: 12 },
  panel: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  item: { paddingHorizontal: spacing.s3 + 2, paddingVertical: spacing.s3, gap: 2 },
  itemGaris: { borderTopWidth: 1, borderTopColor: colors.border },
  itemAktif: { backgroundColor: colors.primarySoft },
  itemNama: { ...type.bodyStrong, color: colors.textPrimary },
  itemNamaAktif: { fontFamily: fontFamily.bold },
  itemAlamat: { ...type.micro, color: colors.textMuted },
  kosong: { ...type.caption, color: colors.textMuted, padding: spacing.s3 },
});
