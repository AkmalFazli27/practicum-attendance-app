# Design — Sprint 4 (Manajemen Lab, Dashboard, Denda, dan Pembayaran)

**Produk:** TapIn
**Sprint:** 4 — Manajemen Laboratorium, Dashboard, Denda Keterlambatan, dan Pembayaran Midtrans
**Pemilik Dokumen:** P1 (Akmal)
**Status:** Draft skeleton (Task 1). Difinalkan di Task 9.
**Acuan:** `docs/sprints/sprint-4.md` §5.2, `docs/DESIGN.md`, `docs/DESIGN-SPRINT3.md`.

---

## 1. Prinsip

1. Semua warna berasal dari `src/theme/tokens.ts`; tidak ada hex di komponen.
2. Status tidak boleh dibedakan hanya dengan warna; selalu ada teks.
3. Setiap layar punya state loading, empty, error, dan success.
4. Tema terang/gelap dan bahasa Indonesia/Inggris harus terbaca.
5. Komponen lintas peran tinggal di `src/components/ui/**` dan diekspor lewat barrel.
6. Komponen khusus area tinggal di folder area masing-masing.

---

## 2. Token Warna Status Baru

### 2.1 Status pembayaran

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `pembayaranUnpaidFg` | `#374151` | `#D1D5DB` | Teks “Belum dibayar” |
| `pembayaranUnpaidBg` | `#E5E7EB` | `#272C2B` | Latar “Belum dibayar” |
| `pembayaranPendingFg` | `#1D4ED8` | `#93C5FD` | Teks pending |
| `pembayaranPendingBg` | `#DBEAFE` | `#172554` | Latar pending |
| `pembayaranSuccessFg` | `#166534` | `#86EFAC` | Teks lunas/success |
| `pembayaranSuccessBg` | `#DCFCE7` | `#143322` | Latar lunas/success |
| `pembayaranFailedFg` | `#991B1B` | `#FCA5A5` | Teks gagal/failed |
| `pembayaranFailedBg` | `#FEE2E2` | `#3A1919` | Latar gagal/failed |
| `pembayaranDibebaskanFg` | `#626A62` | `#9CA3AF` | Teks dibebaskan |
| `pembayaranDibebaskanBg` | `#EDF0E9` | `#242928` | Latar dibebaskan |

### 2.2 Status kehadiran

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `kehadiranTepatWaktuFg` | `#166534` | `#86EFAC` | Teks “Tepat waktu” |
| `kehadiranTepatWaktuBg` | `#DCFCE7` | `#143322` | Latar “Tepat waktu” |
| `kehadiranTerlambatFg` | `#92400E` | `#FCD34D` | Teks “Terlambat” |
| `kehadiranTerlambatBg` | `#FEF3C7` | `#382B14` | Latar “Terlambat” |

---

## 3. Komponen UI Kit Baru

### 3.1 `StatusPembayaranBadge`

```ts
type StatusPembayaranTampil =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'DIBEBASKAN'
  | 'pending'
  | 'success'
  | 'failed';

interface StatusPembayaranBadgeProps {
  status: StatusPembayaranTampil;
  style?: StyleProp<ViewStyle>;
}
```

Label:

| Status | Indonesia | English | Warna |
|---|---|---|---|
| `UNPAID` | Belum dibayar | Unpaid | unpaid |
| `PENDING` / `pending` | Menunggu pembayaran | Awaiting payment | pending |
| `PAID` / `success` | Lunas | Paid | success |
| `FAILED` / `failed` | Gagal | Failed | failed |
| `DIBEBASKAN` | Dibebaskan | Waived | dibebaskan |

### 3.2 `TagihanCard`

```ts
interface TagihanCardData {
  id: string;
  nominal: number;
  menitTerlambat: number;
  status: StatusPembayaranTampil;
  dibuatPada: string;
  dibayarPada?: string;
}

interface TagihanCardProps {
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

- Menampilkan judul sesi, subjudul (tanggal + lab), nominal, menit terlambat, dan badge status.
- Tombol Bayar hanya muncul untuk `UNPAID`, `FAILED`, atau `failed`.
- Tombol nonaktif dan menampilkan spinner saat `loadingBayar`.
- Tidak mencari sesi/lab sendiri; caller menyiapkan `judul`/`subjudul`.

### 3.3 `FilterRentang`

```ts
type RentangDashboard = 'hari' | 'minggu' | 'bulan';

interface FilterRentangProps {
  value: RentangDashboard;
  onChange: (value: RentangDashboard) => void;
  style?: StyleProp<ViewStyle>;
}
```

- Tiga chip: Hari/Minggu/Bulan (Day/Week/Month).
- Dipakai dashboard Aslab (P3). Jangan membuat filter duplikat.

### 3.4 `StatusBadge` (diperluas)

Status baru: `TEPAT_WAKTU` dan `TERLAMBAT`.

| Status | Indonesia | English |
|---|---|---|
| `TEPAT_WAKTU` | Tepat waktu | On time |
| `TERLAMBAT` | Terlambat | Late |

---

## 4. Struktur Route Baru

| Route | Pemilik isi | Keterangan |
|---|---|---|
| `/(aslab)/(tabs)/beranda-aslab` | P3 | Dashboard Aslab |
| `/(aslab)/(tabs)/lab` | P2 | Kelola Lab |
| `/(praktikan)/tagihan` | P1 | Daftar tagihan |
| `/(praktikan)/tagihan/[id]` | P1 | Detail tagihan |
| `/(praktikan)/riwayat-pembayaran` | P1 | Riwayat transaksi |

Role gate di `src/app/_layout.tsx` mengarahkan:

- Aslab → `/(aslab)/(tabs)/beranda-aslab`
- Asprak → `/(asisten)/(tabs)/beranda-asisten`
- Praktikan → `/(praktikan)/(tabs)/beranda-praktikan`

Rute bersama yang tidak dialihkan: `/peta`, `/pengaturan`, `/notifikasi`, `/scan-qr`.

---

## 5. Status Pembayaran dan Aksi

| Status tagihan | Label | Aksi di daftar | Aksi di detail |
|---|---|---|---|
| `UNPAID` | Belum dibayar | Bayar | Bayar sekarang |
| `PENDING` | Menunggu pembayaran | Cek status | Cek status, tanpa order baru |
| `PAID` | Lunas | Tidak ada | Tidak ada |
| `FAILED` | Gagal | Bayar ulang | Bayar ulang |
| `DIBEBASKAN` | Dibebaskan | Tidak ada | Tidak ada |

Aturan:

- Status tidak pernah ditentukan dari halaman pembayaran; hanya dari Firestore setelah backend memverifikasi.
- `PENDING` tidak boleh membuat order baru; hanya `FAILED` yang boleh bayar ulang.
- Tombol Bayar nonaktif/loading selama transaksi dibuat.

---

## 6. Status Kehadiran dan Denda

| Status | Label | Tampilan |
|---|---|---|
| `TEPAT_WAKTU` | Tepat waktu | Tanpa denda |
| `TERLAMBAT` | Terlambat | Menit terlambat + nominal denda + tautan tagihan |

Aturan:

- Perbandingan waktu dilakukan backend/context; UI tidak menghitung ulang.
- Jika `tagihanId` belum tersedia, tautan tagihan disembunyikan.
- Data lama tanpa `statusKehadiran` tidak ditebak; tampilkan status hanya bila ada.

---

## 7. Status Izin

| Status | Tampilan |
|---|---|
| `MENUNGGU` | “Izin menunggu · kamu masih bisa presensi” |
| `DITERIMA` | “Tidak hadir dengan izin · bebas denda” |
| `DITOLAK` | “Izin ditolak · presensi normal” |

AI:

- Kategori dan sentimen adalah informasi pendukung.
- AI tidak tersedia → “Analisis AI tidak tersedia”; pengajuan/pemeriksaan tetap berjalan.
- Keputusan tetap dari Asprak.

---

## 8. Matriks State Layar

| Layar | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Daftar tagihan | “Memuat tagihan…” | “Belum ada tagihan” | Pesan + Coba lagi | Daftar card |
| Detail tagihan | “Memuat detail…” | “Tagihan tidak ditemukan” | Pesan + Coba lagi | Rincian + aksi |
| Riwayat pembayaran | “Memuat riwayat…” | “Belum ada transaksi” | Pesan + Coba lagi | Daftar transaksi |
| Presensi | Menunggu GPS/QR | Sesi tidak ditemukan | Pesan alasan tolak | Tepat waktu/Terlambat |
| Notifikasi | Spinner | “Belum ada notifikasi” | — | Daftar riwayat |
| Izin (riwayat/detail) | Memuat sesi | Belum ada izin | Pesan sync | Status + AI |

---

## 9. Copywriting Baku

| Konteks | Indonesia | English |
|---|---|---|
| Tombol bayar | Bayar | Pay now |
| Bayar ulang | Bayar ulang | Retry payment |
| Cek status | Cek status | Check status |
| Lunas | Lunas | Paid |
| Gagal | Gagal | Failed |
| Dibebaskan | Dibebaskan | Waived |
| Tepat waktu | Tepat waktu | On time |
| Terlambat | Terlambat | Late |
| Izin diterima | Tidak hadir dengan izin · bebas denda | Excused absence · no fine |
| Izin menunggu | Izin menunggu · kamu masih bisa presensi | Leave pending · you can still check in |
| Izin ditolak | Izin ditolak · presensi normal | Leave rejected · normal attendance |
| AI tidak tersedia | Analisis AI tidak tersedia | AI analysis unavailable |

---

## 10. Aksesibilitas

- Badge status memakai `accessibilityRole="text"` dan label yang menyebut status.
- Tombol ikon minimal 44×44 dan punya `accessibilityLabel`.
- Teks status tidak hanya bergantung pada warna.
- Kontras teks/badge diuji di tema terang dan gelap.
- Nominal memakai format `Rp` yang konsisten.

---

## 11. Keputusan Terbuka

| Keputusan | Usulan | Status |
|---|---|---|
| Warna status pembayaran | Tabel §2.1 | Menunggu konfirmasi PM/desainer |
| Entry point tagihan | Kartu di Beranda + menu Profil | Menunggu konfirmasi |
| Tagihan `PENDING` | Hanya Cek status | Menunggu konfirmasi |
| Izin `MENUNGGU` boleh presensi | Ya | Menunggu konfirmasi PM |
| Badge notifikasi belum dibaca | Latar `errorFg`, teks `onGraphite` | Menunggu konfirmasi |

---

## 12. Dokumen Terkait

- `docs/DESIGN.md` — token dan pola dasar.
- `docs/DESIGN-SPRINT3.md` — presensi, peta, notifikasi.
- `docs/sprints/sprint-4.md` — requirement dan pembagian area.
