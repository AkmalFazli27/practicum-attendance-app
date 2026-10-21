# Sprint 1 — Antarmuka dan Alur Praktikum

**PM:** pemilik repository (kamu)
**Programmer:** P1 Farras, P2 Eileen, P3 Nouvella
**Periode:** Rabu, 21 Oktober 2026 (H+0) — Minggu, 25 Oktober 2026 sore (H+4)
**Acuan requirement (SRS):** `docs/PRD.md` — FR-01 sampai FR-10
**Acuan desain:** `docs/design.md`
**Status:** Berjalan

> Dokumen ini mengatur pembagian area dan hasil yang harus dicapai. Requirement tetap di PRD (SRS); keputusan visual tetap di design.md. Setiap orang bebas menentukan urutan dan cara kerja di dalam areanya, selama kriteria terima terpenuhi.

---

## 1. Tujuan Sprint

Menghasilkan aplikasi yang mendemonstrasikan alur praktikum secara utuh dalam satu perangkat:

1. Pengunjung melihat jadwal tanpa login.
2. Asisten membuka sesi.
3. Praktikan melakukan presensi.
4. Presensi ganda ditolak.
5. Asisten melihat rekap; praktikan melihat riwayat.
6. Asisten menutup sesi.

Data masih lokal/dummy. Belum ada Firebase, autentikasi nyata, QR, atau notifikasi.

## 2. Sumber Requirement (SRS)

### 2.1 Butir SRS yang dikerjakan

| Butir SRS | Kebutuhan | Area utama |
| --- | --- | --- |
| FR-01 | Landing publik read-only + detail sesi | P1 |
| FR-02 | Login dummy + routing peran | P1 |
| FR-03 | Beranda asisten | P2 |
| FR-04 | Detail sesi asisten + buka/tutup/buka lagi + daftar hadir | P2 |
| FR-05 | Beranda praktikan + filter | P3 |
| FR-06 | Detail sesi praktikan + presensi | P3 |
| FR-07 | Pencegahan presensi ganda | P3 (antarmuka) + PM (aksi context) |
| FR-08 | Rekap kehadiran asisten | P2 |
| FR-09 | Riwayat kehadiran praktikan | P3 |
| FR-10 | Form, modal, dan bottom sheet | P1 (komponen) + P2/P3 (pemakaian) |

### 2.2 Di luar Sprint 1

Seluruh item pada `docs/PRD.md` §5.2, termasuk:

- Firebase dan autentikasi nyata.
- QR, PIN, wajah, atau lokasi.
- Badge dan alur Izin/Alpa.
- Membuat/mengubah/menghapus sesi.
- Pencarian, ekspor, statistik, notifikasi.
- Tab Beranda dashboard terpisah.

Jangan menambah dependensi atau fitur di luar daftar ini tanpa persetujuan PM.

## 3. Pembagian Area & Kepemilikan File

| Area | Kode | Pemilik | File utama |
| --- | --- | --- | --- |
| Fondasi, data, state, desain, rilis | PM | pemilik repository (kamu) | `app.json`, `eas.json`, `src/data/**`, `src/context/**`, `src/theme/**`, `README.md`, `docs/**` |
| Shell, landing, login, komponen UI | P1 | **Farras** | `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/login.tsx`, `src/components/ui/**` |
| Asisten | P2 | **Eileen** | `src/app/(asisten)/**`, `src/components/asisten/**` |
| Praktikan | P3 | **Nouvella** | `src/app/(praktikan)/**`, `src/components/praktikan/**` |

Aturan: selain pemilik, jangan mengedit file area lain. Butuh perubahan? Ajukan ke pemilik area atau PM.

## 4. Jobdesk per Area

Setiap area memiliki **hasil**, **kriteria terima**, dan **batas**. Cara mencapai hasil diserahkan kepada pemilik area.

### 4.1 PM — Fondasi, Integrasi, dan Rilis

**Hasil yang harus ada:**

1. Repository lokal dan GitHub siap dipakai tim.
2. Data dummy dan `SessionContext` berfungsi sebagai sumber state tunggal.
3. Token desain `src/theme/tokens.ts`, hook font `src/theme/fonts.ts`, dan Inter dengan fallback sistem.
4. Repository dipublikasikan, kolaborator diundang, `main` dilindungi.
5. Setiap PR di-review dan di-merge.
6. APK preview EAS tersedia sebagai cadangan demo.
7. Demo gladi bersih dan tag `v0.1-sprint1`.

**Kriteria terima:**

- [ ] Ketiga programmer dapat `git clone` lalu `npm install` dan `npx expo start`.
- [ ] `useSession()` menyediakan `login`, `logout`, `openSession`, `closeSession`, `reopenSession`, `markAttendance`, `getKehadiranSesi`, `getKehadiranPraktikan`, dan `sudahPresensi`.
- [ ] `markAttendance` menolak presensi ganda dan mengembalikan alasan yang menyebut waktu presensi pertama.
- [ ] `src/theme/tokens.ts` memuat token pada `docs/design.md` §2 dan dipakai seluruh area.
- [ ] `src/theme/fonts.ts` menyediakan `useAppFonts()` dengan fallback sistem.
- [ ] Inter dimuat tanpa membuat aplikasi gagal dibuka bila font tidak tersedia.
- [ ] `main` selalu dapat dijalankan; PR di-merge maksimal satu hari setelah disetujui.
- [ ] `eas.json` memiliki profil `preview` dengan `buildType: "apk"`.
- [ ] Tag `v0.1-sprint1` dibuat setelah demo lolos.

**Butir SRS terkait:** mendukung FR-01 sampai FR-10, khususnya guard FR-07 dan fondasi FR-10.

**Batas:** PM tidak mengambil alih layar milik P1, P2, atau P3. Perubahan pada file area programmer harus diminta ke pemiliknya.

### 4.2 P1 — Farras — Shell, Landing, Login, dan Komponen UI

**Hasil yang harus ada:**

1. Root layout, navigasi Stack, dan 3 tab per peran.
2. Landing publik read-only dengan sheet detail.
3. Login dummy dengan pilihan peran dan user.
4. Komponen bersama: `StatusBadge`, `Tombol`, `SheetModal`, `EmptyState`, `FilterChip`.

**Kriteria terima:**

- [ ] Struktur route mengikuti `docs/design.md` §3.1; layar detail tidak muncul sebagai tab.
- [ ] Asisten memiliki tab `Sesi | Rekap | Profil`; praktikan `Jadwal | Riwayat | Profil`.
- [ ] Tab pertama berfungsi sebagai beranda dan menjadi halaman awal setelah login.
- [ ] Guard peran mencegah asisten membuka route praktikan dan sebaliknya.
- [ ] Landing menampilkan seluruh sesi dari `useSession()`, bukan data hardcode baru.
- [ ] Landing menampilkan nama `TapIn` dan tagline `Tap once. You're in.` sesuai `docs/design.md` §4.1.
- [ ] Setiap kartu landing dapat membuka sheet detail; pengunjung tidak dapat menjalankan aksi selain menuju login.
- [ ] Login memilih peran dan user; `Masuk` nonaktif sampai pilihan lengkap.
- [ ] Setelah login, pengguna diarahkan ke tab pertama sesuai peran; `Keluar` mengembalikan ke landing.
- [ ] Lima komponen UI tersedia dan dipakai P2/P3, bukan diduplikasi.
- [ ] Semua komponen memakai token dan tidak menulis kode hex langsung.
- [ ] `src/app/_layout.tsx` memanggil `useAppFonts()` dan aplikasi tetap dapat dibuka bila font gagal dimuat.
- [ ] Semua form/sheet dapat ditutup tanpa menjalankan aksi.

**Butir SRS terkait:** FR-01, FR-02, FR-10. Komponen UI mendukung FR-03 sampai FR-09.

**Batas:** P1 tidak membuat layar asisten atau praktikan. P1 juga tidak mengubah `src/data`, `src/context`, atau `src/theme`.

### 4.3 P2 — Eileen — Asisten

**Hasil yang harus ada:**

1. Beranda asisten berisi sesi yang dikelola.
2. Detail sesi dengan aksi buka, tutup, dan buka lagi.
3. Daftar hadir yang diperbarui saat praktikan presensi.
4. Rekap per sesi berisi jumlah hadir dan waktu kehadiran.

**Kriteria terima:**

- [ ] Beranda menampilkan nama praktikum, kelas, lab, tanggal, waktu, dan badge status.
- [ ] Hanya sesi milik asisten yang login yang tampil.
- [ ] Tombol `Buka` muncul untuk `TERJADWAL`, `Tutup` untuk `DIBUKA`, dan `Buka Lagi` untuk `SELESAI`.
- [ ] Setiap aksi memakai sheet konfirmasi dan memanggil aksi context yang sesuai.
- [ ] Perubahan status langsung terlihat pada beranda dan detail tanpa reload.
- [ ] Detail menampilkan deskripsi dan daftar hadir sesi tersebut.
- [ ] Daftar hadir bertambah tanpa perlu refresh manual.
- [ ] Rekap menampilkan `hadir/total`, nama praktikan, dan waktu kehadiran.
- [ ] Rekap dan daftar hadir memiliki empty state.
- [ ] Tidak ada aksi membuat, mengubah, menghapus, atau mengekspor sesi.

**Butir SRS terkait:** FR-03, FR-04, FR-08.

**Batas:** P2 tidak mengubah landing, login, komponen UI bersama, atau area praktikan.

Mulai lebih awal dengan data dari `useSession()`. Bila komponen UI belum siap, gunakan tampilan sementara di dalam area sendiri, lalu ganti setelah P1 selesai.

### 4.4 P3 — Nouvella — Praktikan

**Hasil yang harus ada:**

1. Beranda praktikan dengan kartu sesi aktif dan filter.
2. Detail sesi dengan tombol presensi yang mengikuti status.
3. Form konfirmasi presensi dan penanganan presensi ganda.
4. Riwayat kehadiran pribadi.

**Kriteria terima:**

- [ ] Beranda menampilkan daftar sesi dan status.
- [ ] Filter `Semua`, `Dibuka`, dan `Saya Hadir` mengubah daftar secara langsung.
- [ ] Filter yang kosong menampilkan empty state.
- [ ] Kartu sesi aktif hanya menampilkan satu CTA lime untuk presensi.
- [ ] Tombol presensi aktif hanya bila sesi `DIBUKA` dan pengguna belum presensi.
- [ ] Sesi `TERJADWAL` dan `SELESAI` menampilkan tombol nonaktif dengan label yang sesuai.
- [ ] Form konfirmasi menampilkan nama praktikan dan checkbox kehadiran yang wajib dicentang.
- [ ] Saat proses, tombol menampilkan loading dan tidak dapat ditekan ulang.
- [ ] Setelah berhasil, waktu kehadiran tampil, banner berubah hijau, dan tombol nonaktif permanen untuk sesi itu.
- [ ] Presensi ganda ditolak dengan sheet yang menyebut waktu presensi pertama.
- [ ] Riwayat hanya menampilkan catatan milik pengguna yang login dan memiliki empty state.

**Butir SRS terkait:** FR-05, FR-06, FR-07, FR-09.

**Batas:** P3 tidak mengubah landing, login, komponen UI bersama, atau area asisten. P3 tidak mengubah aturan guard di context; bila menemukan celah, laporkan ke PM.

## 5. Dependensi & Urutan Integrasi

Urutan ini menjaga agar pekerjaan tidak saling menunggu. Bukan jadwal per orang.

| Urutan | Pekerjaan | Area | Prasyarat |
| --- | --- | --- | --- |
| 1 | Publikasi repository + undangan kolaborator | PM | — |
| 2 | Token desain + font | PM | Repository siap |
| 3 | Root layout, Stack, tab, guard peran | P1 | Token tersedia |
| 4 | Komponen UI bersama | P1 | Root layout |
| 5 | Login dan routing peran | P1 | Root layout + komponen UI |
| 6 | Beranda asisten dan beranda praktikan | P2, P3 | Context + komponen UI + login |
| 7 | Detail asisten dan detail praktikan | P2, P3 | Beranda masing-masing |
| 8 | Rekap, daftar hadir, guard ganda, riwayat | P2, P3 | Detail masing-masing |
| 9 | Landing final + sheet detail | P1 | Login + komponen UI |
| 10 | Gladi demo, perbaikan, tag rilis | PM + semua | Seluruh hasil area |

Eileen dan Nouvella boleh mulai sebelum Farras selesai dengan memakai data context dan tampilan sementara. Jangan menunggu tanpa kabar; gunakan standup untuk menyepakati bentuk sementara.

## 6. Aturan Kerja per Area

1. **Kepemilikan file.** Setiap orang hanya mengubah file areanya. File bersama milik PM.
2. **Satu PR = satu pekerjaan yang koheren.** PR besar yang mencampur beberapa area akan dikembalikan.
3. **Judul PR** memakai konvensi commit (`feat:`, `fix:`, `chore:`, `docs:`). Deskripsi memuat area, FR terkait, cara menguji, dan screenshot/video.
4. **PM yang me-review dan merge.** Programmer tidak merge sendiri. Merge memakai merge commit biasa, bukan squash.
5. **Standup async setiap pagi** di grup: apa yang selesai, apa yang dikerjakan hari ini, apa yang menghambat.
6. **Blocker lebih dari 2 jam** harus disampaikan ke grup, jangan dipendam.
7. **Tidak ada fitur di luar SRS.** Kalau muncul ide baru, catat dan ajukan ke PM; jangan langsung dikerjakan.
8. **Definition of Done setiap deliverable:** berjalan di Expo Go, tidak crash, sesuai FR dan `docs/design.md`, `npx tsc --noEmit` lolos, dan sudah di-merge ke `main`.

## 7. Jadwal

| Hari | Tanggal | Fokus area |
| --- | --- | --- |
| H+0 | Rabu, 21 Okt | PM menyiapkan fondasi dan repository |
| H+1 | Kamis, 22 Okt | PM publikasi + token/font; P1 navigasi + landing awal; P2 beranda; P3 beranda |
| H+2 | Jumat, 23 Okt | P1 login + komponen UI; P2 detail + aksi sesi; P3 detail + presensi |
| H+3 | Sabtu, 24 Okt | P1 landing final; P2 rekap + daftar hadir; P3 guard + riwayat; PM build EAS |
| H+4 | Minggu, 25 Okt | Hentikan fitur baru; integrasi, demo, perbaikan kecil, tag rilis |

Irama harian:

- Pagi: `git pull origin main`, lalu standup async.
- Siang: PR sudah dibuka agar PM dapat me-review sore.
- Sore: PM review dan merge; pemilik area memperbaiki bila diminta.

## 8. Skenario Demo

Dilakukan pada satu perangkat, berganti peran.

1. Buka aplikasi tanpa login. Landing menampilkan jadwal; aksi terkunci dan mengarah ke login.
2. Login sebagai asisten. Buka sesi `TERJADWAL`. Status berubah menjadi `DIBUKA` pada beranda dan detail.
3. Keluar, login sebagai praktikan. Lakukan presensi pada sesi yang dibuka. Waktu kehadiran tampil.
4. Coba presensi lagi pada sesi yang sama. Sistem menolak dan menyebut waktu presensi pertama.
5. Buka Riwayat praktikan: catatan tampil. Login asisten dan buka Rekap: nama serta waktu yang sama tampil.
6. Asisten menutup sesi. Pada sisi praktikan, tombol presensi menjadi tidak aktif.

## 9. Risiko Sprint

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Programmer pemula macet di setup | Pekerjaan tidak mulai | PM memastikan repository siap H+1 pagi; sediakan contoh pola komponen dan layar |
| Menunggu komponen UI Farras | Eileen/Nouvella idle | Mulai dengan data context dan tampilan sementara; ganti setelah komponen UI siap |
| Konflik edit file yang sama | PR macet | Kepemilikan area §3; file bersama hanya PM |
| EAS antre panjang | APK belum siap saat demo | Build H+3; demo utama memakai Expo Go |
| Demo lintas perangkat | Data tidak sinkron | Demo satu perangkat; jelaskan batasan tanpa database |
| Scope melebar | Waktu habis | Acuan demo §8 dan daftar di luar Sprint 1 §2.2 |

## 10. Checklist Progres per Area

### PM

- [ ] Repository GitHub + kolaborator + proteksi `main`
- [ ] Data dummy dan `SessionContext` final
- [ ] Token desain + hook font Inter dengan fallback
- [ ] Review dan merge PR setiap hari
- [ ] APK preview EAS
- [ ] Gladi demo + tag `v0.1-sprint1`

### P1 — Farras

- [ ] Root layout, Stack, tab, guard peran
- [ ] Komponen UI bersama (5 komponen)
- [ ] Login dummy + routing peran
- [ ] Landing publik + sheet detail + aksi terkunci

### P2 — Eileen

- [ ] Beranda asisten + badge status
- [ ] Detail sesi + buka/tutup/buka lagi
- [ ] Daftar hadir yang diperbarui otomatis
- [ ] Rekap per sesi

### P3 — Nouvella

- [ ] Beranda praktikan + filter
- [ ] Detail sesi + tombol presensi empat state
- [ ] Form konfirmasi + penolakan presensi ganda
- [ ] Riwayat kehadiran pribadi

## 11. Catatan untuk PM

- Periksa PR terhadap kriteria terima area dan butir SRS, bukan hanya apakah kode "terlihat jalan".
- Jaga `main` tetap dapat dijalankan; jangan menunda merge sampai semua fitur selesai.
- Catat keputusan penting (misalnya perubahan aturan presensi) di PRD atau dokumen sprint.
- Setelah sprint selesai, lakukan handover sesuai `docs/WORKFLOW-GIT.md` §9.
