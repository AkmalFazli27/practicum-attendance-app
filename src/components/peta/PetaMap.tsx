import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { colors } from '@/theme/tokens';
import { labPunyaKoordinat } from './region';
import type { PetaMapProps } from './types';

export function PetaMap({
  labs,
  labDipilih,
  onPilihLab,
  region,
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
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
  },
});
