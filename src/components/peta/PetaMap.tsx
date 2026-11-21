import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';

import { colors, radius } from '@/theme/tokens';
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
      accessibilityLabel="Peta laboratorium"
    >
      {labTampil.map((lab) => (
        <Marker
          key={lab.id}
          coordinate={{ latitude: lab.lat, longitude: lab.lng }}
          title={lab.nama}
          description={lab.alamat}
          zIndex={labDipilih?.id === lab.id ? 1 : 0}
          onPress={() => onPilihLab(lab)}
        />
      ))}

      {pengguna ? (
        <>
          {typeof pengguna.akurasi === 'number' && pengguna.akurasi > 0 ? (
            <Circle
              center={{ latitude: pengguna.lat, longitude: pengguna.lng }}
              radius={pengguna.akurasi}
              strokeColor={colors.primaryPressed}
              strokeWidth={1}
              fillColor={colors.primarySoft}
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

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
  titikPengguna: {
    width: UKURAN_TITIK,
    height: UKURAN_TITIK,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.graphite,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titikPenggunaInti: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.graphite,
  },
});
