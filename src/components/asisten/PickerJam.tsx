import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

const pad = (n: number) => String(n).padStart(2, '0');

function parse(v: string): { j: number; m: number } {
  const x = /^(\d{2}):(\d{2})$/.exec(v);
  if (!x) return { j: 8, m: 0 };
  return { j: Math.min(23, Number(x[1])), m: Math.min(59, Number(x[2])) };
}

export interface PickerJamProps {
  label: string;
  value: string; // HH:mm
  onChange: (jam: string) => void;
  disabled?: boolean;
}

function Kolom({
  nama,
  nilai,
  maks,
  langkah,
  onUbah,
}: {
  nama: string;
  nilai: number;
  maks: number; // 23 atau 59
  langkah: number;
  onUbah: (n: number) => void;
}) {
  const [teks, setTeks] = useState(pad(nilai));
  const [fokus, setFokus] = useState(false);

  useEffect(() => {
    if (!fokus) setTeks(pad(nilai));
  }, [nilai, fokus]);

  const total = maks + 1;
  const komit = (t: string) => {
    const n = Number(t.replace(/\D/g, ''));
    onUbah(Number.isNaN(n) ? nilai : Math.min(maks, n));
  };

  return (
    <View style={styles.kolom}>
      <Pressable
        accessibilityLabel={`${nama} tambah`}
        onPress={() => onUbah((nilai + langkah) % total)}
        style={styles.btn}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={nama}
        value={teks}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        onFocus={() => setFokus(true)}
        onChangeText={(t) => {
          const bersih = t.replace(/\D/g, '');
          setTeks(bersih);
          if (bersih.length === 2) komit(bersih);
        }}
        onBlur={() => {
          setFokus(false);
          komit(teks);
          setTeks(pad(Math.min(maks, Number(teks) || 0)));
        }}
        style={styles.angka}
      />
      <Pressable
        accessibilityLabel={`${nama} kurang`}
        onPress={() => onUbah((nilai - langkah + total) % total)}
        style={styles.btn}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
    </View>
  );
}

export function PickerJam({ label, value, onChange, disabled = false }: PickerJamProps) {
  const { j, m } = parse(value);
  const set = (jj: number, mm: number) => onChange(`${pad(jj)}:${pad(mm)}`);

  return (
    <View style={styles.group} pointerEvents={disabled ? 'none' : 'auto'}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, disabled && { opacity: 0.5 }]}>
        <View style={styles.atas}>
          <Kolom nama={`${label} jam`} nilai={j} maks={23} langkah={1} onUbah={(n) => set(n, m)} />
          <Text style={styles.titikDua}>:</Text>
          <Kolom nama={`${label} menit`} nilai={m} maks={59} langkah={5} onUbah={(n) => set(j, n)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6, flex: 1 },
  label: { ...type.caption, fontFamily: fontFamily.bold, color: colors.textPrimary },
  box: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s2,
  },
  atas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s1 },
  kolom: { alignItems: 'center', gap: 2 },
  btn: {
    width: 44,
    height: 34,
    borderRadius: radius.button,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 20, lineHeight: 22, color: colors.textPrimary, fontFamily: fontFamily.bold },
  angka: {
    ...type.h3,
    color: colors.textPrimary,
    width: 52,
    height: 40,
    textAlign: 'center',
    padding: 0,
    borderRadius: radius.button,
  },
  titikDua: { ...type.h3, color: colors.textPrimary, paddingBottom: 2 },
});
