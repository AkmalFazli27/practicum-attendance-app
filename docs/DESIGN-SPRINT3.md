# Design — Sprint 3 (Presensi Berbasis Lokasi, Peta Lab, dan Notifikasi)

**Produk:** TapIn
**Sprint:** 3 — Presensi Berbasis Lokasi, Maps, dan Push Notification
**Pemilik Dokumen:** P1 (Farras)
**Acuan Requirement:** `docs/PRD.md` + `docs/sprints/sprint-3.md` (FR-19 s.d. FR-25, PB-01 s.d. PB-06)

---

## 1. Token Warna Status Baru (`src/theme/tokens.ts`)

Seluruh komponen wajib mengimpor warna dari `src/theme/tokens.ts` tanpa menulis kode hex langsung:

| Token | Hex | Pemakaian |
|---|---|---|
| `radiusInsideFg` | `#166534` | Teks & ikon saat praktikan berada di dalam radius lab / izin perangkat aktif |
| `radiusInsideBg` | `#DCFCE7` | Latar badge saat di dalam radius lab / izin perangkat aktif |
| `radiusInsideBorder` | `#BBF7D0` | Garis tepi badge status di dalam radius |
| `radiusOutsideFg` | `#991B1B` | Teks & ikon saat praktikan di luar radius lab / izin ditolak / jaringan gagal |
| `radiusOutsideBg` | `#FEE2E2` | Latar badge/banner saat di luar radius / izin ditolak |
| `radiusOutsideBorder` | `#FECACA` | Garis tepi badge/banner di luar radius |
| `gpsOffFg` | `#92400E` | Teks & ikon peringatan GPS mati / sinyal belum terbaca |
| `gpsOffBg` | `#FEF3C7` | Latar peringatan GPS mati / sinyal belum terbaca |
| `gpsOffBorder` | `#FDE68A` | Garis tepi peringatan GPS mati |
| `lokasiMemuatFg` | `#374151` | Teks & spinner saat memuat koordinat GPS |
| `lokasiMemuatBg` | `#E5E7EB` | Latar badge netral saat memuat koordinat GPS |

---

## 2. Komponen UI Kit Baru (`src/components/ui/`)

### 2.1 `AppHeader` (Akses Peta Laboratorium)
- Menambahkan tombol ikon `MapPin` di sebelah kiri tombol lonceng notifikasi pada `AppHeader`.
- Mengetuk ikon `MapPin` mengarahkan pengguna ke rute `/peta` tanpa mengubah struktur 4 tab bawah.

### 2.2 `PermissionBanner`
- **Props:**
  - `jenis: 'izin-lokasi-ditolak' | 'gps-mati' | 'koordinat-belum-ada' | 'izin-notifikasi-ditolak' | 'jaringan' | 'error'`
  - `judul?: string`, `pesan?: string`, `aksiLabel?: string`
  - `onAksi?: () => void`, `onTutup?: () => void`
- **Perilaku:** Menampilkan peringatan kontekstual di bagian atas layar ketika izin perangkat belum diberikan, layanan GPS nonaktif, atau jaringan bermasalah.

### 2.3 `LokasiStatusCard`
- **Props:**
  - `status: 'memuat' | 'dalam-radius' | 'luar-radius' | 'izin-ditolak' | 'gps-mati' | 'koordinat-belum-ada' | 'lab-belum-diatur' | 'error'`
  - `namaLab: string`, `alamatLab?: string`, `radiusMeter?: number`
  - `jarakMeter?: number | null`, `akurasiMeter?: number | null`
  - `onRefresh?: () => void`, `onMintaIzin?: () => void`
- **Perilaku:** Menampilkan kartu pemeriksaan lokasi fisik praktikan terhadap titik koordinat laboratorium, lengkap dengan metrik **Jarakmu ke Lab** (`m`), **Akurasi GPS** (`±m`), dan **Batas Radius Lab** (`≤ m`).

### 2.4 `StatusIzinPerangkat`
- **Props:** `style?: StyleProp<ViewStyle>`, `onStatusChange?: (...) => void`
- **Perilaku:** Ditampilkan pada halaman **Pengaturan (`/pengaturan`)**. Menyediakan kontrol sakelar interaktif (`Switch` toggle) untuk status izin **Lokasi & GPS** serta **Push Notification** secara langsung (dan memperbarui status otomatis saat pengguna kembali dari menu Pengaturan sistem). Mengetuk sakelar saat tidak aktif akan memicu dialog permintaan izin / mengarahkan ke Pengaturan perangkat bila diperlukan.

---

## 3. Layar Pengaturan & Preferensi (`src/app/pengaturan.tsx` & `src/context/PreferencesContext.tsx`)
1. **Navigasi Header Profil:**
   - Ketika pengguna membuka tab **Profil**, tombol avatar di header `AppHeader` otomatis bertransformasi menjadi ikon tombol **Settings (`lucide-react-native/Settings`)**.
   - Mengetuk tombol Settings tersebut mengarahkan pengguna ke rute `/pengaturan`.
   - Tersedia juga kartu menu pintasan "Pengaturan & Preferensi" langsung di halaman Profil.
2. **Tata Letak Minimalis Berkelompok (Grouped Settings Cards + Bottom Sheet):**
   - Header bersih dengan tombol kembali `<` dan judul **Pengaturan / Settings**.
   - Menu dikelompokkan dalam kartu membulat (*Akun*, *Preferensi*, *Sistem & Data*) dengan baris ringkas (`[Ikon] Label ... [Nilai Aktif] >`).
   - Mengetuk setiap baris membuka `SheetModal` kontekstual yang adaptif terhadap tema aktif.
3. **Logika Tema Real-Time (`terang` | `gelap` | `sistem`) via `PreferencesContext`:**
   - Memakai palet `colors` (terang) dan `darkColors` (gelap) dari `src/theme/tokens.ts` serta `useColorScheme()` untuk mode **Sesuai HP (`sistem`)**.
   - Perubahan tema langsung memperbarui `StatusBar`, `AppHeader`, tab bar, `Profil`, `Pengaturan`, `StatusIzinPerangkat`, dan `SheetModal` secara real-time dan persisten di `AsyncStorage` (`@tapin_theme_mode`).
4. **Logika Bahasa Real-Time (`id` | `en`) via `PreferencesContext`:**
   - Pilihan **Bahasa Indonesia** dan **English (US)** langsung menerjemahkan antarmuka melalui helper `t(key)` dan tersimpan persisten di `AsyncStorage` (`@tapin_app_language`).
5. **Perizinan Perangkat & Keamanan Akun:**
   - **Perizinan Perangkat:** Membuka sheet berisi `StatusIzinPerangkat` (toggle Lokasi & GPS + Push Notification).
   - **Informasi Akun & Ganti Kata Sandi:** Sheet ringkasan akun dan formulir ganti kata sandi terintegrasi Firebase Auth (`reauthenticateWithCredential` & `updatePassword`).
   - **Sistem & Data:** Bersihkan cache lokal, tentang aplikasi, dan konfirmasi keluar akun.

---

## 4. Halaman Presensi Terpisah (`src/app/(praktikan)/presensi/[id].tsx`)

Sesuai **FR-19**, **FR-20**, **FR-25**, dan **PB-06**:
1. **Navigasi:** Tombol presensi pada `BerandaPraktikan` dan `DetailSesiPraktikan` (`sesi/[id].tsx`) mengarahkan praktikan ke `/(praktikan)/presensi/[id]`.
2. **Informasi Sesi & Waktu Efektif (`PB-06`):**
   - Menampilkan nama praktikum, topik, kelas, nama & alamat lab, tanggal, jam mulai–selesai, serta `StatusBadge` yang dihitung melalui `getStatusEfektif(sesi)` setiap 15 detik.
   - Bila waktu sekarang belum mencapai `jamMulai`, tombol presensi nonaktif dengan label `"Sesi belum dimulai"`.
   - Bila waktu sekarang telah melewati `jamSelesai`, status otomatis tampil `SELESAI` dan tombol nonaktif dengan label `"Waktu presensi telah berakhir"`.
3. **Pemeriksaan Lokasi & Radius (`FR-20`, `FR-25`):**
   - Memakai hook `useLocation()` untuk memantau koordinat perangkat dan menampilkan `LokasiStatusCard`.
   - Saat tombol **Konfirmasi Presensi** ditekan, layar memanggil `markAttendance(sesiId, koordinat)` dari `useSession()` dan menerjemahkan seluruh kode penolakan (`LUAR_RADIUS`, `SUDAH_PRESENSI`, `SESI_TIDAK_DIBUKA`, `SESI_SUDAH_DITUTUP`, `BELUM_WAKTUNYA`, `WAKTU_HABIS`, `KOORDINAT_TIDAK_ADA`, `LAB_BELUM_DIATUR`, `SUDAH_IZIN`, `TIDAK_BERHAK`, `JARINGAN`) ke pesan Bahasa Indonesia yang jelas.
   - Setelah presensi berhasil, tombol presensi nonaktif secara permanen dan layar menampilkan waktu hadir beserta jarak tercatat ke laboratorium.
