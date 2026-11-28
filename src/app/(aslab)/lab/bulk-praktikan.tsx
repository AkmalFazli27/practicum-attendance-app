import React from 'react';

import { BulkAnggotaView } from '@/components/aslab/lab/BulkAnggotaView';

/**
 * Layar Bulk Insert Praktikan ke lab tertentu (FR-29, FR-31).
 */
export default function BulkPraktikanScreen() {
  return <BulkAnggotaView peranTarget="praktikan" />;
}
