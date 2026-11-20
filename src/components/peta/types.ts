import type { Koordinat, Lab } from '@/data/dummy';
import type { Titik } from '@/utils/geo';
import type { RegionPeta } from './region';

export type PetaMapProps = {
  labs: Lab[];
  labDipilih: Lab | null;
  onPilihLab: (lab: Lab) => void;
  region: RegionPeta;
  /** Posisi pengguna live; null bila izin ditolak, GPS mati, atau belum ada. */
  pengguna?: Koordinat | null;
};

/**
 * Kontrak `LokasiPicker` dipakai implementasi native dan web sekaligus.
 * Komponen hanya mengurus peta dan input; penyimpanan ada di layar.
 */
export interface LokasiPickerProps {
  titik: Titik | null;
  /** Radius numerik untuk lingkaran peta; 0 bila teks belum bisa dibaca. */
  radius: number;
  onTitikChange: (titik: Titik) => void;
  disabled?: boolean;
  /** Teks mentah input radius; layar yang mem-parse agar pesan validasi seragam. */
  radiusTeks: string;
  onRadiusTeksChange: (teks: string) => void;
  onGunakanLokasi: () => void;
  bisaGunakanLokasi: boolean;
  sedangMembacaLokasi?: boolean;
  pesanLokasi?: string | null;
}
