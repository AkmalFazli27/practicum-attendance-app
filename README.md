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
