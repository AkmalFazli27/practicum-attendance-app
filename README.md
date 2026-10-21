# practicum-attendance-app

Aplikasi mobile Sistem Informasi Praktikum. Satu aplikasi untuk asisten dan praktikan:

- **Asisten:** melihat jadwal, membuka sesi, memantau kehadiran, melihat rekap, menutup sesi.
- **Praktikan:** melihat jadwal, melakukan presensi saat sesi dibuka, melihat riwayat kehadiran.
- **Pengunjung:** melihat jadwal tanpa login; seluruh aksi diarahkan ke login.

Dibangun dengan Expo SDK 58, React Native, TypeScript, dan Expo Router.

## Status

**Sprint 1 — Antarmuka dan Alur Praktikum (berjalan).**

Saat ini repository berisi fondasi: navigasi dasar, data dummy, dan state global. Aplikasi belum memakai database; seluruh data hilang saat aplikasi ditutup.

## Menjalankan

```bash
npm install
npx expo start
```

Pindai QR dengan Expo Go di HP Android. Jika jaringan bermasalah, gunakan `npx expo start --tunnel`.

Pemeriksaan sebelum membuka pull request:

```bash
npx tsc --noEmit
npx expo start --clear
```

## Struktur

```text
src/
  app/                  # route Expo Router (satu file = satu layar)
  components/ui/        # komponen bersama
  context/              # state global sesi dan presensi
  data/                 # tipe dan data dummy
  utils/                # format tanggal dan jam
docs/
  PRD.md                # kebutuhan seluruh produk
  WORKFLOW-GIT.md       # aturan branch, PR, dan rilis
  SETUP.md              # setup repository, Expo, dan EAS
  sprints/              # tujuan, tugas, dan demo per sprint
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | Requirement lengkap seluruh sprint |
| [docs/WORKFLOW-GIT.md](docs/WORKFLOW-GIT.md) | Alur kerja Git dan review |
| [docs/SETUP.md](docs/SETUP.md) | Setup lokal, GitHub, dan EAS |
| [docs/sprints/sprint-1.md](docs/sprints/sprint-1.md) | Tugas dan jadwal sprint berjalan |

## Catatan

- EAS: `eas.json` sudah tersedia di repository. Jalankan `eas login` dan `eas init` sebelum membuat APK (lihat `docs/SETUP.md` §7).
- Nama tampilan aplikasi belum final.
- Data identitas, jadwal, dan sesi masih dummy.
