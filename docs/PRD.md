# PRD — Sistem Informasi Praktikum

**Nama produk:** TapIn
**Tagline:** Tap once. You're in.
**Versi dokumen:** 1.0
**Tanggal:** 21 Oktober 2026
**Status:** Aktif — acuan seluruh sprint
**Pemilik:** PM sprint berjalan

> Dokumen ini hanya berisi **kebutuhan produk**. Pembagian tugas, jadwal kerja, dan skrip demo berada di `docs/sprints/sprint-<n>.md`. Aturan kolaborasi berada di `docs/WORKFLOW-GIT.md`. Panduan teknis setup berada di `docs/SETUP.md`.

---

## 1. Ringkasan

Aplikasi mobile untuk mencatat kehadiran kegiatan praktikum. Aplikasi melayani dua sudut pandang dalam satu aplikasi:

- **Asisten** mengelola sesi praktikum: membuka sesi, memantau kehadiran, menutup sesi, dan melihat rekap.
- **Praktikan** melihat jadwal, melakukan presensi saat sesi dibuka, dan melihat riwayat kehadiran sendiri.

Pengguna yang belum login dapat melihat jadwal (read-only), tetapi seluruh aksi memerlukan login.

## 2. Latar Belakang & Masalah

Pencatatan kehadiran praktikum saat ini rawan tidak konsisten: daftar hadir tersebar, waktu kehadiran tidak tercatat rapi, dan praktikan sulit memeriksa riwayatnya. Asisten juga membutuhkan cara cepat untuk membuka dan menutup sesi saat praktikum berlangsung.

## 3. Tujuan

1. Menyediakan satu alur presensi yang mudah dipahami asisten dan praktikan.
2. Memastikan satu praktikan hanya dapat presensi satu kali pada sesi yang sama.
3. Menampilkan status sesi dan rekap kehadiran secara konsisten di seluruh layar.
4. Menjadi fondasi aplikasi yang dapat dilanjutkan pada sprint berikutnya tanpa mengubah struktur navigasi dan model data.

### 3.1 Metrik keberhasilan

- Alur demo utama (lihat §11) berhasil dijalankan dalam satu perangkat tanpa error.
- Asisten dapat membuka sesi dan melihat rekap; praktikan dapat presensi dan melihat riwayat.
- Presensi ganda selalu ditolak dengan pesan yang jelas.

## 4. Pengguna & Persona

### 4.1 Asisten

Membuka sesi saat praktikum dimulai, memantau siapa yang sudah hadir, menutup sesi setelah selesai, lalu memeriksa rekap. Membutuhkan aksi cepat (≤3 tap dari beranda) dan status yang jelas.

### 4.2 Praktikan

Ingin mengetahui jadwal dan status sesi, melakukan presensi dengan cepat, serta memeriksa catatan kehadirannya sendiri. Membutuhkan tombol presensi yang hanya aktif saat sesi dibuka.

### 4.3 Pengunjung (belum login)

Dapat melihat jadwal dan detail sesi, tetapi tidak dapat membuka/menutup sesi atau melakukan presensi. Setiap aksi diarahkan ke login.

## 5. Ruang Lingkup

### 5.1 Termasuk dalam produk

- Landing publik berisi jadwal dan detail sesi (read-only).
- Login dan pemilihan peran.
- Beranda dan detail sesi untuk asisten dan praktikan.
- Pengelolaan status sesi: buka, tutup, buka kembali.
- Presensi praktikan dengan pencegahan presensi ganda.
- Rekap kehadiran untuk asisten dan riwayat untuk praktikan.
- Form, modal, dan bottom sheet untuk menerima masukan serta konfirmasi.
- Penyimpanan data (direncanakan pada sprint lanjutan; lihat §9.2).

### 5.2 Tidak termasuk

- Backend kustom (Express, Laravel, dan sejenisnya).
- Presensi berbasis QR, PIN, wajah, atau lokasi.
- Notifikasi push, chat, pembayaran.
- Sinkronisasi real-time antar-perangkat pada sprint pertama.
- Automated test end-to-end.

Fitur di luar daftar ini hanya boleh ditambahkan bila ada kebutuhan resmi dari dosen dan disetujui PM sprint berjalan.

## 6. Kebutuhan Fungsional

Setiap requirement diberi ID yang dipakai sebagai acuan pada dokumen sprint. Butir FR-01 sampai FR-10 berfungsi sebagai **SRS** untuk Sprint 1: jobdesk area, kriteria terima, dan demo mengacu ke butir-butir ini. Kriteria terima bersifat wajib kecuali ditandai opsional.

### FR-01 — Landing publik read-only

Pengguna dapat melihat daftar sesi tanpa login.

**Kriteria terima:**
- Setiap item menampilkan nama praktikum, kelas, lab, tanggal, waktu, dan status sesi.
- Mengetuk item membuka detail sesi dalam modal atau bottom sheet.
- Tombol aksi (presensi, buka/tutup sesi) tidak aktif untuk pengunjung dan disertai arahan untuk login.
- Daftar memiliki tampilan kosong (empty state) bila tidak ada sesi.

### FR-02 — Login dan pemilihan peran

Pengguna dapat masuk dengan memilih peran dan identitas pengguna.

**Kriteria terima:**
- Form menyediakan pilihan peran (asisten/praktikan) dan pilihan pengguna.
- Setelah masuk, pengguna diarahkan ke beranda sesuai peran.
- Pengguna tidak dapat mengakses beranda peran lain.
- Tersedia aksi keluar yang mengembalikan pengguna ke landing.
- Data identitas berasal dari data lokal/dummy pada tahap ini.

### FR-03 — Beranda asisten

**Kriteria terima:**
- Menampilkan daftar sesi yang relevan bagi asisten.
- Setiap item menampilkan status sesi terkini.
- Tersedia aksi cepat untuk membuka atau menutup sesi.
- Perubahan status langsung terlihat tanpa memuat ulang aplikasi.

### FR-04 — Detail sesi asisten

**Kriteria terima:**
- Menampilkan nama praktikum, kelas, lab, tanggal, waktu, status, dan deskripsi.
- Asisten dapat membuka sesi berstatus `TERJADWAL`.
- Asisten dapat menutup sesi berstatus `DIBUKA`.
- Asisten dapat membuka kembali sesi berstatus `SELESAI` (buka lagi).
- Aksi buka/tutup memerlukan konfirmasi.
- Daftar kehadiran pada sesi tersebut tampil dan diperbarui saat praktikan presensi.

### FR-05 — Beranda praktikan

**Kriteria terima:**
- Menampilkan daftar sesi beserta status.
- Tersedia filter minimal: semua sesi, sesi dibuka, dan sesi yang sudah dihadiri.
- Filter mengubah daftar secara langsung.
- Daftar memiliki empty state.

### FR-06 — Detail sesi praktikan dan presensi

**Kriteria terima:**
- Menampilkan informasi sesi secara lengkap.
- Tombol presensi hanya aktif bila sesi berstatus `DIBUKA` dan pengguna belum presensi pada sesi tersebut.
- Presensi memerlukan konfirmasi melalui form/modal (nama praktikan ditampilkan, tersedia pernyataan kehadiran).
- Setelah berhasil, tombol tidak dapat dipakai lagi dan waktu kehadiran ditampilkan.
- Saat proses berlangsung, tombol menampilkan status loading untuk mencegah ketukan ganda.

### FR-07 — Pencegahan presensi ganda

**Kriteria terima:**
- Sistem menolak pembuatan catatan kehadiran kedua untuk kombinasi sesi dan praktikan yang sama.
- Penolakan menampilkan pesan yang menyebutkan waktu presensi pertama.
- Pencegahan berlaku pada lapisan antarmuka dan, saat basis data digunakan, juga pada lapisan data.

### FR-08 — Rekap kehadiran asisten

**Kriteria terima:**
- Asisten dapat memilih sesi dan melihat daftar praktikan yang hadir.
- Setiap baris menampilkan nama praktikan dan waktu kehadiran.
- Menampilkan jumlah hadir dibandingkan jumlah praktikan pada sesi/kelas terkait.
- Tersedia empty state bila belum ada kehadiran.

### FR-09 — Riwayat kehadiran praktikan

**Kriteria terima:**
- Praktikan hanya melihat catatan kehadiran miliknya sendiri.
- Setiap baris menampilkan nama praktikum/sesi dan waktu kehadiran.
- Tersedia empty state bila belum ada catatan.

### FR-10 — Form, modal, dan bottom sheet

**Kriteria terima:**
- Login menggunakan form dengan pilihan peran dan pengguna.
- Konfirmasi presensi menggunakan form/modal.
- Konfirmasi buka dan tutup sesi menggunakan modal.
- Pesan kesalahan (misalnya presensi ganda) ditampilkan dalam modal yang dapat ditutup.
- Seluruh dialog dapat ditutup tanpa memicu aksi.

## 7. Aturan Bisnis

1. Status sesi hanya memiliki tiga nilai: `TERJADWAL`, `DIBUKA`, `SELESAI`.
2. Transisi status yang diizinkan: `TERJADWAL → DIBUKA`, `DIBUKA → SELESAI`, dan `SELESAI → DIBUKA` (buka lagi).
3. Presensi hanya dapat dilakukan pada sesi berstatus `DIBUKA`.
4. Satu kombinasi sesi dan praktikan hanya boleh memiliki satu catatan kehadiran.
5. Waktu kehadiran dicatat otomatis oleh sistem saat presensi berhasil, bukan diisi manual oleh pengguna.
6. Setelah presensi berhasil, tombol presensi pada sesi tersebut dinonaktifkan secara permanen untuk pengguna itu.
7. Perubahan status sesi harus tercermin pada seluruh layar yang menampilkan sesi tersebut.
8. Aksi yang mengubah status sesi atau mencatat kehadiran harus melalui konfirmasi.
9. Pengunjung tidak dapat melakukan aksi apa pun selain melihat.

## 8. Alur Pengguna

### 8.1 Alur asisten

Landing → Login sebagai asisten → Beranda asisten → Pilih sesi → Buka sesi (konfirmasi) → Pantau kehadiran → Lihat rekap → Tutup sesi (konfirmasi).

### 8.2 Alur praktikan

Landing → Login sebagai praktikan → Beranda praktikan → Pilih sesi → Presensi (konfirmasi) → Lihat status kehadiran → Lihat riwayat.

### 8.3 Alur pengunjung

Landing → Lihat daftar → Buka detail sesi → Aksi terkunci → Diarahkan ke login.

## 9. Model Data

### 9.1 Data lokal (tahap saat ini)

Data disimpan di memori aplikasi melalui state. Tipe berikut menjadi kontrak data:

```ts
type Peran = 'asisten' | 'praktikan';
type StatusSesi = 'TERJADWAL' | 'DIBUKA' | 'SELESAI';

type User = {
  id: string;
  nama: string;
  nim?: string;
  peran: Peran;
  kelas?: string;
};

type Sesi = {
  id: string;
  namaPraktikum: string;
  kelas: string;
  lab: string;
  tanggal: string;   // YYYY-MM-DD
  jamMulai: string;  // HH:mm
  jamSelesai: string;// HH:mm
  asistenId: string;
  status: StatusSesi;
  deskripsi: string;
};

type Kehadiran = {
  id: string;
  sesiId: string;
  praktikanId: string;
  waktuHadir: string; // ISO lokal
};
```

Data dummy minimal: 2 asisten, 8–10 praktikan, 4–6 sesi dengan variasi status, dan beberapa catatan kehadiran awal.

### 9.2 Rencana penyimpanan (belum diimplementasikan)

Basis data yang direncanakan: **Firebase**. Rancangan konseptual disimpan sebagai informasi, bukan instruksi sprint saat ini:

```text
users/{userId}                        { nama, nim, peran, kelas }
sesi/{sesiId}                         { namaPraktikum, kelas, lab, tanggal,
                                        jamMulai, jamSelesai, asistenId,
                                        status, deskripsi }
sesi/{sesiId}/kehadiran/{praktikanId} { praktikanId, nama, waktuHadir, status }
```

Ketentuan rancangan:
- Nama field dipertahankan sama dengan tipe lokal agar migrasi tidak mengubah antarmuka.
- ID dokumen kehadiran menggunakan ID praktikan sehingga duplikasi pada sesi yang sama tidak mungkin terjadi.
- Nama praktikan disalin ke catatan kehadiran agar rekap tidak memerlukan pembacaan tambahan.
- Mekanisme autentikasi dan aturan keamanan ditentukan saat sprint penyimpanan dimulai.

## 10. Kebutuhan Non-Fungsional

- **NFR-01 Usability:** membuka sesi dan melakukan presensi dapat dicapai dalam maksimal 3 ketukan dari beranda.
- **NFR-02 Platform:** berjalan pada Expo Go untuk pengembangan harian dan APK hasil EAS untuk demo.
- **NFR-03 Ketahanan:** alur demo tidak boleh berakhir pada layar kosong atau crash; setiap daftar kosong menampilkan pesan.
- **NFR-04 Tata letak:** menggunakan flexbox dan responsif terhadap ukuran layar umum Android.
- **NFR-05 Konsistensi:** satu layar satu file route; komponen visual yang berulang menggunakan komponen bersama.
- **NFR-06 Umpan balik:** setiap aksi yang membutuhkan waktu menampilkan indikator loading dan mencegah ketukan berulang.
- **NFR-07 Bahasa:** seluruh teks antarmuka menggunakan Bahasa Indonesia.

## 11. Skenario Demo Acuan

Skenario berikut menjadi acuan penerimaan produk pada tahap saat ini. Dilakukan pada satu perangkat dengan berganti peran.

1. Landing tampil tanpa login; seluruh aksi terkunci dan mengarahkan ke login.
2. Login sebagai asisten; buka sesi berstatus `TERJADWAL`; status berubah menjadi `DIBUKA` di seluruh layar terkait.
3. Keluar dan login sebagai praktikan; lakukan presensi pada sesi yang dibuka; waktu kehadiran tercatat.
4. Coba presensi kembali pada sesi yang sama; sistem menolak dengan pesan dan waktu presensi pertama.
5. Buka riwayat praktikan; catatan kehadiran tampil. Login sebagai asisten; rekap menampilkan nama dan waktu yang sama.
6. Asisten menutup sesi; tombol presensi praktikan menjadi tidak aktif.

## 12. Batasan & Asumsi

- Belum ada basis data; data hilang saat aplikasi ditutup.
- Demonstrasi dilakukan pada satu perangkat dengan berganti peran; aplikasi tidak menjanjikan sinkronisasi antar-perangkat.
- Identitas, jadwal, dan sesi menggunakan data dummy.
- Spesifikasi fitur sprint lanjutan dapat ditambahkan tanpa mengubah struktur navigasi dan model data pada dokumen ini.

## 13. Risiko Produk

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Penguji mengira data tersinkron antar-perangkat | Demo dianggap gagal | Nyatakan batasan tanpa basis data; demo satu perangkat |
| Presensi ganda lolos karena state tidak konsisten | Kebutuhan inti gagal | Guard di aksi presensi + tombol nonaktif setelah berhasil |
| Status sesi tidak seragam antar layar | Alur membingungkan | Satu sumber state untuk seluruh layar |
| Data dummy tidak realistis | Sulit dinilai | Gunakan nama praktikum, kelas, lab, dan waktu yang wajar |

## 14. Glosarium

- **Sesi:** satu pertemuan praktikum pada tanggal, waktu, kelas, dan lab tertentu.
- **Presensi:** pencatatan kehadiran seorang praktikan pada satu sesi.
- **Rekap:** daftar kehadiran pada suatu sesi beserta waktu kehadiran.
- **Status sesi:** kondisi sesi (`TERJADWAL`, `DIBUKA`, `SELESAI`).
- **Buka lagi:** mengembalikan sesi `SELESAI` menjadi `DIBUKA`.
- **Pengunjung:** pengguna yang belum login.

## 15. Hal yang Belum Diputuskan

- Logo dan ikon aplikasi.
- Data lab, kelas, dan jadwal yang akan dipakai pada demo.
- Apakah demo akhir wajib berupa APK atau cukup Expo Go disertai rekaman layar.
- Rincian kebutuhan sprint lanjutan (termasuk Firebase) setelah spesifikasi resmi diterima.

## 16. Dokumen Terkait

- `docs/design.md` — keputusan antarmuka Sprint 1: token, navigasi, wireframe, state, dan teks.
- `docs/ui-ux-design-system-graphite-lime.md` — design system visual (Graphite Lime).
- `docs/WORKFLOW-GIT.md` — aturan branch, commit, pull request, dan rilis.
- `docs/SETUP.md` — panduan menyiapkan proyek dan build.
- `docs/sprints/sprint-1.md` — tujuan, tugas, jadwal, dan demo sprint berjalan.
- `docs/sprints/sprint-2.md`, `sprint-3.md`, `sprint-4.md` — diisi saat sprint terkait dimulai.
