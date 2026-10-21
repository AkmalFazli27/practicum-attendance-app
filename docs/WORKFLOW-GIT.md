# Workflow Git — practicum-attendance-app

Berlaku untuk seluruh sprint. Aturan pembagian tugas per sprint tidak ditulis di sini, melainkan di `docs/sprints/sprint-<n>.md`.

## 1. Prinsip Dasar

- `main` adalah branch yang **selalu dapat dijalankan dan didemokan**.
- Semua pekerjaan dilakukan pada branch fitur yang dibuat dari `main`.
- Satu pull request (PR) mewakili satu tiket/tugas.
- Programmer **tidak melakukan merge sendiri**. PM sprint berjalan yang me-review dan melakukan merge.
- Raih status hijau sebelum menambah pekerjaan baru: pastikan `main` tidak rusak akibat PR yang masuk.

## 2. Penamaan Branch

Format: `<tipe>/<topik-singkat>`

| Tipe | Kegunaan | Contoh |
| --- | --- | --- |
| `feat/` | Fitur baru | `feat/login-role-picker` |
| `fix/` | Perbaikan bug | `fix/presensi-double-tap` |
| `chore/` | Setup, konfigurasi, dependensi | `chore/setup-eas` |
| `docs/` | Dokumentasi | `docs/sprint-1-tasks` |

Gunakan huruf kecil dan tanda hubung. Hindari nama branch yang terlalu umum seperti `feat/update` atau `fix/bug`.

## 3. Alur Kerja Harian

```bash
# 1. Pastikan branch utama terbaru
git checkout main
git pull origin main

# 2. Buat branch fitur dari main
git checkout -b feat/nama-fitur

# 3. Kerjakan tugas, commit dalam potongan kecil
git add <file-yang-diubah>
git commit -m "feat: menambahkan form login"

# 4. Kirim branch ke GitHub
git push -u origin feat/nama-fitur

# 5. Buka Pull Request ke main melalui GitHub
```

Sebelum membuka PR, wajib:

```bash
npx tsc --noEmit
npx expo start --clear   # lalu uji alur yang diubah di Expo Go
```

## 4. Konvensi Commit

Format: `<tipe>: <ringkasan singkat>`

Tipe yang dipakai: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`.

Contoh:

- `feat: menambahkan filter sesi pada beranda praktikan`
- `fix: menonaktifkan tombol presensi setelah berhasil`
- `chore: menambahkan konfigurasi EAS preview`

Aturan:

- Satu commit mewakili satu perubahan logis.
- Gunakan kalimat perintah dan Bahasa Indonesia yang jelas.
- Jangan menggabungkan perubahan dokumentasi, fitur, dan perbaikan dalam satu commit bila tidak berkaitan.

## 5. Pull Request

### 5.1 Ketentuan

- Judul PR: ringkasan tugas, misalnya `feat: form login dan routing peran`.
- Deskripsi wajib memuat: ringkasan perubahan, ID tiket, cara menguji, dan bukti (screenshot/video).
- PR harus kecil dan dapat di-review dalam waktu singkat. Jika terlalu besar, pecah menjadi beberapa PR.
- Jangan mencampur pekerjaan orang lain dalam PR sendiri.
- Jangan menyentuh file di luar area tugas tanpa persetujuan pemilik area atau PM.

### 5.2 Alur review

1. Programmer membuka PR dan meminta review kepada PM.
2. PM memeriksa kode, menjalankan aplikasi, dan mencocokkan dengan kriteria terima tiket.
3. Jika ada perbaikan, PM memberi komentar; programmer memperbaiki pada branch yang sama dan melakukan push ulang.
4. Setelah disetujui, **PM melakukan squash merge** ke `main`.
5. Branch fitur dihapus setelah merge.
6. Semua anggota melakukan `git pull origin main` sebelum melanjutkan pekerjaan berikutnya.

### 5.3 Checklist review PM

- [ ] Aplikasi berjalan di Expo Go tanpa error.
- [ ] Perilaku sesuai kriteria terima tiket dan requirement PRD terkait.
- [ ] Perubahan status/state terlihat pada layar yang terkait.
- [ ] Tidak ada `console.log` sisa debugging.
- [ ] Tidak ada file rahasia (`.env`, kunci API) yang ikut ter-commit.
- [ ] Tidak mengubah file milik area lain tanpa alasan.
- [ ] Tampilan menggunakan flexbox dan tidak terpotong pada layar kecil.
- [ ] `npx tsc --noEmit` lolos.

## 6. Kepemilikan Area (Berlaku Antar-Sprint)

Pemetaan area ke orang berubah tiap sprint dan ditulis di dokumen sprint. Aturan umumnya:

- File bersama (`app.json`, `eas.json`, `src/data/`, `src/context/`, `README.md`) hanya diubah oleh PM sprint berjalan atau atas persetujuan PM.
- File komponen bersama (`src/components/ui/`) dimiliki pengembang yang ditugaskan pada sprint tersebut.
- File layar per peran dimiliki pengembang area peran tersebut.

Jika membutuhkan perubahan pada file milik orang lain: ajukan permintaan di grup, jangan mengedit langsung.

## 7. Menangani Konflik

1. Tarik `main` terbaru ke branch sendiri:

   ```bash
   git checkout feat/nama-fitur
   git fetch origin
   git rebase origin/main
   ```

2. Selesaikan konflik pada file yang benar-benar dipahami.
3. Jalankan aplikasi dan typecheck sebelum melanjutkan rebase:

   ```bash
   git rebase --continue
   npx tsc --noEmit
   ```

4. Jika ragu, hentikan rebase (`git rebase --abort`) dan minta bantuan PM.

**Dilarang:** `git push --force` ke `main`, menghapus branch orang lain, atau menimpa pekerjaan orang lain tanpa koordinasi.

## 8. Rilis dan Tag

- Setiap akhir sprint, PM membuat tag:

  ```bash
  git checkout main
  git pull origin main
  git tag -a v0.1-sprint1 -m "Sprint 1: antarmuka dan alur praktikum"
  git push origin v0.1-sprint1
  ```

- Penomoran: `v0.1-sprint1`, `v0.2-sprint2`, dan seterusnya. Rilis final menggunakan `v1.0`.
- Tag hanya dibuat setelah skenario demo sprint lolos dan `main` dapat dijalankan.

## 9. Handover PM Antar-Sprint

Pada akhir sprint, PM lama menyerahkan kepada PM baru:

1. `main` dalam kondisi hijau dan sudah diberi tag.
2. Papan tugas dibersihkan; tiket yang belum selesai dipindahkan ke sprint berikutnya.
3. PM baru berhasil menjalankan aplikasi di Expo Go dari hasil `git clone`/`git pull`.
4. Build EAS terakhir (jika ada) masih dapat diunduh.
5. Daftar blocker, utang teknis, dan keputusan tertunda dijelaskan.

## 10. Aturan Darurat

- Perbaikan yang harus segera masuk ke `main` (misalnya `main` tidak bisa dijalankan) tetap dibuat sebagai branch `fix/` dan PR singkat.
- PM boleh melakukan merge cepat tanpa menunggu review kedua, tetapi wajib mencatat alasannya di deskripsi PR.
- Jangan pernah membagikan token, kunci API, atau file `.env` melalui repository.
