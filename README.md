# TapIn

**Tap once. You're in.**

TapIn adalah aplikasi presensi praktikum untuk asisten dan praktikan dalam satu aplikasi. Pengunjung dapat melihat jadwal tanpa login, asisten dapat membuka dan menutup sesi serta memantau kehadiran, sedangkan praktikan dapat melakukan presensi saat sesi dibuka dan melihat riwayat kehadirannya.

Sprint 1 berfokus pada antarmuka dan alur praktikum menggunakan data dummy. Belum ada Firebase, autentikasi nyata, QR, PIN, atau notifikasi. Seluruh data masih tersimpan di state aplikasi dan hilang saat aplikasi ditutup.

Dibangun dengan **Expo SDK 58**, **React Native**, **TypeScript**, dan **Expo Router**. Web digunakan sebagai sarana pengembangan dan pengujian; target utama tetap perangkat mobile.

## Status Sprint 1

**Implementasi inti selesai dan sudah masuk `main`.** Tahap akhir yang masih berjalan: verifikasi end-to-end, build APK preview, demo, dan tag `v0.1-sprint1`.

Detail jobdesk, kriteria terima, dan jadwal ada di [`docs/sprints/sprint-1.md`](docs/sprints/sprint-1.md).

## Fitur Sprint 1

| FR | Fitur | Area | Status |
| --- | --- | --- | --- |
| FR-01 | Landing publik + detail sesi | P1 | Selesai |
| FR-02 | Login dummy + routing peran | P1 | Selesai |
| FR-03 | Beranda asisten | P2 | Selesai |
| FR-04 | Detail sesi asisten + buka/tutup/buka lagi + daftar hadir | P2 | Selesai |
| FR-05 | Beranda praktikan + filter | P3 | Selesai |
| FR-06 | Detail sesi praktikan + presensi | P3 | Selesai |
| FR-07 | Pencegahan presensi ganda | P3 + PM | Selesai |
| FR-08 | Rekap kehadiran asisten | P2 | Selesai |
| FR-09 | Riwayat kehadiran praktikan | P3 | Selesai |
| FR-10 | Form, modal, dan bottom sheet | P1 + P2/P3 | Selesai |

Catatan FR-07: presensi ganda dicegah dengan menonaktifkan tombol setelah presensi pertama dan tetap menampilkan waktu presensi tersebut. `SessionContext` juga menolak duplikat sebagai lapisan pengaman.

## Di luar cakupan Sprint 1

- Firebase dan autentikasi nyata.
- QR, PIN, wajah, atau lokasi.
- Badge Izin/Alpa.
- Membuat, mengubah, atau menghapus sesi.
- Pencarian, ekspor, statistik, dan notifikasi.
- Tab Beranda dashboard terpisah.

## Pembagian Tugas

| Peran | Nama | Tanggung jawab |
| --- | --- | --- |
| PM | Pemilik repository | Fondasi, data/context, token/font, review/merge, EAS, demo/tag |
| P1 | Farras | Shell, landing, login, dan 5 komponen UI |
| P2 | Eileen | Beranda asisten, detail sesi, daftar hadir, rekap, profil |
| P3 | Nouvella | Beranda praktikan, detail, presensi, riwayat, profil |

File area: `src/app/(asisten)/**` dan `src/components/asisten/**` milik P2; `src/app/(praktikan)/**` dan `src/components/praktikan/**` milik P3; shell, landing, login, dan `src/components/ui/**` milik P1. File bersama (`app.json`, `eas.json`, `src/data/**`, `src/context/**`, `src/theme/**`, `README.md`, `docs/**`) milik PM.

## Akun Demo

Login masih dummy dan **tanpa password**. Pilih peran, lalu pilih nama.

| Peran | Nama | NIM | Kelas | Catatan |
| --- | --- | --- | --- | --- |
| Asisten | Budi Santoso | 2210512001 | — | Mengelola sesi IF-2A |
| Asisten | Siti Rahma | 2210512002 | — | Mengelola sesi IF-2B |
| Praktikan | Andi Pratama | 2310512001 | IF-2A | Sudah presensi sesi Pemrograman Web |
| Praktikan | Bella Putri | 2310512002 | IF-2A | Sudah presensi sesi Pemrograman Web |
| Praktikan | Citra Dewi | 2310512003 | IF-2A | Belum presensi; cocok untuk tes presensi |
| Praktikan | Dimas Saputra | 2310512004 | IF-2A | Belum presensi |
| Praktikan | Eka Lestari | 2310512005 | IF-2B | Memiliki riwayat sesi Sistem Operasi |
| Praktikan | Fajar Nugroho | 2310512006 | IF-2B | Memiliki riwayat sesi Sistem Operasi |
| Praktikan | Gita Maharani | 2310512007 | IF-2B | Memiliki riwayat sesi Sistem Operasi |
| Praktikan | Hendra Wijaya | 2310512008 | IF-2B | Belum presensi |

Data sesi yang berguna untuk demo:

- **Pemrograman Web — IF-2A**, status `DIBUKA`; Andi dan Bella sudah tercatat hadir.
- **Basis Data — IF-2A**, status `TERJADWAL`.
- **Sistem Operasi — IF-2B**, status `SELESAI`; Eka, Fajar, dan Gita sudah tercatat hadir.

## Alur Demo

1. Buka aplikasi tanpa login. Landing menampilkan jadwal; aksi diarahkan ke login.
2. Login sebagai asisten.
3. Buka sesi `TERJADWAL`.
4. Logout, lalu login sebagai praktikan.
5. Lakukan presensi pada sesi yang dibuka. Waktu kehadiran tampil.
6. Coba presensi lagi pada sesi yang sama; tombol nonaktif dan waktu presensi pertama tampil.
7. Buka Riwayat praktikan, lalu login asisten dan buka Rekap.
8. Asisten menutup sesi; tombol presensi praktikan menjadi tidak aktif.

## Menjalankan

```bash
npm install
npx expo start
```

Pindai QR dengan **Expo Go di HP Android**. Jika jaringan bermasalah:

```bash
npx expo start --tunnel
```

Untuk web:

```bash
npm run web
```

atau tekan `w` setelah `npx expo start`.

Catatan pengujian:

- Web cocok untuk iterasi cepat, tetapi tidak menguji seluruh perilaku native.
- Android Expo Go adalah jalur pengujian native yang paling mudah.
- Expo Go SDK 58 di iOS memerlukan TestFlight/Apple Developer Program; untuk web di iPhone, buka alamat LAN Expo melalui Safari.

Pemeriksaan sebelum membuka pull request:

```bash
npx tsc --noEmit
npx expo export --platform web
```

Jika `tsc` mengeluh soal route yang tidak dikenal, jalankan `npx expo start --clear` sekali untuk memperbarui typed routes.

## Struktur

```text
src/
  app/                    # route Expo Router (satu file = satu layar)
    (asisten)/            # area asisten + guard peran
    (praktikan)/          # area praktikan + guard peran
  components/ui/          # komponen bersama
  components/asisten/     # komponen area asisten
  components/praktikan/   # komponen area praktikan
  context/                # state global sesi dan presensi
  data/                   # tipe dan data dummy
  theme/                  # token desain + hook font
  utils/                  # format tanggal dan jam
docs/
  PRD.md                  # kebutuhan seluruh produk
  DESIGN.md               # token, navigasi, wireframe Sprint 1
  WORKFLOW-GIT.md         # aturan branch, PR, dan rilis
  SETUP.md                # setup repository, Expo, dan EAS
  sprints/                # jobdesk per area dan demo per sprint
```

## Route Utama

| Halaman | Route internal | URL web |
| --- | --- | --- |
| Landing | `/` | `/` |
| Login | `/login` | `/login` |
| Beranda asisten | `/(asisten)/(tabs)/sesi` | `/sesi` |
| Rekap asisten | `/(asisten)/(tabs)/rekap` | `/rekap` |
| Beranda praktikan | `/(praktikan)/(tabs)/jadwal` | `/jadwal` |
| Riwayat praktikan | `/(praktikan)/(tabs)/riwayat` | `/riwayat` |
| Profil | `/(asisten)/(tabs)/profil` atau `/(praktikan)/(tabs)/profil` | `/profil` |
| Detail sesi | `/(asisten)/sesi/[id]` atau `/(praktikan)/sesi/[id]` | `/sesi/[id]` |

Nama dalam tanda kurung adalah **route group** dan tidak ditulis di browser. Saat menguji web, gunakan `/sesi` dan `/jadwal`, bukan `/(asisten)/(tabs)/sesi`.

## Testing

Perintah:

```bash
npx tsc --noEmit
npx expo export --platform web
```

Checklist manual:

- Landing tanpa login: footer CTA tampil; tidak ada login cepat.
- Login praktikan: masuk ke `/jadwal`.
- Login asisten: masuk ke `/sesi`.
- Presensi praktikan: banner hijau dan waktu tampil.
- Presensi kedua: tombol nonaktif dan waktu pertama tetap terlihat.
- Riwayat praktikan hanya menampilkan catatan milik pengguna.
- Rekap asisten menampilkan nama dan waktu kehadiran.
- Logout: kembali ke landing.
- Refresh `/login`: tidak ada error update berulang.
- Tombol back Android dan safe area di layar kecil.

## Batasan Sprint 1

- Data hanya tersimpan di memori; refresh atau aplikasi ditutup akan mereset state.
- Belum ada database, Firebase, atau autentikasi nyata.
- Login dummy tanpa password.
- Web hanya untuk pengembangan dan pengujian, bukan target produksi.
- Pengujian native iOS belum menjadi jalur utama karena keterbatasan Expo Go SDK 58.

## Mulai untuk Programmer

1. Clone repository, lalu jalankan `npm install` dan `npx expo start`.
2. Baca `docs/PRD.md` (requirement), `docs/DESIGN.md` (tampilan), `docs/sprints/sprint-1.md` (jobdesk area), dan `docs/WORKFLOW-GIT.md` (alur PR).
3. Cek area kamu: Farras (P1 — shell, landing, login, UI kit), Eileen (P2 — asisten), Nouvella (P3 — praktikan).
4. Buat branch dari `main`, kerjakan area sendiri, lalu buka PR.
5. Jangan merge sendiri. Hanya PM yang menekan tombol merge.
6. Jika butuh komponen atau token dari area lain, minta ke pemilik area; jangan menduplikasi.

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | Requirement lengkap seluruh sprint |
| [docs/DESIGN.md](docs/DESIGN.md) | Token, navigasi, wireframe, dan state Sprint 1 |
| [docs/ui-ux-design-system-graphite-lime.md](docs/ui-ux-design-system-graphite-lime.md) | Design system visual Graphite Lime |
| [docs/WORKFLOW-GIT.md](docs/WORKFLOW-GIT.md) | Alur kerja Git dan review |
| [docs/SETUP.md](docs/SETUP.md) | Setup lokal, GitHub, dan EAS |
| [docs/sprints/sprint-1.md](docs/sprints/sprint-1.md) | Jobdesk per area dan jadwal sprint berjalan |

## Catatan

- EAS: `eas.json` sudah memiliki profil `preview` dengan `buildType: "apk"`. Untuk membuat APK:
  ```bash
  npx eas-cli@latest login
  npx eas-cli@latest build --platform android --profile preview
  ```
- Data identitas, jadwal, dan sesi masih dummy.
- Tag rilis `v0.1-sprint1` belum dibuat sampai demo akhir lolos.


---

## Kelanjutan Sprint 2 — Data Dinamis dengan Firebase & Integrasi AI

Pada **Sprint 2**, aplikasi **TapIn** dikembangkan dari fondasi data lokal/dummy pada Sprint 1 menjadi aplikasi *real-time* multi-pengguna yang terhubung dengan **Firebase Authentication**, **Cloud Firestore**, serta **API Model AI** untuk klasifikasi alasan izin ketidakhadiran praktikan.

Sebelum ketiga programmer memulai pengembangan fitur Sprint 2, **PM (Farras)** telah menyelesaikan **Refactor UI Parity Pra-Sprint** sesuai prototipe Figma Make (*Graphite Lime*), mencakup struktur navigasi 4 tab dengan halaman Beranda terpisah (`/beranda-asisten` dan `/beranda-praktikan`), komponen UI Kit baru (`AppHeader`, `Toast`, `ConfirmSheet`, `SessionCard`, `ScoreRing`, `MetricCard`), Landing Hero bersih, form Auth 2 tab (Masuk & Daftar Akun), sheet CRUD sesi asisten, serta sheet pengajuan & panel pemeriksaan izin berbantuan AI.

Detail lengkap pembagian area, kriteria terima, dan jadwal kerja berada di [`docs/sprints/sprint-2.md`](docs/sprints/sprint-2.md).

### Fitur Sprint 2 (FR-11 s.d. FR-18)

| FR | Fitur | Area | Status |
| --- | --- | --- | --- |
| FR-00 | Refactor UI Parity Pra-Sprint (4 tab + Beranda, UI Kit baru, antarmuka fitur Sprint 2) | PM (Farras) | Selesai |
| FR-11 | Autentikasi pengguna (Registrasi, Login, Logout dengan Firebase Auth & peran di Firestore) | PM + P1 (Akmal) | Berjalan |
| FR-12 | Pengelolaan data praktikum (CRUD sesi praktikum oleh asisten di Firestore & jadwal praktikan) | PM + P2 (Eileen) + P3 (Nouvella) | Berjalan |
| FR-13 | Presensi terintegrasi di Firestore & pencegahan presensi ganda per akun dan sesi | PM + P3 (Nouvella) | Berjalan |
| FR-14 | Sinkronisasi data *real-time* (`onSnapshot`) untuk status sesi, presensi, izin, dan rekap | PM + P1 / P2 / P3 | Berjalan |
| FR-15 | Pengajuan izin praktikan dengan alasan ketidakhadiran & pemantauan status di Firestore | P3 (Nouvella) + PM | Berjalan |
| FR-16 | Integrasi API Model AI untuk prediksi kategori alasan izin sebagai informasi pendukung | PM (Service) + P3 (Trigger) | Berjalan |
| FR-17 | Pemeriksaan izin oleh asisten (melihat alasan, kategori AI, serta menerima/menolak izin) | P2 (Eileen) + PM | Berjalan |
| FR-18 | Validasi input, penanganan kondisi (*loading*, *empty*, *error*), dan Firebase Security Rules | PM + P1 / P2 / P3 | Berjalan |

### Pembagian Tugas Sprint 2

| Peran | Nama | Tanggung jawab Sprint 2 |
| --- | --- | --- |
| PM | Farras | Refactor UI Pra-Sprint, konfigurasi Firebase & API AI (`src/config/firebase.ts`, `src/services/ai.ts`, `firestore.rules`, `SessionContext.tsx`), review/merge PR, build APK EAS, rilis `v0.2-sprint2` |
| P1 | Akmal | Integrasi Login & Registrasi Firebase Authentication (`src/app/login.tsx`), persistensi sesi & guard Landing (`src/app/index.tsx`), serta halaman Profil & Logout nyata (`profil.tsx`) |
| P2 | Eileen | Area Asisten: Beranda *real-time*, CRUD Sesi Praktikum di Firestore (`SesiFormSheet`), panel pemeriksaan pengajuan izin berbantuan AI, dan Rekap kehadiran *real-time* |
| P3 | Nouvella | Area Praktikan: Beranda & Jadwal *real-time* sesuai kelas, presensi terintegrasi Firestore (`PresensiSheet`), pengajuan izin + pemicu klasifikasi AI (`IzinSheet`), dan Riwayat *real-time* |

### Route Utama Sprint 2 (Navigasi 4 Tab)

| Halaman | Route internal | URL web |
| --- | --- | --- |
| Landing (Hero Bersih) | `/` | `/` |
| Login & Registrasi | `/login` | `/login` |
| Beranda asisten | `/(asisten)/(tabs)/beranda-asisten` | `/beranda-asisten` |
| Sesi asisten (CRUD) | `/(asisten)/(tabs)/sesi` | `/sesi` |
| Rekap asisten | `/(asisten)/(tabs)/rekap` | `/rekap` |
| Profil asisten | `/(asisten)/(tabs)/profil` | `/profil` |
| Detail sesi asisten + Panel Izin AI | `/(asisten)/sesi/[id]` | `/sesi/[id]` |
| Beranda praktikan | `/(praktikan)/(tabs)/beranda-praktikan` | `/beranda-praktikan` |
| Jadwal praktikan | `/(praktikan)/(tabs)/jadwal` | `/jadwal` |
| Riwayat praktikan (Hadir & Izin) | `/(praktikan)/(tabs)/riwayat` | `/riwayat` |
| Profil praktikan | `/(praktikan)/(tabs)/profil` | `/profil` |
| Detail sesi praktikan (Presensi & Izin) | `/(praktikan)/sesi/[id]` | `/sesi/[id]` |

### Konfigurasi Environment Sprint 2 (`.env`)

Salin `.env.example` menjadi `.env` di root proyek dan isi dengan kredensial proyek Firebase serta endpoint API Model AI:

```bash
cp .env.example .env
npx expo start --clear
```

Variabel yang digunakan:
- `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`, `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_AI_API_URL` dan `EXPO_PUBLIC_AI_API_KEY`

### Alur Demo Sprint 2

1. **Alur Presensi & Pengelolaan Sesi Real-Time:**
   Asisten login → menambah/membuka sesi praktikum → praktikan login dan melakukan presensi → data tersimpan di Cloud Firestore (percobaan presensi kedua ditolak) → asisten langsung melihat daftar hadir & rekap secara *real-time* → asisten menutup sesi.
2. **Alur Pengajuan & Pemeriksaan Izin Berbantuan AI:**
   Praktikan login → mengajukan izin pada sesi tertentu dengan mengisi alasan → aplikasi mengirim alasan ke API Model AI untuk mendapatkan prediksi kategori alasan sebagai informasi pendukung → asisten memeriksa pengajuan beserta badge klasifikasi AI lalu memilih **Terima** atau **Tolak** → praktikan melihat status pengajuannya berubah secara *real-time*.
