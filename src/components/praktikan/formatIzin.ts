import type { StatusIzin } from '@/data/dummy';

type SentimentPrediction = {
  label: 'positif' | 'netral' | 'negatif' | null;
  status: string;
};

type SentimentClassifier = (text: string) => SentimentPrediction;

let classifierCache: SentimentClassifier | null | undefined;

function getLocalSentimentClassifier(): SentimentClassifier | null {
  if (classifierCache !== undefined) return classifierCache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createSentimentClassifier } = require('./ai/sentiment') as {
      createSentimentClassifier: (model: unknown) => SentimentClassifier;
    };
    const model = require('./ai/model-edom.json') as unknown;
    classifierCache = createSentimentClassifier(model);
  } catch {
    classifierCache = null;
  }
  return classifierCache;
}

/**
 * Menjalankan prediksi sentimen on-device (model-edom.json) sebagai fallback
 * ketika `sentimenAi` belum tersedia di dokumen izin.
 */
export function analisisSentimenLokal(
  alasan: string | undefined,
): 'positif' | 'netral' | 'negatif' | undefined {
  const teks = (alasan ?? '').trim();
  if (!teks) return undefined;
  const classifier = getLocalSentimentClassifier();
  if (!classifier) return undefined;
  try {
    const prediksi = classifier(teks);
    if (
      prediksi?.label === 'positif' ||
      prediksi?.label === 'netral' ||
      prediksi?.label === 'negatif'
    ) {
      return prediksi.label;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function resolveSentimenAi(
  sentimenAi: string | undefined,
  alasan: string | undefined,
  kategoriTerklasifikasi: boolean,
): string | undefined {
  const tersimpan = (sentimenAi ?? '').trim();
  if (tersimpan) return tersimpan;
  if (!kategoriTerklasifikasi) return undefined;
  return analisisSentimenLokal(alasan);
}

export function formatSentimenAi(
  sentimen: string | undefined,
  isEn: boolean,
): { label: string; tersedia: boolean } {
  const s = (sentimen ?? '').trim().toLowerCase();
  if (s === 'positif' || s === 'positive') {
    return { label: isEn ? 'Positive' : 'Positif', tersedia: true };
  }
  if (s === 'netral' || s === 'neutral') {
    return { label: isEn ? 'Neutral' : 'Netral', tersedia: true };
  }
  if (s === 'negatif' || s === 'negative') {
    return { label: isEn ? 'Negative' : 'Negatif', tersedia: true };
  }
  return {
    label: isEn ? 'Unavailable' : 'Tidak tersedia',
    tersedia: false,
  };
}

export function labelStatusIzin(
  status: StatusIzin,
  isEn: boolean,
): { judul: string; keterangan: string } {
  switch (status) {
    case 'DITERIMA':
      return {
        judul: isEn ? 'Leave approved' : 'Izin diterima',
        keterangan: isEn
          ? 'Excused absence · no fine.'
          : 'Tidak hadir dengan izin · bebas denda.',
      };
    case 'DITOLAK':
      return {
        judul: isEn ? 'Leave rejected' : 'Izin ditolak',
        keterangan: isEn
          ? 'Attendance follows normal rules.'
          : 'Presensi mengikuti aturan normal.',
      };
    case 'MENUNGGU':
    default:
      return {
        judul: isEn
          ? 'Awaiting assistant review'
          : 'Menunggu pemeriksaan Asprak',
        keterangan: isEn
          ? 'You can still check in while the request is pending.'
          : 'Kamu masih bisa presensi selama izin belum diputuskan.',
      };
  }
}
