# Sprint 2 — Data Dinamis dengan Firebase dan Integrasi AI

**PM:** Farras (P1 Sprint 1)
**Programmer:** P1 Akmal, P2 Eileen, P3 Nouvella
**Periode:** Rabu, 11 November 2026 (H+0) — Minggu, 15 November 2026 sore (H+4)
**Acuan requirement (SRS):** `docs/PRD.md` (FR-01 s.d. FR-10) + Spesifikasi Sprint 2 (FR-11 s.d. FR-18)
**Acuan desain:** `docs/DESIGN.md` + Design Refactor Brief Sprint 2 (Prototipe Figma Make)
**Status:** Berjalan

> Dokumen ini mengatur pembagian area dan hasil yang harus dicapai pada Sprint 2. Sebelum ketiga programmer memulai pengembangan fitur Firebase dan AI, **PM (Farras) terlebih dahulu menyelesaikan Refactor UI Parity** (pemisahan 4 tab dengan Beranda, header persisten, komponen UI Kit baru, dan penyelarasan visual prototipe) sehingga seluruh anggota tim bekerja di atas fondasi antarmuka yang sudah final.

---

## 1. Tujuan Sprint

Mengembangkan aplikasi **TapIn** dari data lokal menjadi aplikasi multi-pengguna yang terhubung secara *real-time* menggunakan **Firebase Authentication**, **Cloud Firestore**, dan **API Model AI** untuk mendemonstrasikan dua alur utama secara utuh:

1. **Alur Presensi & Pengelolaan Sesi Real-Time:**
   Asisten login → mengelola (CRUD) & membuka sesi → praktikan login dan melakukan presensi → data tersimpan di Cloud Firestore (presensi ganda ditolak) → asisten melihat daftar hadir dan rekap secara *real-time* → asisten menutup sesi.
2. **Alur Pengajuan & Pemeriksaan Izin Berbantuan AI:**
   Praktikan login → mengajukan izin ketidakhadiran beserta alasan → sistem mengirim alasan ke API model AI untuk mendapatkan prediksi kategori alasan sebagai informasi pendukung → asisten memeriksa pengajuan serta hasil klasifikasi AI lalu memberikan keputusan (Terima/Tolak) → praktikan melihat pembaruan status pengajuannya secara *real-time*.

Seluruh perubahan data tersimpan secara persisten di Cloud Firestore, konsisten lintas pengguna tanpa muat ulang manual, dan dilindungi sesuai kewenangan peran melalui validasi aplikasi serta Firebase Security Rules.

---

## 2. Sumber Requirement (SRS)

### 2.1 Butir SRS yang dikerjakan

Melanjutkan penomoran FR-01 s.d. FR-10 pada Sprint 1, kebutuhan Sprint 2 dipetakan menjadi **FR-11 sampai FR-18**:

| Butir SRS | Kebutuhan | Area utama |
| --------- | --------- | ---------- |
| FR-00 (Pra-Sprint) | Refactor UI Parity (4 tab + Beranda, `AppHeader`, `Toast`, `ConfirmSheet`, restyle seluruh layar sesuai prototipe) | PM (Farras) |
| FR-11 | Autentikasi pengguna (registrasi, login, logout dengan Firebase Authentication + profil & peran di Firestore) | PM (fondasi) + P1 (antarmuka & alur) |
| FR-12 | Pengelolaan data praktikum (penyimpanan kelas, peserta, jadwal, dan CRUD sesi praktikum oleh asisten di Firestore; tampilan jadwal relevan bagi praktikan) | PM (context/service) + P2 (CRUD asisten) + P3 (jadwal praktikan) |
| FR-13 | Presensi terintegrasi di Firestore berdasarkan identitas praktikan & sesi dengan pencegahan presensi ganda | PM (guard & transaksi Firestore) + P3 (antarmuka presensi) |
| FR-14 | Sinkronisasi data *real-time* (`onSnapshot` untuk perubahan status sesi, presensi, izin, dan rekap) serta persistensi data | PM (listener context) + P1/P2/P3 (konsumsi state live) |
| FR-15 | Pengajuan izin praktikan untuk sesi tertentu dengan alasan ketidakhadiran dan pemantauan status di Firestore | P3 (form & status izin praktikan) + PM (aksi Firestore) |
| FR-16 | Integrasi API Model AI untuk klasifikasi kategori alasan izin sebagai informasi pendukung (tidak menentukan diterima/ditolak otomatis) | PM (service API AI & fallback) + P3 (trigger saat submit izin) + P2 (tampilan badge AI) |
| FR-17 | Pemeriksaan izin oleh asisten (melihat daftar izin, alasan, hasil klasifikasi AI, serta menerima/menolak pengajuan) | P2 (antarmuka pemeriksaan & keputusan asisten) + PM (aksi Firestore) |
| FR-18 | Validasi input, penanganan kondisi (*loading*, *empty*, *error* jaringan/AI/auth), dan keamanan akses berbasis peran (Firebase Security Rules) | PM (`firestore.rules` & error handler) + P1/P2/P3 (validasi & state UI) |

### 2.2 Di luar Sprint 2

- Presensi berbasis QR, PIN, pengenalan wajah, atau geolokasi/GPS.
- Backend kustom di luar Firebase dan endpoint API AI yang disediakan pengajar.
- Notifikasi push native (FCM background push).
- Ekspor file laporan ke PDF/CSV/Excel.
- Keputusan penerimaan/penolakan izin secara otomatis oleh AI (dilarang oleh aturan bisnis).

Jangan menambah dependensi atau fitur di luar daftar ini tanpa persetujuan PM.

---

## 3. Pembagian Area & Kepemilikan File

| Area | Kode | Pemilik | File utama |
| ---- | ---- | ------- | ---------- |
| Refactor UI Pra-Sprint, Fondasi Firebase & AI, UI Kit, Security Rules, Integrasi, Rilis | PM | **Farras** | `app.json`, `eas.json`, `firestore.rules`, `.env.example`, `src/config/**`, `src/services/**`, `src/context/**`, `src/data/**`, `src/theme/**`, `src/components/ui/**`, `src/app/_layout.tsx`, `README.md`, `docs/**` |
| Autentikasi (Login & Registrasi Firebase), Guard Landing, dan Profil Akun | P1 | **Akmal** | `src/app/index.tsx`, `src/app/login.tsx`, `src/app/(asisten)/(tabs)/profil.tsx`, `src/app/(praktikan)/(tabs)/profil.tsx` |
| Asisten (Integrasi Firestore Beranda, CRUD Sesi, Pemeriksaan Izin AI, Rekap Real-Time) | P2 | **Eileen** | `src/app/(asisten)/(tabs)/beranda-asisten.tsx`, `src/app/(asisten)/(tabs)/sesi.tsx`, `src/app/(asisten)/(tabs)/rekap.tsx`, `src/app/(asisten)/sesi/[id].tsx`, `src/components/asisten/**` |
| Praktikan (Integrasi Firestore Beranda, Jadwal, Presensi, Pengajuan Izin + AI, Riwayat Real-Time) | P3 | **Nouvella** | `src/app/(praktikan)/(tabs)/beranda-praktikan.tsx`, `src/app/(praktikan)/(tabs)/jadwal.tsx`, `src/app/(praktikan)/(tabs)/riwayat.tsx`, `src/app/(praktikan)/sesi/[id].tsx`, `src/components/praktikan/**` |

**Aturan kepemilikan:**
1. **Tahap Pra-Sprint (H+0):** PM (Farras) menyentuh seluruh folder `src/` untuk menyelesaikan *Refactor UI Parity* sesuai prototipe dan melakukan merge ke `main` terlebih dahulu.
2. **Tahap Sprint 2 (setelah UI Parity merge):** Setiap programmer hanya mengedit file di areanya masing-masing. Bila membutuhkan perubahan pada `SessionContext`, `services`, atau `components/ui`, ajukan kepada PM.

---

## 4. Jobdesk per Area

Setiap area memiliki **hasil**, **kriteria terima**, dan **batas**.

### 4.1 PM — Farras — Refactor UI Pra-Sprint, Fondasi Firebase & AI, dan Rilis

**Hasil yang harus ada:**

1. **Refactor UI Parity & Antarmuka Fitur Sprint 2 (Selesai di H+0 sebelum sprint fitur dimulai):**
   - Token desain baru (`radius.cardLg`, `radius.sheet`, `shadows`, tipografi `Inter_800ExtraBold`) dan ikon `lucide-react-native`.
   - Komponen UI Kit baru & restyle: `Brand`, `AppHeader`, `SessionCard`, `ToastProvider`/`useToast`, `ConfirmSheet`, `SectionHeading`, `MetricCard`, `ScoreRing`, serta restyle `Tombol` (+ varian `danger`), `StatusBadge`, `SheetModal`, `EmptyState`, dan `FilterChip`.
   - Struktur navigasi 4 tab per peran (`Beranda | Sesi | Rekap | Profil` untuk Asisten; `Beranda | Jadwal | Riwayat | Profil` untuk Praktikan) dengan rute `/beranda-asisten` dan `/beranda-praktikan` yang bebas bentrok.
   - Penyelarasan visual seluruh layar eksisting dengan prototipe Figma Make serta penyediaan antarmuka siap pakai untuk Sprint 2:
     - **Landing (`src/app/index.tsx`):** Hero bersih (`"Tap once. You're in."`, CTA Masuk/Mulai) disertai pratinjau *read-only* jadwal terdekat (tanpa kartu demo pintasan akun).
     - **Auth (`src/app/login.tsx`):** Tab switch **Masuk** (Email & Password) dan **Daftar Akun** (Pilih Peran Praktikan/Asisten, Nama Lengkap, NIM, Kelas, Email, Password) tanpa daftar akun dummy.
     - **CRUD Sesi Asisten (`src/components/asisten/SesiFormSheet.tsx`):** Sheet modal tambah & ubah sesi praktikum beserta aksi hapus dengan `ConfirmSheet`.
     - **Pengajuan & Pemeriksaan Izin AI (`src/components/praktikan/IzinSheet.tsx` & `src/app/(asisten)/sesi/[id].tsx`):** Sheet form izin praktikan dan panel pemeriksaan izin asisten dengan badge hasil klasifikasi AI serta tombol Terima/Tolak.
2. **Fondasi Firebase & State Real-Time (`src/config/firebase.ts` & `src/context/SessionContext.tsx`):**
   - Konfigurasi Firebase Authentication dan Cloud Firestore.
   - Penyediaan state & aksi terpusat di `useSession()` untuk autentikasi (`login`, `register`, `logout`), CRUD sesi (`createSession`, `updateSession`, `deleteSession`, `openSession`, `closeSession`, `reopenSession`), presensi (`markAttendance`), dan perizinan (`submitIzin`, `reviewIzin`) dengan *real-time listener* (`onSnapshot`).
3. **Service Integrasi AI (`src/services/ai.ts`):**
   - Fungsi pemanggilan endpoint API model AI pengajar untuk mengklasifikasikan alasan izin, lengkap dengan batas waktu (*timeout*) dan *fallback* aman apabila layanan AI sedang tidak merespons.
4. **Keamanan & Rilis (`firestore.rules` & EAS):**
   - Aturan keamanan Cloud Firestore (`firestore.rules`) yang membatasi baca/tulis sesuai autentikasi dan peran (`asisten` vs `praktikan`).
   - Review PR harian, merge ke `main`, build APK EAS, dan tag rilis `v0.2-sprint2`.

**Kriteria terima:**

- [ ] Seluruh perubahan *Design Refactor Brief* telah ter-merge ke `main` pada H+0 dan lolos `npx tsc --noEmit`.
- [ ] Konfigurasi Firebase menggunakan variabel environment (`EXPO_PUBLIC_FIREBASE_*`) dan menyediakan `.env.example` tanpa membocorkan kunci rahasia di git.
- [ ] `useSession()` menyinkronkan koleksi `users`, `sesi`, `kehadiran`, dan `izin` secara *real-time* menggunakan `onSnapshot` serta menyediakan flag `loading` dan pesan `error`.
- [ ] `src/services/ai.ts` mengembalikan prediksi kategori alasan izin dari API AI, dan bila API gagal/timeout tetap mengembalikan objek *fallback* (`kategori: "Belum Terklasifikasi"`) sehingga pengajuan izin praktikan tidak macet.
- [ ] `firestore.rules` memastikan hanya asisten yang dapat membuat/mengubah/menghapus sesi serta memutuskan status izin, dan hanya praktikan pemilik akun yang dapat mencatat presensi atau mengajukan izin untuk dirinya sendiri.
- [ ] Tag `v0.2-sprint2` dan APK preview tersedia setelah kedua skenario demo utama lolos.

**Butir SRS terkait:** FR-00 (Refactor UI), serta fondasi untuk FR-11 sampai FR-18.

**Batas:** Setelah *Refactor UI Parity* di-merge pada H+0, PM tidak mengambil alih pengerjaan fitur layar P1, P2, dan P3 kecuali untuk membantu *debugging* integrasi.

---

### 4.2 P1 — Akmal — Autentikasi Firebase, Registrasi, Guard Landing, dan Profil

**Hasil yang harus ada:**

1. **Integrasi Login Firebase (`src/app/login.tsx` — tab Masuk):**
   - Menghubungkan form login Email & Password (UI sudah disediakan PM) ke `signInWithEmailAndPassword` Firebase Authentication.
   - Mengambil profil pengguna dari koleksi `users/{uid}` di Cloud Firestore dan mengarahkan pengguna secara otomatis ke `/beranda-praktikan` atau `/beranda-asisten` sesuai perannya.
2. **Integrasi Registrasi Akun Baru (`src/app/login.tsx` — tab Daftar Akun):**
   - Menghubungkan form registrasi (`Praktikan` / `Asisten`, Nama Lengkap, Email, Password, NIM, dan Kelas) ke `createUserWithEmailAndPassword` Firebase Authentication sekaligus menyimpan dokumen profil pengguna di koleksi `users/{uid}` Cloud Firestore.
3. **Persistensi Sesi & Guard Landing (`src/app/index.tsx`):**
   - Memastikan halaman Landing Hero bersih (`"Tap once. You're in."`) mendeteksi status sesi aktif (`onAuthStateChanged`): menampilkan indikator *loading* saat status autentikasi diperiksa dan otomatis mengarahkan pengguna yang sudah login ke beranda perannya tanpa perlu login ulang.
4. **Halaman Profil & Logout (`profil.tsx` Asisten & Praktikan):**
   - Menampilkan identitas asli pengguna yang sedang login dari Firebase/Firestore (nama, email, NIM, kelas, peran, serta total presensi untuk praktikan).
   - Tombol `Keluar dari akun` menjalankan `signOut` Firebase Auth dan mengembalikan pengguna ke Landing (`/`).

**Kriteria terima:**

- [ ] Pengguna baru dapat melakukan registrasi sebagai Praktikan maupun Asisten pada `src/app/login.tsx`, dan datanya langsung tercatat di Firebase Auth serta koleksi `users` Firestore.
- [ ] Pengguna terdaftar dapat login dan langsung diarahkan ke `/beranda-praktikan` atau `/beranda-asisten` sesuai perannya.
- [ ] Sesi login bertahan saat aplikasi ditutup dan dibuka kembali; Landing (`src/app/index.tsx`) langsung mengarahkan pengguna yang masih login ke beranda perannya, dan pengguna yang belum login tidak dapat mengakses rute `(asisten)` atau `(praktikan)`.
- [ ] Validasi input berjalan sebelum request dikirim (email kosong/tidak valid, password < 6 karakter, nama/NIM/kelas kosong).
- [ ] Kegagalan autentikasi (email sudah dipakai, password salah, akun tidak ditemukan, gangguan jaringan) ditampilkan dengan pesan Bahasa Indonesia yang jelas (via `Toast` atau pesan form) tanpa menyebabkan crash.
- [ ] Tombol submit menampilkan status `loading` dan nonaktif selama proses login/registrasi berlangsung.

**Butir SRS terkait:** FR-01, FR-11, FR-14, FR-18.

**Batas:** P1 tidak mengubah layar pengelolaan sesi/rekap asisten (milik P2) maupun layar jadwal/presensi/izin praktikan (milik P3).

---

### 4.3 P2 — Eileen — Asisten (CRUD Sesi, Pemeriksaan Izin Berbantuan AI, dan Rekap Real-Time)

**Hasil yang harus ada:**

1. **Pengelolaan Sesi Praktikum / CRUD (`beranda-asisten.tsx`, `sesi.tsx`, `sesi/[id].tsx`):**
   - Form modal/sheet **Tambah Sesi Baru** dan **Ubah Sesi** (input: nama praktikum, topik, kelas, lab, tanggal, jam mulai, jam selesai, kapasitas, dan deskripsi).
   - Aksi **Hapus Sesi** dengan sheet konfirmasi (`ConfirmSheet` varian `danger`).
   - Aksi pengelolaan status sesi (**Buka Sesi**, **Tutup Sesi**, **Buka Lagi**) yang langsung tersimpan ke Cloud Firestore.
2. **Pemeriksaan Pengajuan Izin & Informasi Klasifikasi AI (`sesi/[id].tsx` / komponen asisten):**
   - Daftar pengajuan izin praktikan pada sesi terkait yang menampilkan nama & NIM praktikan, waktu pengajuan, alasan ketidakhadiran, status izin (`MENUNGGU`, `DITERIMA`, `DITOLAK`), serta **badge/label kategori hasil klasifikasi AI** sebagai informasi pendukung.
   - Tombol aksi **Terima** dan **Tolak** pada pengajuan izin yang masih berstatus `MENUNGGU`, disertai konfirmasi dan pembaruan status ke Firestore.
3. **Beranda & Rekap Kehadiran Real-Time (`beranda-asisten.tsx`, `rekap.tsx`):**
   - Metrik sesi aktif & total hadir, kartu sesi berjalan dengan *progress bar*, serta rekap per sesi (jumlah hadir, jumlah izin diterima/menunggu, dan daftar nama praktikan beserta waktu hadir/status izin) yang otomatis diperbarui secara *real-time*.

**Kriteria terima:**

- [ ] Asisten dapat menambah sesi baru, mengubah informasi sesi, dan menghapus sesi di Firestore; perubahan langsung tampil di sisi asisten maupun praktikan secara *real-time*.
- [ ] Form tambah/ubah sesi memvalidasi kelengkapan field wajib dan format tanggal/jam sebelum disimpan ke Firestore.
- [ ] Aksi Buka, Tutup, dan Buka Lagi sesi memperbarui status sesi di Firestore dan menampilkan notifikasi `Toast`.
- [ ] Saat praktikan melakukan presensi atau mengajukan izin, daftar hadir dan daftar izin pada layar asisten langsung bertambah secara *real-time* tanpa refresh manual.
- [ ] Setiap item pengajuan izin menampilkan alasan praktikan dan **prediksi kategori dari AI** (misal: `AI: Sakit`, `AI: Akademik`, atau penanda jika AI tidak tersedia) secara jelas sebagai referensi pendukung.
- [ ] Asisten dapat menerima atau menolak pengajuan izin; keputusan tersimpan di Firestore dan tidak pernah diputuskan otomatis oleh AI.
- [ ] Seluruh daftar pada Beranda, Sesi, Detail Sesi, dan Rekap memiliki tampilan *loading*, *empty state*, dan penanganan error bila gagal berkomunikasi dengan Firestore.

**Butir SRS terkait:** FR-12, FR-14, FR-17, FR-18.

**Batas:** P2 tidak mengubah alur autentikasi/registrasi (milik P1), area praktikan (milik P3), atau memanggil API AI secara langsung (klasifikasi AI dipicu saat pengajuan izin).

---

### 4.4 P3 — Nouvella — Praktikan (Presensi Firestore, Pengajuan Izin + AI, dan Riwayat Real-Time)

**Hasil yang harus ada:**

1. **Beranda & Jadwal Praktikan Real-Time (`beranda-praktikan.tsx`, `jadwal.tsx`):**
   - Menampilkan kartu sesi aktif, ringkasan persentase kehadiran (`ScoreRing`: hadir, izin, belum hadir/total sesi), serta daftar jadwal praktikum sesuai kelas praktikan yang tersinkronisasi secara *real-time* dari Firestore.
   - Filter jadwal (`Semua`, `Dibuka`, `Dihadiri` / `Izin`) berfungsi langsung di atas data live Firestore.
2. **Presensi Terintegrasi Firestore & Pencegahan Presensi Ganda (`sesi/[id].tsx`, `PresensiSheet.tsx`):**
   - Melakukan presensi ke Firestore saat sesi berstatus `DIBUKA` melalui sheet konfirmasi dengan pernyataan kehadiran.
   - Menolak presensi kedua pada sesi yang sama (atau bila praktikan sudah memiliki izin aktif pada sesi tersebut) dan menampilkan waktu pencatatan pertama.
3. **Pengajuan Izin & Integrasi Klasifikasi AI (`sesi/[id].tsx`, komponen sheet izin praktikan):**
   - Tombol & form sheet **Ajukan Izin** untuk sesi praktikum dengan input teks alasan ketidakhadiran (wajib diisi, minimal panjang karakter wajar).
   - Saat form dikirim, memanggil aksi pengajuan izin yang meminta prediksi kategori alasan ke **API Model AI** lalu menyimpan alasan, hasil klasifikasi AI, dan status awal `MENUNGGU` ke Cloud Firestore.
   - Menampilkan status pengajuan izin pada detail sesi (`Menunggu keputusan asisten`, `Izin diterima`, atau `Izin ditolak` beserta kategori AI).
4. **Riwayat Kehadiran & Izin Real-Time (`riwayat.tsx`):**
   - Menampilkan daftar riwayat kehadiran (`Hadir`) dan pengajuan izin (`Menunggu` / `Izin Diterima` / `Izin Ditolak`) milik praktikan yang login secara *real-time* dari Firestore.

**Kriteria terima:**

- [ ] Praktikan hanya melihat sesi yang sesuai dengan kelasnya dan perubahan status sesi dari asisten (`TERJADWAL → DIBUKA → SELESAI`) langsung terlihat tanpa reload.
- [ ] Tombol presensi hanya aktif saat sesi `DIBUKA` dan praktikan belum presensi serta belum mengajukan izin pada sesi tersebut.
- [ ] Presensi menyimpan data kehadiran ke Firestore, menampilkan `Toast` sukses, dan menonaktifkan tombol presensi secara permanen untuk sesi itu.
- [ ] Percobaan presensi ganda ditolak dan menampilkan pesan yang menyebutkan waktu presensi pertama.
- [ ] Praktikan dapat mengajukan izin dengan mengisi alasan; sistem memvalidasi alasan tidak boleh kosong.
- [ ] Saat mengajukan izin, alasan dikirim ke API AI untuk diklasifikasikan, lalu disimpan ke Firestore dengan status `MENUNGGU` (tidak langsung diterima/ditolak oleh AI).
- [ ] Bila koneksi ke API AI gagal atau timeout, pengajuan izin tetap berhasil disimpan ke Firestore dengan informasi klasifikasi fallback dan memberi tahu pengguna secara wajar.
- [ ] Saat asisten menerima atau menolak izin, status izin pada Detail Sesi dan tab Riwayat praktikan langsung berubah secara *real-time*.

**Butir SRS terkait:** FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18.

**Batas:** P3 tidak mengubah halaman login/registrasi (milik P1), layar asisten (milik P2), atau aturan keamanan Firestore (milik PM).

---

## 5. Dependensi & Urutan Integrasi

Urutan ini wajib dipatuhi agar tidak terjadi konflik file antara *Refactor UI* dan pengerjaan fitur Firebase/AI:

| Urutan | Pekerjaan | Area | Prasyarat |
| ------ | --------- | ---- | --------- |
| 1 | **Refactor UI Parity** (token, ikon, UI kit baru, 4 tab + Beranda, restyle layar sesuai prototipe) | PM (Farras) | — (Dikerjakan pertama kali di H+0) |
| 2 | Setup Firebase (Auth & Firestore), skema koleksi, `firestore.rules`, dan service API AI (`src/services/ai.ts`) | PM (Farras) | Urutan 1 selesai & merge ke `main` |
| 3 | Kontrak baru `SessionContext` berbasis Firebase Auth & Firestore `onSnapshot` | PM (Farras) | Urutan 2 |
| 4 | Registrasi, Login Firebase Auth, Profil nyata, dan Landing real-time | P1 (Akmal) | Urutan 3 |
| 5 | CRUD Sesi Praktikum Asisten & sinkronisasi jadwal real-time Praktikan | P2 (Eileen), P3 (Nouvella) | Urutan 3 |
| 6 | Presensi Firestore & pencegahan presensi ganda | P3 (Nouvella) | Urutan 5 |
| 7 | Pengajuan Izin Praktikan + integrasi klasifikasi API AI | P3 (Nouvella) | Urutan 5 |
| 8 | Pemeriksaan Izin oleh Asisten (tampil klasifikasi AI + Terima/Tolak) & Rekap/Riwayat real-time | P2 (Eileen), P3 (Nouvella) | Urutan 7 |
| 9 | Pengujian validasi, *error handling* (offline/AI gagal), Security Rules, gladi demo, & tag `v0.2-sprint2` | PM + semua | Seluruh hasil area (Urutan 4–8) |

> **Penting:** P1, P2, dan P3 baru membuat branch kerja masing-masing **setelah** PM menyelesaikan dan me-merge Urutan 1 (Refactor UI Parity) dan Urutan 3 (Fondasi Firebase & Context) ke `main`.

---

## 6. Aturan Kerja per Area

1. **UI Parity oleh PM di awal.** Seluruh pembaruan tampilan dasar dari prototipe dikerjakan oleh PM sebelum delegasi fitur dimulai. Programmer wajib menjaga konsistensi desain tersebut saat menambahkan form/fitur Sprint 2 (gunakan `SheetModal`, `ConfirmSheet`, `Toast`, `Tombol`, `StatusBadge`, dan token di `src/theme/tokens.ts`).
2. **Kepemilikan file.** Setiap programmer hanya mengubah file di areanya (§3). File konfigurasi Firebase, context, service AI, dan komponen UI bersama dikelola oleh PM.
3. **Satu PR = satu cakupan fitur yang koheren.** Gunakan penamaan branch sesuai `docs/WORKFLOW-GIT.md` (misal: `feat/firebase-auth-register`, `feat/asisten-crud-sesi`, `feat/praktikan-izin-ai`).
4. **Keamanan kredensial.** Dilarang melakukan commit file `.env` atau kredensial rahasia ke repository. Gunakan variabel `EXPO_PUBLIC_*` dan dokumentasikan nama variabelnya di `.env.example`.
5. **AI hanya sebagai pendukung keputusan.** Jangan pernah membuat logika yang otomatis mengubah status izin menjadi `DITERIMA` atau `DITOLAK` berdasarkan output model AI.
6. **PM yang me-review dan merge.** Programmer tidak melakukan merge sendiri. Merge menggunakan *merge commit* biasa (`--merge`), bukan squash.
7. **Definition of Done setiap PR:** berjalan di Expo Go tanpa crash, terhubung ke Firebase secara *real-time*, menangani state *loading/empty/error*, tidak menulis kode warna hex langsung di luar `tokens.ts`, dan lolos `npx tsc --noEmit`.

---

## 7. Jadwal

| Hari | Tanggal | Fokus area |
| ---- | ------- | ---------- |
| H+0 | Rabu, 11 Nov | **PM (Farras):** Menyelesaikan *Refactor UI Parity* secara penuh, setup proyek Firebase (Auth + Firestore), `firestore.rules`, `src/services/ai.ts`, dan kontrak `SessionContext` baru lalu merge ke `main`. |
| H+1 | Kamis, 12 Nov | **P1 (Akmal):** Login & Registrasi Firebase Auth + penyimpanan profil `users`. **P2 (Eileen):** Beranda asisten real-time + CRUD Sesi (Tambah/Ubah/Hapus). **P3 (Nouvella):** Beranda & Jadwal praktikan real-time + Presensi Firestore. |
| H+2 | Jumat, 13 Nov | **P1 (Akmal):** Landing real-time + Profil & Logout + validasi error Auth. **P3 (Nouvella):** Form Pengajuan Izin + integrasi klasifikasi API AI. **P2 (Eileen):** Panel Pemeriksaan Izin (tampil alasan & klasifikasi AI + aksi Terima/Tolak). |
| H+3 | Sabtu, 14 Nov | **P2 (Eileen):** Rekap kehadiran & izin real-time. **P3 (Nouvella):** Riwayat kehadiran & status izin real-time + guard presensi ganda. **PM (Farras):** Audit `firestore.rules`, uji skenario error/timeout AI, dan build APK preview EAS. |
| H+4 | Minggu, 15 Nov | Hentikan fitur baru; integrasi akhir lintas perangkat/akun, gladi demo 2 alur utama, perbaikan bug kecil, dan pembuatan tag `v0.2-sprint2`. |

Irama harian:
- Pagi: `git pull origin main`, lalu standup async di grup.
- Siang/Sore: Buka PR lebih awal agar PM dapat me-review dan menguji sinkronisasi Firestore.
- Malam: PM merge PR yang lolos kriteria terima; programmer menarik `main` terbaru.

---

## 8. Skenario Demo

Demo dapat dilakukan pada dua perangkat secara bersamaan (atau satu perangkat dengan berganti akun) untuk membuktikan sinkronisasi *real-time* dan persistensi Cloud Firestore:

### Skenario 1 — Alur Presensi & Pengelolaan Sesi Real-Time
1. Buka aplikasi: Landing menampilkan Hero **TapIn** (`"Tap once. You're in."`) dan mengarahkan pengguna ke halaman Login/Registrasi.
2. **Asisten** registrasi/login → membuat atau memilih sesi praktikum berstatus `TERJADWAL` → menekan **Buka Sesi**. Status sesi di Firestore berubah menjadi `DIBUKA`.
3. **Praktikan** login → melihat sesi tersebut langsung berstatus `DIBUKA` secara *real-time* di Beranda/Jadwal → melakukan **Presensi** melalui sheet konfirmasi.
4. Praktikan mencoba melakukan presensi kedua pada sesi yang sama → sistem menolak dan menampilkan waktu presensi pertama.
5. Tanpa memuat ulang aplikasi, **Asisten** langsung melihat nama dan waktu hadir praktikan tersebut muncul pada Detail Sesi dan tab **Rekap**.
6. **Asisten** menutup sesi (`SELESAI`) → tombol presensi di sisi praktikan otomatis menjadi nonaktif secara *real-time*. Aplikasi ditutup lalu dibuka kembali untuk membuktikan seluruh data tetap tersimpan.

### Skenario 2 — Alur Pengajuan & Pemeriksaan Izin Berbantuan AI
1. **Praktikan** login → memilih sesi praktikum → membuka form **Ajukan Izin** dan menuliskan alasan ketidakhadiran (misal: *"Tidak dapat hadir karena sedang demam tinggi dan rawat jalan di klinik"*).
2. Saat dikirim, aplikasi memanggil **API Model AI** untuk mengklasifikasikan alasan tersebut, lalu menyimpan pengajuan beserta hasil prediksi kategori AI ke Cloud Firestore dengan status `MENUNGGU`.
3. **Asisten** membuka sesi terkait → melihat pengajuan izin baru secara *real-time* lengkap dengan alasan praktikan dan badge **hasil klasifikasi AI** sebagai informasi pendukung.
4. **Asisten** menekan tombol **Terima** (atau **Tolak**) → keputusan tersimpan di Firestore.
5. **Praktikan** langsung melihat status pengajuan izinnya berubah menjadi `DITERIMA` (atau `DITOLAK`) secara *real-time* pada Detail Sesi dan tab **Riwayat**.

---

## 9. Risiko Sprint

| Risiko | Dampak | Mitigasi |
| ------ | ------ | -------- |
| Konflik kode antara perubahan UI dan fitur Firebase | PR macet di awal sprint | PM menyelesaikan dan me-merge *Refactor UI Parity* di H+0 sebelum P1, P2, dan P3 membuat branch fitur. |
| Endpoint API AI lambat, timeout, atau down saat demo | Pengajuan izin gagal terkirim | PM membungkus panggilan AI di `src/services/ai.ts` dengan *timeout* (mis. 8 detik) dan *fallback* aman sehingga dokumen izin tetap tersimpan di Firestore walau AI gagal merespons. |
| Struktur dokumen Firestore tidak seragam antar programmer | Data gagal dibaca di layar peran lain | Seluruh operasi baca/tulis Firestore dibungkus melalui kontrak tipe dan fungsi terpusat di `SessionContext` yang disiapkan PM. |
| Firebase Security Rules terlalu ketat atau terlalu longgar | Operasi valid ditolak (`permission-denied`) atau celah keamanan | Uji `firestore.rules` pada H+3 untuk skenario baca publik, aksi praktikan, dan aksi asisten. |
| Kebocoran API Key / konfigurasi di repository publik | Pelanggaran keamanan | Simpan konfigurasi di `.env` (masuk `.gitignore`) dan hanya commit `.env.example`. |

---

## 10. Checklist Progres per Area

### PM — Farras
- [ ] **Pra-Sprint:** Refactor UI Parity (token, font Inter 800, ikon Lucide, komponen UI Kit baru, 4 tab + Beranda, restyle seluruh layar sesuai prototipe)
- [ ] Setup Firebase project (Authentication Email/Password & Cloud Firestore) + `src/config/firebase.ts` + `.env.example`
- [ ] Service integrasi API AI (`src/services/ai.ts`) dengan *timeout* & *fallback*
- [ ] Kontrak `SessionContext` dengan `onSnapshot` real-time untuk `users`, `sesi`, `kehadiran`, dan `izin`
- [ ] Firebase Security Rules (`firestore.rules`) sesuai peran
- [ ] Review & merge PR harian, build APK EAS, gladi demo, dan tag `v0.2-sprint2`

### P1 — Akmal
- [ ] Integrasi Login dengan Firebase Authentication + validasi & pesan error
- [ ] Integrasi Registrasi akun baru pada `src/app/login.tsx` (pilih peran, simpan profil ke `users/{uid}` Firestore)
- [ ] Persistensi sesi (`onAuthStateChanged`) & auto-redirect berdasarkan peran pada Landing (`src/app/index.tsx`)
- [ ] Halaman Profil (data user nyata dari Firestore) + aksi Logout Firebase Auth

### P2 — Eileen
- [ ] Beranda asisten *real-time* (metrik sesi aktif, total hadir, kartu sesi berlangsung)
- [ ] CRUD Sesi Praktikum di Firestore (Tambah Sesi, Ubah Sesi, Hapus Sesi dengan validasi & konfirmasi)
- [ ] Aksi Buka, Tutup, dan Buka Lagi sesi terhubung ke Firestore
- [ ] Panel Pemeriksaan Izin (menampilkan alasan praktikan + hasil klasifikasi AI + aksi Terima/Tolak)
- [ ] Rekap kehadiran & izin per sesi secara *real-time*

### P3 — Nouvella
- [ ] Beranda & Jadwal praktikan *real-time* sesuai kelas + filter sesi
- [ ] Alur Presensi terintegrasi Firestore + pencegahan presensi ganda
- [ ] Form Pengajuan Izin praktikan + integrasi klasifikasi API AI saat submit
- [ ] Tampilan status pengajuan izin (`MENUNGGU` / `DITERIMA` / `DITOLAK` + kategori AI) pada Detail Sesi
- [ ] Riwayat kehadiran & izin pribadi secara *real-time*

---

## 11. Catatan untuk PM

- Pastikan **Refactor UI Parity** selesai dan di-merge ke `main` paling pertama sebelum membagikan aba-aba `git checkout -b` kepada Akmal, Eileen, dan Nouvella.
- Saat me-review PR, uji langsung dengan dua akun berbeda (1 Asisten, 1 Praktikan) untuk memastikan listener `onSnapshot` benar-benar memperbarui antarmuka tanpa reload.
- Pastikan tidak ada logika yang menyetujui/menolak izin secara otomatis dari hasil prediksi AI—keputusan wajib berasal dari aksi klik asisten.
- Setelah kedua skenario demo lolos tanpa error dan `npx tsc --noEmit` bersih, buat tag rilis `v0.2-sprint2`.
