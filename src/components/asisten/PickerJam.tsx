import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
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
  minJam?: number;
  maxJam?: number;
  disabled?: boolean;
}

function Kolom({
  nama,
  nilai,
  min = 0,
  maks,
  langkah,
  onUbah,
}: {
  nama: string;
  nilai: number;
  min?: number;
  maks: number;
  langkah: number;
  onUbah: (n: number) => void;
}) {
  const { themeColors } = usePreferences();
  const [teks, setTeks] = useState(pad(nilai));
  const [fokus, setFokus] = useState(false);

  useEffect(() => {
    if (!fokus) setTeks(pad(nilai));
  }, [nilai, fokus]);

  const jepit = (n: number) => Math.min(maks, Math.max(min, n));

  const komit = (t: string) => {
    const n = Number(t.replace(/\D/g, ''));
    onUbah(Number.isNaN(n) ? nilai : jepit(n));
  };

  const tambah = () => {
    if (maks <= min) return onUbah(min);
    const berikut = nilai + langkah;
    onUbah(berikut > maks ? min : berikut);
  };

  const kurang = () => {
    if (maks <= min) return onUbah(min);
    const sebelum = nilai - langkah;
    onUbah(sebelum < min ? maks : sebelum);
  };

  return (
    <View style={styles.kolom}>
      <Pressable
        accessibilityLabel={`${nama} tambah`}
        onPress={tambah}
        style={[styles.btn, { backgroundColor: themeColors.surfaceMuted }]}
      >
        <Text style={[styles.btnText, { color: themeColors.textPrimary }]}>
          +
        </Text>
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
          const hasil = Number.isNaN(Number(teks)) ? nilai : jepit(Number(teks));
          komit(teks);
          setTeks(pad(hasil));
        }}
        style={[styles.angka, { color: themeColors.textPrimary }]}
      />
      <Pressable
        accessibilityLabel={`${nama} kurang`}
        onPress={kurang}
        style={[styles.btn, { backgroundColor: themeColors.surfaceMuted }]}
      >
        <Text style={[styles.btnText, { color: themeColors.textPrimary }]}>
          −
        </Text>
      </Pressable>
    </View>
  );
}

export function PickerJam({
  label,
  value,
  onChange,
  minJam = 7,
  maxJam = 20,
  disabled = false,
}: PickerJamProps) {
  const { themeColors } = usePreferences();
  const { j, m } = parse(value);
  const jamTerkunci = Math.min(maxJam, Math.max(minJam, j));
  const menitMaks = jamTerkunci >= maxJam ? 0 : 59;
  const menitTerkunci = Math.min(menitMaks, m);

  const set = (jj: number, mm: number) => {
    const jValid = Math.min(maxJam, Math.max(minJam, jj));
    const mValid = jValid >= maxJam ? 0 : Math.min(59, Math.max(0, mm));
    onChange(`${pad(jValid)}:${pad(mValid)}`);
  };

  return (
    <View style={styles.group} pointerEvents={disabled ? 'none' : 'auto'}>
      <Text style={[styles.label, { color: themeColors.textPrimary }]}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          {
            borderColor: themeColors.border,
            backgroundColor: themeColors.surface,
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        <View style={styles.atas}>
          <Kolom
            nama={`${label} jam`}
            nilai={jamTerkunci}
            min={minJam}
            maks={maxJam}
            langkah={1}
            onUbah={(n) => set(n, menitTerkunci)}
          />
          <Text style={[styles.titikDua, { color: themeColors.textPrimary }]}>
            :
          </Text>
          <Kolom
            nama={`${label} menit`}
            nilai={menitTerkunci}
            min={0}
            maks={menitMaks}
            langkah={5}
            onUbah={(n) => set(jamTerkunci, n)}
          />
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