import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { usePreferences } from '@/context/PreferencesContext';
import { radius, shadows, type ThemeColors } from '@/theme/tokens';
import { getLabMarkerStyle } from './labMarkerStyle';
import { labPunyaKoordinat } from './region';
import type { PetaMapProps } from './types';

export function PetaMap({
  labs,
  labDipilih,
  onPilihLab,
  region,
  pengguna,
}: PetaMapProps) {
  const mapRef = useRef<MapView>(null);
  const [siap, setSiap] = useState(false);
  const sudahDiposisikan = useRef(false);
  const { isDark, themeColors } = usePreferences();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const labTampil = labs.filter(labPunyaKoordinat);

  useEffect(() => {
    if (!siap || sudahDiposisikan.current || labTampil.length === 0) return;
    sudahDiposisikan.current = true;
    mapRef.current?.animateToRegion(region, 450);
  }, [
    siap,
    labTampil.length,
    region.latitude,
    region.longitude,
    region.latitudeDelta,
    region.longitudeDelta,
  ]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      onMapReady={() => setSiap(true)}
      toolbarEnabled={false}
      pitchEnabled={false}
      showsMyLocationButton={false}
      showsCompass
      userInterfaceStyle={isDark ? 'dark' : 'light'}
      accessibilityLabel="Peta laboratorium"
    >
      {labTampil.map((lab, idx) => {
        const dipilih = labDipilih?.id === lab.id;
        const { Icon, bg, fg } = getLabMarkerStyle(lab, idx);
        return (
          <Marker
            key={lab.id}
            coordinate={{ latitude: lab.lat, longitude: lab.lng }}
            title={lab.nama}
            description={lab.alamat}
            anchor={{ x: 0.5, y: 1 }}
            zIndex={dipilih ? 2 : 1}
            tracksViewChanges={dipilih}
            onPress={() => onPilihLab(lab)}
          >
            <View style={styles.markerWrap}>
              <View
                style={[
                  styles.markerBubble,
                  {
                    backgroundColor: bg,
                    borderColor: dipilih
                      ? themeColors.primary
                      : themeColors.surface,
                    transform: [{ scale: dipilih ? 1.12 : 1 }],
                  },
                ]}
              >
                <Icon size={18} strokeWidth={2.3} color={fg} />
              </View>
              <View
                style={[
                  styles.markerPointer,
                  { borderTopColor: dipilih ? themeColors.primary : bg },
                ]}
              />
            </View>
          </Marker>
        );
      })}

      {pengguna ? (
        <>
          {typeof pengguna.akurasi === 'number' && pengguna.akurasi > 0 ? (
            <Circle
              center={{ latitude: pengguna.lat, longitude: pengguna.lng }}
              radius={pengguna.akurasi}
              strokeColor={themeColors.primaryPressed}
              strokeWidth={1}
              fillColor={themeColors.primarySoft}
            />
          ) : null}
          <Marker
            coordinate={{ latitude: pengguna.lat, longitude: pengguna.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            accessibilityLabel="Posisi kamu"
            zIndex={2}
          >
            <View style={styles.titikPengguna}>
              <View style={styles.titikPenggunaInti} />
            </View>
          </Marker>
        </>
      ) : null}
    </MapView>
  );
}

const UKURAN_TITIK = 20;

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    map: {
      flex: 1,
      backgroundColor: w.surfaceMuted,
    },
    markerWrap: {
      alignItems: 'center',
    },
    markerBubble: {
      width: 38,
      height: 38,
      borderRadius: 14,
      borderWidth: 2.5,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.card,
    },
    markerPointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 7,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -1,
    },
    titikPengguna: {
      width: UKURAN_TITIK,
      height: UKURAN_TITIK,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: w.graphite,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titikPenggunaInti: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: w.graphite,
    },
  });
