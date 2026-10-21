# TapIn

**Tap once. You're in.**

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

## Mulai untuk Programmer

1. Clone repository, lalu jalankan `npm install` dan `npx expo start`.
2. Baca `docs/PRD.md` (requirement), `docs/design.md` (tampilan), `docs/sprints/sprint-1.md` (jobdesk area), dan `docs/WORKFLOW-GIT.md` (alur PR).
3. Cek area kamu: Farras (P1 — shell, landing, login, UI kit), Eileen (P2 — asisten), Nouvella (P3 — praktikan).
4. Buat branch dari `main`, kerjakan area sendiri, lalu buka PR.
5. Jangan merge sendiri. Hanya PM yang menekan tombol merge.
6. Jika butuh komponen atau token dari area lain, minta ke pemilik area; jangan menduplikasi.

## Struktur

```text
src/
  app/                  # route Expo Router (satu file = satu layar)
  components/ui/        # komponen bersama
  context/              # state global sesi dan presensi
  data/                 # tipe dan data dummy
  theme/                # token desain + hook font
  utils/                # format tanggal dan jam
docs/
  PRD.md                # kebutuhan seluruh produk
  design.md             # token, navigasi, wireframe Sprint 1
  WORKFLOW-GIT.md       # aturan branch, PR, dan rilis
  SETUP.md              # setup repository, Expo, dan EAS
  sprints/              # jobdesk per area dan demo per sprint
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/PRD.md](docs/PRD.md) | Requirement lengkap seluruh sprint |
| [docs/design.md](docs/design.md) | Token, navigasi, wireframe, dan state Sprint 1 |
| [docs/ui-ux-design-system-graphite-lime.md](docs/ui-ux-design-system-graphite-lime.md) | Design system visual Graphite Lime |
| [docs/WORKFLOW-GIT.md](docs/WORKFLOW-GIT.md) | Alur kerja Git dan review |
| [docs/SETUP.md](docs/SETUP.md) | Setup lokal, GitHub, dan EAS |
| [docs/sprints/sprint-1.md](docs/sprints/sprint-1.md) | Jobdesk per area dan jadwal sprint berjalan |

## Catatan

- EAS: `eas.json` sudah tersedia di repository. Jalankan `eas login` dan `eas init` sebelum membuat APK (lihat `docs/SETUP.md` §7).
- Data identitas, jadwal, dan sesi masih dummy.
