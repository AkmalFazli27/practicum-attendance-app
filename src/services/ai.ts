/**
 * Service Integrasi API Model AI Klasifikasi Alasan Izin
 *
 * Mengklasifikasikan alasan ketidakhadiran praktikan dalam bentuk narasi
 * menjadi dua label resmi:
 * - "Sakit" (alasan kesehatan, demam, dokter, klinik, rawat inap, dsb.)
 * - "Izin"  (urusan keluarga, akademik/delegasi, kendala teknis/transportasi, keperluan pribadi)
 *
 * Mendukung:
 * 1. Google Gemini API (Native REST `generateContent` — mendukung Free Tier Google AI Studio)
 * 2. Gemini / OpenAI-Compatible Chat Completions (`/v1` atau `/chat/completions`)
 * 3. Custom REST / Proxy Endpoint
 *
 * Apabila API AI eksternal gagal / 401 / timeout / tidak terkonfigurasi,
 * sistem otomatis menggunakan klasifikasi heuristik lokal agar narasi tetap
 * terlabeli "Sakit" atau "Izin".
 *
 * CATATAN KEAMANAN & ARSITEKTUR:
 * - Hasil klasifikasi HANYA digunakan sebagai informasi pendukung bagi Asisten.
 * - Model AI TIDAK BOLEH memutuskan izin diterima atau ditolak.
 */

export const KATEGORI_IZIN_RESMI = ['Sakit', 'Izin'] as const;

export type KategoriIzinResmi = (typeof KATEGORI_IZIN_RESMI)[number];
export const KATEGORI_FALLBACK = 'Belum Terklasifikasi' as const;

export const SENTIMEN_IZIN = ['positif', 'netral', 'negatif'] as const;
export type SentimenIzin = (typeof SENTIMEN_IZIN)[number];

export const DEFAULT_GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
] as const;

export type AiProviderKind =
  | 'gemini'
  | 'openai-compatible'
  | 'custom'
  | 'local-fallback';

export interface HasilKlasifikasiAI {
  kategori: KategoriIzinResmi | typeof KATEGORI_FALLBACK;
  sentimen?: SentimenIzin;
  confidence?: number;
  isFallback: boolean;
  keterangan?: string;
  provider?: AiProviderKind;
  model?: string;
  errorDetail?: string;
}

export interface KlasifikasiOptions {
  proxyUrl?: string;
  apiUrl?: string;
  apiKey?: string;
  geminiApiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const TIMEOUT_MS = 12000;
const GEMINI_NATIVE_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta';

const SYSTEM_PROMPT_KLASIFIKASI =
  'Kamu adalah asisten pengklasifikasi narasi izin praktikum mahasiswa. ' +
  'Klasifikasikan narasi alasan ketidakhadiran ke tepat SATU label resmi berikut:\n' +
  '- "Sakit": HANYA jika praktikan SENDIRI mengalami gangguan kesehatan, sakit, demam, cedera, ke dokter/klinik/IGD, atau rawat inap.\n' +
  '- "Izin": untuk alasan selain praktikan sendiri sakit, termasuk mengantar/menemani keluarga yang sakit atau dirawat, urusan keluarga/duka, kegiatan akademik/lomba/delegasi/ujian, kendala transportasi/cuaca, atau keperluan pribadi.\n' +
  'Tentukan juga "sentimen" nada narasi: "negatif" bila bernada duka, musibah, atau keluhan berat; ' +
  '"positif" bila kegiatan membanggakan seperti lomba, delegasi, atau acara bahagia; selain itu "netral".\n' +
  'Jawab HANYA dengan JSON valid tanpa markdown: ' +
  '{"kategori": "Sakit" atau "Izin", "sentimen": "positif" atau "netral" atau "negatif", "keterangan": "<ringkasan singkat 1 kalimat Bahasa Indonesia>"}';

const cachedModelByUrl = new Map<string, string>();

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

function isPlaceholderValue(val: string): boolean {
  const lower = val.trim().toLowerCase();
  if (!lower) return true;
  return (
    lower.includes('placeholder') ||
    lower.includes('your_') ||
    lower.includes('your-') ||
    lower.includes('example') ||
    lower.includes('isi_') ||
    lower.startsWith('<')
  );
}

interface ResolvedAiConfig {
  proxyUrl: string;
  geminiApiKey: string;
  apiUrl: string;
  apiKey: string;
  modelEnv: string;
  timeoutMs: number;
  fetchImpl: typeof fetch;
}

function bacaKonfigurasiAi(options?: KlasifikasiOptions): ResolvedAiConfig {
  // Gunakan akses literal process.env.EXPO_PUBLIC_* agar Metro/Expo dapat melakukan inline statis
  const rawProxy =
    options?.proxyUrl ?? process.env.EXPO_PUBLIC_AI_PROXY_URL ?? '';
  const rawGeminiKey =
    options?.geminiApiKey ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  const rawApiUrl =
    options?.apiUrl ?? process.env.EXPO_PUBLIC_AI_API_URL ?? '';
  const rawApiKey =
    options?.apiKey ?? process.env.EXPO_PUBLIC_AI_API_KEY ?? '';
  const rawModel =
    options?.model ?? process.env.EXPO_PUBLIC_AI_MODEL ?? '';

  return {
    proxyUrl: rawProxy.trim(),
    geminiApiKey: rawGeminiKey.trim(),
    apiUrl: rawApiUrl.trim(),
    apiKey: rawApiKey.trim(),
    modelEnv: rawModel.trim(),
    timeoutMs:
      typeof options?.timeoutMs === 'number' && options.timeoutMs > 0
        ? options.timeoutMs
        : TIMEOUT_MS,
    fetchImpl: options?.fetchImpl ?? fetch,
  };
}

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

export function normalisasiSentimen(raw: unknown): SentimenIzin | null {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().toLowerCase();
  if (s.includes('positif') || s.includes('positive')) return 'positif';
  if (s.includes('negatif') || s.includes('negative')) return 'negatif';
  if (s.includes('netral') || s.includes('neutral')) return 'netral';
  return null;
}

const KATA_SENTIMEN_NEGATIF = [
  'meninggal', 'duka', 'musibah', 'kecelakaan', 'rawat inap', 'opname', 'darurat',
  'demam tinggi', 'sakit keras', 'operasi', 'igd', 'ugd', 'kehilangan', 'banjir',
  'accident', 'emergency', 'passed away', 'hospitalized',
];
const KATA_SENTIMEN_POSITIF = [
  'lomba', 'juara', 'delegasi', 'wisuda', 'menikah', 'pernikahan', 'prestasi',
  'penghargaan', 'kompetisi', 'competition', 'wedding', 'graduation', 'award',
];

/** Sentimen lokal berbasis kata kunci; dipakai bila AI gagal atau tidak mengirim sentimen. */
export function sentimenLokal(alasan: string): SentimenIzin {
  const teks = (alasan || '').toLowerCase();
  if (KATA_SENTIMEN_NEGATIF.some((k) => teks.includes(k))) return 'negatif';
  if (KATA_SENTIMEN_POSITIF.some((k) => teks.includes(k))) return 'positif';
  return 'netral';
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

function logFallbackDev(errorDetail?: string): void {
  if (!errorDetail) return;
  const isDev = (globalThis as { __DEV__?: boolean }).__DEV__;
  if (isDev) {
    console.warn('[AI Klasifikasi Fallback]', errorDetail);
  }
}

function buatHasilFallback(
  alasan: string,
  errorDetail?: string,
): HasilKlasifikasiAI {
  logFallbackDev(errorDetail);
  const lokal = klasifikasiLokal(alasan);
  return {
    kategori: lokal.kategori,
    sentimen: sentimenLokal(alasan),
    isFallback: true,
    keterangan: lokal.ringkasan,
    provider: 'local-fallback',
    ...(errorDetail ? { errorDetail } : {}),
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

function isGeminiHost(url: string): boolean {
  return url.toLowerCase().includes('generativelanguage.googleapis.com');
}

function isGeminiOpenAiUrl(url: string): boolean {
  return isGeminiHost(url) && url.toLowerCase().includes('/openai');
}

function isGeminiNativeUrl(url: string): boolean {
  return isGeminiHost(url) && !isGeminiOpenAiUrl(url);
}

/**
 * Mendeteksi apakah URL merupakan OpenAI-compatible API (`/v1`, `/chat/completions`, `/openai`)
 */
function isOpenAiCompatibleUrl(url: string, apiKey: string): boolean {
  const clean = url.replace(/\/+$/, '').toLowerCase();
  return (
    clean.endsWith('/v1') ||
    clean.endsWith('/chat/completions') ||
    clean.endsWith('/openai') ||
    clean.includes('/v1beta/openai') ||
    apiKey.startsWith('sk-')
  );
}

function ekstrakPesanErrorHttp(status: number, rawBody: string): string {
  const trimmed = (rawBody || '').trim();
  if (!trimmed) return `HTTP ${status}`;

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string };
      message?: string;
    };
    const msg = parsed?.error?.message || parsed?.message;
    if (typeof msg === 'string' && msg.trim()) {
      return `HTTP ${status}: ${msg.trim()}`;
    }
  } catch {
    // Gunakan potongan teks mentah
  }

  return `HTTP ${status}: ${trimmed.slice(0, 200)}`;
}

function parseResponsKlasifikasiJson(
  rawContent: string,
  provider: Exclude<AiProviderKind, 'local-fallback'>,
  model?: string,
): HasilKlasifikasiAI | null {
  const trimmed = (rawContent || '').trim();
  if (!trimmed) return null;

  const cleanedJson = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const tryParseObj = (jsonText: string): HasilKlasifikasiAI | null => {
    const parsed = JSON.parse(jsonText) as {
      kategori?: unknown;
      sentimen?: unknown;
      keterangan?: unknown;
    };
    if (typeof parsed?.kategori === 'string') {
      const kategoriValid = normalisasiKategoriResmi(parsed.kategori);
      if (kategoriValid) {
        return {
          kategori: kategoriValid,
          isFallback: false,
          provider,
          ...(normalisasiSentimen(parsed.sentimen)
            ? { sentimen: normalisasiSentimen(parsed.sentimen) as SentimenIzin }
            : {}),
          ...(model ? { model } : {}),
          keterangan:
            typeof parsed.keterangan === 'string' &&
            parsed.keterangan.trim().length > 0
              ? parsed.keterangan.trim()
              : 'Diklasifikasikan otomatis oleh Model AI.',
        };
      }
    }
    return null;
  };

  try {
    const direct = tryParseObj(cleanedJson);
    if (direct) return direct;
  } catch {
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const extracted = tryParseObj(jsonMatch[0]);
        if (extracted) return extracted;
      } catch {
        // Lanjut ke fallback baris pertama
      }
    }
  }

  const barisPertama = trimmed
    .split('\n')[0]
    .replace(/["'`]/g, '')
    .trim();
  const kategoriValid = normalisasiKategoriResmi(barisPertama);
  if (kategoriValid) {
    return {
      kategori: kategoriValid,
      isFallback: false,
      provider,
      ...(model ? { model } : {}),
      keterangan: 'Diklasifikasikan otomatis oleh Model AI.',
    };
  }

  return null;
}

function ekstrakModelDariGeminiUrl(url: string): string | null {
  const match = url.match(/\/models\/([^/:?]+):generateContent/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function ekstrakTeksDariKandidatGemini(data: unknown): string {
  const payload = data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string; thought?: boolean }>;
      };
    }>;
  };
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';

  return parts
    .filter(
      (part) =>
        part &&
        part.thought !== true &&
        typeof part.text === 'string' &&
        part.text.length > 0,
    )
    .map((part) => part.text as string)
    .join('\n')
    .trim();
}

async function klasifikasiViaGeminiNative(
  alasanBersih: string,
  apiKey: string,
  targetUrl: string,
  modelEnv: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<HasilKlasifikasiAI> {
  if (!apiKey || isPlaceholderValue(apiKey)) {
    return buatHasilFallback(alasanBersih, 'API key Gemini belum diisi.');
  }

  const extractedModel = targetUrl
    ? ekstrakModelDariGeminiUrl(targetUrl)
    : null;
  const cleanModelEnv = modelEnv.replace(/^models\//i, '').trim();

  const candidateModels: string[] = cleanModelEnv
    ? [cleanModelEnv]
    : extractedModel
      ? [extractedModel]
      : [...DEFAULT_GEMINI_MODELS];

  let lastError = 'Respons Gemini tidak valid.';

  for (const model of candidateModels) {
    const endpoint = `${GEMINI_NATIVE_BASE_URL}/models/${encodeURIComponent(model)}:generateContent`;

    const generationConfig: Record<string, unknown> = {
      temperature: 0.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          kategori: {
            type: 'STRING',
            enum: ['Sakit', 'Izin'],
          },
          sentimen: {
            type: 'STRING',
            enum: ['positif', 'netral', 'negatif'],
          },
          keterangan: {
            type: 'STRING',
            description:
              'Ringkasan singkat 1 kalimat Bahasa Indonesia mengenai alasan ketidakhadiran.',
          },
        },
        required: ['kategori', 'sentimen', 'keterangan'],
      },
    };

    if (
      model === 'gemini-2.5-flash' ||
      model.startsWith('gemini-2.5-flash-preview')
    ) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT_KLASIFIKASI }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: alasanBersih }],
          },
        ],
        generationConfig,
      }),
      signal,
    });

    const rawText = await response.text();

    if (!response.ok) {
      lastError = ekstrakPesanErrorHttp(response.status, rawText);
      if (
        response.status === 404 ||
        response.status === 429 ||
        response.status === 503
      ) {
        continue;
      }
      return buatHasilFallback(alasanBersih, lastError);
    }

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      lastError = `Respons JSON Gemini tidak valid (${model}).`;
      continue;
    }

    const rawContent = ekstrakTeksDariKandidatGemini(data);
    const parsed = parseResponsKlasifikasiJson(rawContent, 'gemini', model);
    if (parsed) {
      return parsed;
    }

    const blockReason = (
      data as { promptFeedback?: { blockReason?: string } }
    )?.promptFeedback?.blockReason;
    lastError = blockReason
      ? `Permintaan diblokir oleh Gemini (${blockReason}).`
      : `Respons Gemini tidak mengandung kategori valid (${model}).`;
  }

  return buatHasilFallback(alasanBersih, lastError);
}

/**
 * Mengambil ID model yang tersedia dari endpoint `/models` apabila belum diset di `.env`
 */
async function resolveOpenAiModel(
  baseV1Url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
  explicitModel: string,
): Promise<string> {
  if (explicitModel) return explicitModel;
  if (isGeminiOpenAiUrl(baseV1Url)) {
    return DEFAULT_GEMINI_MODELS[0];
  }

  const cached = cachedModelByUrl.get(baseV1Url);
  if (cached) return cached;

  try {
    const res = await fetchImpl(`${baseV1Url}/models`, {
      method: 'GET',
      headers,
      signal,
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ id?: string }> };
      const list = Array.isArray(json?.data) ? json.data : [];
      const preferred = list.find(
        (m) =>
          m.id &&
          !m.id.includes('embedding') &&
          !m.id.includes('whisper') &&
          !m.id.includes('tts') &&
          !m.id.includes('dall-e'),
      );
      if (preferred?.id) {
        cachedModelByUrl.set(baseV1Url, preferred.id);
        return preferred.id;
      }
    }
  } catch {
    // Abaikan dan gunakan default model
  }

  return 'gpt-4o-mini';
}

async function klasifikasiViaOpenAiCompatible(
  alasanBersih: string,
  targetUrl: string,
  apiKey: string,
  modelEnv: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<HasilKlasifikasiAI> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const cleanUrl = targetUrl.replace(/\/+$/, '');
  const baseV1Url = cleanUrl.endsWith('/chat/completions')
    ? cleanUrl.replace(/\/chat\/completions$/, '')
    : cleanUrl;
  const completionsUrl = cleanUrl.endsWith('/chat/completions')
    ? cleanUrl
    : `${cleanUrl}/chat/completions`;

  const model = await resolveOpenAiModel(
    baseV1Url,
    headers,
    signal,
    fetchImpl,
    modelEnv,
  );

  const response = await fetchImpl(completionsUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT_KLASIFIKASI,
        },
        {
          role: 'user',
          content: alasanBersih,
        },
      ],
      temperature: 0.1,
    }),
    signal,
  });

  const rawText = await response.text();
  if (!response.ok) {
    return buatHasilFallback(
      alasanBersih,
      ekstrakPesanErrorHttp(response.status, rawText),
    );
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(rawText);
  } catch {
    return buatHasilFallback(
      alasanBersih,
      'Respons JSON endpoint OpenAI-compatible tidak valid.',
    );
  }

  const rawContent = data?.choices?.[0]?.message?.content?.trim() || '';
  const parsed = parseResponsKlasifikasiJson(
    rawContent,
    'openai-compatible',
    model,
  );
  if (parsed) {
    return parsed;
  }

  return buatHasilFallback(
    alasanBersih,
    'Respons endpoint OpenAI-compatible tidak mengandung kategori valid.',
  );
}

async function klasifikasiViaCustomRest(
  alasanBersih: string,
  targetUrl: string,
  apiKey: string,
  signal: AbortSignal,
  fetchImpl: typeof fetch,
): Promise<HasilKlasifikasiAI> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetchImpl(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      alasan: alasanBersih,
      text: alasanBersih,
    }),
    signal,
  });

  const rawText = await response.text();
  if (!response.ok) {
    return buatHasilFallback(
      alasanBersih,
      ekstrakPesanErrorHttp(response.status, rawText),
    );
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawText) as Record<string, unknown>;
  } catch {
    return buatHasilFallback(
      alasanBersih,
      'Respons JSON endpoint AI kustom tidak valid.',
    );
  }

  const resultObj =
    data.result && typeof data.result === 'object'
      ? (data.result as Record<string, unknown>)
      : undefined;
  const dataObj =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : undefined;

  const kategoriHasil =
    data.kategori ||
    data.category ||
    data.prediction ||
    data.label ||
    resultObj?.kategori ||
    dataObj?.kategori;

  if (typeof kategoriHasil === 'string') {
    const kategoriValid = normalisasiKategoriResmi(kategoriHasil);
    if (kategoriValid) {
      const keterangan =
        typeof data.keterangan === 'string'
          ? data.keterangan
          : typeof data.ringkasan === 'string'
            ? data.ringkasan
            : 'Diklasifikasikan otomatis oleh Model AI.';
      return {
        kategori: kategoriValid,
        confidence:
          typeof data.confidence === 'number' ? data.confidence : undefined,
        isFallback: false,
        provider: 'custom',
        keterangan,
      };
    }
  }

  return buatHasilFallback(
    alasanBersih,
    'Respons endpoint AI kustom tidak mengandung kategori valid.',
  );
}

/**
 * Mengklasifikasikan alasan izin dalam bentuk narasi menjadi "Sakit" atau "Izin".
 * Mencoba API Model AI terlebih dahulu (Gemini Free Tier / OpenAI-Compatible / Custom REST);
 * bila endpoint/token bermasalah, otomatis menggunakan klasifikasi lokal agar label Sakit/Izin
 * tetap dihasilkan.
 */
async function klasifikasiInti(
  alasan: string,
  options?: KlasifikasiOptions,
): Promise<HasilKlasifikasiAI> {
  const alasanBersih = (alasan || '').trim();

  if (!alasanBersih) {
    return {
      kategori: KATEGORI_FALLBACK,
      isFallback: true,
      keterangan: 'Alasan kosong.',
      provider: 'local-fallback',
    };
  }

  const cfg = bacaKonfigurasiAi(options);
  const cleanGeminiKey = !isPlaceholderValue(cfg.geminiApiKey)
    ? cfg.geminiApiKey
    : '';
  const cleanApiKey = !isPlaceholderValue(cfg.apiKey) ? cfg.apiKey : '';
  const effectiveKey = cleanApiKey || cleanGeminiKey;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

  try {
    // Prioritas 1: Proxy URL eksplisit (jika bukan placeholder)
    if (!isPlaceholderValue(cfg.proxyUrl)) {
      if (isGeminiNativeUrl(cfg.proxyUrl)) {
        return await klasifikasiViaGeminiNative(
          alasanBersih,
          effectiveKey,
          cfg.proxyUrl,
          cfg.modelEnv,
          controller.signal,
          cfg.fetchImpl,
        );
      }
      if (isOpenAiCompatibleUrl(cfg.proxyUrl, effectiveKey)) {
        return await klasifikasiViaOpenAiCompatible(
          alasanBersih,
          cfg.proxyUrl,
          effectiveKey,
          cfg.modelEnv,
          controller.signal,
          cfg.fetchImpl,
        );
      }
      return await klasifikasiViaCustomRest(
        alasanBersih,
        cfg.proxyUrl,
        cleanApiKey,
        controller.signal,
        cfg.fetchImpl,
      );
    }

    // Prioritas 2: EXPO_PUBLIC_GEMINI_API_KEY langsung (mengoverride EXPO_PUBLIC_AI_API_URL lama)
    if (cleanGeminiKey) {
      return await klasifikasiViaGeminiNative(
        alasanBersih,
        cleanGeminiKey,
        '',
        cfg.modelEnv,
        controller.signal,
        cfg.fetchImpl,
      );
    }

    // Prioritas 3: EXPO_PUBLIC_AI_API_URL
    if (!isPlaceholderValue(cfg.apiUrl)) {
      if (isGeminiNativeUrl(cfg.apiUrl)) {
        return await klasifikasiViaGeminiNative(
          alasanBersih,
          effectiveKey,
          cfg.apiUrl,
          cfg.modelEnv,
          controller.signal,
          cfg.fetchImpl,
        );
      }
      if (isOpenAiCompatibleUrl(cfg.apiUrl, cleanApiKey)) {
        return await klasifikasiViaOpenAiCompatible(
          alasanBersih,
          cfg.apiUrl,
          cleanApiKey,
          cfg.modelEnv,
          controller.signal,
          cfg.fetchImpl,
        );
      }
      return await klasifikasiViaCustomRest(
        alasanBersih,
        cfg.apiUrl,
        cleanApiKey,
        controller.signal,
        cfg.fetchImpl,
      );
    }

    // Prioritas 4: EXPO_PUBLIC_AI_API_KEY langsung berisi Google AI Studio key (AIza...)
    if (cleanApiKey.startsWith('AIza')) {
      return await klasifikasiViaGeminiNative(
        alasanBersih,
        cleanApiKey,
        '',
        cfg.modelEnv,
        controller.signal,
        cfg.fetchImpl,
      );
    }

    return buatHasilFallback(
      alasanBersih,
      'Konfigurasi API AI belum diisi.',
    );
  } catch (err) {
    const isAbort =
      err instanceof Error && err.name === 'AbortError';
    const detail = isAbort
      ? `Koneksi API AI timeout setelah ${cfg.timeoutMs} ms.`
      : err instanceof Error
        ? err.message
        : String(err);
    return buatHasilFallback(alasanBersih, detail);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Titik masuk publik: klasifikasi Sakit/Izin ditambah sentimen. Bila penyedia AI tidak
 * mengirim sentimen, dipakai sentimen lokal. Hasil hanya informasi pendukung Asprak.
 */
export async function klasifikasikanAlasanIzin(
  alasan: string,
  options?: KlasifikasiOptions,
): Promise<HasilKlasifikasiAI> {
  const hasil = await klasifikasiInti(alasan, options);
  return hasil.sentimen ? hasil : { ...hasil, sentimen: sentimenLokal(alasan) };
}
