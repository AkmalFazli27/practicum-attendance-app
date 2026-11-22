import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LocateFixed, MapIcon } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
import {
  fontFamily,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import { bacaAngka, teksKoordinat, teksTersinkron } from './validasiLab';
import type { LokasiPickerProps } from './types';

/**
 * Fallback web: react-native-maps tidak mendukung web, jadi titik diisi lewat
 * input angka. Perilaku validasi dan penyimpanan tetap sama dengan native.
 */
export function LokasiPicker({
  titik,
  radius,
  onTitikChange,
  disabled = false,
  radiusTeks,
  onRadiusTeksChange,
  onGunakanLokasi,
  bisaGunakanLokasi,
  sedangMembacaLokasi = false,
  pesanLokasi,
}: LokasiPickerProps) {
  // Input angka tidak boleh dikontrol langsung dari Number: mengetik "-7.0"
  // akan langsung dinormalisasi menjadi "-7" dan kursor melompat.
  const [latTeks, setLatTeks] = useState(teksKoordinat(titik?.lat));
  const [lngTeks, setLngTeks] = useState(teksKoordinat(titik?.lng));
  const { themeColors } = usePreferences();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  // Sinkronkan saat titik berubah dari luar input (pilih lab / lokasi saat ini).
  // `teksTersinkron` menjaga teks setengah jadi seperti "-" agar tidak dihapus.
  useEffect(() => {
    setLatTeks((lama) => teksTersinkron(lama, titik?.lat));
  }, [titik?.lat]);

  useEffect(() => {
    setLngTeks((lama) => teksTersinkron(lama, titik?.lng));
  }, [titik?.lng]);

  const ubahKoord = (kunci: 'lat' | 'lng', teks: string) => {
    if (kunci === 'lat') setLatTeks(teks);
    else setLngTeks(teks);

    // Nilai kosong atau belum sah dikirim sebagai NaN agar validasi menolak,
    // bukan diam-diam menjadi 0.
    const angka = bacaAngka(teks);
    onTitikChange({
      lat: kunci === 'lat' ? angka : (titik?.lat ?? Number.NaN),
      lng: kunci === 'lng' ? angka : (titik?.lng ?? Number.NaN),
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.notice}>
        <MapIcon size={18} color={themeColors.textMuted} />
        <Text style={styles.noticeText}>
          Peta interaktif hanya tersedia di aplikasi mobile. Isi titik lab
          dengan koordinat di bawah.
        </Text>
      </View>

      <View style={styles.koordRow}>
        <View style={styles.field}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput
            accessibilityLabel="Latitude laboratorium"
            value={latTeks}
            onChangeText={(teks) => ubahKoord('lat', teks)}
            keyboardType="numeric"
            inputMode="decimal"
            editable={!disabled}
            placeholder="-7.0490375"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.input, disabled && styles.inputNonaktif]}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput
            accessibilityLabel="Longitude laboratorium"
            value={lngTeks}
            onChangeText={(teks) => ubahKoord('lng', teks)}
            keyboardType="numeric"
            inputMode="decimal"
            editable={!disabled}
            placeholder="110.441484375"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.input, disabled && styles.inputNonaktif]}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Gunakan lokasi saat ini"
        accessibilityState={{
          disabled: disabled || !bisaGunakanLokasi || sedangMembacaLokasi,
        }}
        disabled={disabled || !bisaGunakanLokasi || sedangMembacaLokasi}
        onPress={onGunakanLokasi}
        style={({ pressed }) => [
          styles.tombolLokasi,
          (disabled || !bisaGunakanLokasi) && styles.tombolLokasiNonaktif,
          pressed && styles.tombolLokasiDitekan,
        ]}
      >
        {sedangMembacaLokasi ? (
          <ActivityIndicator size="small" color={themeColors.textPrimary} />
        ) : (
          <LocateFixed size={16} color={themeColors.textPrimary} />
        )}
        <Text style={styles.tombolLokasiTeks}>Gunakan lokasi saat ini</Text>
      </Pressable>

      {pesanLokasi ? (
        <Text style={styles.pesanLokasi}>{pesanLokasi}</Text>
      ) : null}

      <View style={styles.radiusRow}>
        <View style={styles.radiusCopy}>
          <Text style={styles.label}>Radius presensi</Text>
          <Text style={styles.bantuan}>
            Area yang dihitung sah saat praktikan presensi
            {radius > 0 ? ` (${Math.round(radius)} m)` : ''}.
          </Text>
        </View>
        <View style={styles.radiusInputWrap}>
          <TextInput
            accessibilityLabel="Radius presensi dalam meter"
            value={radiusTeks}
            onChangeText={onRadiusTeksChange}
            keyboardType="numeric"
            inputMode="decimal"
            editable={!disabled}
            placeholder="0"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.radiusInput, disabled && styles.inputNonaktif]}
            returnKeyType="done"
          />
          <Text style={styles.radiusSatuan}>m</Text>
        </View>
      </View>
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      gap: spacing.s3,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
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
    koordRow: {
      flexDirection: 'row',
      gap: spacing.s3,
    },
    field: {
      flex: 1,
      gap: spacing.s1,
    },
    label: {
      ...type.bodyStrong,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    input: {
      ...type.body,
      color: w.textPrimary,
      height: 44,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.borderDashed,
      backgroundColor: w.surface,
    },
    inputNonaktif: {
      color: w.disabledText,
      backgroundColor: w.disabledBg,
    },
    tombolLokasi: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s2,
      paddingHorizontal: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    tombolLokasiDitekan: {
      backgroundColor: w.surfaceMuted,
    },
    tombolLokasiNonaktif: {
      backgroundColor: w.disabledBg,
    },
    tombolLokasiTeks: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    pesanLokasi: {
      ...type.caption,
      color: w.textMuted,
      lineHeight: 18,
    },
    radiusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
      padding: spacing.s3,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    radiusCopy: {
      flex: 1,
      gap: 2,
    },
    bantuan: {
      ...type.caption,
      color: w.textMuted,
      lineHeight: 17,
    },
    radiusInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s1,
      paddingHorizontal: spacing.s3,
      height: 44,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.borderDashed,
      backgroundColor: w.background,
    },
    radiusInput: {
      ...type.bodyStrong,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
      minWidth: 48,
      textAlign: 'right',
      paddingVertical: 0,
    },
    radiusSatuan: {
      ...type.caption,
      color: w.textMuted,
    },
  });
