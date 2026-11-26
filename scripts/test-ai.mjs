/**
 * Pengujian layanan klasifikasi alasan izin AI (`src/services/ai.ts`).
 *
 * Penggunaan:
 *   node scripts/test-ai.mjs          # Uji live ke API sesuai .env
 *   node scripts/test-ai.mjs --live   # Uji live ke API sesuai .env
 *   node scripts/test-ai.mjs --mock   # Uji offline dengan mock fetch (tanpa jaringan)
 */

import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  DEFAULT_GEMINI_MODELS,
  formatLabelKategoriAi,
  klasifikasikanAlasanIzin,
  normalisasiKategoriResmi,
} from '../src/services/ai.ts';

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function maskSecret(val) {
  const s = (val || '').trim();
  if (!s) return '(kosong)';
  if (s.length <= 8) return `${s.slice(0, 2)}***`;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function makeJsonResponse(status, body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function runMockTests() {
  console.log('=== Menjalankan Pengujian Mock Layanan AI (--mock) ===\n');

  const tests = [];
  const addTest = (name, fn) => tests.push({ name, fn });

  // Test 1: Gemini Native happy path (Sakit & Izin)
  addTest('Gemini Native happy path (Sakit & Izin)', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url: String(url), init });
      const reqBody = JSON.parse(String(init.body));
      const text = reqBody.contents[0].parts[0].text;
      const kategori = text.includes('demam') ? 'Sakit' : 'Izin';
      return makeJsonResponse(200, {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    kategori,
                    keterangan: `Ringkasan uji untuk ${kategori}.`,
                  }),
                },
              ],
            },
          },
        ],
      });
    };

    const resSakit = await klasifikasikanAlasanIzin(
      'Saya demam tinggi dan harus beristirahat.',
      {
        geminiApiKey: 'AIzaTestMockKey123456',
        apiUrl: '',
        apiKey: '',
        proxyUrl: '',
        model: '',
        fetchImpl: mockFetch,
      },
    );

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
    );
    assert.equal(calls[0].url.includes('AIza'), false);
    assert.equal(calls[0].init.headers['x-goog-api-key'], 'AIzaTestMockKey123456');

    const sentBody = JSON.parse(String(calls[0].init.body));
    assert.equal(sentBody.generationConfig.responseMimeType, 'application/json');
    assert.deepEqual(sentBody.generationConfig.responseSchema.properties.kategori.enum, [
      'Sakit',
      'Izin',
    ]);
    assert.equal(resSakit.kategori, 'Sakit');
    assert.equal(resSakit.isFallback, false);
    assert.equal(resSakit.provider, 'gemini');
    assert.equal(resSakit.model, 'gemini-2.5-flash-lite');

    const resIzin = await klasifikasikanAlasanIzin(
      'Saya ikut lomba nasional mewakili fakultas.',
      {
        geminiApiKey: 'AIzaTestMockKey123456',
        apiUrl: '',
        apiKey: '',
        proxyUrl: '',
        model: '',
        fetchImpl: mockFetch,
      },
    );
    assert.equal(resIzin.kategori, 'Izin');
    assert.equal(resIzin.isFallback, false);
    assert.equal(resIzin.provider, 'gemini');
  });

  // Test 2: Gemini Native skips thought parts
  addTest('Gemini Native mengabaikan thought parts dan membaca JSON akhir', async () => {
    const mockFetch = async () =>
      makeJsonResponse(200, {
        candidates: [
          {
            content: {
              parts: [
                { thought: true, text: 'Analisis internal bahwa keluarga yang sakit bukan praktikan.' },
                {
                  text: '{"kategori":"Izin","keterangan":"Menemani anggota keluarga yang sedang dirawat."}',
                },
              ],
            },
          },
        ],
      });

    const res = await klasifikasikanAlasanIzin(
      'Kakek saya dirawat di rumah sakit sehingga saya harus menemani beliau.',
      {
        geminiApiKey: 'AIzaTestMockKey123456',
        apiUrl: '',
        apiKey: '',
        proxyUrl: '',
        model: '',
        fetchImpl: mockFetch,
      },
    );

    assert.equal(res.kategori, 'Izin');
    assert.equal(res.isFallback, false);
    assert.equal(res.provider, 'gemini');
    assert.equal(res.keterangan, 'Menemani anggota keluarga yang sedang dirawat.');
  });

  // Test 3: Retry next candidate model on 404 or 429
  addTest('Gemini Native mencoba model cadangan saat status 404/429', async () => {
    const calledUrls = [];
    const mockFetch = async (url) => {
      calledUrls.push(String(url));
      if (calledUrls.length === 1) {
        return makeJsonResponse(404, { error: { message: 'Model not found' } });
      }
      if (calledUrls.length === 2) {
        return makeJsonResponse(429, { error: { message: 'Rate limit exceeded' } });
      }
      return makeJsonResponse(200, {
        candidates: [
          {
            content: {
              parts: [
                { text: '{"kategori":"Sakit","keterangan":"Praktikan mengalami demam."}' },
              ],
            },
          },
        ],
      });
    };

    const res = await klasifikasikanAlasanIzin('Kepala pusing dan demam.', {
      geminiApiKey: 'AIzaTestMockKey123456',
      apiUrl: '',
      apiKey: '',
      proxyUrl: '',
      model: '',
      fetchImpl: mockFetch,
    });

    assert.equal(calledUrls.length, 3);
    assert.equal(
      calledUrls[0].includes(`/models/${DEFAULT_GEMINI_MODELS[0]}:generateContent`),
      true,
    );
    assert.equal(
      calledUrls[1].includes(`/models/${DEFAULT_GEMINI_MODELS[1]}:generateContent`),
      true,
    );
    assert.equal(
      calledUrls[2].includes(`/models/${DEFAULT_GEMINI_MODELS[2]}:generateContent`),
      true,
    );
    assert.equal(res.kategori, 'Sakit');
    assert.equal(res.isFallback, false);
    assert.equal(res.model, DEFAULT_GEMINI_MODELS[2]);
  });

  // Test 4: Stop immediately on 401/403
  addTest('Gemini Native langsung berhenti pada 401/403 dan fallback lokal', async () => {
    for (const status of [401, 403]) {
      let callCount = 0;
      const mockFetch = async () => {
        callCount += 1;
        return makeJsonResponse(status, {
          error: { message: `Auth error ${status}` },
        });
      };

      const res = await klasifikasikanAlasanIzin('Saya demam tinggi hari ini.', {
        geminiApiKey: 'AIzaInvalidKey123456',
        apiUrl: '',
        apiKey: '',
        proxyUrl: '',
        model: '',
        fetchImpl: mockFetch,
      });

      assert.equal(callCount, 1);
      assert.equal(res.isFallback, true);
      assert.equal(res.provider, 'local-fallback');
      assert.equal(res.kategori, 'Sakit');
      assert.ok(res.errorDetail && res.errorDetail.includes(`HTTP ${status}`));
    }
  });

  // Test 5: Gemini OpenAI-compatible URL
  addTest('Gemini OpenAI-compatible URL memakai /chat/completions & gemini-2.5-flash-lite', async () => {
    const calls = [];
    const mockFetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return makeJsonResponse(200, {
        choices: [
          {
            message: {
              content: '{"kategori":"Izin","keterangan":"Mengikuti kompetisi kampus."}',
            },
          },
        ],
      });
    };

    const res = await klasifikasikanAlasanIzin('Izin ikut lomba.', {
      geminiApiKey: '',
      apiUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: 'AIzaOpenAiCompatKey123',
      proxyUrl: '',
      model: '',
      fetchImpl: mockFetch,
    });

    assert.equal(calls.length, 1);
    assert.equal(
      calls[0].url,
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    );
    assert.equal(calls[0].init.headers.Authorization, 'Bearer AIzaOpenAiCompatKey123');
    const body = JSON.parse(String(calls[0].init.body));
    assert.equal(body.model, 'gemini-2.5-flash-lite');
    assert.equal(res.provider, 'openai-compatible');
    assert.equal(res.isFallback, false);
    assert.equal(res.kategori, 'Izin');
  });

  // Test 6: Generic OpenAI-compatible & Custom REST
  addTest('Endpoint OpenAI-compatible umum & Custom REST tetap bekerja', async () => {
    const mockOpenAiFetch = async (url) => {
      const s = String(url);
      if (s.endsWith('/models')) {
        return makeJsonResponse(200, { data: [{ id: 'custom-llm-chat' }] });
      }
      return makeJsonResponse(200, {
        choices: [
          {
            message: {
              content: '{"kategori":"Sakit","keterangan":"Demam dan perlu istirahat."}',
            },
          },
        ],
      });
    };

    const openAiRes = await klasifikasikanAlasanIzin('Demam sejak malam.', {
      geminiApiKey: '',
      apiUrl: 'https://mock-llm.local/v1',
      apiKey: 'sk-test-token',
      proxyUrl: '',
      model: '',
      fetchImpl: mockOpenAiFetch,
    });
    assert.equal(openAiRes.provider, 'openai-compatible');
    assert.equal(openAiRes.model, 'custom-llm-chat');
    assert.equal(openAiRes.kategori, 'Sakit');
    assert.equal(openAiRes.isFallback, false);

    const customRes = await klasifikasikanAlasanIzin('Motor mogok di jalan.', {
      geminiApiKey: '',
      apiUrl: 'https://custom-classifier.local/classify',
      apiKey: '',
      proxyUrl: '',
      model: '',
      fetchImpl: async () =>
        makeJsonResponse(200, {
          kategori: 'Izin',
          confidence: 0.96,
          keterangan: 'Kendala transportasi.',
        }),
    });
    assert.equal(customRes.provider, 'custom');
    assert.equal(customRes.kategori, 'Izin');
    assert.equal(customRes.confidence, 0.96);
    assert.equal(customRes.isFallback, false);

    // Pastikan nilai placeholder diabaikan tanpa memanggil fetch jaringan
    let placeholderFetchCalled = false;
    const placeholderRes = await klasifikasikanAlasanIzin('Saya demam.', {
      geminiApiKey: 'your_gemini_key_here',
      apiUrl: 'https://api-ai-placeholder.edu/v1',
      apiKey: 'your_optional_api_key_here',
      proxyUrl: '',
      model: '',
      fetchImpl: async () => {
        placeholderFetchCalled = true;
        throw new Error('Seharusnya tidak memanggil fetch untuk placeholder');
      },
    });
    assert.equal(placeholderFetchCalled, false);
    assert.equal(placeholderRes.isFallback, true);
    assert.equal(placeholderRes.provider, 'local-fallback');
    assert.equal(placeholderRes.kategori, 'Sakit');
  });

  // Test 7: Precedence of geminiApiKey over stale apiUrl
  addTest('EXPO_PUBLIC_GEMINI_API_KEY memprioritaskan Gemini Native di atas AI_API_URL lama', async () => {
    const calledUrls = [];
    const mockFetch = async (url) => {
      calledUrls.push(String(url));
      return makeJsonResponse(200, {
        candidates: [
          {
            content: {
              parts: [
                { text: '{"kategori":"Izin","keterangan":"Keperluan keluarga mendesak."}' },
              ],
            },
          },
        ],
      });
    };

    const res = await klasifikasikanAlasanIzin('Ada acara keluarga penting.', {
      geminiApiKey: 'AIzaPriorityGeminiKey999',
      apiUrl: 'https://aotianzz.xyz/v1',
      apiKey: 'sk-old-invalid-token',
      proxyUrl: '',
      model: '',
      fetchImpl: mockFetch,
    });

    assert.equal(calledUrls.length, 1);
    assert.equal(
      calledUrls[0].startsWith('https://generativelanguage.googleapis.com/v1beta/models/'),
      true,
    );
    assert.equal(res.provider, 'gemini');
    assert.equal(res.isFallback, false);
    assert.equal(res.kategori, 'Izin');
  });

  // Test 8: normalisasiKategoriResmi & formatLabelKategoriAi
  addTest('normalisasiKategoriResmi & formatLabelKategoriAi (ID & EN)', async () => {
    assert.equal(normalisasiKategoriResmi('Sakit / Medis'), 'Sakit');
    assert.equal(normalisasiKategoriResmi('Akademik / Delegasi'), 'Izin');
    assert.equal(normalisasiKategoriResmi('Belum Terklasifikasi'), null);

    assert.deepEqual(formatLabelKategoriAi('Sakit', undefined, false), {
      kategoriResmi: 'Sakit',
      label: 'Sakit',
      terklasifikasi: true,
    });
    assert.deepEqual(formatLabelKategoriAi('Sakit', undefined, true), {
      kategoriResmi: 'Sakit',
      label: 'Sick',
      terklasifikasi: true,
    });
    assert.deepEqual(formatLabelKategoriAi('Izin', undefined, true), {
      kategoriResmi: 'Izin',
      label: 'Excused Leave',
      terklasifikasi: true,
    });
    assert.deepEqual(formatLabelKategoriAi('Belum Terklasifikasi', undefined, false), {
      kategoriResmi: null,
      label: 'Belum terklasifikasi',
      terklasifikasi: false,
    });
  });

  let passed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      passed += 1;
      console.log(`[PASS] ${t.name}`);
    } catch (err) {
      console.error(`[FAIL] ${t.name}`);
      console.error(err);
      process.exitCode = 1;
    }
  }

  console.log(`\nRingkasan Mock: ${passed}/${tests.length} skenario lulus.`);
}

async function runLiveTests() {
  loadDotEnv();

  const proxyUrl = (process.env.EXPO_PUBLIC_AI_PROXY_URL || '').trim();
  const geminiKey = (process.env.EXPO_PUBLIC_GEMINI_API_KEY || '').trim();
  const apiUrl = (process.env.EXPO_PUBLIC_AI_API_URL || '').trim();
  const apiKey = (process.env.EXPO_PUBLIC_AI_API_KEY || '').trim();
  const modelEnv = (process.env.EXPO_PUBLIC_AI_MODEL || '').trim();

  let activeMode = 'Belum terkonfigurasi (akan memakai local-fallback)';
  if (proxyUrl) {
    activeMode = `Proxy (${proxyUrl})`;
  } else if (geminiKey) {
    activeMode = 'Gemini API Native (EXPO_PUBLIC_GEMINI_API_KEY)';
  } else if (apiUrl && !apiUrl.toLowerCase().includes('placeholder')) {
    activeMode = apiUrl.toLowerCase().includes('generativelanguage.googleapis.com')
      ? `Gemini via EXPO_PUBLIC_AI_API_URL (${apiUrl})`
      : `OpenAI-compatible / Custom (${apiUrl})`;
  } else if (apiKey.startsWith('AIza')) {
    activeMode = 'Gemini API Native (EXPO_PUBLIC_AI_API_KEY)';
  }

  console.log('=== Pengujian Live Layanan AI Klasifikasi Izin ===');
  console.log(`Mode terdeteksi          : ${activeMode}`);
  console.log(`EXPO_PUBLIC_GEMINI_API_KEY: ${maskSecret(geminiKey)}`);
  console.log(`EXPO_PUBLIC_AI_API_URL    : ${apiUrl || '(kosong)'}`);
  console.log(`EXPO_PUBLIC_AI_API_KEY    : ${maskSecret(apiKey)}`);
  console.log(`EXPO_PUBLIC_AI_MODEL      : ${modelEnv || '(otomatis)'}\n`);

  const cases = [
    {
      nama: 'Kasus 1 (Sakit jelas — IGD & demam)',
      expected: 'Sakit',
      alasan:
        'Permisi kak, saya tidak bisa masuk praktikum hari ini karena semalam masuk IGD dan sekarang masih demam tinggi 39 derajat.',
    },
    {
      nama: 'Kasus 2 (Izin jelas — lomba delegasi)',
      expected: 'Izin',
      alasan:
        'Maaf kak, saya mewakili kampus untuk lomba Gemastik di luar kota selama 3 hari.',
    },
    {
      nama: 'Kasus 3 (Sakit semantik — tanpa kata kunci dasar)',
      expected: 'Sakit',
      alasan:
        'Mohon maaf kak, sejak subuh kepala saya berdenyut hebat dan mata berkunang-kunang jadi harus bedrest dulu.',
    },
    {
      nama: 'Kasus 4 (Izin vs Sakit — menemani keluarga di RS)',
      expected: 'Izin',
      alasan:
        'Izin tidak hadir kak, kakek saya sedang dirawat di rumah sakit sehingga saya harus menemani beliau.',
    },
    {
      nama: 'Kasus 5 (Izin kendala transportasi & cuaca)',
      expected: 'Izin',
      alasan: 'Mohon izin tidak bisa datang, motor mogok di jalan dan hujan deras.',
    },
  ];

  let realAiMatchCount = 0;
  const fallbackErrors = new Set();

  for (const c of cases) {
    const start = Date.now();
    const res = await klasifikasikanAlasanIzin(c.alasan);
    const ms = Date.now() - start;

    const labelOk = res.kategori === c.expected;
    const realAiOk = res.isFallback === false;
    const ok = labelOk && realAiOk;
    if (ok) realAiMatchCount += 1;
    if (res.errorDetail) fallbackErrors.add(res.errorDetail);

    console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.nama}`);
    console.log(`  Output     : ${res.kategori} (harapan: ${c.expected})`);
    console.log(
      `  Provider   : ${res.provider ?? '-'} | Model: ${res.model ?? '-'} | Fallback: ${res.isFallback} | Latensi: ${ms} ms`,
    );
    console.log(`  Keterangan : ${res.keterangan ?? '-'}`);
    if (res.errorDetail) {
      console.log(`  ErrorDetail: ${res.errorDetail}`);
    }
    console.log('');
  }

  console.log(
    `Ringkasan Live: ${realAiMatchCount}/${cases.length} kasus lulus via API AI nyata (non-fallback).`,
  );

  if (realAiMatchCount < cases.length) {
    console.error('\nPengujian live GAGAL: AI eksternal belum aktif atau hasil tidak sesuai.');
    if (fallbackErrors.size > 0) {
      console.error('Penyebab terdeteksi:');
      for (const e of fallbackErrors) {
        console.error(`  - ${e}`);
      }
    }
    process.exitCode = 1;
  }
}

const isMock = process.argv.includes('--mock');
if (isMock) {
  await runMockTests();
} else {
  await runLiveTests();
}
