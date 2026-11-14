/**
 * Service Integrasi API Model AI Pengajar
 *
 * Mengirimkan alasan ketidakhadiran praktikan ke API model AI
 * untuk mendapatkan prediksi kategori alasan yang di-whitelist ke lima kategori resmi:
 * - "Sakit / Medis"
 * - "Kegiatan Akademik / Delegasi"
 * - "Keluarga / Mendesak"
 * - "Kendala Teknis / Transportasi"
 * - "Keperluan Pribadi"
 *
 * Apabila layanan AI gagal/timeout/tidak terkonfigurasi, fungsi mengembalikan
 * fallback sesuai spesifikasi (`kategori: "Belum Terklasifikasi"`).
 *
 * CATATAN KEAMANAN & ARSITEKTUR:
 * - Hasil klasifikasi HANYA digunakan sebagai informasi pendukung bagi Asisten.
 * - Model AI TIDAK BOLEH memutuskan izin diterima atau ditolak.
 * - Gunakan endpoint proxy/Cloud Function (`EXPO_PUBLIC_AI_PROXY_URL` / `EXPO_PUBLIC_AI_API_URL`)
 *   agar kunci rahasia tidak ter-bundle di aplikasi klien produksi.
 */

export const KATEGORI_IZIN_RESMI = [
  'Sakit / Medis',
  'Kegiatan Akademik / Delegasi',
  'Keluarga / Mendesak',
  'Kendala Teknis / Transportasi',
  'Keperluan Pribadi',
] as const;

export type KategoriIzinResmi = (typeof KATEGORI_IZIN_RESMI)[number];
export const KATEGORI_FALLBACK = 'Belum Terklasifikasi' as const;

export interface HasilKlasifikasiAI {
  kategori: KategoriIzinResmi | typeof KATEGORI_FALLBACK;
  confidence?: number;
  isFallback: boolean;
  keterangan?: string;
}

const AI_API_URL = (
  process.env.EXPO_PUBLIC_AI_PROXY_URL ||
  process.env.EXPO_PUBLIC_AI_API_URL ||
  ''
).trim();
const AI_API_KEY = (process.env.EXPO_PUBLIC_AI_API_KEY || '').trim();
const AI_MODEL_ENV = (process.env.EXPO_PUBLIC_AI_MODEL || '').trim();
const TIMEOUT_MS = 8000;

let cachedModelId: string | null = AI_MODEL_ENV || null;

/**
 * Memvalidasi dan menormalisasi kategori dari respons model AI agar hanya
 * mengembalikan salah satu dari lima kategori resmi di KATEGORI_IZIN_RESMI.
 * Mengembalikan `null` jika respons di luar whitelist.
 */
export function normalisasiKategoriResmi(
  rawKategori: string,
): KategoriIzinResmi | null {
  const bersih = (rawKategori || '').trim();
  if (!bersih) return null;

  const lower = bersih.toLowerCase();

  // 1. Cek kecocokan langsung (case-insensitive) dengan 5 kategori resmi
  for (const resmi of KATEGORI_IZIN_RESMI) {
    if (resmi.toLowerCase() === lower) {
      return resmi;
    }
  }

  // 2. Normalisasi variasi penulisan dari model ke 5 kategori resmi
  if (lower.includes('sakit') || lower.includes('medis') || lower.includes('kesehatan')) {
    return 'Sakit / Medis';
  }
  if (
    lower.includes('akademik') ||
    lower.includes('delegasi') ||
    lower.includes('lomba') ||
    lower.includes('kampus')
  ) {
    return 'Kegiatan Akademik / Delegasi';
  }
  if (
    lower.includes('keluarga') ||
    lower.includes('mendesak') ||
    lower.includes('darurat') ||
    lower.includes('duka')
  ) {
    return 'Keluarga / Mendesak';
  }
  if (
    lower.includes('teknis') ||
    lower.includes('transportasi') ||
    lower.includes('kendaraan') ||
    lower.includes('cuaca')
  ) {
    return 'Kendala Teknis / Transportasi';
  }
  if (lower.includes('pribadi')) {
    return 'Keperluan Pribadi';
  }

  return null;
}

/**
 * Petunjuk heuristik lokal berbasis kata kunci untuk memperkaya keterangan
 * saat sistem menggunakan kategori fallback "Belum Terklasifikasi".
 */
function indikasiHeuristikLokal(alasan: string): {
  indikasi: KategoriIzinResmi;
  ringkasan: string;
} {
  const teks = (alasan || '').toLowerCase();

  if (
    teks.includes('sakit') ||
    teks.includes('demam') ||
    teks.includes('pusing') ||
    teks.includes('rawat') ||
    teks.includes('dokter') ||
    teks.includes('klinik') ||
    teks.includes('rumah sakit') ||
    teks.includes('flu') ||
    teks.includes('medis')
  ) {
    return {
      indikasi: 'Sakit / Medis',
      ringkasan: 'Indikasi awal: kondisi kesehatan atau pemeriksaan medis.',
    };
  }

  if (
    teks.includes('lomba') ||
    teks.includes('delegasi') ||
    teks.includes('seminar') ||
    teks.includes('kuliah') ||
    teks.includes('sidang') ||
    teks.includes('ujian') ||
    teks.includes('praktikum lain') ||
    teks.includes('tugas akhir') ||
    teks.includes('akademik')
  ) {
    return {
      indikasi: 'Kegiatan Akademik / Delegasi',
      ringkasan: 'Indikasi awal: kegiatan akademik, ujian, atau delegasi kampus.',
    };
  }

  if (
    teks.includes('keluarga') ||
    teks.includes('duka') ||
    teks.includes('meninggal') ||
    teks.includes('darurat') ||
    teks.includes('musibah') ||
    teks.includes('kecelakaan')
  ) {
    return {
      indikasi: 'Keluarga / Mendesak',
      ringkasan: 'Indikasi awal: urusan keluarga mendesak atau kondisi darurat.',
    };
  }

  if (
    teks.includes('banjir') ||
    teks.includes('macet') ||
    teks.includes('ban bocor') ||
    teks.includes('kendaraan') ||
    teks.includes('listrik') ||
    teks.includes('hujan deras')
  ) {
    return {
      indikasi: 'Kendala Teknis / Transportasi',
      ringkasan: 'Indikasi awal: kendala perjalanan, cuaca, atau teknis.',
    };
  }

  return {
    indikasi: 'Keperluan Pribadi',
    ringkasan: 'Indikasi awal: keperluan pribadi di luar kategori medis/akademik.',
  };
}

function buatHasilFallback(alasan: string, sebab: string): HasilKlasifikasiAI {
  const lokal = indikasiHeuristikLokal(alasan);
  return {
    kategori: KATEGORI_FALLBACK,
    isFallback: true,
    keterangan: `${lokal.ringkasan} (${sebab} — fallback lokal: ${lokal.indikasi})`,
  };
}

/**
 * Mendeteksi apakah URL merupakan OpenAI-compatible API (`/v1` atau `/chat/completions`)
 */
function isOpenAiCompatibleUrl(url: string): boolean {
  const clean = url.replace(/\/+$/, '');
  return (
    clean.endsWith('/v1') ||
    clean.endsWith('/chat/completions') ||
    AI_API_KEY.startsWith('sk-')
  );
}

/**
 * Mengambil ID model yang tersedia dari endpoint `/v1/models` apabila belum diset di `.env`
 */
async function resolveOpenAiModel(
  baseV1Url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<string> {
  if (cachedModelId) return cachedModelId;

  try {
    const res = await fetch(`${baseV1Url}/models`, {
      method: 'GET',
      headers,
      signal,
    });
    if (res.ok) {
      const json = await res.json();
      const list: Array<{ id?: string }> = Array.isArray(json?.data)
        ? json.data
        : [];
      const preferred = list.find(
        (m) =>
          m.id &&
          !m.id.includes('embedding') &&
          !m.id.includes('whisper') &&
          !m.id.includes('tts') &&
          !m.id.includes('dall-e'),
      );
      if (preferred?.id) {
        cachedModelId = preferred.id;
        return preferred.id;
      }
    }
  } catch {
    // Abaikan dan gunakan default model
  }

  return 'gpt-4o-mini';
}

/**
 * Mengklasifikasikan alasan izin menggunakan API Model AI pengajar.
 *
 * @param alasan Teks alasan izin dari praktikan
 * @returns Promise<HasilKlasifikasiAI>
 */
export async function klasifikasikanAlasanIzin(
  alasan: string,
): Promise<HasilKlasifikasiAI> {
  const alasanBersih = (alasan || '').trim();

  if (!alasanBersih) {
    return {
      kategori: KATEGORI_FALLBACK,
      isFallback: true,
      keterangan: 'Alasan kosong (fallback lokal)',
    };
  }

  // Jika URL API belum dikonfigurasi, gunakan fallback resmi ("Belum Terklasifikasi")
  if (!AI_API_URL || AI_API_URL.includes('placeholder')) {
    return buatHasilFallback(alasanBersih, 'Endpoint AI belum dikonfigurasi');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (AI_API_KEY) {
      headers['Authorization'] = `Bearer ${AI_API_KEY}`;
    }

    // Mode 1: OpenAI-Compatible Chat Completions API
    if (isOpenAiCompatibleUrl(AI_API_URL)) {
      const cleanUrl = AI_API_URL.replace(/\/+$/, '');
      const baseV1Url = cleanUrl.endsWith('/chat/completions')
        ? cleanUrl.replace(/\/chat\/completions$/, '')
        : cleanUrl;
      const completionsUrl = cleanUrl.endsWith('/chat/completions')
        ? cleanUrl
        : `${cleanUrl}/chat/completions`;

      const model = await resolveOpenAiModel(
        baseV1Url,
        headers,
        controller.signal,
      );

      const response = await fetch(completionsUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah asisten pengklasifikasi alasan izin praktikum mahasiswa. ' +
                'Klasifikasikan alasan izin ke tepat SATU kategori resmi berikut: ' +
                '"Sakit / Medis", "Kegiatan Akademik / Delegasi", "Keluarga / Mendesak", ' +
                '"Kendala Teknis / Transportasi", atau "Keperluan Pribadi". ' +
                'Jawab HANYA dengan JSON valid tanpa markdown: ' +
                '{"kategori": "<nama kategori resmi>", "keterangan": "<ringkasan singkat 1 kalimat Bahasa Indonesia>"}',
            },
            {
              role: 'user',
              content: alasanBersih,
            },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`API AI merespons dengan HTTP status ${response.status}`);
      }

      const data = await response.json();
      const rawContent: string =
        data?.choices?.[0]?.message?.content?.trim() || '';

      if (rawContent) {
        try {
          const cleanedJson = rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```$/i, '')
            .trim();
          const parsed = JSON.parse(cleanedJson);
          if (parsed.kategori && typeof parsed.kategori === 'string') {
            const kategoriValid = normalisasiKategoriResmi(parsed.kategori);
            if (kategoriValid) {
              return {
                kategori: kategoriValid,
                isFallback: false,
                keterangan:
                  typeof parsed.keterangan === 'string' &&
                  parsed.keterangan.trim().length > 0
                    ? parsed.keterangan.trim()
                    : 'Diklasifikasikan oleh Model AI.',
              };
            }
          }
        } catch {
          const barisPertama = rawContent
            .split('\n')[0]
            .replace(/["']/g, '')
            .trim();
          const kategoriValid = normalisasiKategoriResmi(barisPertama);
          if (kategoriValid) {
            return {
              kategori: kategoriValid,
              isFallback: false,
              keterangan: 'Diklasifikasikan oleh Model AI.',
            };
          }
        }
      }
    } else {
      // Mode 2: Custom REST / Proxy Endpoint (tanpa perlu mengekspos API key di klien)
      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alasan: alasanBersih,
          text: alasanBersih,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`API AI merespons dengan HTTP status ${response.status}`);
      }

      const data = await response.json();
      const kategoriHasil =
        data.kategori ||
        data.category ||
        data.prediction ||
        data.label ||
        data.result?.kategori ||
        data.data?.kategori;

      if (kategoriHasil && typeof kategoriHasil === 'string') {
        const kategoriValid = normalisasiKategoriResmi(kategoriHasil);
        if (kategoriValid) {
          return {
            kategori: kategoriValid,
            confidence:
              typeof data.confidence === 'number' ? data.confidence : undefined,
            isFallback: false,
            keterangan:
              data.keterangan ||
              data.ringkasan ||
              'Diklasifikasikan oleh Model AI.',
          };
        }
      }
    }

    return buatHasilFallback(
      alasanBersih,
      'Kategori respons AI di luar daftar resmi',
    );
  } catch (error: any) {
    clearTimeout(timer);

    const isTimeout = error?.name === 'AbortError';
    return buatHasilFallback(
      alasanBersih,
      isTimeout ? 'Layanan AI timeout' : 'Layanan AI tidak terjangkau',
    );
  }
}
