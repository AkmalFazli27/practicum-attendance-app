/**
 * Script Seeding Data Awal Firebase (10 Asisten Praktikum + Sesi Praktikum)
 *
 * Praktikum:
 * 1. Basis Data
 * 2. Sistem Operasi
 * 3. Pengembangan Perangkat Lunak
 * 4. Struktur Data
 *
 * Asisten Wajib:
 * - Muhammad Akmal Fazli Riyadi (24060124130123)
 * - Farras Hilmy Zaidan (24060124120003)
 * - Eileen Albert Tandrio (24060124140180)
 * - Nouvella Rahma Fitrah Legarsi (24060124120029)
 * + 6 Asisten Rekan Tim Tambahan
 *
 * Jalankan dengan:
 * node scripts/seed-db.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import * as fs from 'node:fs';
import * as path from 'node:path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Konfigurasi Firebase tidak ditemukan di .env!');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_PASSWORD = 'password123';

const DAFTAR_ASPRAK = [
  {
    nama: 'Farras Hilmy Zaidan',
    email: 'farras@tapin.ac.id',
    nim: '24060124120003',
    praktikum: 'Pengembangan Perangkat Lunak',
    lab: 'Lab Multimedia',
  },
  {
    nama: 'Muhammad Akmal Fazli Riyadi',
    email: 'akmal@tapin.ac.id',
    nim: '24060124130123',
    praktikum: 'Basis Data',
    lab: 'Lab Basis Data',
  },
  {
    nama: 'Eileen Albert Tandrio',
    email: 'eileen@tapin.ac.id',
    nim: '24060124140180',
    praktikum: 'Sistem Operasi',
    lab: 'Lab Jaringan & Sistem',
  },
  {
    nama: 'Nouvella Rahma Fitrah Legarsi',
    email: 'nouvella@tapin.ac.id',
    nim: '24060124120029',
    praktikum: 'Struktur Data',
    lab: 'Lab Komputasi Dasar',
  },
  {
    nama: 'Arya Putra Pradana',
    email: 'arya@tapin.ac.id',
    nim: '24060124120035',
    praktikum: 'Basis Data',
    lab: 'Lab Basis Data',
  },
  {
    nama: 'Nabila Syahrani',
    email: 'nabila@tapin.ac.id',
    nim: '24060124130042',
    praktikum: 'Pengembangan Perangkat Lunak',
    lab: 'Lab Multimedia',
  },
  {
    nama: 'Dimas Rizky Ramadhan',
    email: 'dimas@tapin.ac.id',
    nim: '24060124140058',
    praktikum: 'Sistem Operasi',
    lab: 'Lab Jaringan & Sistem',
  },
  {
    nama: 'Zahra Annisa Putri',
    email: 'zahra@tapin.ac.id',
    nim: '24060124120064',
    praktikum: 'Struktur Data',
    lab: 'Lab Komputasi Dasar',
  },
  {
    nama: 'Rian Hidayatulloh',
    email: 'rian@tapin.ac.id',
    nim: '24060124130079',
    praktikum: 'Basis Data',
    lab: 'Lab Basis Data',
  },
  {
    nama: 'Tasya Salsabila',
    email: 'tasya@tapin.ac.id',
    nim: '24060124140091',
    praktikum: 'Struktur Data',
    lab: 'Lab Komputasi Dasar',
  },
];

async function seed() {
  console.log('🚀 Memulai proses seeding data Asisten & Sesi ke Firebase...\n');
  console.log(`📌 Project ID : ${firebaseConfig.projectId}`);
  console.log(`🔑 Password Default Asprak : ${DEFAULT_PASSWORD}\n`);

  for (const asprak of DAFTAR_ASPRAK) {
    let uid = '';

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        asprak.email,
        DEFAULT_PASSWORD,
      );
      uid = userCredential.user.uid;
      console.log(`✅ [AUTH] Akun baru dibuat: ${asprak.email} (${uid})`);
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        const loginRes = await signInWithEmailAndPassword(
          auth,
          asprak.email,
          DEFAULT_PASSWORD,
        );
        uid = loginRes.user.uid;
        console.log(`ℹ️ [AUTH] Akun sudah ada, login berhasil: ${asprak.email} (${uid})`);
      } else {
        console.error(`❌ [AUTH GAGAL] ${asprak.email}: ${err?.message}`);
        continue;
      }
    }

    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          nama: asprak.nama,
          email: asprak.email,
          nim: asprak.nim,
          peran: 'asisten',
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
      console.log(`  📄 [FIRESTORE] Profil asisten tersimpan: ${asprak.nama}`);
    } catch (err) {
      console.error(`  ❌ [FIRESTORE GAGAL] Simpan profil: ${err?.message}`);
      continue;
    }

    try {
      const sesiQuery = query(
        collection(db, 'sesi'),
        where('asistenId', '==', uid),
      );
      const sesiSnap = await getDocs(sesiQuery);

      if (sesiSnap.empty) {
        const sesiContoh = {
          namaPraktikum: asprak.praktikum,
          topik: `Modul 1: Pengenalan & Lingkungan Kerja ${asprak.praktikum}`,
          kelas: 'IF-2A',
          lab: asprak.lab,
          tanggal: '2026-11-20',
          jamMulai: '08:00',
          jamSelesai: '10:00',
          kapasitas: 32,
          asistenId: uid,
          status: 'TERJADWAL',
          deskripsi: `Sesi praktikum ${asprak.praktikum} kelas IF-2A bersama asisten ${asprak.nama}.`,
        };

        const docRef = await addDoc(collection(db, 'sesi'), sesiContoh);
        console.log(
          `  🗓️ [SESI] Sesi awal dibuat: ${asprak.praktikum} (ID: ${docRef.id})`,
        );
      } else {
        console.log(`  🗓️ [SESI] Sesi sudah ada (${sesiSnap.size} sesi).`);
      }
    } catch (err) {
      console.error(`  ❌ [SESI GAGAL] ${err?.message}`);
    }

    console.log('------------------------------------------------------------');
  }

  console.log('\n🎉 SEEDING SELESAI!');
  console.log('Semua 10 akun asisten praktikum sudah siap digunakan untuk login.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
