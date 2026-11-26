# Sprint 4 — Manajemen Laboratorium, Dashboard, Denda Keterlambatan, dan Pembayaran Midtrans

Dokumen perencanaan sprint · disusun oleh PM

| Item | Keterangan |
|---|---|
| PM | Eileen |
| Programmer | P1 Akmal, P2 Farras, P3 Nouvella |
| Periode | Kamis, 26 November 2026 (H+0) — Senin, 30 November 2026 pukul 23.59 (H+4). Usulan; sesuaikan dengan batas dari pengajar. |
| Acuan requirement (SRS) | docs/PRD.md + docs/sprints/sprint-3.md (FR-19 s.d. FR-25) + Spesifikasi Sprint 4 (FR-26 s.d. FR-48) |
| Acuan desain | docs/DESIGN.md + docs/DESIGN-SPRINT3.md + docs/DESIGN-SPRINT4.md |
| Status | Direncanakan |

Dokumen ini mengatur pembagian area dan hasil yang harus dicapai. Requirement tetap di PRD dan spesifikasi sprint; keputusan visual tetap di docs/DESIGN.md. Setiap orang bebas menentukan urutan dan cara kerja di dalam areanya, selama kriteria terima terpenuhi.

**Istilah. Aslab** = asisten laboratorium (peran baru). **Asprak** = asisten praktikum, yaitu peran `asisten` pada Sprint 1–3; nilai di data tidak diganti, hanya label tampilan menjadi Asprak. **Praktikan** tidak berubah.

---

## 1. Tujuan Sprint

Menyempurnakan TapIn dengan manajemen laboratorium oleh Aslab, dashboard keberlangsungan lab, pengelolaan sesi oleh Asprak, perhitungan keterlambatan dengan denda, dan pembayaran denda lewat Midtrans Sandbox. Sprint ini juga memfinalisasi antarmuka semua peran agar modern dan konsisten.

Tiga alur yang harus dapat didemonstrasikan:

1. **Manajemen Lab:** Aslab membuat lab dari satu mata kuliah (bulk) → memasukkan praktikan dan asprak lewat template CSV (masing-masing terpisah) → meninjau dan memperbaiki baris → menyimpan → memindahkan praktikan → mengatur radius, grace period, dan denda.
2. **Keterlambatan dan Pembayaran:** Asprak membuka sesi → praktikan presensi di dalam grace period (tepat waktu) dan sesudahnya (terlambat) → tagihan dibuat satu kali → notifikasi → praktikan membayar lewat Midtrans Sandbox → webhook memverifikasi → status success → notifikasi → riwayat.
3. **Izin, AI, dan Dashboard:** Praktikan mengajukan izin → AI memberi analisis → Asprak menerima → praktikan tercatat tidak hadir dengan izin tanpa denda → Aslab melihat dashboard (status lab, jadwal, riwayat kegiatan, riwayat keuangan) dengan filter hari/minggu/bulan.

---

## 2. Sumber Requirement (SRS)

### 2.1 Butir SRS yang dikerjakan

| Butir | Kebutuhan | Area utama |
|---|---|---|
| FR-26 | Peran Aslab dan pembatasan akses tiga peran (Aslab, Asprak, Praktikan) | PM (rules, context) + P2 (guard, login) + P1 (routing shell) |
| FR-27 | Pengelolaan data lab oleh Aslab: nama, mata kuliah, lokasi, koordinat, radius | PM (updateLab) + P2 (layar) |
| FR-28 | Bulk/single insert laboratorium berdasarkan satu mata kuliah | PM (createLabsBulk) + P2 |
| FR-29 | Bulk/single insert praktikan ke lab tertentu | PM (addAnggotaBulk) + P2 |
| FR-30 | Bulk/single insert asprak ke lab tertentu | PM (addAnggotaBulk) + P2 |
| FR-31 | Template CSV yang dapat diunduh dan daftar review baris (terima/tolak, ubah, lengkapi) untuk tiap bulk insert; ketiganya terpisah | PM (parser, template) + P2 (tampilan) |
| FR-32 | Pindah praktikan/asprak antar lab, tanpa memindah jadwal | PM (pindahAnggota) + P2 |
| FR-33 | Konfigurasi cakupan lokasi presensi (radius), batas keterlambatan (grace period), dan nominal denda per lab | PM + P2 |
| FR-34 | Dashboard lab: jumlah lab dan praktikan, status kegiatan, lokasi dan waktu, jadwal berlangsung/akan datang, riwayat kegiatan, riwayat keuangan denda; filter hari/minggu/bulan | P3 (+ PM data, P1 komponen filter) |
| FR-35 | Pengelolaan sesi oleh Asprak: lihat kelas/jadwal/sesi, buka, pantau presensi, tutup; sinkron real-time | P3 |
| FR-36 | Perhitungan keterlambatan (grace period) dan satu tagihan denda per kejadian | PM (markAttendance) + P1 (antarmuka) |
| FR-37 | Integrasi Midtrans Sandbox lewat backend: transaksi, redirect, webhook, verifikasi status | PM (backend) + P1 (klien) |
| FR-38 | Daftar tagihan, rincian nominal, status pending/success/failed, riwayat transaksi praktikan | P1 |
| FR-39 | Notifikasi: tagihan baru, pembayaran berhasil, pembayaran gagal | PM (pengiriman) + P1 (klien) |
| FR-40 | Izin dan AI (analisis sentimen) disesuaikan dengan lab, sesi, presensi, dan denda; excused absence bebas denda | PM (ai.ts, context) + P1 (praktikan) + P3 (Asprak) |
| FR-41 | Finalisasi antarmuka lintas peran: modern, konsisten, state loading/empty/error | P1 + semua pemilik area |
| FR-42 | Notifikasi hanya diterima pengguna yang sedang login | PM (logout, token) + P1 (klien) |
| FR-43 | Notifikasi lab hanya untuk praktikan yang terdaftar di lab tersebut; asisten tidak menerimanya | PM (penargetan) + P1 (klien, riwayat) |
| FR-44 | Jumlah notifikasi belum dibaca pada tombol notifikasi | P1 |
| FR-45 | Notifikasi berhasil atau gagal saat membuat dan menutup sesi | PM (pesan) + P3 (layar) + P1 (riwayat) |
| FR-46 | Presensi tanpa konfirmasi tambahan di UI; validasi di `markAttendance` | P1 (antarmuka) + PM (validasi) |
| FR-47 | Bahasa Indonesia dan Inggris memakai i18n | P1 (fondasi) + semua pemilik area |
| FR-48 | Sesi hanya dalam jam operasional lab 07.00–20.00 WIB | PM (aturan) + P3 (form dan tombol) |

### 2.2 Keputusan Aturan Bisnis

- **Tiga peran.** Aslab mengelola lab dan distribusi anggota serta melihat dashboard. Asprak hanya mengelola pelaksanaan sesi di lab tempat ia terdaftar dan tidak dapat mengelola distribusi praktikan maupun konfigurasi lab. Aslab tidak dibuat lewat register: PM mengangkat akun Aslab lewat Firebase Console (field `peran: 'aslab'`), dan rules melarang pengguna mengubah `peran` sendiri.
- **Lab dan anggota.** Lab adalah unit praktikum per mata kuliah dengan lokasi, radius, grace period, dan denda sendiri. Praktikan dan Asprak terhubung ke lab lewat koleksi `keanggotaanLab`. Satu praktikan hanya punya satu lab aktif per mata kuliah; memindahkan praktikan berarti mengubah `labId` keanggotaannya. Jadwal dan sesi tidak dipindah.
- **Bulk insert.** Ada tiga fitur terpisah: lab, praktikan, asprak. Formatnya CSV dengan template yang dapat diunduh. Setiap baris menjadi item pada daftar scroll yang dapat diterima, ditolak, diubah, atau dilengkapi; hanya baris yang diterima dan valid yang disimpan, dalam batch Firestore (maksimal 500 operasi per batch). Baris yang NIM atau emailnya belum terdaftar ditandai 'belum terdaftar' dan tidak disimpan pada sprint ini.
- **Grace period.** Presensi sebelum atau tepat pada `jamMulai + graceMenit` dianggap tepat waktu; sesudahnya terlambat. Default 15 menit (usulan), dapat dikonfigurasi per lab (0–60). Zona waktu WIB, memakai waktu server Firestore bila memungkinkan. Perbandingan dilakukan per menit; detik diabaikan.
- **Denda.** Nominal tetap per kejadian, default Rp5.000 (usulan), dikonfigurasi per lab. Satu kejadian = satu tagihan: ID tagihan `{sesiId}_{praktikanId}` dibuat dalam transaksi yang sama dengan catatan kehadiran sehingga tidak dapat ganda. Tagihan memuat praktikan, sesi, dan catatan kehadiran terkait. Pembayaran tidak mengubah status kehadiran.
- **Izin diterima.** Praktikan tetap dicatat tidak hadir dengan izin (excused absence): tidak membuat catatan kehadiran, presensi ditolak (`SUDAH_IZIN`), dan tidak didenda. Bila ada tagihan belum dibayar pada sesi itu (presensi terlambat dilakukan saat izin masih menunggu), tagihan menjadi `DIBEBASKAN`; tagihan yang sudah dibayar tidak diubah dan dicatat sebagai batasan. Izin ditolak mengikuti aturan normal. Tagihan `PENDING` tidak langsung dibebaskan: bila pembayarannya gagal, backend membebaskannya; bila sukses, dicatat sebagai batasan.
- **Alur pembayaran.** Client–server–Midtrans. Backend membuat transaksi Snap Sandbox dengan nominal yang dibaca dari Firestore, bukan dari klien. Rahasia (server key) hanya ada di backend: tidak di React Native dan tidak di repo. Status tagihan hanya diubah backend (Admin SDK) setelah webhook tervalidasi: `signature_key` cocok (SHA-512 dari order_id + status_code + gross_amount + server key), nominal cocok, dan bila perlu dikonfirmasi lewat Status API Midtrans. Respons halaman pembayaran di klien hanya memicu penyegaran tampilan. Format terbaru dirujuk dari docs.midtrans.com.
- **Pemetaan status.** settlement/capture → success; pending → pending; deny/cancel/expire/failure → failed. Tagihan yang gagal dapat dibayar ulang dengan order baru; satu tagihan hanya boleh punya satu pembayaran sukses, dan webhook yang sama yang diterima berulang tidak menggandakan efek (idempoten).
- **Backend.** Sprint 3 mencatat backend kustom di luar cakupan; Sprint 4 mengubahnya karena webhook membutuhkan server. Keputusan PM pada H+0: (A) Firebase Cloud Functions (memerlukan paket Blaze) atau (B) server Node kecil di hosting gratis. Webhook membutuhkan URL HTTPS publik; saat pengembangan boleh memakai tunnel.
- **Notifikasi.** Tagihan baru dikirim dari klien saat presensi terlambat; pembayaran berhasil dan gagal dikirim backend lewat Expo Push API ke `users/{uid}.pushToken`. Hanya ke praktikan terkait. Kegagalan notifikasi tidak menggagalkan aksi utama.
- **AI.** Tetap informasi pendukung. Selain kategori Sakit/Izin dari Sprint 3, hasil analisis menambahkan sentimen (positif/netral/negatif) yang disimpan di dokumen izin. Bila 'analisis sentimen' pada spesifikasi ternyata sama dengan klasifikasi yang sudah ada, konfirmasikan ke pengajar (lihat §12). Layanan AI gagal → penanda fallback; pengajuan dan pemeriksaan tetap berjalan.
- **Login dan notifikasi.** Saat logout, `pushToken` dihapus dari akun sebelum `signOut`, dan notifikasi tidak diterima sebelum login kembali. Satu token perangkat hanya melekat pada satu akun.
- **Penerima notifikasi.** Notifikasi sesi dan jadwal dikirim ke praktikan anggota lab (`keanggotaanLab`), bukan berdasarkan kelas. Asisten tidak menerimanya. Riwayat notifikasi dipisah per akun.
- **Notifikasi aksi sesi.** Hasil membuat dan menutup sesi (berhasil atau gagal) hanya ditujukan ke Asprak yang melakukan aksi, berupa Toast dan entri di riwayat notifikasi.
- **Konfirmasi presensi.** Sheet "Lanjut ke Halaman Presensi" dan centang pernyataan kehadiran dihapus. Satu tombol presensi langsung memanggil `markAttendance`, yang tetap memeriksa waktu, lokasi, dan status.
- **Bahasa.** Teks tampilan memakai `i18next` dan `react-i18next`, mengikuti pilihan bahasa di pengaturan.
- **Jam operasional.** `jamMulai` paling awal 07.00 dan `jamSelesai` paling lambat 20.00 WIB. Pembuatan, perubahan, dan pembukaan sesi di luar rentang itu ditolak.

### 2.3 Di luar Sprint 4

- Pembayaran uang asli (production), refund, dan metode pembayaran kustom.
- Format Excel (.xlsx); hanya CSV.
- Pemindahan jadwal praktikum (yang dipindah hanya praktikan dan asprak).
- Pendeteksian lokasi palsu (fake GPS) dan ekspor laporan PDF/CSV/Excel.

> Jangan menambah dependensi atau fitur di luar daftar ini tanpa persetujuan PM.

---

## 3. Pembagian Area dan Kepemilikan File

| Area | Kode | Pemilik | File utama |
|---|---|---|---|
| Fondasi data, backend, rules, notifikasi (pengiriman), config, rilis | PM | Eileen | `src/context/**`, `src/services/**`, `src/utils/**`, `src/data/**`, `server/**`, `firestore.rules`, `app.json`, `eas.json`, `package.json`, `package-lock.json`, `.env.example`, `README.md`, `docs/**` (kecuali DESIGN-SPRINT4.md) |
| Shell, UI kit, area praktikan, tagihan dan pembayaran, notifikasi klien | P1 | Akmal | `src/app/_layout.tsx`, `src/components/ui/**` (termasuk barrel `index.ts`), `src/theme/**`, `src/app/(praktikan)/**`, `src/components/praktikan/**`, `src/hooks/useNotifications.ts`, `docs/DESIGN-SPRINT4.md`, `src/i18n/**`, `src/app/notifikasi.tsx`, `src/app/(aslab)/_layout.tsx` dan `src/app/(aslab)/(tabs)/_layout.tsx` |
| Manajemen lab, bulk insert, autentikasi, peta | P2 | Farras | `src/app/(aslab)/lab/**`, `src/app/(aslab)/(tabs)/lab.tsx`, `src/components/aslab/lab/**`, `src/app/kelola-lab.tsx`, `src/app/login.tsx`, `src/app/index.tsx`, `src/app/peta.tsx`, `src/components/peta/**` |
| Area asprak dan dashboard Aslab | P3 | Nouvella | `src/app/(asisten)/**`, `src/components/asisten/**`, `src/app/(aslab)/(tabs)/beranda-aslab.tsx`, `src/app/(aslab)/dashboard/**`, `src/components/aslab/dashboard/**` |

**Aturan kepemilikan:**

1. Selain pemilik, jangan mengedit file area lain. Butuh perubahan? Ajukan ke pemilik area atau PM.
2. Pengecualian tunggal: PR skeleton P1 (§5.2) boleh membuat route group `(aslab)` beserta stub layar milik P2 dan P3, serta rute `(praktikan)/tagihan` dan `(praktikan)/riwayat-pembayaran`. PR ini di-merge sebelum yang lain membuat branch kerja.
3. `package.json`, `package-lock.json`, `app.json`, dan `eas.json` hanya diubah PM. Paket Sprint 4 dipasang PM pada H+0: `expo-document-picker`, `expo-file-system`, `expo-sharing`, `expo-web-browser`, `papaparse`, `i18next`, `react-i18next`. Paket native baru membutuhkan development build baru; PM mengumumkannya di grup.
4. Komponen UI baru milik area lain dibuat di folder areanya (misalnya `components/aslab/**`), bukan di `components/ui/**`. Komponen lintas peran (badge status pembayaran, filter rentang) dibuat P1 di `components/ui/**`.
5. `ImportReviewList` (daftar review baris untuk bulk insert) dibuat P2 di `components/aslab/lab/**` dan dipakai ketiga bulk insert.
6. Backend `server/**` hanya diubah PM. Rahasia (server key, service account) tidak pernah masuk repo.

---

## 4. Kontrak useSession() Sprint 4

Kontrak dibekukan pada H+0 dan di-merge ke `main` (isi boleh stub). Perubahan setelah itu hanya boleh dilakukan dengan: (1) pengumuman di grup sebelum merge, (2) pencatatan di dokumen ini atau PRD, (3) pemilik layar menyesuaikan.

```ts
// Peran dan anggota
currentUser.peran                      // 'praktikan' | 'asisten' (Asprak) | 'aslab'
labs: Lab[]                            // { id, nama, mataKuliah, alamat, lat, lng, radius, graceMenit, dendaNominal, aslabId }
keanggotaanLab: Keanggotaan[]          // { id, labId, uid, peran: 'praktikan' | 'asprak', mataKuliah }
createLab(input)                       // { ok: true, labId } atau { ok: false, alasan }
createLabsBulk(mataKuliah, baris[])    // HasilBulk
addAnggotaBulk(labId, peran, baris[])  // HasilBulk; peran: 'praktikan' | 'asprak'
pindahAnggota(uid, dariLabId, keLabId) // { ok: true } atau { ok: false, alasan }
updateLab(labId, { nama, alamat, lat, lng, radius, graceMenit, dendaNominal })

// Presensi dan denda
markAttendance(sesiId, koordinat)      // { ok: true, jarak, status: 'TEPAT_WAKTU' | 'TERLAMBAT', menitTerlambat?, tagihanId? }
                                       // atau { ok: false, alasan }
tagihan: Tagihan[]                     // milik praktikan login, real-time
pembayaran: Pembayaran[]               // riwayat transaksi praktikan, real-time
mulaiPembayaran(tagihanId)             // { ok: true, redirectUrl, orderId } atau { ok: false, alasan }
sinkronPembayaran(orderId)             // minta backend memeriksa ulang status

// Dashboard
getRingkasanLab(rentang)               // rentang: 'hari' | 'minggu' | 'bulan'

// HasilBulk = { berhasil: number; gagal: { baris: number; alasan: string }[] }
```

**Alasan penolakan baru:**

- `markAttendance`: `SUDAH_IZIN` (izin sudah diterima).
- `mulaiPembayaran`: `TAGIHAN_TIDAK_DITEMUKAN`, `SUDAH_LUNAS`, `TIDAK_BERHAK`, `JARINGAN`, `SERVER_ERROR`.
- `pindahAnggota`: `LAB_TUJUAN_TIDAK_DITEMUKAN`, `SUDAH_DI_LAB_TUJUAN`, `TIDAK_BERHAK`, `JARINGAN`.
- `createSession`, perubahan jadwal, dan `openSession`: `DI_LUAR_JAM_OPERASIONAL`.
- `createLab`, `createLabsBulk`, `addAnggotaBulk`: `TIDAK_BERHAK`, `DATA_TIDAK_VALID`, `JARINGAN`.

**Skema Firestore (ringkas):**

- `labs/{labId}`: tambah `mataKuliah`, `aslabId`, `graceMenit`, `dendaNominal`.
- `keanggotaanLab/{labId}_{uid}`: `labId`, `uid`, `peran`, `mataKuliah`, `dibuatPada`.
- `kehadiran/*`: tambah `statusKehadiran` (`TEPAT_WAKTU` | `TERLAMBAT`), `menitTerlambat`, `tagihanId?`.
- `izin/*`: tambah `sentimenAi?`; `kategoriAi` dan `ringkasanAi` tetap.
- `tagihan/{sesiId}_{praktikanId}`: `praktikanId`, `sesiId`, `labId`, `kehadiranId`, `nominal`, `menitTerlambat`, `status` (`UNPAID` | `PENDING` | `PAID` | `FAILED` | `DIBEBASKAN`), `dibuatPada`, `dibayarPada?`.
- `pembayaran/{orderId}`: `tagihanId`, `praktikanId`, `nominal`, `status` (`pending` | `success` | `failed`), `statusMidtrans`, `metode?`, `dibuatPada`, `diperbaruiPada`.
- `users/{uid}`: `peran`, `pushToken`.

**Kontrak backend** (`EXPO_PUBLIC_PAYMENT_API_URL`):

- `POST /pembayaran/buat` — header `Authorization: Bearer <Firebase ID token>`, body `{ tagihanId }` → `{ redirectUrl, orderId }`. Backend memeriksa kepemilikan dan status tagihan, lalu membuat transaksi Snap Sandbox.
- `POST /pembayaran/webhook` — dipanggil Midtrans; memverifikasi signature, memperbarui `pembayaran` dan `tagihan`, mengirim push.
- `POST /pembayaran/sinkron` — body `{ orderId }`; backend menanyakan status ke Midtrans lalu memperbarui Firestore.

---

## 5. Jobdesk per Area

Setiap area memiliki hasil, kriteria terima, dan batas. Cara mencapai hasil diserahkan kepada pemilik area.

### 5.1 PM — Fondasi Data, Backend, Notifikasi, dan Rilis

**Hasil yang harus ada:**

1. Peran `aslab`, akun Aslab awal (seed lewat Console), dan tipe data baru (Lab diperluas, Keanggotaan, Tagihan, Pembayaran).
2. Kontrak `useSession()` Sprint 4 (§4) di-merge pada H+0.
3. Fungsi context `createLab`, `createLabsBulk`, `addAnggotaBulk`, `pindahAnggota`, dan `updateLab` (radius, grace, denda) dengan validasi dan penyimpanan batch.
4. `src/utils`: `hitungKeterlambatan`, parser dan validator CSV (lab, praktikan, asprak), pembuat template CSV, serta helper rentang hari/minggu/bulan (WIB).
5. `markAttendance`: menentukan tepat waktu/terlambat, menyimpan `statusKehadiran`, membuat tagihan dalam transaksi yang sama, guard `SUDAH_IZIN`. `reviewIzin` membebaskan tagihan belum dibayar bila izin diterima. Tagihan `PENDING` dibebaskan backend hanya bila pembayarannya gagal.
6. Backend Midtrans (`server/**`): tiga endpoint di §4, verifikasi Firebase ID token, Snap Sandbox, validasi signature, pemetaan status, idempotensi, push notifikasi, deploy dengan URL HTTPS publik, dan README cara menjalankan serta memasang URL webhook di dashboard Sandbox.
7. `ai.ts` dan `submitIzin`: sentimen, fallback aman, penyimpanan hasil ke Firestore.
8. `services/notifications.ts`: pesan tagihan baru, pembayaran berhasil, dan pembayaran gagal, ditargetkan.
9. `firestore.rules` diperbarui.
10. `app.json`, `eas.json`, `.env.example` (`EXPO_PUBLIC_PAYMENT_API_URL`), paket baru terpasang, development build EAS baru, review dan merge PR, uji dua perangkat, APK preview, tag `v0.4-sprint4`.

**Kriteria terima:**

- [ ] Semua paket terpasang di H+0 dan development build baru tersedia paling lambat H+1; PM mengumumkan di grup karena paket native baru membutuhkan APK baru.
- [ ] Hanya Aslab yang dapat membuat atau mengubah lab dan keanggotaan; Asprak dan Praktikan ditolak oleh rules; pengguna tidak dapat mengubah `peran` sendiri.
- [ ] Bulk insert menolak baris tidak valid per baris dengan alasan jelas, tidak membuat duplikat (praktikan yang sudah ada di lab), dan memecah batch di atas 500 operasi.
- [ ] `pindahAnggota` berjalan dalam transaction, menolak lab tujuan yang tidak ada atau sama, dan tidak menyentuh sesi.
- [ ] Presensi tepat pada `jamMulai + graceMenit` dicatat tepat waktu; satu menit sesudahnya dicatat terlambat; keduanya tersimpan di `statusKehadiran`.
- [ ] Satu kejadian terlambat menghasilkan tepat satu tagihan (ID deterministik); presensi ulang ditolak dan tidak menambah tagihan.
- [ ] Praktikan dengan izin diterima tidak dapat presensi, tidak punya tagihan aktif, dan tidak dihitung hadir.
- [ ] Backend menolak webhook dengan signature atau nominal salah, tidak menggandakan efek bila webhook berulang, dan tidak pernah mempercayai status dari klien.
- [ ] Server key tidak ada di repo maupun bundle aplikasi.
- [ ] Notifikasi tagihan baru, pembayaran berhasil, dan gagal hanya ke praktikan terkait; kegagalan kirim tidak menggagalkan aksi utama dan mengembalikan status agar UI menampilkan Toast.
- [ ] `firestore.rules`: praktikan hanya membaca tagihan dan pembayaran miliknya, hanya dapat membuat tagihan `UNPAID` miliknya dengan nominal sesuai lab, dan tidak dapat menulis status pembayaran; Asprak dan Aslab hanya membaca data lab mereka; hanya backend yang mengubah status pembayaran. Pengecualian: Asprak di lab tagihan boleh mengubah `UNPAID` atau `FAILED` menjadi `DIBEBASKAN` (hanya `status` dan `izinId`) bila izin itu diterima serta milik praktikan dan sesi yang sama.
- [ ] AI tetap hanya pendukung; tidak ada logika yang memutuskan izin otomatis.
- [ ] Tag `v0.4-sprint4` dibuat setelah tiga alur demo lolos.

**Butir SRS terkait:** FR-26 s.d. FR-33, FR-36, FR-37, FR-39, FR-40.

**Batas:** PM tidak mengambil alih layar P1, P2, atau P3. Perubahan di file area programmer diminta ke pemiliknya.

### 5.2 P1 — Shell, UI Kit, Area Praktikan, Tagihan dan Pembayaran

**Hasil yang harus ada:**

1. PR skeleton (H+1): route group `(aslab)` dengan tab stub (`beranda-aslab`, `lab`); rute `(praktikan)/tagihan`, `(praktikan)/tagihan/[id]`, dan `(praktikan)/riwayat-pembayaran`; routing di `_layout.tsx` berdasarkan peran (Aslab → `/(aslab)/...`, Asprak → `/(asisten)/...`, Praktikan → `/(praktikan)/...`); skeleton komponen dengan props final: `StatusPembayaranBadge`, `TagihanCard`, dan `FilterRentang` (Hari/Minggu/Bulan).
2. Styling final dan token warna di `src/theme/**` untuk status pembayaran (pending, success, failed, dibebaskan) dan status kehadiran (tepat waktu, terlambat).
3. Halaman Tagihan praktikan: daftar real-time, rincian nominal, status, dan tombol Bayar.
4. Alur bayar: `mulaiPembayaran` → buka `redirectUrl` (`expo-web-browser`) → saat kembali tampilkan status dari Firestore secara real-time; tombol Cek status memanggil `sinkronPembayaran`; tombol bayar ulang saat failed.
5. Riwayat pembayaran: sesi, tanggal tagihan, nominal, waktu transaksi, dan status.
6. Halaman Presensi: tampilkan Tepat waktu atau Terlambat, menit keterlambatan, info denda, dan tautan ke tagihan.
7. Notifikasi klien: mengetuk notifikasi tagihan atau pembayaran membuka halaman terkait (`useNotifications`; bentuk hook tidak berubah).
8. Status izin praktikan real-time dengan badge AI dan keterangan: izin diterima berarti tidak hadir dengan izin dan bebas denda.
9. Finalisasi antarmuka lintas peran (FR-41): konsistensi komponen, tema terang/gelap, bahasa, dan state loading/empty/error. Temuan di area lain disampaikan ke pemilik lewat review.
10. `docs/DESIGN-SPRINT4.md`: tampilan komponen baru, status pembayaran, dan status kehadiran.

**Kriteria terima:**

- [ ] Skeleton di-merge H+1, sebelum layar final.
- [ ] Setelah login, tiap peran masuk ke area yang benar dan tidak dapat membuka area peran lain lewat URL.
- [ ] Daftar tagihan menampilkan sesi, nominal, tanggal, dan status; ada loading, empty, dan error state.
- [ ] Tombol Bayar nonaktif dan menampilkan loading saat transaksi dibuat; tagihan lunas atau dibebaskan tidak menampilkan tombol Bayar.
- [ ] Status pending, success, dan failed tampil berbeda dan berubah tanpa reload; status dibaca dari Firestore, bukan dari hasil halaman pembayaran.
- [ ] Riwayat pembayaran tetap tersedia setelah aplikasi ditutup dan dibuka kembali.
- [ ] Halaman Presensi menampilkan tepat waktu atau terlambat dengan pesan Bahasa Indonesia yang jelas, termasuk pesan untuk `SUDAH_IZIN`.
- [ ] Notifikasi tagihan dan pembayaran membuka halaman yang benar; aplikasi tidak crash bila izin notifikasi ditolak.
- [ ] Semua komponen memakai token tanpa hex; barrel `components/ui/index.ts` hanya diubah P1.
- [ ] Tampilan sesuai docs/DESIGN.md dan docs/DESIGN-SPRINT4.md.

**Butir SRS terkait:** FR-26, FR-36 s.d. FR-41.

**Batas:** P1 tidak mengubah `src/context`, `src/services`, `server`, area asisten dan aslab (kecuali skeleton), `peta.tsx`, atau `login.tsx`.

### 5.3 P2 — Manajemen Laboratorium, Bulk Insert, dan Autentikasi

**Hasil yang harus ada:**

1. Layar Kelola Lab untuk Aslab (`(aslab)/lab`): daftar lab dikelompokkan per mata kuliah; tambah dan ubah lab (nama, mata kuliah, alamat, koordinat lewat `LokasiPicker`, radius, grace period, nominal denda) dengan validasi.
2. Single insert untuk lab, praktikan, dan asprak lewat form.
3. Bulk insert lab dari satu mata kuliah: pilih mata kuliah, unggah CSV, review, simpan.
4. Bulk insert praktikan ke lab tertentu.
5. Bulk insert asprak ke lab tertentu. Ketiga bulk insert terpisah, masing-masing dengan layar dan alurnya sendiri.
6. Template CSV yang dapat diunduh untuk tiap jenis bulk insert (`expo-file-system` dan `expo-sharing`).
7. `ImportReviewList`: tiap baris CSV menjadi item pada daftar scroll; Aslab dapat menerima atau menolak, mengubah, dan melengkapi field yang kosong; ada indikator valid, tidak valid, duplikat, dan belum terdaftar; ada ringkasan jumlah; Simpan hanya memproses baris yang diterima dan valid, lalu menampilkan hasil per baris.
8. Pindah praktikan dan asprak antar lab: pilih anggota, lab tujuan, konfirmasi (tanpa memindah jadwal).
9. Guard peran dan autentikasi: layar manajemen lab hanya untuk Aslab; login mengarahkan sesuai peran; register tidak menawarkan Aslab; pesan galat Bahasa Indonesia.
10. Peta: marker lab memakai data lab baru dan sheet menampilkan mata kuliah.

**Kriteria terima:**

- [ ] Hanya Aslab yang dapat membuka layar manajemen lab; Asprak dan Praktikan diarahkan keluar.
- [ ] Koordinat dan radius divalidasi (radius lebih dari 0, koordinat valid), grace period 0–60 menit, dan nominal denda lebih dari 0 sebelum disimpan.
- [ ] Setiap bulk insert memiliki template yang dapat diunduh dan alur terpisah; tidak ada satu bulk yang mencakup ketiganya.
- [ ] CSV rusak, kolom kurang, atau file kosong menampilkan pesan jelas tanpa crash.
- [ ] Daftar review dapat di-scroll; tiap baris dapat diterima, ditolak, diubah, dan dilengkapi; baris ditolak atau tidak valid tidak disimpan.
- [ ] Hasil simpan menampilkan jumlah berhasil dan daftar baris gagal beserta alasannya.
- [ ] Memindahkan anggota memperbarui lab anggota tanpa mengubah jadwal atau sesi, dan perubahan terlihat di lab tujuan tanpa reload.
- [ ] Setelah radius disimpan, validasi presensi dan peta memakai nilai baru.
- [ ] Login mengarahkan Aslab, Asprak, dan Praktikan ke area masing-masing.
- [ ] Loading, empty, dan error state ada di semua layar.

**Butir SRS terkait:** FR-26 s.d. FR-33.

**Batas:** P2 tidak mengubah `components/ui/**`, `_layout.tsx`, `src/hooks/useLocation.ts`, layar praktikan, atau layar Asprak dan dashboard. Hook lokasi dipakai, tidak dibuat ulang. Bila bug ada di context, laporkan ke PM dan kerjakan layar sebagai PR terpisah.

### 5.4 P3 — Area Asprak dan Dashboard Aslab

**Hasil yang harus ada:**

1. Daftar kelas, jadwal, dan sesi yang hanya menampilkan lab tempat pengguna terdaftar sebagai Asprak.
2. Buka dan tutup sesi; perubahan status sinkron real-time ke aplikasi praktikan (aturan PB-05 dan PB-06 tetap berlaku).
3. Pemantauan presensi: daftar hadir real-time berisi nama, waktu, jarak, dan status Tepat waktu atau Terlambat, serta ringkasan jumlah tepat waktu, terlambat, izin, dan belum hadir.
4. Panel izin: alasan, kategori dan sentimen AI (atau penanda fallback), tombol Terima dan Tolak; izin diterima tampil sebagai 'Tidak hadir dengan izin · bebas denda'.
5. Toast bila notifikasi gagal terkirim pada buka sesi, ubah jadwal, dan keputusan izin.
6. Beranda Aslab (`beranda-aslab`): jumlah lab dan praktikan, status kegiatan tiap lab (berlangsung, terjadwal, selesai, tanpa kegiatan), lokasi dan waktu, serta jadwal berlangsung dan akan datang.
7. Riwayat kegiatan lab (sesi selesai) dan riwayat keuangan denda (praktikan, sesi, nominal, status, total terbayar dan tertunggak).
8. Filter Hari, Minggu, dan Bulan yang mempengaruhi seluruh bagian dashboard (memakai `FilterRentang` dari P1 dan helper rentang dari PM).

**Kriteria terima:**

- [ ] Asprak hanya melihat kelas, sesi, dan izin dari lab tempat ia terdaftar, dan tidak melihat menu manajemen lab atau distribusi anggota.
- [ ] Tombol buka dan tutup memakai `getStatusEfektif`; sesi selesai tidak dapat dibuka lagi; penolakan dari context tampil lewat Toast.
- [ ] Perubahan status sesi terlihat di aplikasi praktikan tanpa reload.
- [ ] Daftar presensi menampilkan Tepat waktu atau Terlambat sesuai catatan di Firestore, tidak dihitung ulang di layar.
- [ ] Panel izin menampilkan kategori dan sentimen AI atau penanda bila tidak tersedia; keputusan tetap dari klik Asprak.
- [ ] Praktikan dengan izin diterima tampil sebagai tidak hadir dengan izin, bukan hadir.
- [ ] Dashboard menampilkan jumlah lab dan praktikan, status kegiatan, lokasi dan waktu, jadwal berlangsung dan akan datang, riwayat kegiatan, dan riwayat keuangan.
- [ ] Filter hari/minggu/bulan mengubah semua bagian yang bergantung waktu; data berasal dari Firestore dan diperbarui real-time.
- [ ] Loading, empty, dan error state ada di semua layar.

**Butir SRS terkait:** FR-34, FR-35, FR-36 (tampilan), FR-40, FR-41.

**Batas:** P3 tidak mengubah `_layout.tsx`, `components/ui/**`, area praktikan, layar manajemen lab (P2), `peta.tsx`, atau `login.tsx`.

### 5.5 Pekerjaan Tambahan

**PM (Eileen)**

- [ ] FR-42: `logout` menghapus `pushToken`; bila penghapusan gagal, pengguna diberi tahu. Setelah logout, perangkat tidak menerima notifikasi.
- [ ] FR-43: penerima notifikasi diambil dari anggota lab berperan praktikan; praktikan lab lain dan asisten tidak menerima.
- [ ] FR-45: pesan berhasil dan gagal untuk membuat dan menutup sesi.
- [ ] FR-46: `markAttendance` menolak presensi yang tidak memenuhi syarat tanpa bergantung pada pemeriksaan di UI.
- [ ] FR-47: memasang `i18next` dan `react-i18next`.
- [ ] FR-48: aturan 07.00–20.00 di context dan `firestore.rules` bila memungkinkan; 07.00 dan 20.00 diterima, 06.59 dan 20.01 ditolak.

**P1 (Akmal)**

- [ ] FR-42 dan FR-43: tidak ada notifikasi atau riwayat milik akun lain setelah ganti akun di perangkat yang sama.
- [ ] FR-44: badge jumlah belum dibaca di `AppHeader`; berkurang setelah dibaca, hilang bila nol, tampil "99+" bila lebih dari 99.
- [ ] FR-45: hasil aksi sesi tersimpan di riwayat notifikasi.
- [ ] FR-46: sheet konfirmasi dan centang pernyataan dihapus; tombol nonaktif selama proses agar tidak terkirim ganda.
- [ ] FR-47: fondasi `src/i18n/**` (id dan en) dan teks area praktikan.

**P2 (Farras)**

- [ ] FR-47: teks login, peta, dan manajemen lab memakai i18n.

**P3 (Nouvella)**

- [ ] FR-45: Toast berhasil dan gagal saat membuat dan menutup sesi.
- [ ] FR-47: teks area Asprak dan dashboard memakai i18n.
- [ ] FR-48: pemilih jam hanya menawarkan 07.00–20.00; pesan jelas bila sesi di luar jam operasional.

---

## 6. Dependensi dan Urutan Integrasi

| Urutan | Pekerjaan | Area | Prasyarat |
|---|---|---|---|
| 1 | Paket terpasang, kontrak `useSession()` (stub), skema baru, keputusan hosting backend | PM | — |
| 2 | Development build EAS baru (paket native baru) | PM | Urutan 1 |
| 3 | PR skeleton (route group aslab, rute tagihan, routing peran, skeleton komponen) | P1 | Urutan 1 |
| 4 | Guard peran dan login per peran | P2 | Urutan 3 |
| 5 | Kelola Lab, `ImportReviewList`, bulk lab dan praktikan | P2 | Urutan 3 |
| 6 | Area Asprak dan dashboard dengan data stub | P3 | Urutan 3 |
| 7 | `hitungKeterlambatan`, `markAttendance` + tagihan, fungsi lab di context | PM | Urutan 1 |
| 8 | Halaman tagihan dan presensi dengan data stub | P1 | Urutan 3 |
| 9 | Backend Midtrans, webhook, pengiriman notifikasi | PM | Urutan 7 |
| 10 | Bulk asprak dan pindah anggota | P2 | Urutan 5, 7 |
| 11 | Alur bayar, riwayat, notifikasi klien | P1 | Urutan 8, 9 |
| 12 | Dashboard keuangan dan filter dengan data asli | P3 | Urutan 7, 9 |
| 13 | `firestore.rules`, uji webhook end-to-end, integrasi dua perangkat, gladi, tag rilis | PM + semua | Urutan 4–12 |

**Ketergantungan yang dijembatani stub:**

- Semua layar bergantung pada kontrak `useSession()`; sampai logika asli selesai, context mengembalikan data dummy dan hasil tetap.
- P2 dan P3 memakai tampilan sementara di area masing-masing sampai skeleton P1 di-merge.
- Alur bayar (P1) diuji dengan stub `mulaiPembayaran` (berisi `redirectUrl` contoh) sampai backend siap.
- Dashboard keuangan (P3) memakai tagihan dummy sampai tagihan asli terbentuk.
- `ImportReviewList` dibuat P2 sendiri, sehingga bulk insert tidak menunggu orang lain.

---

## 7. Aturan Kerja per Area

1. Kepemilikan file (§3) ditaati; file bersama milik PM atau pemilik yang tercantum.
2. Tampilan sementara boleh, duplikasi tidak. Gunakan komponen UI bersama setelah di-merge sebelum PR di-merge.
3. Satu PR = satu pekerjaan koheren. Perbaikan memakai judul `fix:` dan dikerjakan sebelum fitur baru di layar yang sama.
4. Judul PR memakai konvensi commit (`feat:`, `fix:`, `chore:`, `docs:`). Deskripsi memuat area, FR terkait, cara menguji, serta screenshot atau video.
5. PM me-review dan merge. Programmer tidak merge sendiri. Merge memakai merge commit biasa, bukan squash.
6. Kontrak dibekukan. Perubahan kontrak diumumkan di grup sebelum merge dan dicatat.
7. Standup async setiap pagi: selesai, dikerjakan hari ini, hambatan. Blocker lebih dari 2 jam harus disampaikan.
8. Keamanan kredensial. Jangan commit `.env`, API key, server key Midtrans, atau service account; gunakan `.env.example`. Jangan menempel kunci ke chat atau screenshot.
9. AI hanya pendukung keputusan. Status izin tidak pernah ditentukan otomatis oleh AI.
10. Tidak ada fitur di luar SRS. Ide baru dicatat dan diajukan ke PM.
11. Pembayaran hanya memakai Midtrans Sandbox, dan status pembayaran tidak pernah ditentukan dari klien.
12. Setelah `git pull origin main`, jalankan `npm install`. Bila PM mengumumkan paket native baru, pasang APK baru sebelum menguji.
13. Cek `git branch --show-current` sebelum commit; branch kerja selalu dibuat dari `main` terbaru, dan perintah git dijalankan satu per satu sambil membaca hasilnya.
14. **Definition of Done** setiap PR: berjalan di development build tanpa crash, sesuai FR dan `docs/DESIGN.md`, menangani state loading/empty/error, tidak ada hex di luar `tokens.ts`, `npx tsc --noEmit` lolos, dan di-merge ke `main`.

---

## 8. Jadwal

| Hari | Tanggal | Fokus |
|---|---|---|
| H+0 | Kamis, 26 Nov | **PM:** paket, kontrak (stub), skema, seed Aslab, keputusan hosting backend, mulai development build. **P1:** mulai PR skeleton. **P2 dan P3:** baca spesifikasi, siapkan rancangan layar. |
| H+1 | Jumat, 27 Nov | **PM:** merge perbaikan, umumkan build, `hitungKeterlambatan`, `markAttendance` + tagihan, mulai backend. **P1:** PR skeleton di-merge, lalu halaman tagihan (stub). **P2:** guard peran, login, Kelola Lab. **P3:** area Asprak (daftar sesi, buka/tutup, pantau presensi). |
| H+2 | Sabtu, 28 Nov | **PM:** endpoint buat dan webhook, `ai.ts`, fungsi lab di context. **P1:** alur bayar dan riwayat. **P2:** `ImportReviewList`, bulk lab dan praktikan, template. **P3:** dashboard Aslab dan panel izin. |
| H+3 | Minggu, 29 Nov | **PM:** notifikasi pembayaran, `firestore.rules`, uji webhook end-to-end, APK preview. **P1:** notifikasi klien, finalisasi antarmuka. **P2:** bulk asprak, pindah anggota, peta. **P3:** filter dan riwayat keuangan dengan data asli. |
| H+4 | Senin, 30 Nov | Hentikan fitur baru; integrasi, gladi tiga alur, perbaikan kecil, tag `v0.4-sprint4`. **Batas akhir: pukul 23.59** |

**Irama harian:**

- **Pagi:** `git pull origin main`, `npm install`, lalu standup async.
- **Siang:** PR sudah dibuka agar PM dapat me-review sore.
- **Sore/malam:** PM review dan merge; pemilik area memperbaiki bila diminta.

---

## 9. Skenario Demo

Dilakukan pada dua perangkat (satu Asprak atau Aslab, satu Praktikan) memakai development build.

**Alur 1 — Manajemen Lab**

1. Aslab login dan masuk ke beranda Aslab.
2. Aslab membuat beberapa lab dari satu mata kuliah lewat bulk insert; baris diperiksa, satu baris ditolak, satu baris dilengkapi, lalu disimpan.
3. Aslab memasukkan praktikan lewat template CSV; baris yang belum terdaftar ditandai dan tidak disimpan.
4. Aslab memasukkan asprak ke lab yang sama lewat bulk insert terpisah.
5. Aslab memindahkan satu praktikan ke lab lain; jadwal tidak berubah.
6. Aslab mengatur radius, grace period, dan nominal denda.

**Alur 2 — Keterlambatan, Denda, dan Pembayaran**

1. Asprak membuka sesi; status menjadi DIBUKA di kedua perangkat.
2. Praktikan A presensi tepat pada akhir grace period: tepat waktu, tanpa tagihan.
3. Praktikan B presensi satu menit sesudahnya: terlambat; tagihan dibuat satu kali dan notifikasi diterima.
4. Praktikan B mencoba presensi lagi: ditolak, tagihan tidak bertambah.
5. Praktikan B membuka tagihan, menekan Bayar, dan menyelesaikan pembayaran di Midtrans Sandbox.
6. Status berubah dari pending menjadi success setelah webhook diverifikasi backend; notifikasi diterima; status kehadiran tetap terlambat.
7. Pembayaran yang gagal menampilkan failed, notifikasi, dan tombol bayar ulang.
8. Riwayat pembayaran tetap ada setelah aplikasi ditutup dan dibuka lagi.

**Alur 3 — Izin, AI, dan Dashboard**

1. Praktikan C mengajukan izin; hasil analisis AI tersimpan (atau penanda fallback bila AI mati).
2. Asprak melihat alasan dan hasil AI, lalu menerima izin.
3. Praktikan C tampil tidak hadir dengan izin, tanpa denda, dan tidak dapat presensi.
4. Aslab membuka dashboard: jumlah lab dan praktikan, status kegiatan, jadwal, riwayat kegiatan, dan riwayat keuangan.
5. Aslab mengganti filter hari, minggu, dan bulan; data berubah sesuai.

**Pemeriksaan tambahan**

- Asprak tidak memiliki menu manajemen lab atau distribusi anggota; Praktikan tidak dapat membuka area Aslab.
- Webhook dengan signature salah ditolak backend dan status tidak berubah.
- Webhook yang sama dikirim dua kali tidak menggandakan efek.
- AI dimatikan: pengajuan dan pemeriksaan izin tetap berjalan.
- Server key tidak ditemukan di repo maupun bundle aplikasi.

---

## 10. Risiko Sprint

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Backend dan webhook terlambat | Pembayaran tidak dapat diuji | Pilih hosting pada H+0; bangun endpoint buat dahulu, lalu webhook; klien memakai stub sementara |
| Webhook tidak terjangkau dari Midtrans (URL tidak publik) | Status pembayaran tidak pernah berubah | URL HTTPS publik (tunnel saat pengembangan); endpoint sinkron sebagai cadangan |
| Paket native baru, APK lama gagal dengan pesan Cannot find native module | Semua layar gagal dimuat | PM membuat build baru pada H+0 atau H+1 dan mengumumkan; programmer memasang APK baru dan menjalankan `npm install` |
| Beban P2 menumpuk (lab, tiga bulk insert, review list, pindah anggota) | Target tidak tercapai | `ImportReviewList` dibuat lebih dulu; pantau standup H+1 dan H+2; PM memindahkan bulk asprak ke P3 bila perlu |
| Beban PM menumpuk (context, backend, rules) | Rilis terlambat | Prioritaskan endpoint buat dan webhook; rules pada H+3; review PR dipercepat |
| Server key bocor | Pelanggaran keamanan | Disimpan di environment hosting, tidak di repo; diganti bila bocor |
| Tagihan ganda | Denda ganda | ID deterministik, transaksi, webhook idempoten |
| GPS dan jam perangkat tidak akurat | Terlambat atau tepat waktu salah ditentukan | Waktu server Firestore, grace period, sisanya dicatat sebagai batasan |
| CSV besar atau formatnya salah | Gagal simpan | Validasi per baris, batch maksimal 500, pesan jelas |
| Layanan AI gangguan | Klasifikasi dan sentimen kosong | Fallback; pengajuan dan pemeriksaan izin tetap berjalan |
| Sandbox Midtrans lambat atau gagal saat demo | Demo terganggu | Siapkan skenario cadangan (pending lalu sinkron) dan rekaman bukti |

---

## 11. Checklist Progres per Area

### PM

- [ ] Paket dan kontrak di-merge (H+0)
- [ ] Skema, seed, dan peran Aslab
- [ ] Development build EAS baru
- [ ] Fungsi lab (`createLab`, bulk, `pindahAnggota`, `updateLab`)
- [ ] `utils`: keterlambatan, CSV, rentang waktu
- [ ] `markAttendance` + tagihan + `SUDAH_IZIN`
- [ ] Backend Midtrans (buat, webhook, sinkron) dan deploy
- [ ] `ai.ts`: sentimen dan fallback
- [ ] Notifikasi tagihan dan pembayaran
- [ ] `firestore.rules` diperbarui
- [ ] APK preview, gladi demo, tag `v0.4-sprint4`

### P1 — Akmal

- [ ] PR skeleton di-merge (H+1)
- [ ] Styling komponen baru dan token status pembayaran
- [ ] Tagihan dan alur bayar
- [ ] Riwayat pembayaran
- [ ] Halaman Presensi (tepat waktu/terlambat)
- [ ] Status izin dan AI sisi praktikan
- [ ] Notifikasi klien
- [ ] Finalisasi antarmuka lintas peran
- [ ] `docs/DESIGN-SPRINT4.md`

### P2 — Farras

- [ ] Guard peran dan login per peran
- [ ] Kelola Lab (radius, grace, denda)
- [ ] `ImportReviewList`
- [ ] Bulk lab dan template
- [ ] Bulk praktikan dan template
- [ ] Bulk asprak dan template
- [ ] Single insert
- [ ] Pindah anggota
- [ ] Peta memakai data lab baru

### P3 — Nouvella

- [ ] Daftar kelas dan sesi Asprak
- [ ] Buka dan tutup sesi real-time
- [ ] Pantau presensi (tepat waktu/terlambat)
- [ ] Panel izin (kategori, sentimen, excused)
- [ ] Dashboard Aslab
- [ ] Riwayat kegiatan dan riwayat keuangan
- [ ] Filter hari, minggu, bulan

---

## 12. Catatan untuk PM

- Periksa PR terhadap kriteria terima dan butir FR, bukan hanya apakah kode terlihat jalan.
- Uji pembayaran dengan akun Sandbox Midtrans di dua perangkat, termasuk webhook dengan signature salah dan webhook yang dikirim dua kali.
- Catat keputusan penting di PRD: peran Aslab, grace period dan denda default, serta hosting backend.
- Jaga `main` tetap dapat dijalankan; jangan menunda merge sampai semua fitur selesai.
- Setelah sprint selesai, lakukan handover sesuai `docs/WORKFLOW-GIT.md` §9.

**Keputusan terbuka (isi sebelum H+0):**

| Keputusan | Usulan | Diputuskan |
|---|---|---|
| Nama PM dan pembagian P1, P2, P3 | PM Eileen, P1 Akmal, P2 Farras, P3 Nouvella (peran bergilir dari Sprint 3) | Sudah |
| Hosting backend | Server Node di hosting gratis, atau Firebase Cloud Functions bila paket Blaze tersedia | (isi) |
| Grace period default | 15 menit | (isi) |
| Denda default per keterlambatan | Rp5.000 | (isi) |
| Tanggal H+0 sampai H+4 | 26–30 November 2026 | (isi) |
| Konfirmasi ke pengajar: analisis sentimen dibedakan dari klasifikasi Sakit/Izin? Backend kustom diperbolehkan? | Tanyakan sebelum H+1 | (isi) |
