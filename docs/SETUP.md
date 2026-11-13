# Setup — practicum-attendance-app

Panduan menyiapkan lingkungan pengembangan, repository GitHub, dan build EAS. Ditulis untuk PM yang baru pertama kali menyiapkan proyek.

## 1. Prasyarat

| Kebutuhan | Versi/disarankan | Catatan |
| --- | --- | --- |
| Node.js | 20 atau lebih baru | Cek dengan `node -v` |
| npm | Mengikuti Node | Cek dengan `npm -v` |
| Git | Terbaru | Cek dengan `git --version` |
| Expo Go | Versi terbaru | Pasang di HP Android dari Play Store |
| Akun Expo | Gratis | Daftar di https://expo.dev |
| Akun GitHub | Gratis | Untuk repository dan pull request |

Tidak perlu memasang Android Studio atau Android SDK untuk pengembangan harian dan build APK, karena build dilakukan di cloud melalui EAS.

## 2. Kondisi Repository Saat Ini

Repository sudah berisi fondasi Sprint 1:

- Expo SDK 58 dengan TypeScript.
- Expo Router dengan direktori route `src/app/`.
- Alias import `@/*` yang mengarah ke `src/*`.
- Deep link scheme `practicum-attendance-app` dan typed routes aktif.
- Data dummy di `src/data/dummy.ts`.
- State global di `src/context/SessionContext.tsx`.
- Skeleton landing dan login.
- Dokumentasi di `docs/`.

Dependensi yang sudah terpasang: `expo-router`, `react-native-safe-area-context`, `react-native-screens`, `expo-linking`, `expo-constants`, `expo-status-bar`.

## 3. Menjalankan Proyek

```bash
git clone <URL_REPOSITORY>
cd practicum-attendance-app
npm install
npx expo start
```

Pindai QR yang muncul menggunakan aplikasi Expo Go di HP. HP dan laptop harus berada di jaringan yang sama. Jika jaringan kampus memblokir koneksi, gunakan hotspot HP atau jalankan `npx expo start --tunnel`.

Perintah harian:

```bash
npx expo start --clear   # bersihkan cache Metro jika ada perubahan aneh
npx tsc --noEmit         # typecheck sebelum membuka PR
npx expo-doctor          # periksa kesehatan dependensi
```

## 4. Membuat Repository GitHub (Sekali Saja)

Jika repository belum ada di GitHub:

1. Buka https://github.com/new.
2. Nama repository: `practicum-attendance-app`.
3. **Jangan** centang "Add a README file", `.gitignore`, atau license (proyek sudah punya).
4. Buat repository, lalu dari folder proyek jalankan:

   ```bash
   git remote add origin https://github.com/<username>/practicum-attendance-app.git
   git push -u origin main
   ```

Jika `origin` sudah ada dan URL-nya salah:

```bash
git remote set-url origin https://github.com/<username>/practicum-attendance-app.git
```

## 5. Mengundang Kolaborator

1. Buka repository → **Settings** → **Collaborators**.
2. Klik **Add people**, masukkan username GitHub ketiga anggota.
3. Pilih akses **Write** (cukup untuk membuat branch dan pull request, tidak untuk mengubah pengaturan repository).

## 6. Melindungi Branch `main`

Dilakukan oleh PM pemilik repository:

1. **Settings** → **Branches** → **Add branch protection rule** (atau **Rulesets** pada tampilan GitHub terbaru).
2. Target branch: `main`.
3. Aktifkan **Require a pull request before merging**.
4. Aktifkan **Require approvals** minimal 1.
5. Pastikan force push dan delete branch dilarang.
6. Simpan.

Dengan aturan ini, programmer tidak dapat melakukan push langsung ke `main`. Hanya PM yang menekan tombol merge; ini aturan tim yang ditegaskan di `docs/WORKFLOW-GIT.md`. Proteksi saat ini mewajibkan PR tanpa approval, sehingga tombol merge tetap tersedia bagi kolaborator dan kepatuhan bergantung pada aturan tim.

Catatan: pada repository milik akun personal, GitHub tidak menyediakan pembatasan tombol merge per pengguna. Untuk enforcement keras, repository perlu dipindahkan ke GitHub Organization dan memakai push restriction.

## 7. Menyiapkan EAS

EAS dipakai untuk membuat APK demo. Langkah ini membutuhkan akun Expo.

```bash
npx eas-cli@latest login          # masuk dengan akun Expo
npx eas-cli@latest init           # menghubungkan proyek ke akun Expo, membuat projectId
npx eas-cli@latest build:configure
```

File `eas.json` sudah tersedia di repository dengan profil `development`, `preview`, dan `production`. Jika file tersebut hilang, buat ulang dengan isi berikut:

```json
{
  "cli": {
    "version": ">= 16.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

Membuat APK demo:

```bash
npx eas-cli@latest build -p android --profile preview
```

Profil `preview` menghasilkan APK yang dapat dibagikan langsung. Build pertama biasanya memerlukan antrean 10–30 menit, jadi jangan menunggu hingga hari demo.

Catatan:

- `eas init` menambahkan `extra.eas.projectId` ke `app.json`. Perubahan ini harus di-commit.
- Jangan pernah meng-commit token Expo, kunci API, atau file `.env`.
- Build production final menggunakan `npx eas-cli@latest build -p android --profile production`.

## 8. Struktur Folder

```text
practicum-attendance-app/
  src/
    app/                  # route Expo Router (setiap file = layar)
      _layout.tsx         # root layout + SessionProvider
      index.tsx           # landing (skeleton)
      login.tsx           # login (skeleton)
    components/
      ui/                 # komponen bersama (badge, tombol, modal)
    context/
      SessionContext.tsx  # state global + aksi sesi dan presensi
    data/
      dummy.ts            # tipe dan data dummy
    theme/
      tokens.ts           # token desain
    utils/
      format.ts           # format tanggal dan jam
  docs/
    PRD.md
    DESIGN.md
    ui-ux-design-system-graphite-lime.md
    WORKFLOW-GIT.md
    SETUP.md
    sprints/
      sprint-1.md
      sprint-2.md
      sprint-3.md
      sprint-4.md
  .github/
    pull_request_template.md
  app.json
  eas.json                # profil build EAS (sudah tersedia)
  package.json
  tsconfig.json
```

Aturan: folder `src/app/` hanya berisi route. Komponen, hook, dan utilitas disimpan di luar `src/app/`.

## 9. Konfigurasi yang Sudah Ada

`package.json`:

```json
{
  "main": "expo-router/entry"
}
```

`app.json` (bagian penting):

```json
{
  "expo": {
    "scheme": "practicum-attendance-app",
    "plugins": ["expo-router", "expo-status-bar"],
    "experiments": { "typedRoutes": true }
  }
}
```

`tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## 10. Troubleshooting

| Masalah | Penyebab umum | Solusi |
| --- | --- | --- |
| Expo Go menolak membuka proyek | Versi Expo Go tidak cocok dengan SDK 58 | Perbarui Expo Go dari Play Store |
| Perubahan tidak muncul | Cache Metro | `npx expo start --clear` |
| HP tidak dapat terhubung | Jaringan berbeda/diblokir | Satu jaringan, atau `npx expo start --tunnel` |
| `Unable to resolve module @/...` | Alias belum terbaca | Pastikan `tsconfig.json` benar, restart dengan `--clear` |
| Build EAS gagal karena versi | Dependensi tidak kompatibel | `npx expo install --fix` lalu ulangi build |
| `npm install` gagal | Node terlalu lama | Gunakan Node 20+ |
| `npm install` gagal `ERESOLVE` react/react-dom | `react-dom` 19.3.1 menuntut React 19.3.1 | Pastikan `react-dom@19.3.0` ada di `package.json`; jangan memakai `--force` |
| Layar putih setelah mengubah route | File route salah nama/posisi | Pastikan file berada di `src/app/` dan ada `_layout.tsx` |

## 11. Referensi

- Expo Router: https://docs.expo.dev/router/introduction/
- Expo SDK 58: https://docs.expo.dev/versions/v58.0.0/
- EAS Build: https://docs.expo.dev/build/introduction/
- Panduan agen Expo (jika memakai AI): lihat `AGENTS.md` di root proyek.


---

## 12. Kelanjutan Setup Sprint 2 — Firebase & API Model AI

Bagian ini melanjutkan panduan setup Sprint 1 di atas untuk kebutuhan **Sprint 2 (Firebase Authentication, Cloud Firestore, & API Model AI)**.

### 12.1 Menyiapkan Proyek Firebase di Console

1. Buka [Firebase Console](https://console.firebase.google.com) dan buat proyek baru (mis. `tapin-practicum-attendance`).
2. Daftarkan aplikasi **Web (`</>`)** pada Project Overview untuk memperoleh objek `firebaseConfig` (digunakan secara universal oleh Firebase JS SDK di Android Expo Go, iOS, dan Web).
3. Aktifkan **Build → Authentication → Sign-in method → Email/Password**.
4. Aktifkan **Build → Firestore Database → Create database** dengan Database ID `(default)` dan lokasi `asia-southeast2 (Jakarta)`.
5. Buka tab **Firestore Database → Rules**, salin seluruh isi file `firestore.rules` di root proyek, lalu klik **Publish**.

### 12.2 Mengatur File `.env` Lokal

1. Salin template `.env.example` menjadi `.env` di root proyek:
   ```bash
   cp .env.example .env
   ```
2. Isi variabel konfigurasi Firebase dan API Model AI pada `.env`:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...

   EXPO_PUBLIC_AI_API_URL=...
   EXPO_PUBLIC_AI_API_KEY=...
   ```
3. Setiap kali mengubah isi `.env`, jalankan ulang server Expo dengan membersihkan cache Metro:
   ```bash
   npx expo start --clear
   ```
4. **Penting:** File `.env` sudah terdaftar di `.gitignore`. Jangan pernah melakukan commit file `.env` ke repository GitHub.
