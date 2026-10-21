# Design — Sprint 1

**Produk:** TapIn
**Tagline:** Tap once. You're in.
**Sprint:** 1 — Antarmuka dan Alur Praktikum
**Acuan kebutuhan:** `docs/PRD.md` — FR-01 sampai FR-10
**Acuan visual:** `docs/ui-ux-design-system-graphite-lime.md`
**Status:** Sprint 1 saja. Sprint berikutnya belum dirancang.
**Pemilik:** PM sprint berjalan

> Dokumen ini menerjemahkan PRD dan design system menjadi keputusan antarmuka yang dapat langsung dikerjakan: token, navigasi, wireframe, state, dan teks. Requirement tetap mengacu ke PRD; bila ada konflik, PRD menang.

---

## 1. Prinsip & Batas Sprint

### 1.1 Prinsip visual

1. **Graphite membangun struktur.** Judul, header landing, kartu ringkasan, tab aktif, dan filter aktif.
2. **Lime menandai satu aksi utama.** Maksimal satu tombol lime per layar. Tombol lain memakai putih, outline, atau graphite.
3. **Netral menjaga keterbacaan.** Latar `#F6F8F4`, kartu putih, teks utama `#202522`.
4. **Status selalu punya label teks.** Warna tidak pernah menjadi satu-satunya pembeda.
5. **Satu layar satu tujuan.** Tidak ada dua aksi utama yang bersaing dalam satu tampilan.

### 1.2 Batas scope Sprint 1

| Masuk Sprint 1 | Tidak masuk Sprint 1 (backlog) |
| --- | --- |
| Presensi lewat tombol + sheet konfirmasi | Scan QR, PIN, wajah, lokasi |
| Badge sesi `TERJADWAL/DIBUKA/SELESAI` | Badge Izin/Alpa di antarmuka, validasi izin, koreksi kehadiran |
| Status pribadi: sudah/belum presensi | Statistik persentase, grafik |
| Buka, tutup, dan buka lagi sesi dummy | Membuat, mengubah, menghapus sesi; mengatur durasi |
| Rekap per sesi dan riwayat pribadi | Pencarian, filter status rekap, ekspor CSV |
| Sukses = state lokal (`markAttendance` mengembalikan `ok`) | Menunggu konfirmasi server |
| 3 tab per peran, tab pertama sebagai beranda | Tab Beranda dashboard terpisah, notifikasi |

Aturan: bila sebuah elemen tidak mendukung FR-01–FR-10, elemen itu tidak masuk Sprint 1.

### 1.3 Hubungan dokumen

- **PRD** menentukan perilaku dan kriteria terima.
- **Design system Graphite Lime** menentukan bahasa visual.
- **Dokumen ini** menentukan susunan layar, komponen, state, dan teks.
- **`docs/sprints/sprint-1.md`** menentukan siapa mengerjakan apa.

---

## 2. Design Tokens

Seluruh nilai visual disimpan di satu tempat: `src/theme/tokens.ts` (dibuat oleh PM sebagai fondasi desain). Komponen tidak boleh menulis kode hex langsung.

### 2.1 Warna dasar

| Token | Hex | Pemakaian Sprint 1 |
| --- | --- | --- |
| `background` | `#F6F8F4` | Latar seluruh layar |
| `surface` | `#FFFFFF` | Kartu, sheet, input, tab bar |
| `surfaceMuted` | `#EDF0E9` | Input, area sekunder, badge netral |
| `border` | `#E0E5DC` | Border kartu, pemisah, outline tombol sekunder |
| `textPrimary` | `#202522` | Judul, isi utama, teks di atas lime |
| `textSecondary` | `#626A62` | Metadata penting, deskripsi |
| `textMuted` | `#7C847B` | Placeholder dan teks non-esensial |
| `graphite` | `#171A1A` | Header landing, kartu ringkasan, tab/chip aktif |
| `onGraphite` | `#FFFFFF` | Teks di atas graphite |

Catatan aksesibilitas: `textMuted` hanya untuk placeholder/dekorasi. Teks kecil yang perlu dibaca (tanggal, jam, keterangan) memakai `textSecondary`.

### 2.2 Warna aksi

| Token | Hex | Pemakaian |
| --- | --- | --- |
| `primary` | `#C4F15B` | Satu CTA utama per layar |
| `primaryPressed` | `#A4D139` | State pressed tombol lime |
| `primarySoft` | `#EAF5D4` | Area terpilih ringan, highlight |
| `onPrimary` | `#202522` | Teks/ikon di atas lime |
| `disabledBg` | `#E5E7EB` | Tombol nonaktif |
| `disabledText` | `#9CA3AF` | Label tombol nonaktif |

### 2.3 Warna status sesi (dipakai Sprint 1)

| Status | Foreground | Background | Alasan |
| --- | --- | --- | --- |
| `TERJADWAL` | `#374151` | `#E5E7EB` | Netral, belum berlangsung |
| `DIBUKA` | `#166534` | `#DCFCE7` | Hijau = aktif, dapat dipresensi |
| `SELESAI` | `#202522` | `#EDF0E9` | Netral gelap = tuntas, bukan error |

Merah **tidak** dipakai untuk `SELESAI`. Merah khusus error, misalnya penolakan presensi ganda.

### 2.4 Warna status kehadiran

| Status | Foreground | Background | Sprint 1 |
| --- | --- | --- | --- |
| Sudah presensi / Hadir | `#166534` | `#DCFCE7` | Dipakai |
| Belum presensi | `#374151` | `#E5E7EB` | Dipakai |
| Izin | `#92400E` | `#FEF3C7` | Token disimpan, tidak dipakai |
| Alpa | `#991B1B` | `#FEE2E2` | Token disimpan, tidak dipakai |
| Error | `#991B1B` | `#FEE2E2` | Dipakai untuk modal presensi ganda |

### 2.5 Spacing

| Token | Nilai | Pemakaian |
| --- | ---: | --- |
| `space1` | 4 | Jarak label dengan badge |
| `space2` | 8 | Jarak antarelemen kecil |
| `space3` | 12 | Jarak dalam kartu |
| `space4` | 16 | Padding kartu |
| `space5` | 20 | Margin horizontal layar |
| `space6` | 24 | Jarak antarkelompok |
| `space8` | 32 | Pemisah bagian besar |

Margin horizontal layar: **20**. Padding kartu: **16**. Jarak antar-kartu: **12**.

### 2.6 Radius, ukuran, dan elevasi

| Token | Nilai | Pemakaian |
| --- | ---: | --- |
| `radiusButton` | 14 | Semua tombol |
| `radiusCard` | 16 | Kartu, input, sheet |
| `radiusBadge` | 999 | Badge kapsul |
| `buttonHeight` | 50 | Tombol utama dan sekunder |
| `touchTarget` | 48 | Minimum area sentuh ikon/tab |
| `borderWidth` | 1 | Border kartu dan outline |

Elevasi: tanpa shadow atau sangat tipis. Pemisah utama adalah border `#E0E5DC`, bukan bayangan.

### 2.7 Tipografi

Font: **Inter**. Fallback: font sistem perangkat.

| Token | Ukuran | Line height | Weight | Pemakaian |
| --- | ---: | ---: | --- | --- |
| `h1` | 26 | 32 | 700 | Judul layar |
| `h2` | 19 | 26 | 600 | Judul bagian/kartu |
| `body` | 15 | 22 | 400 | Isi dan deskripsi |
| `bodyStrong` | 15 | 22 | 600 | Nama praktikum, label penting |
| `caption` | 12 | 18 | 500 | Metadata, badge, tab |

Aturan: jangan memakai lebih dari tiga ukuran teks dalam satu kartu. Nama praktikum selalu `bodyStrong`; metadata selalu `caption` atau `body` dengan `textSecondary`.

### 2.8 Sketsa `src/theme/tokens.ts`

```ts
export const colors = {
  background: '#F6F8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0E9',
  border: '#E0E5DC',
  textPrimary: '#202522',
  textSecondary: '#626A62',
  textMuted: '#7C847B',
  graphite: '#171A1A',
  onGraphite: '#FFFFFF',
  primary: '#C4F15B',
  primaryPressed: '#A4D139',
  primarySoft: '#EAF5D4',
  onPrimary: '#202522',
  disabledBg: '#E5E7EB',
  disabledText: '#9CA3AF',
  sesiTerjadwalFg: '#374151',
  sesiTerjadwalBg: '#E5E7EB',
  sesiDibukaFg: '#166534',
  sesiDibukaBg: '#DCFCE7',
  sesiSelesaiFg: '#202522',
  sesiSelesaiBg: '#EDF0E9',
  errorFg: '#991B1B',
  errorBg: '#FEE2E2',
  // Backlog, belum dipakai di Sprint 1:
  izinFg: '#92400E',
  izinBg: '#FEF3C7',
  alpaFg: '#991B1B',
  alpaBg: '#FEE2E2',
} as const;

export const spacing = {
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32,
} as const;

export const radius = {
  button: 14, card: 16, badge: 999, sheet: 16,
} as const;

export const layout = {
  screenPadding: 20, buttonHeight: 50, touchTarget: 48,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = {
  h1: { fontSize: 26, lineHeight: 32, fontFamily: fontFamily.bold },
  h2: { fontSize: 19, lineHeight: 26, fontFamily: fontFamily.semibold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.regular },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.semibold },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.medium },
} as const;
```

### 2.9 Aturan pemakaian warna

- **Lime** hanya untuk satu aksi utama per layar: `Masuk`, `Presensi`, `Buka Sesi`, atau `Buka Lagi`.
- **Graphite** untuk header landing, kartu ringkasan, tab aktif, chip filter aktif, dan tombol `Tutup Sesi`.
- **Putih + border** untuk tombol sekunder dan kartu.
- **Merah** hanya untuk error dan peringatan penolakan, bukan untuk status selesai.
- Jangan memberi lime pada badge, ikon dekoratif, atau seluruh kartu.

---

## 3. Navigasi & Peta Layar

### 3.1 Struktur route

```text
src/app/
├── _layout.tsx                 Stack root + SessionProvider + font loading
├── index.tsx                   Landing publik (FR-01)
├── login.tsx                   Login dummy (FR-02)
├── (asisten)/
│   ├── _layout.tsx             Stack + guard peran asisten
│   ├── (tabs)/
│   │   ├── _layout.tsx         Tabs: Sesi | Rekap | Profil
│   │   ├── index.tsx           Sesi = beranda asisten (FR-03)
│   │   ├── rekap.tsx           Rekap (FR-08)
│   │   └── profil.tsx          Profil + Keluar
│   └── sesi/
│       └── [id].tsx            Detail sesi asisten (FR-04)
└── (praktikan)/
    ├── _layout.tsx             Stack + guard peran praktikan
    ├── (tabs)/
    │   ├── _layout.tsx         Tabs: Jadwal | Riwayat | Profil
    │   ├── index.tsx           Jadwal = beranda praktikan (FR-05)
    │   ├── riwayat.tsx         Riwayat (FR-09)
    │   └── profil.tsx          Profil + Keluar
    └── sesi/
        └── [id].tsx            Detail sesi praktikan (FR-06, FR-07)
```

Alasan detail sesi berada di luar `(tabs)`: layar detail tidak boleh muncul sebagai tab. Detail dibuka dengan `router.push` dan kembali dengan tombol back.

### 3.2 Tab

| Peran | Tab 1 (beranda) | Tab 2 | Tab 3 |
| --- | --- | --- | --- |
| Asisten | `Sesi` | `Rekap` | `Profil` |
| Praktikan | `Jadwal` | `Riwayat` | `Profil` |

Aturan tab:

- Tab bar putih, border atas `#E0E5DC`, tinggi area sentuh minimal 56.
- Tab aktif: label graphite + indikator lime setinggi 3 di atas label.
- Tab nonaktif: label `textMuted`.
- Tanpa ikon pada Sprint 1 (menghindari dependensi tambahan). Label saja, tebal 600 saat aktif.
- Tab selalu terlihat pada layar beranda, rekap, riwayat, profil. Tidak terlihat pada landing, login, dan detail.

### 3.3 Guard peran

- `(asisten)/_layout.tsx`: bila `currentUser === null` → redirect `/`; bila `peran !== 'asisten'` → redirect `/(praktikan)`.
- `(praktikan)/_layout.tsx`: aturan kebalikannya.
- Landing dan login tidak memerlukan guard.
- Login sebagai satu peran tidak boleh membuka route peran lain, termasuk lewat deep link.
- Keluar dari profil → `logout()` → redirect `/`.

### 3.4 Kapan memakai layar, sheet, atau modal

| Kebutuhan | Bentuk | Alasan |
| --- | --- | --- |
| Detail sesi dari landing | `SheetModal` | Pengunjung hanya melihat; tidak perlu halaman penuh |
| Detail sesi dari beranda | Layar penuh | Ada aksi dan daftar kehadiran |
| Konfirmasi buka/tutup/buka lagi | `SheetModal` | Aksi singkat, wajib konfirmasi |
| Form konfirmasi presensi | `SheetModal` | Masukan singkat, tetap dalam konteks sesi |
| Error presensi ganda | `SheetModal` | Pesan + satu tombol tutup |
| Login | Layar penuh | Form dengan pilihan peran dan user |
| Rekap dan riwayat | Layar/tab | Konten panjang, sering dibuka |

Semua sheet dapat ditutup dengan tombol `✕`, tombol `Batal`, atau ketukan backdrop. Menutup sheet tidak boleh menjalankan aksi.

---

## 4. Wireframe

Keterangan: `[ ]` tombol, `▓` area graphite, `•` teks kecil, `▁` indikator aktif. Lebar acuan 360 px; wireframe bukan pengganti implementasi.

### 4.1 Landing publik (FR-01)

```text
┌──────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  TapIn                     [ Masuk ] │
│  Tap once. You're in.                │
│  Jadwal praktikum minggu ini         │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Pemrograman Web      [ DIBUKA ]│  │
│  │ IF-2A · Lab Multimedia         │  │
│  │ Rab, 21 Okt · 08.00–10.00      │  │
│  │                      Lihat detail│
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Basis Data       [ TERJADWAL ] │  │
│  │ IF-2A · Lab Basis Data         │  │
│  │ Rab, 21 Okt · 10.15–12.15      │  │
│  │                      Lihat detail│
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Sistem Operasi     [ SELESAI ] │  │
│  │ IF-2B · Lab Sistem Operasi     │  │
│  │ Sel, 20 Okt · 08.00–10.00      │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁  │
│  Login untuk presensi atau kelola    │
│  sesi.                               │
│  [ Masuk untuk lanjut ]  ← lime      │
└──────────────────────────────────────┘
```

Aturan:

- Header graphite, teks putih, tombol `Masuk` kecil bergaya outline terang.
- Kartu sesi putih, radius 16, border, padding 16. Seluruh kartu dapat diketuk.
- Badge status selalu berlabel.
- CTA bawah hanya muncul untuk pengunjung; satu-satunya elemen lime di layar.
- Empty state: `Belum ada jadwal praktikum.` dengan ikon/garis dekoratif sederhana.
- Saat kartu diketuk: buka sheet detail (lihat §4.10).

### 4.2 Login (FR-02)

```text
┌──────────────────────────────────────┐
│  ‹ Kembali                           │
│                                      │
│  Masuk                               │
│  Pilih peran dan nama kamu. Data     │
│  identitas masih dummy untuk Sprint 1│
│                                      │
│  PERAN                               │
│  ┌──────────────┬──────────────┐     │
│  │  Praktikan   │   Asisten    │     │
│  └──────────────┴──────────────┘     │
│     ▓ aktif graphite, teks putih     │
│                                      │
│  NAMA                                │
│  ┌────────────────────────────────┐  │
│  │ (•) Andi Pratama               │  │
│  │     2310512001 · IF-2A         │  │
│  ├────────────────────────────────┤  │
│  │ ( ) Bella Putri                │  │
│  │     2310512002 · IF-2A         │  │
│  ├────────────────────────────────┤  │
│  │ ( ) Citra Dewi                 │  │
│  │     2310512003 · IF-2A         │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │            MASUK               │  │  ← lime, nonaktif
│  └────────────────────────────────┘  │     sampai user dipilih
└──────────────────────────────────────┘
```

Aturan:

- Segmented control peran: aktif graphite + teks putih; nonaktif putih + border.
- Mengganti peran mengosongkan pilihan user dan menampilkan daftar user peran tersebut.
- Daftar user dapat digulir; setiap baris minimal 56 px.
- `Masuk` nonaktif sampai peran dan user dipilih. Satu-satunya lime di layar.
- Tidak ada field password pada Sprint 1.
- Setelah masuk, redirect ke tab pertama peran; login tidak dapat dibatalkan dengan back ke layar peran lain.

### 4.3 Sesi — beranda asisten (FR-03)

```text
┌──────────────────────────────────────┐
│  Halo, Budi                         │
│  Asisten · Selasa, 21 Oktober 2026   │
│                                      │
│  ┌─ kartu ringkasan graphite ──────┐ │
│  │  1 DIBUKA   3 TERJADWAL         │ │
│  │  1 SELESAI  · 5 sesi total      │ │
│  └─────────────────────────────────┘ │
│                                      │
│  Sesi saya                           │
│  ┌────────────────────────────────┐  │
│  │ Pemrograman Web      [ DIBUKA ]│  │
│  │ IF-2A · Lab Multimedia         │  │
│  │ Rab, 21 Okt · 08.00–10.00      │  │
│  │ Hadir 2 orang                  │  │
│  │        [ Tutup ]  [ Detail ]   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Basis Data       [ TERJADWAL ] │  │
│  │ IF-2A · Lab Basis Data         │  │
│  │ Rab, 21 Okt · 10.15–12.15      │  │
│  │                    [ Buka ]    │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▁ Sesi      Rekap      Profil       │
└──────────────────────────────────────┘
```

Aturan:

- Tab pertama adalah beranda; tidak ada tab `Beranda` terpisah.
- Kartu ringkasan graphite menampilkan hitungan status dari data yang sama, bukan data baru.
- `Tutup` dan `Buka` adalah tombol sekunder (outline), bukan lime. Aksi lime muncul di sheet konfirmasi.
- `Buka` hanya tampil untuk `TERJADWAL`; `Tutup` hanya untuk `DIBUKA`; sesi `SELESAI` menampilkan `Buka Lagi` di layar detail.
- `Detail` membuka layar `sesi/[id]`.
- Daftar hanya berisi sesi milik asisten yang login.
- Perubahan status dari mana pun langsung terlihat tanpa reload.
- Empty state: `Belum ada sesi untukmu.`

### 4.4 Detail sesi asisten (FR-04)

```text
┌──────────────────────────────────────┐
│  ‹ Kembali                [ DIBUKA ] │
│                                      │
│  Pemrograman Web                     │
│  IF-2A · Lab Multimedia              │
│  Rabu, 21 Oktober 2026               │
│  08.00–10.00                         │
│                                      │
│  Pertemuan 4: Layout responsif       │
│  dengan flexbox dan komponen React.  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │          TUTUP SESI            │  │  ← graphite
│  └────────────────────────────────┘  │
│                                      │
│  Kehadiran (2)         [ Lihat rekap]│
│  ┌────────────────────────────────┐  │
│  │ Andi Pratama            08.02  │  │
│  │ Bella Putri             08.05  │  │
│  └────────────────────────────────┘  │
│                                      │
│  Belum ada yang presensi.  ← empty   │
└──────────────────────────────────────┘
```

Aturan tombol berdasarkan status:

| Status | Tombol utama | Gaya | Konfirmasi |
| --- | --- | --- | --- |
| `TERJADWAL` | `Buka Sesi` | Lime | `Buka sesi ini sekarang?` |
| `DIBUKA` | `Tutup Sesi` | Graphite | `Tutup sesi ini? Presensi baru tidak dapat masuk setelah ditutup.` |
| `SELESAI` | `Buka Lagi` | Lime (outline) | `Buka kembali sesi ini?` |

Aturan lain:

- `Lihat rekap` membuka tab Rekap dengan sesi ini terpilih.
- Daftar hadir memakai `getKehadiranSesi(sesiId)` dan langsung diperbarui.
- Nama baris hadir memakai nama praktikan dari data user; waktu memakai `formatJam`.
- Empty state kehadiran: `Belum ada yang presensi pada sesi ini.`
- Tidak ada aksi hapus atau edit sesi.

### 4.5 Rekap (FR-08)

```text
┌──────────────────────────────────────┐
│  Rekap kehadiran                     │
│                                      │
│  Pilih sesi                          │
│  ┌────────────────────────────────┐  │
│  │ Pemrograman Web · IF-2A     ▾ │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌─ kartu ringkasan graphite ──────┐ │
│  │  2 dari 8 praktikan hadir       │ │
│  │  ████████░░░░░░░░  25%          │ │  ← bar opsional
│  └─────────────────────────────────┘ │
│                                      │
│  Daftar hadir                        │
│  ┌────────────────────────────────┐  │
│  │ Andi Pratama       08.02 [Hadir]│ │
│  ├────────────────────────────────┤  │
│  │ Bella Putri        08.05 [Hadir]│ │
│  └────────────────────────────────┘  │
│                                      │
│  Belum ada kehadiran di sesi ini.    │
└──────────────────────────────────────┘
```

Aturan:

- Selector sesi hanya berisi sesi milik asisten yang login.
- Angka `hadir/total` dihitung dari `getKehadiranSesi` dan jumlah praktikan pada kelas sesi.
- Bar kemajuan memakai lime di atas `surfaceMuted`; opsional, boleh dihilangkan bila waktu mepet.
- Badge `Hadir` memakai token hijau. Tidak ada badge Izin/Alpa di Sprint 1.
- Empty state wajib; jangan menampilkan tabel kosong tanpa penjelasan.
- Tidak ada pencarian, filter status, atau ekspor pada Sprint 1.

### 4.6 Jadwal — beranda praktikan (FR-05)

```text
┌──────────────────────────────────────┐
│  Halo, Andi                          │
│  Praktikan · IF-2A                   │
│                                      │
│  ┌─ kartu sesi aktif ──────────────┐ │
│  │ Sesi dibuka sekarang             │ │
│  │ Pemrograman Web · Lab Multimedia │ │
│  │ 08.00–10.00                      │ │
│  │ ┌──────────────────────────────┐ │ │
│  │ │      PRESENSI SEKARANG       │ │ │ ← lime, satu-satunya
│  │ └──────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
│                                      │
│  [ Semua ] [ Dibuka ] [ Saya hadir ] │
│    ▓ aktif graphite                  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Pemrograman Web      [ DIBUKA ]│  │
│  │ IF-2A · 08.00–10.00            │  │
│  │ ✓ Sudah presensi 08.02         │  │  ← hijau
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Basis Data       [ TERJADWAL ] │  │
│  │ IF-2A · 10.15–12.15            │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▁ Jadwal     Riwayat     Profil     │
└──────────────────────────────────────┘
```

Aturan:

- Tab pertama adalah beranda; kartu sesi aktif di atas adalah ringkasan, bukan layar baru.
- Hanya satu CTA lime: `Presensi Sekarang` pada sesi `DIBUKA` yang belum dipresensi.
- Bila tidak ada sesi `DIBUKA`, kartu ringkasan diganti teks `Tidak ada sesi yang dibuka saat ini.` tanpa CTA.
- Bila sudah presensi, CTA diganti banner hijau `Sudah presensi pukul 08.02` (nonaktif).
- Filter: `Semua`, `Dibuka`, `Saya hadir`. Chip aktif graphite, nonaktif putih + border.
- Filter `Saya hadir` memakai `getKehadiranPraktikan(currentUser.id)`.
- Empty state per filter, misalnya `Tidak ada sesi yang dibuka.`
- Kartu tetap dapat diketuk untuk membuka detail.

### 4.7 Detail sesi praktikan + presensi (FR-06, FR-07)

```text
┌──────────────────────────────────────┐
│  ‹ Kembali                [ DIBUKA ] │
│                                      │
│  Pemrograman Web                     │
│  IF-2A · Lab Multimedia              │
│  Rabu, 21 Oktober 2026               │
│  08.00–10.00                         │
│                                      │
│  Pertemuan 4: Layout responsif       │
│  dengan flexbox dan komponen React.  │
│                                      │
│  ┌─ status pribadi ────────────────┐ │
│  │ Belum presensi pada sesi ini    │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐  │
│  │       PRESENSI SEKARANG        │  │ ← lime
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

Empat state tombol presensi:

| State | Label | Gaya | Kondisi |
| --- | --- | --- | --- |
| Siap | `Presensi Sekarang` | Lime | Sesi `DIBUKA` dan belum presensi |
| Terkunci status | `Sesi Belum Dibuka` / `Sesi Selesai` | Disabled | Sesi `TERJADWAL` / `SELESAI` |
| Proses | spinner + `Mencatat...` | Lime, nonaktif | Selama `markAttendance()` |
| Berhasil | `✓ Sudah Presensi 08.02` | Disabled hijau | Setelah `ok: true`, permanen |

Banner status pribadi:

- Belum: `Belum presensi pada sesi ini` (latar `surfaceMuted`, teks `textSecondary`).
- Sudah: `Presensi tercatat pukul 08.02` (latar `#DCFCE7`, teks `#166534`) + catatan kecil `Tersimpan di perangkat`.
- Tidak dapat presensi: `Sesi ini belum dibuka.` atau `Sesi ini sudah ditutup.`

Urutan presensi (3 ketukan dari beranda):

1. Ketuk `Presensi Sekarang` (beranda atau detail).
2. Centang `Saya hadir pada sesi ini` pada sheet.
3. Ketuk `Konfirmasi` (lime).

### 4.8 Riwayat praktikan (FR-09)

```text
┌──────────────────────────────────────┐
│  Riwayat kehadiran                   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Pemrograman Web                │  │
│  │ Rabu, 21 Oktober 2026          │  │
│  │ Hadir pukul 08.02      [Hadir] │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ Sistem Operasi                 │  │
│  │ Selasa, 20 Oktober 2026        │  │
│  │ Hadir pukul 08.03      [Hadir] │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▁ Jadwal     Riwayat     Profil     │
└──────────────────────────────────────┘
```

Aturan:

- Hanya catatan milik `currentUser.id`.
- Urut dari waktu terbaru.
- Setiap kartu menampilkan nama praktikum, tanggal sesi, waktu hadir, dan badge `Hadir`.
- Empty state: `Kamu belum memiliki catatan kehadiran.` + arahan `Presensi akan muncul di sini setelah kamu hadir.`
- Tidak ada tombol aksi pada kartu riwayat.

### 4.9 Profil (asisten dan praktikan)

```text
┌──────────────────────────────────────┐
│  Profil                              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ( BS )  Budi Santoso          │  │
│  │          Asisten · 2210512001  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  Peran           Asisten       │  │
│  │  NIM             2210512001    │  │
│  │  Kelas           —             │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │            KELUAR              │  │  ← outline
│  └────────────────────────────────┘  │
│                                      │
│  Sprint 1 · data lokal               │
│                                      │
│  ▁ Jadwal     Riwayat     Profil     │
└──────────────────────────────────────┘
```

Aturan:

- Avatar berupa inisial pada lingkaran `primarySoft` dengan teks graphite.
- `Keluar` memakai outline, bukan lime, dan langsung memanggil `logout()` tanpa modal (bukan aksi destruktif data).
- Tidak ada pengaturan, edit profil, atau notifikasi pada Sprint 1.
- Label versi menunjukkan `Sprint 1 · data lokal` agar batasan demo jelas.

### 4.10 Sheet dan modal

**A. Sheet detail dari landing (FR-01)**

```text
┌──────────────────────────────────────┐
│                                      │
│  (backdrop gelap transparan)         │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  ──                        ✕   │  │
│  │  Pemrograman Web      [DIBUKA] │  │
│  │  IF-2A · Lab Multimedia        │  │
│  │  Rabu, 21 Oktober 2026         │  │
│  │  08.00–10.00                   │  │
│  │                                │  │
│  │  Pertemuan 4: Layout responsif │  │
│  │  dengan flexbox...             │  │
│  │                                │  │
│  │  Aksi tersedia setelah login.  │  │
│  │  [ Masuk untuk presensi ]      │  │ ← lime
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

- Tombol aksi sesi (buka/tutup/presensi) tidak ditampilkan sebagai tombol aktif.
- Satu-satunya aksi adalah menuju login.
- `✕`, backdrop, dan tombol back menutup sheet.

**B. Konfirmasi buka/tutup sesi (FR-04, FR-10)**

```text
│  ┌────────────────────────────────┐  │
│  │  Tutup sesi?               ✕   │  │
│  │                                │  │
│  │  Pemrograman Web · IF-2A       │  │
│  │  Presensi baru tidak dapat     │  │
│  │  masuk setelah sesi ditutup.   │  │
│  │                                │  │
│  │  [ Batal ]      [ Ya, tutup ]  │  │
│  │                   ↑ lime       │  │
│  └────────────────────────────────┘  │
```

- Judul menyebut aksi; isi menyebut konsekuensi.
- `Batal` selalu di kiri, aksi utama di kanan.
- Untuk `Buka Sesi` dan `Buka Lagi`, tombol kanan berbunyi `Ya, buka`.
- Tidak ada aksi yang berjalan saat sheet ditutup.

**C. Form konfirmasi presensi (FR-06, FR-10)**

```text
│  ┌────────────────────────────────┐  │
│  │  Konfirmasi presensi       ✕   │  │
│  │                                │  │
│  │  Pemrograman Web · IF-2A       │  │
│  │  Rabu, 21 Oktober 2026         │  │
│  │  08.00–10.00                   │  │
│  │                                │  │
│  │  Nama                          │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │ Andi Pratama             │  │  │ non-edit
│  │  └──────────────────────────┘  │  │
│  │                                │  │
│  │  [✓] Saya hadir pada sesi ini  │  │ wajib
│  │                                │  │
│  │  [ Batal ]   [ Konfirmasi ]    │  │
│  │                  ↑ lime        │  │
│  └────────────────────────────────┘  │
```

- Checkbox wajib; `Konfirmasi` nonaktif sampai dicentang.
- Setelah `Konfirmasi`: tombol berubah menjadi spinner + `Mencatat...`, sheet tidak dapat ditutup selama proses.
- Berhasil: sheet tertutup, banner hijau dan waktu tampil, tombol presensi menjadi nonaktif.
- Gagal karena sesi sudah ditutup: sheet error `Sesi sudah ditutup.` + `Tutup`.

**D. Error presensi ganda (FR-07)**

```text
│  ┌────────────────────────────────┐  │
│  │  (!)  Presensi sudah tercatat  │  │
│  │                                │  │
│  │  Kamu sudah presensi pada sesi │  │
│  │  ini pukul 08.02.              │  │
│  │                                │  │
│  │  [ Tutup ]                     │  │
│  └────────────────────────────────┘  │
```

- Ikon peringatan merah, latar ikon `errorBg`.
- Pesan wajib menyebut waktu presensi pertama.
- Hanya satu tombol `Tutup`; tidak ada aksi lain.

### 4.11 Empty state

| Konteks | Judul | Pesan | Aksi |
| --- | --- | --- | --- |
| Landing tanpa sesi | `Belum ada jadwal` | `Jadwal praktikum akan tampil di sini.` | — |
| Beranda asisten | `Belum ada sesi` | `Sesi yang kamu kelola akan tampil di sini.` | — |
| Detail asisten tanpa hadir | `Belum ada yang presensi` | `Kehadiran praktikan akan muncul saat mereka presensi.` | — |
| Rekap tanpa hadir | `Belum ada kehadiran` | `Belum ada praktikan yang tercatat pada sesi ini.` | — |
| Filter praktikan kosong | `Tidak ada sesi` | Sesuaikan dengan filter: `Tidak ada sesi yang dibuka.` / `Kamu belum menghadiri sesi apa pun.` | `Tampilkan semua` |
| Riwayat kosong | `Belum ada catatan` | `Presensi yang berhasil akan muncul di sini.` | — |

Anatomi `EmptyState`: garis/ikon dekoratif 40×40 dengan `primarySoft`, judul `bodyStrong`, pesan `body` `textSecondary` selebar maksimal 280, CTA opsional.

---

## 5. Komponen UI Kit

Dibuat oleh P1 sebagai bagian dari komponen UI bersama, dipakai P2 dan P3. Semua komponen memakai token; tidak ada hex lokal.

| Komponen | Props | State | Catatan |
| --- | --- | --- | --- |
| `StatusBadge` | `status: 'TERJADWAL' \| 'DIBUKA' \| 'SELESAI'` | — | Kapsul, padding 10×5, label teks wajib, `caption` 600 |
| `Tombol` | `variant: 'primer' \| 'sekunder' \| 'graphite' \| 'ghost'`, `loading?`, `disabled?`, `onPress`, `children` | default, pressed, disabled, loading | Tinggi 50, radius 14, teks 600. `primer` = lime; `graphite` = gelap; `sekunder` = putih + border; `ghost` = transparan |
| `SheetModal` | `visible`, `judul`, `onClose`, `children`, `dismissible?` | terbuka/tertutup | Slide dari bawah, radius atas 16, backdrop, `✕` selalu ada. Saat `loading`, `dismissible=false` |
| `EmptyState` | `judul`, `pesan`, `aksi?` | — | Center, max width 280 |
| `FilterChip` | `label`, `aktif`, `onPress` | aktif/nonaktif | Aktif graphite + teks putih; nonaktif putih + border |

Aturan tambahan:

- `Tombol` dengan `loading` otomatis `disabled` dan menampilkan `ActivityIndicator` kecil.
- `SheetModal` memakai `Modal` bawaan React Native dengan `animationType="slide"` dan `transparent`.
- Tidak ada komponen yang menyimpan state bisnis; state tetap di layar/context.
- Komponen tidak boleh mengimpor data dummy secara langsung.

Anatomi kartu sesi (dipakai berulang):

```text
┌──────────────────────────────────┐
│ Nama praktikum        [Badge]    │  bodyStrong + StatusBadge
│ Kelas · Lab                      │  caption/textSecondary
│ Tanggal · Jam                    │  caption/textSecondary
│ [aksi kiri]           [Detail]   │  tombol sekunder/ghost
└──────────────────────────────────┘
```

---

## 6. Alur Interaksi

### 6.1 Asisten membuka sesi

1. Asisten membuka tab `Sesi`.
2. Menekan `Buka` pada kartu sesi `TERJADWAL` (tombol sekunder).
3. Sheet konfirmasi muncul: judul `Buka sesi?`, isi nama sesi dan kelas.
4. Menekan `Ya, buka` (lime).
5. `openSession(sesiId)` dipanggil; sheet tertutup.
6. Badge berubah menjadi `DIBUKA` pada kartu dan detail; tombol berubah menjadi `Tutup Sesi`.
7. Tidak ada loading global; perubahan state lokal langsung terlihat.

Kegagalan yang mungkin: sesi tidak ditemukan (state sudah berubah). Tampilkan sheet `Sesi tidak ditemukan.` dan kembali ke daftar.

### 6.2 Asisten menutup sesi

1. Dari kartu `DIBUKA` atau detail, tekan `Tutup`.
2. Sheet: `Tutup sesi?` + peringatan presensi baru tidak dapat masuk.
3. `Ya, tutup` → `closeSession(sesiId)`.
4. Badge menjadi `SELESAI`; daftar hadir tetap dapat dilihat; tombol menjadi `Buka Lagi`.

### 6.3 Praktikan melakukan presensi

1. Dari beranda, tekan `Presensi Sekarang` pada kartu sesi aktif (atau dari detail).
2. Sheet konfirmasi menampilkan nama, sesi, tanggal, dan jam.
3. Centang `Saya hadir pada sesi ini`.
4. Tekan `Konfirmasi`; tombol berubah menjadi `Mencatat...`.
5. `markAttendance(sesiId)` dipanggil.
6. Bila `ok: true`: sheet tertutup; banner hijau `Presensi tercatat pukul HH.mm` + `Tersimpan di perangkat`; tombol menjadi `✓ Sudah Presensi`.
7. Bila `ok: false`: sheet error muncul dengan `alasan` dari context.

### 6.4 Guard presensi ganda

Guard berlapis:

1. **Tombol:** nonaktif bila sesi tidak `DIBUKA` atau `sudahPresensi()` mengembalikan data.
2. **Aksi context:** `markAttendance` memeriksa ulang status sesi dan duplikat sebelum menulis.
3. **UI:** bila tetap gagal, tampilkan sheet error dengan waktu presensi pertama.
4. **Database (sprint berikutnya):** ID dokumen kehadiran = praktikanId, sehingga duplikasi tidak mungkin.

Anti double-tap: state `loading` lokal layar, tombol nonaktif, sheet tidak dapat ditutup selama proses.

### 6.5 State machine tombol presensi

```text
        sesi TERJADWAL
               │
               ▼
        [ Sesi Belum Dibuka ] ──disabled──┐
                                          │
        sesi DIBUKA + belum presensi      │
               │                          │
               ▼                          │
        [ Presensi Sekarang ] ──tap──► sheet konfirmasi
               │                          │
               │                    [ Konfirmasi ]
               │                          │
               │                    loading "Mencatat..."
               │                          │
               │              ┌───────────┴───────────┐
               │              ▼                       ▼
               │        ok: true                 ok: false
               │              │                       │
               │              ▼                       ▼
               │   [ ✓ Sudah Presensi ]        sheet error + waktu
               │        (permanen)                  │
               │                                    ▼
               └──────────────────────────► kembali ke state sebelumnya
```

---

## 7. Matriks State per Layar

| Layar | Loading | Empty | Error | Sukses | Disabled |
| --- | --- | --- | --- | --- | --- |
| Landing | — | `Belum ada jadwal` | — | — | Aksi terkunci + CTA login |
| Login | — | — | — | Redirect ke tab peran | `Masuk` sampai user dipilih |
| Sesi (asisten) | — | `Belum ada sesi` | Sheet `Sesi tidak ditemukan` | Badge berubah langsung | — |
| Detail asisten | — | `Belum ada yang presensi` | Sheet error status | Badge + tombol berubah | Tombol lawan status tidak ditampilkan |
| Rekap | — | `Belum ada kehadiran` | — | — | — |
| Jadwal (praktikan) | — | Empty per filter | — | Banner hijau + tombol terkunci | Tombol saat bukan `DIBUKA` |
| Detail praktikan | `Mencatat...` | — | Sheet presensi ganda / sesi ditutup | Banner hijau + waktu | 3 kondisi: belum dibuka, selesai, sudah presensi |
| Riwayat | — | `Belum ada catatan` | — | — | — |
| Profil | — | — | — | Redirect ke landing setelah keluar | — |

Catatan: seluruh data Sprint 1 bersifat lokal dan sinkron, sehingga tidak ada state loading daftar. Loading hanya pada aksi presensi.

---

## 8. Copywriting Baku

Gunakan teks berikut agar konsisten. Jangan membuat variasi baru tanpa memperbarui dokumen ini.

### 8.1 Tombol

| Konteks | Teks |
| --- | --- |
| Landing | `Masuk`, `Masuk untuk lanjut`, `Lihat detail` |
| Login | `Masuk`, `Kembali` |
| Asisten | `Buka`, `Tutup`, `Buka Lagi`, `Detail`, `Lihat rekap` |
| Praktikan | `Presensi Sekarang`, `Konfirmasi`, `Batal` |
| Umum | `Tutup`, `✕` |

### 8.2 Judul dan konfirmasi

- Buka: `Buka sesi?` / `Sesi akan dibuka dan praktikan dapat melakukan presensi.`
- Tutup: `Tutup sesi?` / `Presensi baru tidak dapat masuk setelah sesi ditutup.`
- Buka lagi: `Buka kembali sesi ini?` / `Praktikan dapat kembali melakukan presensi.`
- Presensi: `Konfirmasi presensi` / `Periksa sesi dan nyatakan kehadiranmu.`

### 8.3 Pesan status dan error

- Sukses: `Presensi tercatat pukul {HH.mm}.` + `Tersimpan di perangkat.`
- Ganda: `Presensi sudah tercatat` / `Kamu sudah presensi pada sesi ini pukul {HH.mm}.`
- Sesi ditutup: `Sesi sudah ditutup.` / `Presensi tidak dapat dilakukan lagi pada sesi ini.`
- Belum dibuka: `Sesi belum dibuka.` / `Tombol presensi aktif saat asisten membuka sesi.`
- Selesai: `Sesi selesai.` / `Sesi ini sudah ditutup oleh asisten.`
- Guard peran: `Halaman ini hanya untuk {peran}.` (jarang terlihat; redirect lebih utama)

Format waktu di antarmuka: `HH.mm` (contoh `08.02`). Format tanggal: `Rabu, 21 Oktober 2026`. Format rentang: `08.00–10.00`.

---

## 9. Aksesibilitas & Usability

- Target sentuh minimal 48×48 untuk tombol, tab, chip, dan baris daftar.
- Kontras teks utama dan lime memenuhi syarat; teks kecil memakai `textSecondary`, bukan `textMuted`.
- Status tidak boleh dibedakan hanya dengan warna; selalu ada label.
- Tombol nonaktif tetap terbaca (jangan opacity di bawah 0.5).
- Form presensi dapat diselesaikan dengan satu tangan; CTA berada di area bawah sheet.
- Tidak ada gestur tersembunyi; semua aksi punya tombol terlihat.
- Dialog selalu punya tombol tutup yang jelas.
- Angka tanggal dan waktu memakai lebar konsisten agar mudah dipindai.

---

## 10. Font Inter

### 10.1 Keputusan

- Inter dipakai sejak Sprint 1.
- PM menyiapkan font sebagai bagian dari fondasi desain; programmer tidak perlu memasang sendiri.
- Bila font gagal dimuat, aplikasi tetap berjalan dengan font sistem (fallback), tanpa layar error.

### 10.2 Rencana teknis

- Paket: `expo-font` + `@expo-google-fonts/inter` melalui `npx expo install`.
- PM menyediakan hook `useAppFonts()` di `src/theme/fonts.ts`; P1 memanggilnya di `src/app/_layout.tsx`.
- Weight yang dimuat: `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`.
- Jangan memakai config plugin `expo-font` untuk Sprint 1 karena tidak berjalan di Expo Go.
- Saat font belum siap, tampilkan latar `background` polos (tanpa spinner) atau render dengan font sistem; jangan menahan aplikasi dengan splash yang lama.
- Bila `error` dari `useFonts`, lanjutkan render; React Native akan memakai font sistem.
- `tokens.ts` tetap mendefinisikan nama family Inter; fallback terjadi di level platform.

### 10.3 Kriteria terima font

- Aplikasi tetap dapat dibuka di Expo Go sebelum dan sesudah font tersedia.
- Tidak ada error merah karena font tidak ditemukan.
- Teks tidak berkedip putih atau berubah ukuran saat font selesai dimuat.
- `npx tsc --noEmit` lolos.

---

## 11. Design QA Checklist Sprint 1

- [ ] Tidak ada kode hex di luar `src/theme/tokens.ts`.
- [ ] Setiap layar memiliki maksimal satu tombol lime.
- [ ] Tombol lime selalu memakai teks graphite.
- [ ] Badge sesi selalu berlabel dan tidak mengandalkan warna.
- [ ] Warna merah hanya muncul untuk error, bukan status selesai.
- [ ] Asisten tidak melihat aksi praktikan dan sebaliknya.
- [ ] Tombol presensi memiliki empat state: siap, terkunci, loading, berhasil.
- [ ] Presensi ganda menampilkan waktu presensi pertama.
- [ ] Semua daftar memiliki empty state.
- [ ] Semua sheet dapat ditutup tanpa menjalankan aksi.
- [ ] Buka sesi dan presensi dapat dilakukan maksimal 3 ketukan dari beranda.
- [ ] Tab aktif mudah dikenali tanpa mengandalkan warna saja.
- [ ] Tanggal, waktu, dan status terbaca dengan cepat.
- [ ] Rekap dapat dipahami tanpa melihat warna badge.
- [ ] Layout tidak terpotong pada lebar 320 px.
- [ ] Teks tidak keluar dari kartu saat nama praktikum panjang.
- [ ] Aplikasi tetap berjalan bila font Inter gagal dimuat.

---

## 12. Backlog Visual (Bukan Sprint 1)

Ditunda dan tidak boleh dikerjakan tanpa pembaruan PRD:

- Scan QR / PIN presensi.
- Tab Beranda dashboard terpisah.
- Badge dan alur Izin/Alpa.
- Pencarian dan filter status pada rekap.
- Ekspor CSV/rekap.
- Koreksi kehadiran oleh asisten.
- Membuat/mengubah/menghapus sesi dan durasi check-in.
- Statistik persentase dan grafik kehadiran.
- Notifikasi dan pengingat sesi.
- Dark mode.
- Font Plus Jakarta Sans.
- Ikon tab dan ilustrasi kustom.

---

## 13. Keputusan Terbuka

- Logo dan ikon aplikasi (maksimal H+2 Sprint 1).
- Data lab/kelas final untuk demo.
- Apakah APK EAS wajib atau cukup Expo Go + rekaman.
- Apakah ikon tab diperlukan setelah Sprint 1 (menambah dependensi `@expo/vector-icons`).

---

## 14. Dokumen Terkait

- `docs/PRD.md` — requirement dan kriteria terima.
- `docs/ui-ux-design-system-graphite-lime.md` — token dan prinsip visual.
- `docs/sprints/sprint-1.md` — jobdesk per area, jadwal, dan demo Sprint 1.
- `docs/WORKFLOW-GIT.md` — aturan branch dan review.
