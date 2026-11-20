import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Circle, Marker, type MapPressEvent } from 'react-native-maps';
import { LocateFixed, MapPin } from 'lucide-react-native';

import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import type { LokasiPickerProps } from './types';

/** Region awal hanya dipakai sekali; peta tidak boleh melompat saat data berubah. */
const DELTA_AWAL = 0.004;
const UKURAN_TITIK = 22;

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
  labId = null,
}: LokasiPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [siap, setSiap] = useState(false);
  const sudahDiposisikan = useRef(false);

  const regionAwal = {
    latitude: titik?.lat ?? -7.0486,
    longitude: titik?.lng ?? 110.4411,
    latitudeDelta: DELTA_AWAL,
    longitudeDelta: DELTA_AWAL,
  };

  // Saat asisten memilih lab lain, peta harus mengarah ke titik lab itu.
  // `sudahDiposisikan` hanya mencegah recenter akibat perubahan kecil pada lab
  // yang sama (mis. drag marker).
  const labIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siap || !titik) return;
    const bergantiLab = labIdRef.current !== labId;
    const pertamaKali = !sudahDiposisikan.current;
    if (!pertamaKali && !bergantiLab) return;
    sudahDiposisikan.current = true;
    labIdRef.current = labId;
    mapRef.current?.animateToRegion(
      {
        latitude: titik.lat,
        longitude: titik.lng,
        latitudeDelta: DELTA_AWAL,
        longitudeDelta: DELTA_AWAL,
      },
      400,
    );
  }, [siap, titik, labId]);

  const tanganiTekan = (e: MapPressEvent) => {
    if (disabled) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    onTitikChange({ lat: latitude, lng: longitude });
  };

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={regionAwal}
          onMapReady={() => setSiap(true)}
          onPress={tanganiTekan}
          toolbarEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          showsCompass
          accessibilityLabel="Peta pengaturan lokasi laboratorium"
        >
          {titik ? (
            <>
              <Circle
                center={{ latitude: titik.lat, longitude: titik.lng }}
                radius={Number.isFinite(radius) && radius > 0 ? radius : 0}
                strokeColor={colors.primaryPressed}
                strokeWidth={2}
                fillColor={colors.primarySoft}
              />
              <Marker
                coordinate={{ latitude: titik.lat, longitude: titik.lng }}
                draggable={!disabled}
                onDragEnd={(e) => {
                  if (disabled) return;
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  onTitikChange({ lat: latitude, lng: longitude });
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                accessibilityLabel="Titik laboratorium"
              >
                <View style={styles.titik}>
                  <MapPin size={14} color={colors.onPrimary} />
                </View>
              </Marker>
            </>
          ) : null}
        </MapView>

        {disabled ? <View style={styles.tirai} /> : null}
      </View>

      <View style={styles.aksiRow}>
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
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <LocateFixed size={16} color={colors.textPrimary} />
          )}
          <Text style={styles.tombolLokasiTeks}>Gunakan lokasi saat ini</Text>
        </Pressable>
      </View>

      {pesanLokasi ? (
        <Text style={styles.pesanLokasi}>{pesanLokasi}</Text>
      ) : null}

      <View style={styles.radiusRow}>
        <View style={styles.radiusCopy}>
          <Text style={styles.label}>Radius presensi</Text>
          <Text style={styles.bantuan}>
            Area yang dihitung sah saat praktikan presensi.
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
            placeholderTextColor={colors.textMuted}
            style={[styles.radiusInput, disabled && styles.radiusInputNonaktif]}
            returnKeyType="done"
          />
          <Text style={styles.radiusSatuan}>m</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.s3,
  },
  mapWrap: {
    height: 260,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  map: {
    flex: 1,
  },
  tirai: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surfaceMuted,
    opacity: 0.45,
  },
  titik: {
    width: UKURAN_TITIK,
    height: UKURAN_TITIK,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.onPrimary,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aksiRow: {
    flexDirection: 'row',
  },
  tombolLokasi: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tombolLokasiDitekan: {
    backgroundColor: colors.surfaceMuted,
  },
  tombolLokasiNonaktif: {
    backgroundColor: colors.disabledBg,
  },
  tombolLokasiTeks: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  pesanLokasi: {
    ...type.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  radiusCopy: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...type.bodyStrong,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  bantuan: {
    ...type.caption,
    color: colors.textMuted,
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
    borderColor: colors.borderDashed,
    backgroundColor: colors.background,
  },
  radiusInput: {
    ...type.bodyStrong,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    minWidth: 48,
    textAlign: 'right',
    paddingVertical: 0,
  },
  radiusInputNonaktif: {
    color: colors.disabledText,
  },
  radiusSatuan: {
    ...type.caption,
    color: colors.textMuted,
  },
});
