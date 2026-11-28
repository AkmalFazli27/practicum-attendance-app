import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/context/PreferencesContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';

const MONTH_KEYS = [
  'm0', 'm1', 'm2', 'm3', 'm4', 'm5',
  'm6', 'm7', 'm8', 'm9', 'm10', 'm11',
] as const;
const DAY_KEYS = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6'] as const;

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
  const { t } = useTranslation();
  const { themeColors } = usePreferences();
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

  const namaBulan = (idx: number) => t(`asprak.months.${MONTH_KEYS[idx]}`);

  const tampil = (() => {
    const p = parse(value);
    return p
      ? `${p.h} ${namaBulan(p.b)} ${p.t}`
      : t('asprak.dateSelectPlaceholder');
  })();

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: themeColors.textPrimary }]}>
        {label}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${tampil}`}
        disabled={disabled}
        onPress={() => setTerbuka((v) => !v)}
        style={[
          styles.field,
          {
            borderColor: terbuka
              ? themeColors.primaryPressed
              : themeColors.border,
            backgroundColor: themeColors.surface,
          },
        ]}
      >
        <Text style={[styles.fieldText, { color: themeColors.textPrimary }]}>
          {tampil}
        </Text>
      </Pressable>

      {terbuka && (
        <View
          style={[
            styles.panel,
            {
              borderColor: themeColors.border,
              backgroundColor: themeColors.surface,
            },
          ]}
        >
          <View style={styles.nav}>
            <Pressable
              accessibilityLabel={t('asprak.datePrevMonthAria')}
              disabled={!bulanSebelumnyaBoleh}
              onPress={() => geser(-1)}
              style={[
                styles.navBtn,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text
                style={[
                  styles.navText,
                  { color: themeColors.textPrimary },
                  !bulanSebelumnyaBoleh && styles.off,
                ]}
              >
                ‹
              </Text>
            </Pressable>
            <Text style={[styles.bulan, { color: themeColors.textPrimary }]}>
              {namaBulan(bulan)} {tahun}
            </Text>
            <Pressable
              accessibilityLabel={t('asprak.dateNextMonthAria')}
              onPress={() => geser(1)}
              style={[
                styles.navBtn,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text style={[styles.navText, { color: themeColors.textPrimary }]}>
                ›
              </Text>
            </Pressable>
          </View>

          <View style={styles.baris}>
            {DAY_KEYS.map((k) => (
              <Text
                key={k}
                style={[styles.hariHead, { color: themeColors.textMuted }]}
              >
                {t(`asprak.weekdaysShort.${k}`)}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: sel.length / 7 }, (_, w) => (
              <View key={`w${w}`} style={styles.minggu}>
                {sel.slice(w * 7, w * 7 + 7).map((h, j) => {
                  if (h === null) {
                    return <View key={`k${w}-${j}`} style={styles.sel} />;
                  }
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
                      <View
                        style={[
                          styles.hari,
                          aktif && { backgroundColor: themeColors.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.hariText,
                            { color: themeColors.textPrimary },
                            mati && styles.off,
                            aktif && {
                              color: themeColors.onPrimary,
                              fontFamily: fontFamily.bold,
                            },
                          ]}
                        >
                          {h}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
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
  grid: {},
  minggu: { flexDirection: 'row' },
  sel: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
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
