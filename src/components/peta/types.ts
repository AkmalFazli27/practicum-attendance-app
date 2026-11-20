import type { Lab } from '@/data/dummy';
import type { RegionPeta } from './region';

export type PetaMapProps = {
  labs: Lab[];
  labDipilih: Lab | null;
  onPilihLab: (lab: Lab) => void;
  region: RegionPeta;
};
