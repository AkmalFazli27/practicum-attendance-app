import type { Koordinat, Lab } from '@/data/dummy';
import type { RegionPeta } from './region';

export type PetaMapProps = {
  labs: Lab[];
  labDipilih: Lab | null;
  onPilihLab: (lab: Lab) => void;
  region: RegionPeta;
  /** Posisi pengguna live; null bila izin ditolak, GPS mati, atau belum ada. */
  pengguna?: Koordinat | null;
};
