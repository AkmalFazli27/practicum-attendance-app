/**
 * Service Integrasi API Model AI Pengajar
 *
 * Mengirimkan alasan ketidakhadiran praktikan ke API model AI
 * untuk mendapatkan prediksi kategori alasan (misal: "Sakit / Medis", "Kegiatan Akademik / Delegasi",
 * "Keluarga / Mendesak", "Kendala Teknis / Transportasi", atau "Keperluan Pribadi").
 *
 * Mendukung dua mode endpoint secara otomatis:
 * 1. OpenAI-Compatible Endpoint (mis. `https://.../v1` atau `/v1/chat/completions` dengan API Key `sk-...`)
 * 2. Custom Classification Endpoint (POST `{ alasan, text }` -> `{ kategori }`)
 *
 * CATATAN PENTING ARSITEKTUR:
 * - Hasil klasifikasi HANYA digunakan sebagai informasi pendukung bagi Asisten.
 * - Model AI TIDAK BOLEH memutuskan izin diterima atau ditolak.
 * - Dilengkapi batas waktu (timeout 8 detik) dan nilai fallback aman agar
 *   kegagalan jaringan/API tidak menggagalkan penyimpanan izin ke Firestore.
 */

export interface HasilKlasifikasiAI {
  kategori: string;
  confidence?: number;
  isFallback: boolean;
  keterangan?: string;
}

const AI_API_URL = (process.env.EXPO_PUBLIC_AI_API_URL || '').trim();
const AI_API_KEY = (process.env.EXPO_PUBLIC_AI_API_KEY || '').trim();
const AI_MODEL_ENV = (process.env.EXPO_PUBLIC_AI_MODEL || '').trim();
const TIMEOUT_MS = 8000;

let cachedModelId: string | null = AI_MODEL_ENV || null;

/**
 * Fallback heuristik lokal berbasis kata kunci jika API AI pengajar tidak tersedia / timeout.
 * Memastikan pengalaman pengguna tidak macet saat demonstrasi offline atau server AI down.
 */
function fallbackKlasifikasiLokal(alasan: string): {
  kategori: string;
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
      kategori: 'Sakit / Medis',
      ringkasan: 'Terdeteksi kondisi kesehatan atau pemeriksaan medis.',
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
      kategori: 'Kegiatan Akademik / Delegasi',
      ringkasan: 'Terdeteksi kegiatan akademik, ujian, atau penugasan kampus.',
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
      kategori: 'Keluarga / Mendesak',
      ringkasan: 'Terdeteksi urusan keluarga mendesak atau kondisi darurat.',
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
      kategori: 'Kendala Teknis / Transportasi',
      ringkasan: 'Terdeteksi kendala perjalanan, cuaca, atau teknis.',
    };
  }

  return {
    kategori: 'Keperluan Pribadi',
    ringkasan: 'Alasan ketidakhadiran umum di luar kategori medis/akademik.',
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
      kategori: 'Tidak Ada Alasan',
      isFallback: true,
      keterangan: 'Alasan kosong',
    };
  }

  // Jika URL API belum dikonfigurasi, gunakan fallback lokal
  if (!AI_API_URL || AI_API_URL.includes('placeholder')) {
    const lokal = fallbackKlasifikasiLokal(alasanBersih);
    return {
      kategori: lokal.kategori,
      isFallback: true,
      keterangan: `${lokal.ringkasan} (Mode fallback lokal)`,
    };
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

    // Mode 1: OpenAI-Compatible Chat Completions API (misal https://aotianzz.xyz/v1)
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
                'Klasifikasikan alasan izin ke tepat SATU kategori berikut: ' +
                '"Sakit / Medis", "Kegiatan Akademik / Delegasi", "Keluarga / Mendesak", ' +
                '"Kendala Teknis / Transportasi", atau "Keperluan Pribadi". ' +
                'Jawab HANYA dengan JSON valid tanpa markdown: ' +
                '{"kategori": "<nama kategori>", "keterangan": "<ringkasan singkat 1 kalimat Bahasa Indonesia>"}',
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
            return {
              kategori: parsed.kategori.trim(),
              isFallback: false,
              keterangan:
                typeof parsed.keterangan === 'string'
                  ? parsed.keterangan.trim()
                  : 'Diklasifikasikan oleh Model AI.',
            };
          }
        } catch {
          // Jika balasan berupa teks biasa (bukan JSON), ambil baris pertamanya sebagai kategori
          const barisPertama = rawContent.split('\n')[0].replace(/["']/g, '').trim();
          if (barisPertama.length > 0 && barisPertama.length <= 45) {
            return {
              kategori: barisPertama,
              isFallback: false,
              keterangan: 'Diklasifikasikan oleh Model AI.',
            };
          }
        }
      }
    } else {
      // Mode 2: Custom REST Endpoint
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
        return {
          kategori: kategoriHasil.trim(),
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

    const lokal = fallbackKlasifikasiLokal(alasanBersih);
    return {
      kategori: lokal.kategori,
      isFallback: true,
      keterangan: `${lokal.ringkasan} (Format respons AI fallback)`,
    };
  } catch (error: any) {
    clearTimeout(timer);

    const isTimeout = error?.name === 'AbortError';
    const lokal = fallbackKlasifikasiLokal(alasanBersih);

    return {
      kategori: lokal.kategori,
      isFallback: true,
      keterangan: isTimeout
        ? `${lokal.ringkasan} (Layanan AI timeout — fallback)`
        : `${lokal.ringkasan} (Fallback lokal)`,
    };
  }
}
