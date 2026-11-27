import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { StubScreen } from '@/components/praktikan/StubScreen';

// STUB P1 — diisi di Task 2.
export default function DetailTagihanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <StubScreen
      kicker="DETAIL TAGIHAN"
      judul="Detail tagihan"
      pesan={`Rincian tagihan ${id ?? '-'} akan tampil di sini.`}
    />
  );
}
