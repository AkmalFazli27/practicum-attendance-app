# UI/UX Design System — Graphite Lime

**Produk:** Aplikasi mobile pencatatan kehadiran praktikan dan asisten praktikum  
**Mode:** Light mode  
**Gaya:** Minimalis, clean, modern

## 1. Konsep desain

Graphite Lime menggabungkan warna graphite yang tegas dengan lime green yang cerah sebagai aksen. Hasilnya adalah antarmuka modern, sedikit eksperimental, dan berbeda dari aplikasi akademik yang biasanya didominasi warna biru.

**Prinsip utama:** gunakan warna gelap untuk membangun struktur, warna lime untuk menarik perhatian ke aksi penting, dan warna netral untuk menjaga keterbacaan.

## 2. Color design tokens

Gunakan token warna agar seluruh halaman konsisten dan perubahan tema dapat dilakukan tanpa mengedit setiap komponen satu per satu.

### 2.1 Warna dasar

| Token | Hex | Penggunaan |
|---|---|---|
| `background` | `#F6F8F4` | Latar belakang halaman |
| `surface` | `#FFFFFF` | Card, modal, bottom sheet |
| `surface-muted` | `#EDF0E9` | Area input dan elemen sekunder |
| `border` | `#E0E5DC` | Garis pemisah dan border |
| `text-primary` | `#202522` | Judul dan teks utama |
| `text-secondary` | `#626A62` | Deskripsi dan metadata |
| `text-muted` | `#7C847B` | Placeholder dan informasi tambahan |
| `graphite` | `#171A1A` | Header gelap dan elemen kontras |

### 2.2 Warna brand dan interaksi

| Token | Hex | Penggunaan |
|---|---|---|
| `primary` | `#C4F15B` | Tombol aksi utama |
| `primary-hover` | `#B2DF47` | State hover pada web atau pointer |
| `primary-pressed` | `#A4D139` | State pressed |
| `primary-soft` | `#EAF5D4` | Highlight, badge, dan area terpilih |
| `on-primary` | `#202522` | Teks dan ikon di atas lime |
| `on-graphite` | `#FFFFFF` | Teks di atas graphite |

**Catatan:** untuk tombol lime, gunakan teks graphite, bukan putih, agar kontrasnya lebih baik. Pada perangkat mobile, state `pressed` lebih relevan daripada `hover`.

### 2.3 Warna status kehadiran

Warna status harus dibedakan dengan jelas. Jangan hanya mengandalkan warna; sertakan teks atau ikon agar status mudah dipahami.

| Status | Foreground | Background | Penggunaan |
|---|---|---|---|
| Hadir | `#166534` | `#DCFCE7` | Presensi berhasil atau kehadiran tercatat |
| Izin | `#92400E` | `#FEF3C7` | Izin yang sudah tercatat |
| Alpa | `#991B1B` | `#FEE2E2` | Tidak hadir tanpa keterangan yang diterima |
| Belum tercatat | `#374151` | `#E5E7EB` | Status belum dikonfirmasi |

Status izin dan alpa sebaiknya hanya ditetapkan setelah proses validasi atau penutupan sesi yang sesuai. Jangan otomatis menampilkan status alpa sebelum jadwal praktikum berlangsung.

## 3. Aturan penggunaan warna

Sebagai pedoman awal, gunakan distribusi visual berikut:

- **60% warna netral/background:** ruang kosong dan latar halaman.
- **25% surface putih:** kartu, form, dan panel informasi.
- **10% graphite:** judul kuat, header tertentu, navigasi aktif, atau kartu unggulan.
- **5% lime:** tombol presensi, CTA, indikator pilihan aktif, dan elemen yang perlu menarik perhatian.

Persentase ini merupakan pedoman komposisi visual, bukan batas yang wajib dipenuhi.

### Aturan praktis

- **Graphite:** gunakan untuk judul yang kuat, header tertentu, navigasi aktif, atau kartu unggulan.
- **Lime:** prioritaskan untuk tombol presensi, CTA, indikator pilihan aktif, dan elemen yang membutuhkan perhatian.
- **Putih:** gunakan untuk kartu jadwal, daftar praktikan, form, dan ringkasan data.
- **Background terang:** gunakan sebagai pemisah visual antarkelompok konten.
- **Warna status:** gunakan secara konsisten untuk hadir, izin, dan alpa.

Hindari membuat semua tombol, ikon, badge, dan kartu menjadi lime. Warna tersebut akan kehilangan fungsinya sebagai penanda aksi utama.

## 4. Tipografi dan bentuk komponen

### 4.1 Tipografi

**Font utama:** Inter  
**Alternatif:** Plus Jakarta Sans

| Elemen | Ukuran rekomendasi | Penggunaan |
|---|---:|---|
| Heading halaman | 24–28 px | Judul halaman utama |
| Subheading | 18–20 px | Judul bagian atau kartu |
| Body | 14–16 px | Isi dan deskripsi |
| Caption | 12 px | Metadata dan informasi tambahan |

Gunakan bobot medium atau semibold untuk judul dan label penting. Pastikan teks isi mudah dibaca dan tidak terlalu rapat.

### 4.2 Buttons

- Tinggi tombol utama: **48–52 px**.
- Radius: **12–14 px**.
- Teks: semibold.
- Tombol utama: background lime (`#C4F15B`) dengan teks graphite (`#202522`).
- Tombol sekunder: surface putih dengan border netral.
- Gunakan state pressed yang jelas; jangan mengandalkan hover pada perangkat mobile.

### 4.3 Cards

- Radius: **16 px**.
- Padding: **16 px**.
- Border: `#E0E5DC`.
- Gunakan shadow yang sangat ringan atau tanpa shadow.
- Hindari menumpuk terlalu banyak kartu di dalam kartu.

### 4.4 Status badges

- Bentuk kapsul dengan padding horizontal **10 px** dan vertikal **5–6 px**.
- Gunakan warna foreground dan background sesuai token status.
- Selalu sertakan label teks, misalnya “Hadir”, “Izin”, atau “Alpa”.
- Jangan menyampaikan status hanya melalui warna.

## 5. Komponen utama aplikasi

Aplikasi memiliki dua jenis pengguna dengan kebutuhan berbeda. Keduanya dapat menggunakan design system yang sama, tetapi konten dan tindakan harus mengikuti peran pengguna.

### 5.1 Praktikan

**Presensi utama**
- Tombol scan QR menjadi aksi paling menonjol.
- Tampilkan nama praktikum, jadwal, dan batas waktu presensi.
- Jangan sembunyikan tindakan utama di menu tambahan.

**Jadwal dan riwayat**
- Daftar sesi mendatang.
- Status kehadiran setiap sesi.
- Rekap hadir, izin, dan alpa.
- Tanggal dan nama praktikum ditampilkan dengan jelas.

### 5.2 Asisten praktikum

**Kelola sesi presensi**
- Buat atau aktifkan sesi.
- Tampilkan QR code.
- Atur durasi check-in jika diperlukan.
- Tampilkan jumlah praktikan yang sudah melakukan presensi.

**Daftar dan rekap kehadiran**
- Daftar praktikan.
- Pencarian nama dan filter status.
- Koreksi kehadiran sesuai izin pengguna.
- Ekspor rekap jika diperlukan.
- Minta konfirmasi sebelum perubahan status disimpan.

## 6. Struktur navigasi

Gunakan bottom navigation untuk halaman yang sering dibuka, bukan untuk setiap fitur.

### Navigasi praktikan

1. **Beranda** — status presensi hari ini dan sesi aktif.
2. **Jadwal** — sesi mendatang.
3. **Riwayat** — riwayat dan rekap kehadiran.
4. **Profil** — data pengguna dan pengaturan.

Navigasi asisten dapat mengganti menu Jadwal atau Riwayat dengan **Sesi** dan **Rekap**, sesuai prioritas penggunaan.

## 7. Alur presensi yang disarankan

1. Praktikan membuka beranda.
2. Aplikasi menampilkan sesi aktif yang relevan.
3. Praktikan menekan tombol scan dan memindai QR.
4. Aplikasi memvalidasi sesi dan mencatat kehadiran.
5. Layar konfirmasi menampilkan status berhasil, waktu presensi, dan nama sesi.

Rancang state yang jelas untuk:
- Loading.
- QR tidak valid.
- Sesi kedaluwarsa.
- Presensi duplikat.
- Koneksi bermasalah.
- Presensi berhasil.

Jangan menampilkan status berhasil sebelum server mengonfirmasi pencatatan.

## 8. Layout dan spacing

Gunakan sistem spacing berbasis kelipatan 4 px agar layout konsisten.

| Token | Ukuran | Penggunaan |
|---|---:|---|
| `space-1` | 4 px | Jarak ikon dan label |
| `space-2` | 8 px | Jarak elemen kecil |
| `space-3` | 12 px | Jarak dalam kelompok |
| `space-4` | 16 px | Padding kartu standar |
| `space-6` | 24 px | Jarak antarkelompok |
| `space-8` | 32 px | Pemisah bagian besar |

Rekomendasi tambahan:

- Margin horizontal layar ponsel sekitar **20 px**, dengan penyesuaian terhadap ukuran perangkat.
- Target sentuh ideal sekitar **48 × 48 px** untuk tombol utama, ikon navigasi, dan kontrol penting.
- Jaga konsistensi alignment, jarak antarkomponen, dan hierarki informasi.

## 9. Contoh penerapan pada dashboard praktikan

Struktur dashboard yang disarankan:

1. **Header:** nama atau sapaan pengguna dan notifikasi.
2. **Kartu presensi:** status kehadiran hari ini, nama praktikum, dan tombol “Scan untuk presensi”.
3. **Ringkasan kehadiran:** jumlah sesi hadir dibanding total sesi dan persentase kehadiran.
4. **Sesi berikutnya:** tanggal, waktu, dan nama praktikum.
5. **Bottom navigation:** Beranda, Jadwal, Riwayat, Profil.

Gunakan background `#F6F8F4`, kartu putih, teks utama `#202522`, dan lime `#C4F15B` hanya untuk tombol aksi utama atau elemen terpilih.

## 10. Checklist design QA

- [ ] Semua layar memakai token warna yang sama, bukan kode hex acak.
- [ ] Tombol lime menggunakan teks graphite dan memiliki kontras yang memadai.
- [ ] Status hadir, izin, alpa, dan belum tercatat punya label yang jelas.
- [ ] Praktikan dan asisten melihat tindakan sesuai perannya.
- [ ] Loading, error, empty state, dan success state sudah dirancang.
- [ ] Form dan tombol nyaman digunakan dengan satu tangan.
- [ ] Informasi tanggal, waktu, sesi, dan status mudah dipindai.
- [ ] Rekap kehadiran dapat dibaca tanpa bergantung pada warna.

## 11. Ringkasan keputusan desain

| Elemen | Rekomendasi |
|---|---|
| Background | `#F6F8F4` |
| Surface | `#FFFFFF` |
| Teks utama | `#202522` |
| Graphite | `#171A1A` |
| Primary / lime | `#C4F15B` |
| Font | Inter |
| Radius card | 16 px |
| Radius tombol | 12–14 px |
| Padding card | 16 px |
| Gaya visual | Minimalis, clean, kontras terarah |
| Navigasi | Bottom navigation |
| Prioritas UX | Presensi cepat, status jelas, rekap mudah dibaca |

**Kesimpulan:** gunakan `#F6F8F4` sebagai background, `#FFFFFF` untuk surface, `#171A1A` untuk elemen graphite, dan `#C4F15B` sebagai aksen utama. Dengan penggunaan lime yang selektif, aplikasi akan terasa minimalis dan modern tanpa mengorbankan keterbacaan maupun fungsi presensi.
