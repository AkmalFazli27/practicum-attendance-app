import React from 'react';

import { BulkAnggotaView } from '@/components/aslab/lab/BulkAnggotaView';

/**
 * Layar Bulk Insert Asprak ke lab tertentu (FR-30, FR-31).
 */
export default function BulkAsprakScreen() {
  return <BulkAnggotaView peranTarget="asprak" />;
}
