import { MapPin, type LucideIcon } from 'lucide-react-native';

import type { Lab } from '@/data/dummy';

export interface LabMarkerPreset {
  Icon: LucideIcon;
  bg: string;
  fg: string;
  softBg: string;
}

const COLOR_PRESETS: Omit<LabMarkerPreset, 'Icon'>[] = [
  { bg: '#166534', fg: '#FFFFFF', softBg: '#DCFCE7' }, // Hijau (Lab AP)
  { bg: '#1D4ED8', fg: '#FFFFFF', softBg: '#DBEAFE' }, // Biru (Lab B)
  { bg: '#B45309', fg: '#FFFFFF', softBg: '#FEF3C7' }, // Amber (Lab C)
  { bg: '#BE123C', fg: '#FFFFFF', softBg: '#FFE4E6' }, // Merah Rose (Lab D)
  { bg: '#4338CA', fg: '#FFFFFF', softBg: '#E0E7FF' }, // Indigo (Basis Data)
  { bg: '#6D28D9', fg: '#FFFFFF', softBg: '#EDE9FE' }, // Ungu (AI / IoT)
  { bg: '#0F766E', fg: '#FFFFFF', softBg: '#CCFBF1' }, // Teal (Jaringan)
  { bg: '#A21CAF', fg: '#FFFFFF', softBg: '#FAE8FF' }, // Magenta
  { bg: '#0369A1', fg: '#FFFFFF', softBg: '#E0F2FE' }, // Biru Langit
  { bg: '#3F6212', fg: '#FFFFFF', softBg: '#ECFCCB' }, // Olive
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Mengembalikan ikon marker yang seragam (MapPin) dengan warna berbeda
 * untuk tiap laboratorium, disertai fallback deterministik untuk lab baru.
 */
export function getLabMarkerStyle(
  lab: Pick<Lab, 'id' | 'nama'>,
  indexFallback = 0,
): LabMarkerPreset {
  const key = `${lab.id ?? ''} ${lab.nama ?? ''}`.toLowerCase();

  let color = COLOR_PRESETS[0];
  if (/basis\s*data|database|\bdb\b/.test(key)) color = COLOR_PRESETS[4];
  else if (/jaringan|network|komdat/.test(key)) color = COLOR_PRESETS[6];
  else if (/\bai\b|cerdas|mesin|iot|robot|mikro/.test(key))
    color = COLOR_PRESETS[5];
  else if (/multimedia|grafis|desain|ui/.test(key)) color = COLOR_PRESETS[8];
  else if (/kimia|biologi|fisika|sains/.test(key)) color = COLOR_PRESETS[7];
  else if (/lab[\s-]*ap\b|algoritma|pemrograman|rpl/.test(key))
    color = COLOR_PRESETS[0];
  else if (/lab[\s-]*b\b/.test(key)) color = COLOR_PRESETS[1];
  else if (/lab[\s-]*c\b/.test(key)) color = COLOR_PRESETS[2];
  else if (/lab[\s-]*d\b|sistem|linux|\bos\b/.test(key))
    color = COLOR_PRESETS[3];
  else {
    const seed = hashString(lab.id || lab.nama || String(indexFallback));
    color = COLOR_PRESETS[(seed + indexFallback) % COLOR_PRESETS.length];
  }

  return {
    Icon: MapPin,
    ...color,
  };
}
