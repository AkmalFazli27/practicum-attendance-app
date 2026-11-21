import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const pad = (n: number) => String(n).padStart(2, '0');
const keStr = (t: number, b: number, h: number) => `${t}-${pad(b + 1)}-${pad(h)}`;

function parse(v: string): { t: number; b: number; h: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return { t: Number(m[1]), b: Number(m[2]) - 1, h: Number(m[3]) };
}

function hariIni(): string {
  const d = new Date();
  return keStr(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface PickerTanggalProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (tanggal: string) => void;
  /** Tanggal paling awal yang boleh dipilih (YYYY-MM-DD). Default: hari ini. */
  minTanggal?: string;
  disabled?: boolean;
}

export function PickerTanggal({
  label,
  value,
  onChange,
  minTanggal,
  disabled = false,
}: PickerTanggalProps) {
  const [terbuka, setTerbuka] = useState(false);
  const awal = parse(value) ?? parse(hariIni())!;
  const [tahun, setTahun] = useState(awal.t);
  const [bulan, setBulan] = useState(awal.b);

  useEffect(() => {
    const p = parse(value);
    if (p) {
      setTahun(p.t);
      setBulan(p.b);
    }
  }, [value]);

  const batas = minTanggal ?? hariIni();

  const sel = useMemo(() => {
    const kosong = new Date(tahun, bulan, 1).getDay();
    const jumlah = new Date(tahun, bulan + 1, 0).getDate();
    const out: (number | null)[] = Array(kosong).fill(null);
    for (let i = 1; i <= jumlah; i++) out.push(i);
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [tahun, bulan]);

  const geser = (arah: -1 | 1) => {
    const d = new Date(tahun, bulan + arah, 1);
    setTahun(d.getFullYear());
    setBulan(d.getMonth());
  };

  const bulanSebelumnyaBoleh =
    keStr(tahun, bulan, 1) > batas.slice(0, 8) + '01';

  const tampil = (() => {
    const p = parse(value);
    return p ? `${p.h} ${NAMA_BULAN[p.b]} ${p.t}` : 'Pilih tanggal';
  })();

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${tampil}`}
        disabled={disabled}
        onPress={() => setTerbuka((v) => !v)}
        style={[styles.field, terbuka && styles.fieldAktif]}
      >
        <Text style={styles.fieldText}>{tampil}</Text>
      </Pressable>

      {terbuka && (
        <View style={styles.panel}>
          <View style={styles.nav}>
            <Pressable
              accessibilityLabel="Bulan sebelumnya"
              disabled={!bulanSebelumnyaBoleh}
              onPress={() => geser(-1)}
              style={styles.navBtn}
            >
              <Text style={[styles.navText, !bulanSebelumnyaBoleh && styles.off]}>‹</Text>
            </Pressable>
            <Text style={styles.bulan}>
              {NAMA_BULAN[bulan]} {tahun}
            </Text>
            <Pressable
              accessibilityLabel="Bulan berikutnya"
              onPress={() => geser(1)}
              style={styles.navBtn}
            >
              <Text style={styles.navText}>›</Text>
            </Pressable>
          </View>

          <View style={styles.baris}>
            {HARI.map((h) => (
              <Text key={h} style={styles.hariHead}>
                {h}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {sel.map((h, i) => {
              if (h === null) return <View key={`k${i}`} style={styles.sel} />;
              const str = keStr(tahun, bulan, h);
              const mati = str < batas;
              const aktif = str === value;
              return (
                <Pressable
                  key={str}
                  disabled={mati}
                  accessibilityRole="button"
                  accessibilityState={{ selected: aktif, disabled: mati }}
                  onPress={() => {
                    onChange(str);
                    setTerbuka(false);
                  }}
                  style={styles.sel}
                >
                  <View style={[styles.hari, aktif && styles.hariAktif]}>
                    <Text
                      style={[
                        styles.hariText,
                        mati && styles.off,
                        aktif && styles.hariTextAktif,
                      ]}
                    >
                      {h}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { ...type.caption, fontFamily: fontFamily.bold, color: colors.textPrimary },
  field: {
    height: 48,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s3 + 2,
    justifyContent: 'center',
  },
  fieldAktif: { borderColor: colors.primaryPressed },
  fieldText: { ...type.bodyStrong, color: colors.textPrimary },
  panel: {
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.s3,
    gap: spacing.s2,
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 24, color: colors.textPrimary, fontFamily: fontFamily.bold },
  bulan: { ...type.bodyStrong, color: colors.textPrimary },
  baris: { flexDirection: 'row' },
  hariHead: {
    flex: 1,
    textAlign: 'center',
    ...type.micro,
    color: colors.textMuted,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sel: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  hari: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hariAktif: { backgroundColor: colors.primary },
  hariText: { ...type.caption, color: colors.textPrimary },
  hariTextAktif: { fontFamily: fontFamily.bold, color: colors.onPrimary },
  off: { color: colors.disabledText, opacity: 0.45 },
});
