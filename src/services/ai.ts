/**
 * Service Integrasi API Model AI Klasifikasi Alasan Izin
 *
 * Mengklasifikasikan alasan ketidakhadiran praktikan dalam bentuk narasi
 * menjadi dua label resmi:
 * - "Sakit" (alasan kesehatan, demam, dokter, klinik, rawat inap, dsb.)
 * - "Izin"  (urusan keluarga, akademik/delegasi, kendala teknis/transportasi, keperluan pribadi)
 *
 * Apabila API AI eksternal gagal / 401 / timeout / tidak terkonfigurasi,
 * sistem otomatis menggunakan klasifikasi heuristik lokal agar narasi tetap
 * terlabeli "Sakit" atau "Izin" secara akurat.
 *
 * CATATAN KEAMANAN & ARSITEKTUR:
 * - Hasil klasifikasi HANYA digunakan sebagai informasi pendukung bagi Asisten.
 * - Model AI TIDAK BOLEH memutuskan izin diterima atau ditolak.
 */

export const KATEGORI_IZIN_RESMI = ['Sakit', 'Izin'] as const;

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

const KATA_KUNCI_SAKIT = [
  'sakit',
  'tidak enak badan',
  'tak enak badan',
  'gak enak badan',
  'ga enak badan',
  'kurang enak badan',
  'kurang sehat',
  'tidak sehat',
  'badan panas',
  'masuk angin',
  'maag',
  'asam lambung',
  'gerd',
  'vertigo',
  'demam',
  'panas',
  'pusing',
  'migren',
  'migrain',
  'mual',
  'muntah',
  'diare',
  'tipes',
  'tifus',
  'dbd',
  'batuk',
  'pilek',
  'flu',
  'radang',
  'meriang',
  'lemas',
  'sesak',
  'asma',
  'alergi',
  'cedera',
  'keseleo',
  'luka',
  'operasi',
  'rawat',
  'opname',
  'dokter',
  'klinik',
  'puskesmas',
  'rumah sakit',
  'rsud',
  'igd',
  'ugd',
  'medis',
  'kesehatan',
  'periksa',
  'obat',
  'istirahat total',
  'sick',
  'fever',
  'ill',
  'illness',
  'headache',
  'cough',
  'cold',
  'doctor',
  'clinic',
  'hospital',
  'medical',
  'health',
  'unwell',
  'not feeling well',
  'under the weather',
];

/**
 * Memvalidasi dan menormalisasi kategori dari respons model AI agar hanya
 * mengembalikan "Sakit" atau "Izin".
 */
export function normalisasiKategoriResmi(
  rawKategori: string,
): KategoriIzinResmi | null {
  const bersih = (rawKategori || '').trim();
  if (!bersih) return null;

  const lower = bersih.toLowerCase();

  if (
    lower === 'sakit' ||
    lower.includes('sakit') ||
    lower.includes('medis') ||
    lower.includes('kesehatan') ||
    lower.includes('sick') ||
    lower.includes('medical')
  ) {
    return 'Sakit';
  }

  if (
    lower === 'izin' ||
    lower.includes('izin') ||
    lower.includes('akademik') ||
    lower.includes('delegasi') ||
    lower.includes('keluarga') ||
    lower.includes('mendesak') ||
    lower.includes('darurat') ||
    lower.includes('teknis') ||
    lower.includes('transportasi') ||
    lower.includes('pribadi') ||
    lower.includes('leave') ||
    lower.includes('excused') ||
    lower.includes('personal') ||
    lower.includes('family')
  ) {
    return 'Izin';
  }

  return null;
}

/**
 * Klasifikasi lokal berbasis kata kunci (ID + EN) untuk narasi izin praktikan.
 */
function klasifikasiLokal(alasan: string): {
  kategori: KategoriIzinResmi;
  ringkasan: string;
} {
  const teks = (alasan || '').toLowerCase();

  const terdeteksiSakit = KATA_KUNCI_SAKIT.some((kata) => teks.includes(kata));
  if (terdeteksiSakit) {
    return {
      kategori: 'Sakit',
      ringkasan: 'Terindikasi alasan kesehatan atau pemeriksaan medis.',
    };
  }

  if (
    teks.includes('lomba') ||
    teks.includes('delegasi') ||
    teks.includes('seminar') ||
    teks.includes('sidang') ||
    teks.includes('ujian') ||
    teks.includes('akademik') ||
    teks.includes('competition') ||
    teks.includes('exam')
  ) {
    return {
      kategori: 'Izin',
      ringkasan: 'Terindikasi izin kegiatan akademik, ujian, atau delegasi kampus.',
    };
  }

  if (
    teks.includes('keluarga') ||
    teks.includes('duka') ||
    teks.includes('meninggal') ||
    teks.includes('nikah') ||
    teks.includes('pernikahan') ||
    teks.includes('darurat') ||
    teks.includes('musibah') ||
    teks.includes('family') ||
    teks.includes('wedding') ||
    teks.includes('emergency')
  ) {
    return {
      kategori: 'Izin',
      ringkasan: 'Terindikasi izin urusan keluarga atau keperluan mendesak.',
    };
  }

  if (
    teks.includes('banjir') ||
    teks.includes('macet') ||
    teks.includes('ban bocor') ||
    teks.includes('kendaraan') ||
    teks.includes('motor') ||
    teks.includes('hujan') ||
    teks.includes('transport')
  ) {
    return {
      kategori: 'Izin',
      ringkasan: 'Terindikasi izin kendala perjalanan, kendaraan, atau cuaca.',
    };
  }

  return {
    kategori: 'Izin',
    ringkasan: 'Terindikasi izin keperluan pribadi non-medis.',
  };
}

function buatHasilFallback(alasan: string): HasilKlasifikasiAI {
  const lokal = klasifikasiLokal(alasan);
  return {
    kategori: lokal.kategori,
    isFallback: true,
    keterangan: lokal.ringkasan,
  };
}

/**
 * Helper tampilan UI untuk memformat label klasifikasi AI (termasuk data lama di Firestore)
 * agar selalu menampilkan "Sakit" / "Izin" (ID) atau "Sick" / "Excused Leave" (EN).
 */
export function formatLabelKategoriAi(
  kategori?: string,
  ringkasan?: string,
  isEn = false,
): {
  kategoriResmi: KategoriIzinResmi | null;
  label: string;
  terklasifikasi: boolean;
} {
  const dariKategori = kategori ? normalisasiKategoriResmi(kategori) : null;
  const dariRingkasan =
    !dariKategori && ringkasan ? normalisasiKategoriResmi(ringkasan) : null;
  const hasil = dariKategori ?? dariRingkasan;

  if (hasil === 'Sakit') {
    return {
      kategoriResmi: 'Sakit',
      label: isEn ? 'Sick' : 'Sakit',
      terklasifikasi: true,
    };
  }
  if (hasil === 'Izin') {
    return {
      kategoriResmi: 'Izin',
      label: isEn ? 'Excused Leave' : 'Izin',
      terklasifikasi: true,
    };
  }
  return {
    kategoriResmi: null,
    label: isEn ? 'Unclassified' : 'Belum terklasifikasi',
    terklasifikasi: false,
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
 * Mengklasifikasikan alasan izin dalam bentuk narasi menjadi "Sakit" atau "Izin".
 * Mencoba API Model AI terlebih dahulu; bila endpoint/token bermasalah,
 * otomatis menggunakan klasifikasi lokal agar label Sakit/Izin tetap dihasilkan.
 */
export async function klasifikasikanAlasanIzin(
  alasan: string,
): Promise<HasilKlasifikasiAI> {
  const alasanBersih = (alasan || '').trim();

  if (!alasanBersih) {
    return {
      kategori: KATEGORI_FALLBACK,
      isFallback: true,
      keterangan: 'Alasan kosong.',
    };
  }

  // Jika URL API belum dikonfigurasi, langsung klasifikasikan secara lokal
  if (!AI_API_URL || AI_API_URL.includes('placeholder')) {
    return buatHasilFallback(alasanBersih);
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
                'Kamu adalah asisten pengklasifikasi narasi izin praktikum mahasiswa. ' +
                'Klasifikasikan narasi alasan ketidakhadiran ke tepat SATU label resmi berikut: ' +
                '"Sakit" (jika terkait kondisi kesehatan/medis/dokter/klinik) atau ' +
                '"Izin" (jika terkait urusan keluarga, akademik, transportasi, atau keperluan pribadi). ' +
                'Jawab HANYA dengan JSON valid tanpa markdown: ' +
                '{"kategori": "Sakit" atau "Izin", "keterangan": "<ringkasan singkat 1 kalimat Bahasa Indonesia>"}',
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
                    : 'Diklasifikasikan otomatis oleh Model AI.',
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
              keterangan: 'Diklasifikasikan otomatis oleh Model AI.',
            };
          }
        }
      }
    } else {
      // Mode 2: Custom REST / Proxy Endpoint
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
              'Diklasifikasikan otomatis oleh Model AI.',
          };
        }
      }
    }

    return buatHasilFallback(alasanBersih);
  } catch {
    clearTimeout(timer);
    return buatHasilFallback(alasanBersih);
  }
}
