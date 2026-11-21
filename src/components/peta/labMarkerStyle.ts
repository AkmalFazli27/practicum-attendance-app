import {
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Layers,
  Microscope,
  Monitor,
  Network,
  Server,
  Terminal,
  type LucideIcon,
} from 'lucide-react-native';

import type { Lab } from '@/data/dummy';

export interface LabMarkerPreset {
  Icon: LucideIcon;
  bg: string;
  fg: string;
  softBg: string;
}

const PRESET_LIST: LabMarkerPreset[] = [
  { Icon: Code2, bg: '#166534', fg: '#FFFFFF', softBg: '#DCFCE7' },
  { Icon: Monitor, bg: '#1D4ED8', fg: '#FFFFFF', softBg: '#DBEAFE' },
  { Icon: Server, bg: '#B45309', fg: '#FFFFFF', softBg: '#FEF3C7' },
  { Icon: Terminal, bg: '#BE123C', fg: '#FFFFFF', softBg: '#FFE4E6' },
  { Icon: Database, bg: '#4338CA', fg: '#FFFFFF', softBg: '#E0E7FF' },
  { Icon: Cpu, bg: '#6D28D9', fg: '#FFFFFF', softBg: '#EDE9FE' },
  { Icon: Network, bg: '#0F766E', fg: '#FFFFFF', softBg: '#CCFBF1' },
  { Icon: FlaskConical, bg: '#A21CAF', fg: '#FFFFFF', softBg: '#FAE8FF' },
  { Icon: Layers, bg: '#0369A1', fg: '#FFFFFF', softBg: '#E0F2FE' },
  { Icon: Microscope, bg: '#3F6212', fg: '#FFFFFF', softBg: '#ECFCCB' },
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Mengembalikan ikon dan warna marker yang berbeda untuk tiap laboratorium
 * berdasarkan nama/kategori lab, dengan fallback deterministik untuk lab baru.
 */
export function getLabMarkerStyle(
  lab: Pick<Lab, 'id' | 'nama'>,
  indexFallback = 0,
): LabMarkerPreset {
  const key = `${lab.id ?? ''} ${lab.nama ?? ''}`.toLowerCase();

  if (/basis\s*data|database|\bdb\b/.test(key)) return PRESET_LIST[4];
  if (/jaringan|network|komdat/.test(key)) return PRESET_LIST[6];
  if (/\bai\b|cerdas|mesin|iot|robot|mikro/.test(key)) return PRESET_LIST[5];
  if (/multimedia|grafis|desain|ui/.test(key)) return PRESET_LIST[8];
  if (/kimia|biologi|fisika|sains/.test(key)) return PRESET_LIST[7];
  if (/lab[\s-]*ap\b|algoritma|pemrograman|rpl/.test(key)) return PRESET_LIST[0];
  if (/lab[\s-]*b\b/.test(key)) return PRESET_LIST[1];
  if (/lab[\s-]*c\b/.test(key)) return PRESET_LIST[2];
  if (/lab[\s-]*d\b|sistem|linux|\bos\b/.test(key)) return PRESET_LIST[3];

  const seed = hashString(lab.id || lab.nama || String(indexFallback));
  return PRESET_LIST[(seed + indexFallback) % PRESET_LIST.length];
}
