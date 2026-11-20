import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { colors } from '@/theme/tokens';
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

  useEffect(() => {
    if (!siap || sudahDiposisikan.current || labs.length === 0) return;
    sudahDiposisikan.current = true;
    mapRef.current?.animateToRegion(region, 450);
  }, [
    siap,
    labs.length,
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
      {labs.map((lab) => (
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
