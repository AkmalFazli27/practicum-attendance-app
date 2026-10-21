# Sprint 1 — Antarmuka dan Alur Praktikum

**PM:** pemilik repository (kamu)
**Programmer:** P1, P2, P3 (nama diisi setelah tim final)
**Periode:** Rabu, 21 Oktober 2026 (H+0) — Minggu, 25 Oktober 2026 sore (H+4)
**Acuan kebutuhan:** `docs/PRD.md` — FR-01 sampai FR-10
**Status:** Berjalan

> Dokumen ini berisi tujuan sprint, pembagian tugas, jadwal, dan demo. Requirement lengkap tetap mengacu ke `docs/PRD.md`, bukan disalin ke sini.

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

## 2. Ruang Lingkup Sprint

**Dikerjakan:** FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07, FR-08, FR-09, FR-10.

**Tidak dikerjakan:** seluruh item di §5.2 PRD, termasuk integrasi Firebase. Jangan menambah dependensi di luar yang sudah ada tanpa persetujuan PM.

## 3. Definition of Done Sprint

Sprint dianggap selesai bila:

- [ ] Seluruh tiket berstatus selesai dan sudah di-merge ke `main`.
- [ ] Aplikasi berjalan dari `git clone` baru tanpa langkah manual tambahan selain `npm install`.
- [ ] `npx tsc --noEmit` lolos tanpa error.
- [ ] Skenario demo §7 berhasil dijalankan tanpa crash.
- [ ] Tidak ada layar kosong tanpa empty state.
- [ ] README dan dokumen sprint diperbarui.
- [ ] Tag `v0.1-sprint1` dibuat di `main`.
- [ ] APK preview EAS tersedia sebagai cadangan demo.

## 4. Kepemilikan File

| Area | Pemilik | File utama |
| --- | --- | --- |
| Fondasi, data, state, rilis | PM | `app.json`, `eas.json`, `src/data/**`, `src/context/**`, `README.md`, `docs/**` |
| Shell, landing, login, komponen UI | P1 | `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/login.tsx`, `src/components/ui/**` |
| Asisten | P2 | `src/app/(asisten)/**`, `src/components/asisten/**` |
| Praktikan | P3 | `src/app/(praktikan)/**`, `src/components/praktikan/**` |

Aturan: selain pemilik, jangan mengedit file area lain. Butuh perubahan? Ajukan ke pemilik area atau PM.

## 5. Tugas

### 5.1 PM

| ID | Tugas | Target | Status |
| --- | --- | --- | --- |
| CHORE-01 | Siapkan repository, Expo, dan Expo Router | H+0 | Sebagian — lokal selesai; GitHub dan undangan menyusul |
| CHORE-02 | Skeleton folder, data dummy, SessionContext, README | H+0 | Selesai |
| CHORE-03 | Publikasikan repository ke GitHub, undang kolaborator, aktifkan proteksi `main` | H+1 pagi | Belum |
| CHORE-04 | Konfigurasi EAS dan build APK preview | H+3 | Sebagian — `eas.json` siap; login/init dan build belum |
| REVIEW | Review dan merge PR setiap sore | H+1–H+4 | Berjalan |
| REL-01 | Gladi demo, perbaikan akhir, tag `v0.1-sprint1` | H+4 | Belum |

**CHORE-03 — Publikasi repository**

Kriteria terima:
- Repository `practicum-attendance-app` tersedia di GitHub.
- Ketiga programmer dapat `git clone` dan menjalankan `npx expo start`.
- Branch `main` dilindungi dengan aturan wajib pull request.
- Panduan ada di `docs/SETUP.md` §4–§6.

**CHORE-04 — EAS preview**

Kriteria terima:
- `npx eas-cli@latest login` dan `eas init` selesai.
- `eas.json` memiliki profil `preview` dengan `buildType: "apk"`.
- APK preview berhasil diunduh dan dapat dipasang di HP.
- `projectId` di `app.json` sudah di-commit.
- Panduan ada di `docs/SETUP.md` §7.

### 5.2 P1 — Shell, Landing, Login, Komponen UI

| ID | Tugas | Target | Bergantung pada |
| --- | --- | --- | --- |
| P1-01 | Struktur navigasi dan landing statis | H+1 | CHORE-02 |
| P1-02 | Form login dan routing peran | H+2 | P1-01 |
| P1-03 | Komponen UI bersama | H+2 | P1-01 |
| P1-04 | Landing final dengan detail dan aksi terkunci | H+3 | P1-02, P1-03 |

**P1-01 — Navigasi dan landing statis**

- Buat root layout dengan `Stack` dan grup route `(asisten)` serta `(praktikan)`.
- Buat tab per peran: Asisten `[Sesi | Rekap | Profil]`, Praktikan `[Jadwal | Riwayat | Profil]`.
- Landing menampilkan daftar sesi dari `useSession()` (bukan data hardcode baru).
- Setiap tab sementara boleh berisi layar kosong berlabel.
- Kriteria terima: aplikasi berjalan, perpindahan tab tidak crash, landing menampilkan seluruh sesi dummy.

**P1-02 — Form login dan routing peran**

- Form berisi pilihan peran (asisten/praktikan) dan pilihan pengguna sesuai peran.
- Tombol Masuk memanggil `login(userId)` dari context.
- Setelah login, arahkan ke beranda peran yang dipilih.
- Profil memiliki tombol Keluar yang memanggil `logout()` dan kembali ke landing.
- Kriteria terima: asisten tidak bisa masuk ke tab praktikan dan sebaliknya; logout berfungsi.

**P1-03 — Komponen UI bersama**

Buat di `src/components/ui/`:

- `StatusBadge` — warna dan label untuk `TERJADWAL`, `DIBUKA`, `SELESAI`.
- `Tombol` — varian primer/sekunder, mendukung `disabled` dan `loading`.
- `SheetModal` — modal dari bawah dengan judul, isi, dan tombol tutup.
- `EmptyState` — ikon/teks pesan saat daftar kosong.

Kriteria terima: P2 dan P3 memakai komponen ini, bukan membuat versi sendiri. Dokumentasikan props singkat di komentar file.

**P1-04 — Landing final**

- Setiap item sesi dapat diketuk untuk membuka detail dalam `SheetModal`.
- Detail menampilkan nama praktikum, kelas, lab, tanggal, waktu, status, dan deskripsi.
- Untuk pengunjung, tombol presensi dan buka/tutup sesi nonaktif.
- Sediakan tombol/arahan menuju login.
- Kriteria terima: pengunjung tidak dapat memicu aksi apa pun selain melihat dan menuju login.

### 5.3 P2 — Asisten

| ID | Tugas | Target | Bergantung pada |
| --- | --- | --- | --- |
| P2-01 | Beranda asisten dengan data dari context | H+1 | CHORE-02 |
| P2-02 | Detail sesi dan aksi buka/tutup/buka lagi | H+2 | P2-01, P1-03 |
| P2-03 | Rekap kehadiran per sesi | H+3 | P2-02 |
| P2-04 | Daftar hadir live pada detail sesi | H+3 | P2-02 |

Mulai H+1 dengan data dari `useSession()`; jangan menunggu P1 selesai. Gunakan layar sementara bila komponen UI belum tersedia, lalu ganti setelah P1-03 selesai.

**P2-01 — Beranda asisten**

- Menampilkan sesi yang relevan untuk asisten yang login.
- Status sesi memakai `StatusBadge` (atau tampilan sementara).
- Tombol buka/tutup cepat tersedia pada item yang sesuai.
- Kriteria terima: perubahan status dari context langsung terlihat di daftar.

**P2-02 — Detail sesi asisten**

- Tampilkan seluruh informasi sesi.
- Tombol Buka untuk `TERJADWAL`, Tutup untuk `DIBUKA`, Buka Lagi untuk `SELESAI`.
- Setiap aksi memakai modal konfirmasi.
- Aksi memanggil `openSession`, `closeSession`, atau `reopenSession`.
- Kriteria terima: status berubah dan badge di beranda ikut berubah tanpa reload.

**P2-03 — Rekap**

- Pilih sesi, lalu tampilkan daftar praktikan yang hadir beserta waktu (`formatJam`).
- Tampilkan jumlah hadir/total.
- Tampilkan `EmptyState` bila belum ada kehadiran.
- Kriteria terima: setelah P3 melakukan presensi, data muncul di rekap.

**P2-04 — Daftar hadir live**

- Detail sesi menampilkan daftar hadir sesi tersebut.
- Daftar berasal dari `getKehadiranSesi(sesiId)`.
- Kriteria terima: presensi baru langsung tampil tanpa menarik refresh.

### 5.4 P3 — Praktikan

| ID | Tugas | Target | Bergantung pada |
| --- | --- | --- | --- |
| P3-01 | Beranda praktikan dan filter | H+1 | CHORE-02 |
| P3-02 | Detail sesi dan alur presensi | H+2 | P3-01, P1-03 |
| P3-03 | Guard presensi ganda dan anti double-tap | H+3 | P3-02 |
| P3-04 | Riwayat kehadiran praktikan | H+3 | P3-02 |

**P3-01 — Beranda praktikan**

- Daftar sesi dengan status.
- Filter: Semua, Dibuka, Saya Hadir.
- Filter memakai state lokal layar dan data dari context.
- Empty state untuk hasil filter kosong.
- Kriteria terima: filter mengubah daftar secara langsung.

**P3-02 — Detail sesi dan presensi**

- Tampilkan informasi sesi dan status presensi pengguna.
- Tombol Presensi hanya aktif bila status `DIBUKA` dan `sudahPresensi()` kosong.
- Form konfirmasi menampilkan nama praktikan dan pernyataan kehadiran.
- Panggil `markAttendance(sesiId)`; tangani hasil `ok` dan `alasan`.
- Setelah sukses, tampilkan waktu kehadiran dan nonaktifkan tombol.
- Kriteria terima: presensi berhasil pada sesi dibuka dan tercatat di context.

**P3-03 — Guard presensi ganda**

- Jika `markAttendance` mengembalikan `ok: false`, tampilkan alasannya dalam modal.
- Tombol masuk status loading selama proses untuk mencegah ketukan ganda.
- Kriteria terima: tidak ada cara menghasilkan dua catatan untuk sesi dan praktikan yang sama; pesan menyebut waktu presensi pertama.

**P3-04 — Riwayat**

- Tampilkan `getKehadiranPraktikan(currentUser.id)`.
- Setiap baris menampilkan nama praktikum/sesi dan waktu hadir.
- Tersedia empty state.
- Kriteria terima: praktikan hanya melihat catatan miliknya.

## 6. Jadwal

| Hari | Tanggal | Fokus |
| --- | --- | --- |
| H+0 | Rabu, 21 Okt | PM menyiapkan fondasi (selesai sebagian) |
| H+1 | Kamis, 22 Okt | PM publikasi repo; P1 navigasi+landing; P2 beranda asisten; P3 beranda praktikan |
| H+2 | Jumat, 23 Okt | P1 login+UI kit; P2 detail+aksi sesi; P3 detail+presensi |
| H+3 | Sabtu, 24 Okt | P1 landing final; P2 rekap+live; P3 guard+riwayat; PM build EAS |
| H+4 | Minggu, 25 Okt | Stop fitur baru; merge sisa PR; uji demo; perbaikan kecil; tag rilis |

**Irama harian:**

- Pagi: `git pull origin main`, lalu standup async di grup (3 baris: kemarin / hari ini / blocker).
- Siang: target PR sudah dibuka agar PM dapat me-review sore.
- Sore: PM review dan merge; programmer memperbaiki jika diminta.

## 7. Skenario Demo

Dilakukan pada satu perangkat, berganti peran.

1. Buka aplikasi tanpa login. Landing menampilkan jadwal; tombol aksi terkunci dan mengarah ke login.
2. Login sebagai asisten. Buka sesi `TERJADWAL`. Status berubah menjadi `DIBUKA` pada beranda dan detail.
3. Keluar, login sebagai praktikan. Lakukan presensi pada sesi yang dibuka. Waktu kehadiran tampil.
4. Coba presensi lagi pada sesi yang sama. Sistem menolak dan menyebut waktu presensi pertama.
5. Buka Riwayat praktikan: catatan tampil. Login asisten dan buka Rekap: nama serta waktu yang sama tampil.
6. Asisten menutup sesi. Pada sisi praktikan, tombol presensi menjadi tidak aktif.

## 8. Urutan Merge yang Disarankan

1. CHORE-03 (repo publik) — tanpa PR, dilakukan PM.
2. P1-01 (navigasi) — fondasi rute.
3. P1-03 (UI kit) — dibutuhkan P2 dan P3.
4. P1-02 (login) — membuka alur peran.
5. P2-01, P3-01 — beranda per peran.
6. P2-02, P3-02 — detail dan aksi utama.
7. P2-03, P2-04, P3-03, P3-04 — rekap, live, guard, riwayat.
8. P1-04 — landing final.
9. Perbaikan kecil dan dokumentasi.

Jika ada PR yang saling menunggu, PM boleh mengubah urutan selama `main` tetap dapat dijalankan.

## 9. Risiko Sprint

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Programmer pemula macet di setup | Pekerjaan tidak mulai | PM memastikan CHORE-03 selesai H+1 pagi; sediakan contoh pola komponen dan layar |
| Menunggu komponen UI P1 | P2/P3 idle | Mulai dengan tampilan sementara; ganti setelah P1-03 |
| Konflik edit file yang sama | PR macet | Kepemilikan file §4; file bersama hanya PM |
| EAS antre panjang | APK belum siap saat demo | Build H+3; demo utama memakai Expo Go |
| Demo lintas perangkat | Data tidak sinkron | Demo satu perangkat; jelaskan batasan tanpa database |

## 10. Catatan untuk PM

- Periksa PR terhadap kriteria terima tiket dan requirement PRD, bukan hanya apakah kode "terlihat jalan".
- Jaga `main` tetap dapat dijalankan; jangan menunda merge sampai semua fitur selesai.
- Catat keputusan penting (misalnya perubahan aturan presensi) di PRD atau dokumen sprint.
- Setelah sprint selesai, lakukan handover sesuai `docs/WORKFLOW-GIT.md` §9.
