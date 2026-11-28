# Design — Sprint 4 (Manajemen Lab, Dashboard, Denda, dan Pembayaran)

**Produk:** TapIn
**Sprint:** 4 — Manajemen Laboratorium, Dashboard, Denda Keterlambatan, dan Pembayaran Midtrans
**Pemilik Dokumen:** P1 (Akmal)
**Status:** Final (Task 9, Sprint 4)
**Acuan:** `docs/sprints/sprint-4.md` §5.2, `docs/DESIGN.md`, `docs/DESIGN-SPRINT3.md`.

---

## 1. Prinsip

1. Semua warna berasal dari `src/theme/tokens.ts` (`usePreferences().themeColors` / `colors` / `darkColors`); tidak ada kode hex langsung di komponen area P1 atau UI kit.
2. Status tidak boleh dibedakan hanya dengan warna; setiap badge dan indikator selalu memuat teks status yang terbaca screen reader.
3. Setiap layar memiliki state **loading**, **empty**, **error** (dengan aksi coba lagi bila relevan), dan **success**.
4. Tema terang/gelap (`terang` / `gelap` / `sistem`) dan bahasa `id`/`en` disinkronkan melalui `PreferencesContext` + `I18nSync` (`i18next` & `react-i18next`).
5. Komponen lintas peran tinggal di `src/components/ui/**` dan diekspor lewat barrel `src/components/ui/index.ts`.
6. Komponen khusus area tinggal di folder area masing-masing (`src/components/praktikan/**`, `src/components/asisten/**`, `src/components/aslab/**`, `src/components/peta/**`).

---

## 2. Token Warna Status Baru

Seluruh nilai hex di bawah diverifikasi sama persis dengan `src/theme/tokens.ts` (`colors` dan `darkColors`).

### 2.1 Status pembayaran

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `pembayaranUnpaidFg` | `#374151` | `#D1D5DB` | Teks dan dot status “Belum dibayar” (`UNPAID`) |
| `pembayaranUnpaidBg` | `#E5E7EB` | `#272C2B` | Latar pill status “Belum dibayar” |
| `pembayaranPendingFg` | `#1D4ED8` | `#93C5FD` | Teks dan dot status `PENDING` / `pending` |
| `pembayaranPendingBg` | `#DBEAFE` | `#172554` | Latar pill status pending |
| `pembayaranSuccessFg` | `#166534` | `#86EFAC` | Teks, dot, dan banner lunas (`PAID` / `success`) |
| `pembayaranSuccessBg` | `#DCFCE7` | `#143322` | Latar pill dan kartu footer lunas |
| `pembayaranFailedFg` | `#991B1B` | `#FCA5A5` | Teks dan dot status gagal (`FAILED` / `failed`) |
| `pembayaranFailedBg` | `#FEE2E2` | `#3A1919` | Latar pill status gagal |
| `pembayaranDibebaskanFg` | `#626A62` | `#9CA3AF` | Teks, dot, dan catatan dibebaskan (`DIBEBASKAN`) |
| `pembayaranDibebaskanBg` | `#EDF0E9` | `#242928` | Latar pill dan kartu footer dibebaskan |

### 2.2 Status kehadiran

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `kehadiranTepatWaktuFg` | `#166534` | `#86EFAC` | Teks dan dot badge `TEPAT_WAKTU` |
| `kehadiranTepatWaktuBg` | `#DCFCE7` | `#143322` | Latar pill badge `TEPAT_WAKTU` |
| `kehadiranTerlambatFg` | `#92400E` | `#FCD34D` | Teks, dot badge `TERLAMBAT`, dan keterangan menit terlambat |
| `kehadiranTerlambatBg` | `#FEF3C7` | `#382B14` | Latar pill badge `TERLAMBAT` dan kartu bukti presensi terlambat |

### 2.3 Badge notifikasi belum dibaca (`AppHeader`)

- Latar pill: `themeColors.errorFg`
- Teks jumlah: `themeColors.onPrimary` saat tema gelap, `themeColors.onGraphite` saat tema terang.
- Batas tampilan angka: `unread > 99 ? '99+' : String(unread)`.

---

## 3. Komponen UI Kit Baru dan Diperbarui

Seluruh komponen diekspor lewat `src/components/ui/index.ts`.

### 3.1 `StatusPembayaranBadge`

```ts
export type StatusPembayaranTampil =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'DIBEBASKAN'
  | 'pending'
  | 'success'
  | 'failed';

export interface StatusPembayaranBadgeProps {
  status: StatusPembayaranTampil;
  style?: StyleProp<ViewStyle>;
}
```

Label (`i18next` namespace `status`):

| Status | Indonesia (`id`) | English (`en`) | Pasangan Token |
|---|---|---|---|
| `UNPAID` | Belum dibayar | Unpaid | `pembayaranUnpaidBg/Fg` |
| `PENDING` / `pending` | Menunggu pembayaran | Awaiting payment | `pembayaranPendingBg/Fg` |
| `PAID` / `success` | Lunas | Paid | `pembayaranSuccessBg/Fg` |
| `FAILED` / `failed` | Gagal | Failed | `pembayaranFailedBg/Fg` |
| `DIBEBASKAN` | Dibebaskan | Waived | `pembayaranDibebaskanBg/Fg` |

### 3.2 `TagihanCard`

```ts
export interface TagihanCardData {
  id: string;
  nominal: number;
  menitTerlambat: number;
  status: StatusPembayaranTampil;
  dibuatPada: string;
  dibayarPada?: string;
}

export interface TagihanCardProps {
  tagihan: TagihanCardData;
  judul: string;
  subjudul?: string;
  onPress?: () => void;
  onBayar?: () => void;
  loadingBayar?: boolean;
  style?: StyleProp<ViewStyle>;
}
```

Perilaku:

- Menampilkan judul sesi, subjudul (`tanggal · lab`), nominal (`formatRupiah`), teks keterlambatan (`tagihan.lateMinutesShort`), dan `StatusPembayaranBadge`.
- Tombol aksi pembayaran hanya tampil bila `onBayar` diberikan dan status adalah `UNPAID`, `FAILED`, atau `failed` (`tagihan.pay` atau `tagihan.payAgain`).
- Saat `loadingBayar = true`, tombol menampilkan spinner (`Tombol` prop `loading`) dan mencegah penekanan ganda.
- Tidak membaca konteks sesi/lab sendiri; pemanggil menyiapkan `judul` dan `subjudul`.

### 3.3 `FilterRentang`

```ts
export type RentangDashboard = 'hari' | 'minggu' | 'bulan';

export interface FilterRentangProps {
  value: RentangDashboard;
  onChange: (value: RentangDashboard) => void;
  style?: StyleProp<ViewStyle>;
}
```

- Tiga `FilterChip`: Hari (`filter.day`), Minggu (`filter.week`), Bulan (`filter.month`).
- Dipakai bersama oleh dashboard Aslab P3 (`src/app/(aslab)/(tabs)/beranda-aslab.tsx`). Tidak ada komponen filter duplikat di repo.

### 3.4 `StatusBadge` (diperluas)

Mendukung `StatusSesi` (`TERJADWAL`, `DIBUKA`, `SELESAI`), `StatusIzin` (`MENUNGGU`, `DITERIMA`, `DITOLAK`), `ALPHA`, serta dua status kehadiran Sprint 4 (`TEPAT_WAKTU`, `TERLAMBAT`):

| Status | Indonesia (`id`) | English (`en`) | Pasangan Token |
|---|---|---|---|
| `TEPAT_WAKTU` | Tepat waktu | On time | `kehadiranTepatWaktuBg/Fg` |
| `TERLAMBAT` | Terlambat | Late | `kehadiranTerlambatBg/Fg` |

### 3.5 `AppHeader`

- Tombol Peta (`openMapAria`), tombol Notifikasi (`notifikasi.unread`) dengan pill jumlah belum dibaca per `currentUser.id` (`useUnreadNotificationCount`), dan tombol Avatar/Pengaturan (`openProfileAria` / `openSettingsAria`).
- Avatar mengarahkan ke rute profil sesuai peran (`/(aslab)/(tabs)/beranda-aslab`, `/(asisten)/(tabs)/profil`, `/(praktikan)/(tabs)/profil`).
- Touch target tombol ikon dan avatar berukuran `44×44`.

### 3.6 `SessionCard`

- Memakai `useTranslation()` untuk label status izin (`sessionCard.leaveApproved`, `leaveRejected`, `leavePending`), counter izin asisten (`sessionCard.leaveCount`), waktu hadir (`sessionCard.presentWithTime`), dan `accessibilityLabel`.

---

## 4. Struktur Route dan Penjaga Peran

| Route | Pemilik isi | Keterangan |
|---|---|---|
| `/(aslab)/(tabs)/beranda-aslab` | P3 | Dashboard Aslab (sudah terisi oleh P3) |
| `/(aslab)/(tabs)/lab` | P2 | Manajemen lab, bulk insert, pindah anggota (masih stub P1 menunggu PR UI P2) |
| `/(praktikan)/tagihan` | P1 | Daftar tagihan denda praktikan |
| `/(praktikan)/tagihan/[id]` | P1 | Rincian tagihan, riwayat transaksi, dan aksi pembayaran |
| `/(praktikan)/riwayat-pembayaran` | P1 | Daftar semua transaksi pembayaran praktikan |
| `/notifikasi` | P1 | Riwayat notifikasi terisolasi per akun + rute ke sesi atau tagihan |
| `/pengaturan`, `/peta`, `/scan-qr`, `/kelola-lab` | Bersama / P2 / P3 | Rute di luar tab yang tidak dialihkan oleh role gate |

Role gate di `src/app/_layout.tsx` (memakai tipe resmi `Peran` dari `@/data/dummy`) bersama layout grup `(praktikan)/_layout.tsx`, `(aslab)/_layout.tsx`, dan `(asisten)/_layout.tsx`:

- `aslab` → `/(aslab)/(tabs)/beranda-aslab`
- `asisten` → `/(asisten)/(tabs)/beranda-asisten`
- `praktikan` → `/(praktikan)/(tabs)/beranda-praktikan`
- `<I18nSync />` dipasang di `src/app/_layout.tsx` di dalam `<PreferencesProvider>`.

---

## 5. Status Pembayaran dan Aksi

| Status tagihan | Label (`id` / `en`) | Aksi di daftar (`tagihan/index.tsx`) | Aksi di detail (`tagihan/[id].tsx`) |
|---|---|---|---|
| `UNPAID` | Belum dibayar / Unpaid | Bayar sekarang | Bayar sekarang |
| `PENDING` | Menunggu pembayaran / Awaiting payment | — (hanya lihat detail) | Cek status (`sinkronPembayaran`), tanpa order baru |
| `PAID` | Lunas / Paid | — | Kartu konfirmasi hijau + waktu bayar |
| `FAILED` | Gagal / Failed | Bayar ulang | Bayar ulang (`mulaiPembayaran`) |
| `DIBEBASKAN` | Dibebaskan / Waived | — | Kartu catatan pembebasan karena izin diterima |

Aturan:

- Status tidak pernah diubah di klien; klien memanggil `mulaiPembayaran(tagihanId)`, membuka `redirectUrl` lewat `WebBrowser.openBrowserAsync`, lalu memanggil `sinkronPembayaran(orderId)` / `retrySync()` saat kembali ke aplikasi (listener `AppState` Android & langsung resolve di iOS).
- `PENDING` tidak menampilkan tombol buat transaksi baru; hanya `UNPAID` dan `FAILED` yang dapat memulai transaksi.
- Alasan gagal pembuatan transaksi dari `mulaiPembayaran` dipetakan terpusat melalui `keyAlasanPembayaran` (`src/components/praktikan/pesanPembayaran.ts`) ke key `tagihan.err*`.

---

## 6. Status Kehadiran dan Denda (FR-36, FR-46)

| Status | Label | Tampilan pada detail sesi & presensi |
|---|---|---|
| `TEPAT_WAKTU` | Tepat waktu | Kartu bukti hijau + badge `Tepat waktu` + teks “Tanpa denda.” |
| `TERLAMBAT` | Terlambat | Kartu bukti amber + badge `Terlambat` + menit terlambat + nominal denda + tombol `Lihat tagihan` bila `tagihanId` ada |

Aturan:

- Sesuai **FR-46**, tombol presensi di `BerandaPraktikan` dan `sesi/[id]` langsung membuka kamera `/scan-qr` tanpa sheet konfirmasi tambahan atau centang pernyataan.
- Validasi lokasi, waktu, status, grace period, dan pembuatan tagihan `{sesiId}_{praktikanId}` dilakukan di `markAttendance` / backend; UI tidak menghitung denda sendiri.
- Data kehadiran lama tanpa `statusKehadiran` tetap tampil normal tanpa menebak status keterlambatan.

---

## 7. Status Izin dan AI Sentimen (FR-40)

| Status | Judul ringkas (`Beranda` / tombol) | Penjelasan di kartu izin (`riwayat.tsx`, `sesi/[id].tsx`) |
|---|---|---|
| `MENUNGGU` | `Izin menunggu · tetap bisa presensi` | Praktikan tetap dapat melakukan presensi selama keputusan Asprak belum ditetapkan |
| `DITERIMA` | `Izin diterima` | `Tidak hadir dengan izin · bebas denda` · presensi dikunci |
| `DITOLAK` | `Izin ditolak` | `Izin ditolak · presensi normal` |

AI (pendukung keputusan Asprak):

- Menampilkan chip kategori (`Label AI` / `AI`) dan chip sentimen (`Sentimen AI: Positif | Netral | Negatif`).
- Bila `sentimenAi` belum ada di Firestore, klien memakai fallback on-device (`resolveSentimenAi` -> `src/components/praktikan/ai/sentiment.js` + `model-edom.json`).
- Bila klasifikasi AI tidak tersedia (misal layanan AI nonaktif/gagal), tampil chip amber `Analisis AI tidak tersedia`, dan alur pengajuan/pemeriksaan tetap berjalan.

---

## 8. Matriks State Layar P1 (Hasil Audit Task 9)

| Layar | Loading | Empty | Error | Tema Terang/Gelap | i18n (`id`/`en`) | Status Audit |
|---|---|---|---|---|---|---|
| Beranda Praktikan (`BerandaPraktikan.tsx`) | `EmptyState` memuat | `EmptyState` sesi/jadwal kosong | `EmptyState` + `Coba lagi` | OK (`themeColors`) | `useTranslation()` | OK |
| Jadwal (`(tabs)/jadwal.tsx`) | `EmptyState` memuat | Per filter + tombol `Tampilkan semua` | `EmptyState` + `Coba lagi` | OK (`themeColors`) | `useTranslation()` | OK |
| Riwayat Kehadiran (`(tabs)/riwayat.tsx`) | `EmptyState` memuat | `EmptyState` belum ada riwayat | `EmptyState` + `Coba lagi` | OK (`themeColors`) | `useTranslation()` | Diperbaiki Task 9 |
| Profil (`(tabs)/profil.tsx`) | Redirect guard saat null | Fallback `'-'` | Toast bila logout gagal | OK (`themeColors`) | Menu Keuangan `useTranslation()`, profil inti masih `PreferencesContext.t` | OK |
| Detail Sesi (`sesi/[id].tsx`) | `EmptyState` memuat sesi | `EmptyState` sesi tidak ditemukan | Pesan izin & fallback AI | OK (`themeColors`) | `useTranslation()` | Diperbaiki Task 9 |
| Presensi / Scan QR (`scan-qr.tsx`) | Loading GPS & verifikasi | State izin kamera / sesi kosong | Modal alasan tolak & banner lokasi | OK (`themeColors`) | Pakai `PreferencesContext.language` (rute bersama) | OK (rute bersama) |
| Daftar Tagihan (`tagihan/index.tsx`) | `EmptyState` memuat | `EmptyState` belum ada tagihan | `EmptyState` + `Coba lagi` + `BannerGalat` | OK (`themeColors`) | `useTranslation()` | OK |
| Detail Tagihan (`tagihan/[id].tsx`) | `EmptyState` memuat detail | `EmptyState` + kembali ke daftar | `EmptyState` + `Coba lagi` + `BannerGalat` | OK (`themeColors`) | `useTranslation()` | OK |
| Riwayat Pembayaran (`riwayat-pembayaran.tsx`) | `EmptyState` memuat | `EmptyState` belum ada transaksi | Banner/EmptyState + `Coba lagi` | OK (`themeColors`) | `useTranslation()` | OK |
| Notifikasi (`notifikasi.tsx`) | `ActivityIndicator` terpusat | `EmptyState` dengan ikon lonceng | Toleran item tanpa rute | OK (`themeColors`) | `useTranslation()` | OK |
| Izin Sheet (`IzinSheet.tsx`) | Tombol `loading` + disabled | Validasi input minimal 10 karakter | Kotak error terlokalisasi | OK (`themeColors`) | `useTranslation()` | OK |

---

## 9. Copywriting Baku (`src/i18n/resources/id.ts` & `en.ts`)

| Key / Konteks | Indonesia (`id`) | English (`en`) |
|---|---|---|
| `tagihan.payNow` | Bayar sekarang | Pay now |
| `tagihan.payAgain` | Bayar ulang | Retry payment |
| `tagihan.checkStatus` | Cek status | Check status |
| `status.paid` | Lunas | Paid |
| `status.failed` | Gagal | Failed |
| `status.waived` | Dibebaskan | Waived |
| `status.tepatWaktu` | Tepat waktu | On time |
| `status.terlambat` | Terlambat | Late |
| `izin.excused` | Tidak hadir dengan izin · bebas denda | Excused absence · no fine |
| `presensi.pendingLeave` | Izin menunggu · tetap bisa presensi | Leave pending · you can still check in |
| `izin.rejectedShort` | Izin ditolak · presensi normal | Leave rejected · normal attendance |
| `izin.aiUnavailable` | Analisis AI tidak tersedia | AI analysis unavailable |

---

## 10. Aksesibilitas & Token

- `StatusBadge` dan `StatusPembayaranBadge` memakai `accessibilityRole="text"` dengan label deskriptif, serta indikator titik + teks status (tidak hanya warna).
- Seluruh tombol ikon di `AppHeader`, header `tagihan/index.tsx`, `tagihan/[id].tsx`, `riwayat-pembayaran.tsx`, `sesi/[id].tsx`, dan `notifikasi.tsx` memiliki `accessibilityRole="button"`, `accessibilityLabel` terlokalisasi, dan touch target minimum `44×44`.
- Format mata uang memakai `formatRupiah` (`Rp...` locale `id-ID`); tanggal tagihan/pembayaran memakai `formatTanggalTagihan(iso, isEn)`.
- Audit regex `#[0-9A-Fa-f]{3,8}` pada seluruh area P1 (`src/app/(praktikan)/**`, `src/components/praktikan/**`, `src/components/ui/**`, `src/app/_layout.tsx`, `src/app/notifikasi.tsx`, `src/app/(aslab)/_layout.tsx`, `src/app/(aslab)/(tabs)/_layout.tsx`, `src/i18n/**`) menghasilkan **0 temuan**.

---

## 11. Keputusan Final & Catatan Handoff Lintas Peran

### Keputusan Desain yang Difinalisasi

| Topik | Keputusan |
|---|---|
| Token warna status pembayaran & kehadiran | Ditetapkan sesuai §2.1 & §2.2 di `src/theme/tokens.ts` |
| Entry point tagihan | `TagihanRingkasCard` di `BerandaPraktikan` (muncul saat `jumlahAktif > 0`) + sub-menu Keuangan di tab `Profil` |
| Tagihan `PENDING` | Hanya aksi `Cek status`; tidak boleh membuat order transaksi baru |
| Izin `MENUNGGU` | Tetap diizinkan presensi; bila menghasilkan tagihan lalu izin diterima, pembebasan ditangani backend/konteks |
| Presensi tanpa sheet konfirmasi (FR-46) | Ketuk presensi langsung membuka `/scan-qr` |

### Catatan Audit Lintas Peran (Read-Only, di luar kepemilikan P1)

- **Area P2:**
  - `src/app/(aslab)/(tabs)/lab.tsx` masih berisi stub P1 (tampilan Kelola Lab/CSV/pindah anggota belum digabungkan ke tab tersebut).
  - `src/app/login.tsx` fungsi `berandaUntuk(peran)` belum menyertakan kasus `peran === 'aslab'` secara eksplisit (masih mengandalkan RoleGate di `_layout.tsx`).
  - `src/components/peta/labMarkerStyle.ts` masih memiliki literal hex langsung di luar `src/theme/tokens.ts`.
  - Layar auth dan peta belum dimigrasikan ke `useTranslation()`.
- **Area P3:**
  - `src/app/(aslab)/(tabs)/beranda-aslab.tsx` sudah memakai `FilterRentang`, `MetricCard`, `StatusPembayaranBadge`, `themeColors`, dan memiliki state loading/error/empty; teks masih memakai helper `tx(id, en)` lokal dan belum memakai `useTranslation()`.
  - `src/components/asisten/useAksiSesi.tsx` sudah menampilkan Toast saat buka/tutup sesi, tetapi belum memanggil helper `catatHasilAksiSesi` untuk entri riwayat notifikasi **FR-45** dan pesan penolakan `PESAN_TOLAK` masih hardcoded bahasa Indonesia.
  - `src/components/asisten/BadgeKehadiran.tsx` dapat disatukan atau disesuaikan penuh dengan `StatusBadge` UI kit + `useTranslation()`.

### Daftar Uji Integrasi Manual (Dua Perangkat + Midtrans Sandbox)

Verifikasi statis (`npx tsc --noEmit`, ESLint, audit hex, audit barrel) sudah dijalankan di environment CLI. Uji alur end-to-end berikut dilakukan pada perangkat development build dengan akun Midtrans Sandbox dan backend aktif:

1. **Alur 1 — Manajemen Lab & Role Gate:** login sebagai Aslab, Asprak, dan Praktikan; pastikan tab sesuai peran dan tidak terjadi redirect loop.
2. **Alur 2 — Keterlambatan & Midtrans:** presensi tepat waktu (tanpa tagihan) vs terlambat (`tagihanId` + nominal denda) → bayar via Snap Sandbox → sinkron status `PENDING` → `PAID` → cek notifikasi & riwayat pembayaran persisten; uji juga pembatalan/gagal (`FAILED` + `Bayar ulang`).
3. **Alur 3 — Izin, AI & Dashboard:** ajukan izin (`MENUNGGU` + label/sentimen AI, plus skenario fallback AI) → Asprak menerima → badge `Izin diterima` & `Tidak hadir dengan izin · bebas denda`, presensi terkunci; verifikasi dashboard Aslab dengan filter Hari/Minggu/Bulan.

---

## 12. Dokumen Terkait

- `docs/DESIGN.md` — token dan pola dasar.
- `docs/DESIGN-SPRINT3.md` — presensi, peta, notifikasi.
- `docs/sprints/sprint-4.md` — requirement, kontrak `useSession()`, dan pembagian area.
