Sprint 3 — Presensi Berbasis Lokasi, Maps, dan Push Notification
PM: Nouvella, Programmer: P1 Farras, P2 Akmal, P3 Eileen Periode: Rabu, 18 November 2026 (H+0) — Minggu, 22 November 2026 pukul 23.59 (H+4) Acuan requirement (SRS): docs/PRD.md (FR-01 s.d. FR-18) + Spesifikasi Sprint 3 (FR-19 s.d. FR-25) + Perbaikan Sprint 2 (PB-01 s.d. PB-06) Acuan desain: docs/DESIGN.md + docs/DESIGN-SPRINT3.md Status: Berjalan
Dokumen ini mengatur pembagian area dan hasil yang harus dicapai. Requirement tetap di PRD; keputusan visual tetap di docs/DESIGN.md. Setiap orang bebas menentukan urutan dan cara kerja di dalam areanya, selama kriteria terima terpenuhi.
1. Tujuan Sprint
Mengembangkan TapIn agar presensi mempertimbangkan lokasi fisik praktikan, menampilkan peta laboratorium beserta aktivitas praktikumnya, dan memberi push notification pada peristiwa penting. Sprint ini juga memperbaiki beberapa UI dan logika dari Sprint 2.
Tiga alur yang harus dapat didemonstrasikan:
1.  Presensi Berbasis Lokasi: Asisten membuka sesi → praktikan membuka halaman presensi → aplikasi memeriksa lokasi dan radius lab → presensi dicatat bila semua ketentuan terpenuhi → asisten melihat rekap.
2.  Peta dan Informasi Lab: Pengguna membuka Peta → melihat posisi sendiri dan marker lab → memilih marker → melihat praktikum yang sedang berlangsung dan berikutnya dari Firestore.
3.  Notifikasi Kegiatan: Asisten membuka sesi, mengubah jadwal, atau memutuskan izin → sistem mendeteksi peristiwa → push notification terkirim ke pengguna terkait.
2. Sumber Requirement (SRS)
2.1 Butir SRS yang dikerjakan
Butir
Kebutuhan
Area utama
FR-19
Halaman Presensi terpisah dari detail sesi (opsional: QR Code)
P1
FR-20
Validasi lokasi dan waktu sesi sebagai bagian pencatatan presensi
PM (markAttendance) + P1 (antarmuka hasil)
FR-21
Pengelolaan lokasi dan radius lab oleh asisten, disimpan di Firestore
PM (skema, updateLab) + P2 (layar Kelola Lab)
FR-22
Peta lab interaktif: marker lab, marker pengguna live, info marker
P2
FR-23
Informasi aktivitas lab (berlangsung dan berikutnya, real-time)
P2 (tampilan) + PM (data)
FR-24
Push notification: sesi dibuka, jadwal berubah, izin diterima/ditolak
PM (pengiriman) + P1 (klien)
FR-25
Penanganan izin dan kondisi perangkat
PM (service lokasi) + P1/P2/P3 (state UI)
PB-01
Perbaikan password dan register asisten
P2 (form) + PM (bila bug di context)
PB-02
Perbaikan klasifikasi AI
PM (ai.ts) + P1 (tampilan praktikan) + P3 (badge asisten)
PB-03
Rekap dua level: pilih matkul dulu, lalu daftar praktikan
P3
PB-04
Perbaikan input jam dan tanggal pada form sesi
P3 (pemilih tanggal dan jam sendiri)
PB-05
Sesi yang sudah ditutup (manual atau otomatis) tidak dapat dibuka lagi
PM (guard) + P3 (UI)
PB-06
Pembatasan waktu sesi: hanya dapat dibuka pada jadwalnya dan otomatis dianggap selesai setelah jam selesai
PM (aturan di context) + P1 (UI praktikan) + P3 (UI asisten) + P2 (sheet Peta)
2.2 Keputusan Aturan Bisnis yang Berubah
• PB-05 mengubah aturan Sprint 1: Buka Lagi pada sesi SELESAI tidak lagi diizinkan. Fungsi reopenSession menolak dengan hasil SESI_SUDAH_DITUTUP; tombolnya dinonaktifkan atau dihapus di UI. Berlaku untuk penutupan manual maupun otomatis (PB-06).
• Mekanisme push: Expo Push Service (aplikasi memanggil Expo Push API saat peristiwa terjadi), tanpa backend kustom. Push notification tidak dijamin berjalan di Expo Go, sehingga Sprint ini memakai development build EAS.
• Validasi radius dilakukan di aplikasi (Firestore transaction), karena Security Rules tidak praktis untuk menghitung jarak. Rules menjaga status sesi dan kepemilikan.
• PB-06 menambah batas waktu sesi: sesi hanya dapat dibuka pada rentang jadwalnya (contoh jadwal 08.00–09.00: baru dapat dibuka mulai 08.00) dan dianggap SELESAI otomatis setelah jam selesai (pukul 09.01 presensi pasti ditolak). Status dihitung dari waktu lewat getStatusEfektif dan dipakai semua layar; penolakan dilakukan di openSession dan markAttendance, bukan hanya dengan menonaktifkan tombol. Zona waktu WIB. Presensi diterima sampai tepat jam selesai. Asisten boleh menutup sesi lebih awal, tetapi sesi yang sudah ditutup tidak dapat dibuka lagi.
• Batasan teknis PB-06: tanpa backend, field status di Firestore tidak berubah sendiri pada jam selesai; yang berubah adalah status efektif hasil perhitungan waktu. Layar yang menampilkan sesi memeriksa waktu secara berkala (misalnya tiap menit).
2.3 Di luar Sprint 3
• Pendeteksian lokasi palsu (fake GPS); dicatat sebagai batasan.
• Backend kustom dan Cloud Functions.
• Rute/navigasi (directions) ke lab.
• Ekspor laporan PDF/CSV/Excel.
• QR Code bersifat opsional, dikerjakan hanya bila seluruh butir wajib selesai.
Jangan menambah dependensi atau fitur di luar daftar ini tanpa persetujuan PM.
3. Pembagian Area dan Kepemilikan File
Area
Kode
Pemilik
File utama
Fondasi data, lokasi, notifikasi (pengiriman), rules, config, rilis
PM
Nouvella
src/context/**, src/services/**, src/hooks/useLocation.ts, src/utils/**, src/data/**, firestore.rules, app.json, eas.json, package.json, package-lock.json, .env.example, README.md, docs/**
Shell, UI kit, area praktikan, notifikasi klien
P1
Farras
src/app/_layout.tsx, src/components/ui/** (termasuk barrel index.ts), src/theme/**, src/app/(praktikan)/**, src/components/praktikan/**, docs/DESIGN-SPRINT3.md, src/hooks/useNotifications.ts
Peta, Kelola Lab, autentikasi
P2
Akmal
src/app/peta.tsx, src/app/kelola-lab.tsx, src/components/peta/**, src/app/login.tsx, src/app/index.tsx
Area asisten
P3
Eileen
src/app/(asisten)/**, src/components/asisten/**
Aturan kepemilikan:
1.  Selain pemilik, jangan mengedit file area lain. Butuh perubahan? Ajukan ke pemilik area atau PM.
2.  Pengecualian tunggal: PR skeleton Farras (§5) boleh menyentuh _layout.tsx, AppHeader, stub layar baru, dan satu tombol "Kelola Lab" di folder (asisten). PR ini di-merge sebelum yang lain membuat branch kerja.
3.  package.json, package-lock.json, app.json, dan eas.json hanya diubah PM. Butuh paket baru? Minta ke PM. Pada H+0 PM memasang semua paket sekaligus (maps, location, notifications).
4.  Komponen UI baru dari area lain dibuat di folder areanya sendiri (misalnya components/peta/**), bukan di components/ui/**.
5.  Peta bukan tab. Aksesnya lewat ikon di AppHeader, sehingga layout tab asisten dan praktikan tidak disentuh.
4. Kontrak useSession() Sprint 3
Kontrak dibekukan pada H+0 dan di-merge ke main (isi boleh stub). Perubahan setelah itu hanya boleh dilakukan dengan: (1) pengumuman di grup sebelum merge, (2) pencatatan di dokumen ini atau PRD, (3) pemilik layar menyesuaikan.
labs: Lab[]                        // { id, nama, alamat, lat, lng, radius }
updateLab(labId, { lat, lng, radius })
savePushToken(token)               // menyimpan token ke users/{uid}
getStatusEfektif(sesi)             // "TERJADWAL" | "DIBUKA" | "SELESAI", dihitung dari waktu (WIB)
openSession(sesiId)                // hasil: { ok: true } atau { ok: false, alasan }
//   alasan: "BELUM_WAKTUNYA" | "WAKTU_HABIS" | "SESI_SUDAH_DITUTUP"
markAttendance(sesiId, koordinat)  // koordinat: { lat, lng, akurasi }
// hasil: { ok: true, jarak } atau { ok: false, alasan }
// alasan: "LUAR_RADIUS" | "SUDAH_PRESENSI" | "SESI_TIDAK_DIBUKA"
//       | "SESI_SUDAH_DITUTUP" | "BELUM_WAKTUNYA" | "WAKTU_HABIS"
//       | "KOORDINAT_TIDAK_ADA" | "JARINGAN"
reopenSession(sesiId)              // menolak bila sesi pernah ditutup: "SESI_SUDAH_DITUTUP"
Skema: koleksi labs baru; sesi memiliki field labId; dokumen kehadiran menyimpan lat, lng, dan jarak; users/{uid} menyimpan pushToken.
Perubahan kontrak (Kamis, 19 November): PB-06 menambah fungsi getStatusEfektif dan alasan BELUM_WAKTUNYA serta WAKTU_HABIS pada openSession dan markAttendance. Perubahan diumumkan di grup sebelum merge.
Lab dan utilitas waktu: hanya ada empat lab (lab-ap, lab-b, lab-c, lab-d); field Lab pada form sesi berupa dropdown dari labs, bukan ketik bebas. src/utils/statusSesi.ts (milik PM) berisi getStatusEfektif, sudahMulai, dan validasiJadwal. Form sesi memanggil validasiJadwal sebelum menyimpan, dan createSession serta updateSession memanggilnya lagi sebagai pengaman kedua.
5. Jobdesk per Area
Setiap area memiliki hasil, kriteria terima, dan batas. Cara mencapai hasil diserahkan kepada pemilik area.
5.1 PM — Nouvella — Fondasi Data, Lokasi, Notifikasi, dan Rilis
Hasil yang harus ada:
1.  Skema labs, field labId di sesi, seed empat lab (Lab AP, Lab B, Lab C, Lab D), dan tipe data baru.
2.  Kontrak useSession() Sprint 3 (§4) di-merge pada H+0.
3.  markAttendance dengan validasi lokasi dan guard reopenSession (PB-05), serta aturan waktu sesi (PB-06): validasi jam mulai dan selesai dan fungsi getStatusEfektif.
4.  src/services/location.ts dan src/hooks/useLocation.ts: izin, koordinat, watchPosition, jarak Haversine, status (izin ditolak, GPS mati, koordinat belum ada).
5.  src/services/notifications.ts: pengiriman notifikasi ditargetkan dan trigger pada openSession, updateSession (jadwal berubah), dan reviewIzin.
6.  Perbaikan ai.ts (PB-02) dan, bila bug register ada di context, register() (PB-01).
7.  firestore.rules diperbarui.
8.  app.json, eas.json (profil development build), .env.example, dan semua paket terpasang.
9.  Review dan merge PR, uji dua perangkat, APK preview, tag v0.3-sprint3.
Kriteria terima:
[ ] Semua paket terpasang di H+0 dan ketiga programmer dapat menjalankan development build.
[ ] Development build EAS tersedia paling lambat H+1 agar peta dan notifikasi dapat diuji.
[ ] markAttendance menolak presensi bila sesi tidak DIBUKA, sesi sudah ditutup, koordinat tidak ada, jarak melebihi radius, atau pengguna sudah presensi; hanya presensi yang lolos semua syarat yang dicatat.
[ ] Dokumen kehadiran menyimpan koordinat dan jarak; validasi berjalan dalam transaction.
[ ] reopenSession menolak sesi yang sudah SELESAI dengan alasan SESI_SUDAH_DITUTUP.
[ ] Notifikasi ditargetkan: sesi dibuka dan jadwal berubah hanya ke praktikan pada kelas sesi tersebut; keputusan izin hanya ke praktikan pengaju.
[ ] Kegagalan pengiriman notifikasi tidak membuat aksi utama (buka sesi, ubah jadwal, keputusan izin) gagal, dan mengembalikan status agar UI dapat menampilkan Toast.
[ ] firestore.rules: hanya asisten yang dapat mengubah labs; praktikan hanya dapat menulis kehadiran miliknya pada sesi DIBUKA.
[ ] AI tetap hanya sebagai informasi pendukung; tidak ada logika yang memutuskan izin otomatis.
[ ] Tag v0.3-sprint3 dibuat setelah tiga alur demo lolos.
[ ] PB-06: openSession menolak sebelum jam mulai (BELUM_WAKTUNYA) dan setelah jam selesai (WAKTU_HABIS); markAttendance menolak setelah jam selesai. Presensi diterima sampai tepat jam selesai.
[ ] PB-06: getStatusEfektif menghitung status dari waktu (WIB); sesi yang melewati jam selesai dianggap SELESAI walau field di Firestore masih DIBUKA, dan semua layar memakai fungsi ini.
[ ] PB-06: pengecekan waktu di markAttendance memakai waktu server Firestore bila memungkinkan; bila tidak, dicatat sebagai batasan.
[ ] Sesi yang ditutup lebih awal oleh asisten tidak dapat dibuka lagi.
[ ] validasiJadwal menolak format tanggal atau jam yang salah dan jam selesai yang tidak setelah jam mulai; dipanggil oleh form sesi dan oleh createSession serta updateSession.
[ ] markAttendance menolak dengan alasan jelas bila sesi belum terhubung ke lab (labId kosong).
Butir SRS terkait: FR-20, FR-21, FR-23, FR-24, FR-25, PB-01, PB-02, PB-05, PB-06.
Batas: PM tidak mengambil alih layar P1, P2, atau P3. Perubahan di file area programmer diminta ke pemiliknya.
5.2 P1 — Farras — Shell, UI Kit, dan Area Praktikan
Hasil yang harus ada:
1.  PR skeleton (H+1): rute baru peta, kelola-lab, presensi/[id]; ikon Peta di AppHeader; stub layar baru; satu baris pemanggilan useNotifications() di _layout.tsx; tombol “Kelola Lab” di area asisten; skeleton PermissionBanner, LokasiStatusCard, dan StatusIzinPerangkat dengan props final.
2.  Styling final komponen baru dan token warna status (di dalam radius, di luar radius, GPS mati) di src/theme/**.
3.  Halaman Presensi terpisah: info sesi, status sesi, tombol presensi, hasil pemeriksaan lokasi.
4.  Tampilan AI pada form izin praktikan (PB-02): badge kategori dan penanda fallback.
5.  Notifikasi klien: src/hooks/useNotifications.ts, dipanggil dari _layout.tsx.
6.  PB-06 sisi praktikan: tombol presensi dan label status mengikuti getStatusEfektif.
7.  Profil praktikan memakai StatusIzinPerangkat.
8.  docs/DESIGN-SPRINT3.md: tampilan komponen baru dan state lokasi.
Kriteria terima:
[ ] Halaman Presensi berada di src/app/(praktikan)/presensi/[id].tsx; tombol Presensi di beranda dan detail sesi mengarah ke halaman ini.
[ ] Halaman Presensi menampilkan nama praktikum, kelas, lab, waktu, status sesi, jarak ke lab, serta status di dalam atau di luar radius.
[ ] Layar memanggil markAttendance dan tidak menghitung jarak sendiri.
[ ] Setiap hasil alasan punya pesan Bahasa Indonesia yang jelas; ada state khusus untuk izin lokasi ditolak, GPS mati, koordinat belum ada, dan jaringan terputus.
[ ] Tombol presensi nonaktif permanen setelah berhasil dan menampilkan loading saat proses.
[ ] Badge AI tampil pada status izin praktikan, termasuk penanda bila klasifikasi tidak tersedia.
[ ] Semua komponen memakai token, tanpa hex langsung; barrel components/ui/index.ts hanya diubah Farras.
[ ] Skeleton di-merge H+1, sebelum layar final.
[ ] Aplikasi tidak crash bila izin lokasi atau notifikasi ditolak.
[ ] useNotifications() meminta izin notifikasi, mendaftarkan token lewat savePushToken, menangani notifikasi yang masuk dan diketuk (menuju sesi terkait), dan memberi informasi jelas bila izin ditolak. Bentuk hook (tanpa parameter) tidak diubah setelah PR skeleton. Hook tidak menulis ke Firestore sendiri.
[ ] PB-06: tombol presensi berubah nonaktif otomatis saat jam selesai tanpa reload manual, dengan label “Sesi belum dimulai” atau “Waktu presensi telah berakhir”; status dibaca dari getStatusEfektif, bukan dari field status langsung.
Butir SRS terkait: FR-19, FR-20 (antarmuka), FR-24, FR-25, PB-02, PB-06.
Batas: Farras tidak mengubah src/context, src/services, area asisten (kecuali tombol di PR skeleton), peta.tsx, atau kelola-lab.tsx.
5.3 P2 — Akmal — Peta, Kelola Lab, dan Autentikasi
Hasil yang harus ada:
1.  Halaman Peta (src/app/peta.tsx): marker lab, marker lokasi pengguna yang bergerak, dan sheet informasi lab saat marker dipilih.
2.  Halaman Kelola Lab (src/app/kelola-lab.tsx) khusus asisten: pilih titik di peta atau "gunakan lokasi saat ini", isi radius, simpan lewat updateLab. Komponen LokasiPicker di components/peta/**.
3.  Perbaikan login dan register asisten (PB-01).
Kriteria terima:
[ ] Setiap lab ditampilkan sebagai marker; marker pengguna diperbarui mengikuti perubahan lokasi selama halaman terbuka dan berhenti memantau saat halaman ditutup.
[ ] Memilih marker membuka sheet berisi praktikum yang sedang berlangsung dan praktikum berikutnya (nama praktikum, kelas, waktu, status sesi) dari data sesi real-time.
[ ] Perubahan jadwal atau status sesi langsung tercermin pada sheet tanpa reload; ada empty state bila lab tidak punya kegiatan.
[ ] Peta menangani izin lokasi ditolak, GPS mati, koordinat belum tersedia, dan jaringan terputus dengan pesan yang jelas; marker lab tetap tampil walau lokasi pengguna tidak ada.
[ ] Kelola Lab hanya dapat dibuka asisten (guard peran); koordinat dan radius divalidasi (radius lebih dari 0, koordinat valid) sebelum disimpan ke Firestore.
[ ] Data lab yang disimpan langsung dipakai oleh validasi presensi dan peta pengguna lain.
[ ] PB-01: pendaftaran asisten berhasil dengan validasi password yang jelas dan profil tersimpan di users/{uid} dengan peran benar; login mengarahkan ke /beranda-asisten.
[ ] Kegagalan autentikasi tampil dengan pesan Bahasa Indonesia tanpa crash.
[ ] PB-06: status praktikum pada sheet Peta dibaca dari getStatusEfektif, sehingga sesi yang melewati jam selesai langsung tampil SELESAI tanpa reload.
Butir SRS terkait: FR-21, FR-22, FR-23, FR-25, PB-01, PB-06.
Batas: Akmal tidak mengubah components/ui/**, _layout.tsx, src/hooks/useLocation.ts, atau layar praktikan dan asisten. Hook lokasi dipakai, tidak dibuat ulang. Bila bug register ada di SessionContext, laporkan ke PM dan kerjakan form sebagai PR terpisah.
5.4 P3 — Eileen — Area Asisten
Hasil yang harus ada (urutan: perbaikan lebih dulu):
1.  PB-04: perbaikan jam dan tanggal pada SesiFormSheet, memakai pemilih tanggal dan jam buatan sendiri di components/asisten/** (bukan komponen bersama).
2.  PB-03: Rekap dua level.
3.  PB-05: tombol Buka Lagi dinonaktifkan atau dihapus untuk sesi SELESAI.
4.  PB-06 sisi asisten: tombol Buka nonaktif sebelum jam mulai dengan keterangan “Bisa dibuka pukul 08.00”; status dan tombol mengikuti getStatusEfektif.
5.  Field Lab pada form sesi, jarak presensi pada rekap dan daftar hadir.
6.  Badge klasifikasi AI pada panel izin asisten (PB-02).
7.  Profil asisten memakai StatusIzinPerangkat.
Kriteria terima:
[ ] Input tanggal dan jam tervalidasi (format benar, jam selesai setelah jam mulai, tanggal wajar) sebelum disimpan, dengan pesan error jelas. Pemilih tanggal dan jam dibuat di components/asisten/**, tanpa menunggu komponen bersama.
[ ] Rekap menampilkan daftar praktikum terlebih dahulu; memilih satu praktikum menampilkan daftar praktikan, nama, waktu, jarak presensi, dan status izin; ada tombol kembali.
[ ] Rekap memiliki loading, empty, dan error state.
[ ] Sesi SELESAI tidak menampilkan tombol Buka Lagi aktif; layar membaca hasil SESI_SUDAH_DITUTUP dari context dan menampilkan Toast bila ditolak.
[ ] PB-06: tombol Buka nonaktif sebelum jam mulai dan menampilkan jam bukanya; setelah jam selesai status berubah menjadi SELESAI tanpa reload; penolakan BELUM_WAKTUNYA atau WAKTU_HABIS dari context tampil lewat Toast. Asisten boleh menutup sesi lebih awal, tetapi sesi yang sudah ditutup tidak dapat dibuka lagi.
[ ] Form sesi memiliki pilihan Lab dari useSession().labs dan menyimpan labId.
[ ] Panel izin asisten menampilkan alasan dan badge kategori AI (atau penanda bila tidak tersedia); keputusan Terima/Tolak tetap dari klik asisten.
[ ] Aksi buka sesi, ubah jadwal, dan keputusan izin menampilkan Toast bila notifikasi gagal terkirim.
Butir SRS terkait: FR-21, FR-23, FR-24, FR-25, PB-02, PB-03, PB-04, PB-05, PB-06.
Batas: Eileen tidak mengubah _layout.tsx, components/ui/**, area praktikan, atau peta.tsx dan kelola-lab.tsx.
6. Dependensi dan Urutan Integrasi
Urutan
Pekerjaan
Area
Prasyarat
1
Paket terpasang, kontrak useSession() (stub), skema labs, app.json
PM
—
2
Development build EAS pertama
PM
Urutan 1
3
PR skeleton (rute, stub, ikon Peta, skeleton komponen, pemanggilan hook)
P1
Urutan 1
4
Perbaikan Sprint 2 sebagai PR fix:
P2, P3 (+ PM untuk guard dan AI)
Urutan 3
5
Peta dan Presensi dengan data stub
P2, P1
Urutan 3
6
markAttendance asli, useLocation, notifikasi pengiriman, aturan waktu sesi (PB-06)
PM
Urutan 1
7
Kelola Lab (P2), field Lab di form sesi (P3), notifikasi klien (P1)
P1, P2, P3
Urutan 4–6
8
Rekap dengan jarak, badge AI, profil
P3, P1
Urutan 6
9
firestore.rules, integrasi dua perangkat, gladi demo, tag rilis
PM + semua
Urutan 4–8
Ketergantungan yang dijembatani stub:
• Semua layar bergantung pada kontrak useSession(); sampai logika asli selesai, context mengembalikan data dummy dan hasil tetap.
• P2 dan P3 memakai tampilan sementara di area masing-masing sampai skeleton P1 di-merge.
• Presensi (P1) diuji dengan hasil stub (ok, LUAR_RADIUS, dan lainnya) untuk semua state.
• Tombol Buka Lagi (P3) langsung dinonaktifkan selama guard belum asli.
• Tombol Buka (P3) dan tombol presensi (P1) memakai stub getStatusEfektif sampai logika asli selesai.
• P3 membuat pemilih tanggal dan jam sendiri di folder asisten, sehingga tidak menunggu komponen bersama dari P1.
7. Aturan Kerja per Area
1.  Kepemilikan file (§3) ditaati; file bersama milik PM atau pemilik yang tercantum.
2.  Tampilan sementara boleh, duplikasi tidak. Gunakan komponen UI bersama setelah di-merge sebelum PR di-merge.
3.  Satu PR = satu pekerjaan koheren. Perbaikan memakai judul fix: dan dikerjakan sebelum fitur baru di layar yang sama.
4.  Judul PR memakai konvensi commit (feat:, fix:, chore:, docs:). Deskripsi memuat area, FR/PB terkait, cara menguji, serta screenshot atau video.
5.  PM me-review dan merge. Programmer tidak merge sendiri. Merge memakai merge commit biasa, bukan squash.
6.  Kontrak dibekukan. Perubahan kontrak diumumkan di grup sebelum merge dan dicatat.
7.  Standup async setiap pagi: selesai, dikerjakan hari ini, hambatan. Blocker lebih dari 2 jam harus disampaikan.
8.  Keamanan kredensial. Jangan commit .env atau API key. Gunakan .env.example.
9.  AI hanya pendukung keputusan. Status izin tidak pernah ditentukan otomatis oleh AI.
10.  Tidak ada fitur di luar SRS. Ide baru dicatat dan diajukan ke PM.
11.  Definition of Done setiap PR: berjalan di development build tanpa crash, sesuai FR/PB dan docs/DESIGN.md, menangani state loading/empty/error, tidak ada hex di luar tokens.ts, npx tsc --noEmit lolos, dan di-merge ke main.
8. Jadwal
Hari
Tanggal
Fokus
H+0
Rabu, 18 Nov
PM: paket terpasang, kontrak useSession() (stub), skema labs, app.json, mulai development build; kontrak ditambah getStatusEfektif serta alasan BELUM_WAKTUNYA dan WAKTU_HABIS (PB-06)
H+1
Kamis, 19 Nov
PM: merge kontrak dan development build, mulai markAttendance dan useLocation. P1: PR skeleton, lalu halaman Presensi. P2: PB-01 dan peta dasar. P3: PB-04 dan PB-03
H+2
Jumat, 20 Nov
PM: notifikasi pengiriman, guard PB-05 dan PB-06, ai.ts. P1: state error lokasi, tampilan AI, useNotifications, label status waktu sesi (PB-06). P2: sheet aktivitas lab, LokasiPicker. P3: PB-05 dan PB-06 UI, badge AI
H+3
Sabtu, 21 Nov
P2: Kelola Lab. P3: field Lab, jarak di rekap, profil. P1: profil, penyelarasan UI. PM: firestore.rules, uji dua perangkat, APK preview
H+4
Minggu, 22 Nov
Hentikan fitur baru; integrasi, gladi tiga alur, perbaikan kecil, tag v0.3-sprint3. Batas akhir: pukul 23.59
Irama harian:
• Pagi: git pull origin main, lalu standup async.
• Siang: PR sudah dibuka agar PM dapat me-review sore.
• Sore/malam: PM review dan merge; pemilik area memperbaiki bila diminta.
9. Skenario Demo
Dilakukan pada dua perangkat (satu asisten, satu praktikan) memakai development build.
Alur 1 — Presensi Berbasis Lokasi
1.  Asisten membuka sesi TERJADWAL; status menjadi DIBUKA di kedua perangkat.
2.  Praktikan membuka halaman Presensi dari sesi tersebut.
3.  Aplikasi menampilkan jarak ke lab dan hasil pemeriksaan radius.
4.  Praktikan di luar radius ditolak dengan pesan jelas; di dalam radius presensi berhasil.
5.  Praktikan mencoba presensi lagi dan ditolak.
6.  Asisten membuka Rekap, memilih praktikum, dan melihat nama, waktu, serta jarak praktikan.
Alur 2 — Peta dan Informasi Lab
1.  Pengguna membuka Peta lewat ikon di header.
2.  Marker lab dan marker posisi pengguna tampil.
3.  Pengguna memilih marker; sheet menampilkan praktikum berlangsung dan berikutnya.
4.  Asisten mengubah status atau jadwal sesi; sheet berubah tanpa reload.
Alur 3 — Notifikasi Kegiatan
1.  Asisten membuka sesi, mengubah jadwal, lalu memutuskan sebuah izin.
2.  Praktikan terkait menerima push notification untuk tiap peristiwa.
3.  Mengetuk notifikasi membuka sesi yang bersangkutan.
4.  Praktikan di kelas lain tidak menerima notifikasi sesi tersebut.
Pemeriksaan Perbaikan
Register asisten berhasil; rekap dua level berfungsi; input jam dan tanggal tervalidasi; Buka Lagi tidak dapat dipakai pada sesi yang sudah ditutup; badge AI tampil; tombol Buka tidak aktif sebelum jam mulai; sesi yang melewati jam selesai (misalnya pukul 09.01 untuk jadwal 08.00–09.00) tidak dapat menerima presensi dan tidak dapat dibuka lagi.
10. Risiko Sprint
Risiko
Dampak
Mitigasi
Development build terlambat
Peta dan notifikasi tidak dapat diuji
PM memprioritaskan build H+0 sampai H+1; pantau di standup
Push notification tidak jalan di Expo Go
Alur 3 gagal
Gunakan development build; uji di perangkat fisik
Kontrak useSession() berubah di tengah sprint
Banyak layar rusak
Bekukan di H+0; setiap perubahan diumumkan
Skeleton P1 terlambat
P2 dan P3 menunggu
Gunakan tampilan sementara; styling final boleh menyusul
Konflik edit file yang sama
PR macet
Tabel kepemilikan §3; PR skeleton sebagai satu-satunya pengecualian
GPS tidak akurat di dalam gedung
Presensi sah ditolak
Simpan akurasi koordinat; radius disesuaikan asisten; siapkan lokasi uji untuk demo
Fake GPS
Presensi curang
Di luar cakupan; dicatat sebagai batasan
Bug register ternyata di context
PB-01 terhambat
Perbaikan di PM sebagai PR terpisah; Akmal mengurus form
Beban Akmal (Peta) atau Farras (notifikasi dan Presensi) menumpuk
Target tidak tercapai
Pantau standup H+1 dan H+2; pindahkan pekerjaan kecil bila perlu
Sesi “tertutup sendiri” tanpa backend; jam perangkat tidak akurat
Presensi diterima di luar jadwal atau ditolak saat masih sah
Status dihitung dari waktu (getStatusEfektif), penolakan di context dan transaction, zona WIB, waktu server bila memungkinkan; sisanya dicatat sebagai batasan
11. Checklist Progres per Area
PM — Nouvella
[ ] Paket terpasang dan kontrak useSession() di-merge (H+0)
[ ] Skema labs, seed data, field labId
[ ] Development build EAS
[ ] markAttendance dengan validasi lokasi; guard reopenSession
[ ] services/location.ts dan hooks/useLocation.ts
[ ] services/notifications.ts dan trigger
[ ] Perbaikan ai.ts (dan register() bila perlu)
[ ] firestore.rules diperbarui
[ ] APK preview, gladi demo, tag v0.3-sprint3
[ ] Aturan waktu sesi PB-06 (getStatusEfektif, openSession, markAttendance)
P1 — Farras
[ ] PR skeleton di-merge (H+1)
[ ] Styling komponen baru dan token status
[ ] Halaman Presensi dengan semua state
[ ] Tampilan AI di form izin praktikan
[ ] Profil praktikan dan StatusIzinPerangkat
[ ] docs/DESIGN-SPRINT3.md
[ ] Notifikasi klien (useNotifications)
[ ] Label status waktu sesi di sisi praktikan (PB-06)
P2 — Akmal
[ ] Peta: marker lab dan marker pengguna live
[ ] Sheet aktivitas lab real-time
[ ] LokasiPicker dan Kelola Lab
[ ] Perbaikan login dan register asisten (PB-01)
[ ] Status waktu sesi pada sheet Peta memakai getStatusEfektif (PB-06)
P3 — Eileen
[ ] Perbaikan jam dan tanggal (PB-04)
[ ] Rekap dua level (PB-03)
[ ] Buka Lagi dinonaktifkan (PB-05)
[ ] Field Lab, jarak presensi, badge AI asisten
[ ] Profil asisten dan tombol Buka/Tutup mengikuti waktu sesi (PB-06)
12. Catatan untuk PM
• Periksa PR terhadap kriteria terima dan butir FR/PB, bukan hanya apakah kode "terlihat jalan".
• Nilai UI lewat screenshot atau video di PR dan acuan docs/DESIGN-SPRINT3.md.
• Uji notifikasi dan presensi dengan dua akun berbeda di dua perangkat.
• Catat keputusan penting (terutama PB-05 dan PB-06) di PRD.
• Jaga main tetap dapat dijalankan; jangan menunda merge sampai semua fitur selesai.
• Setelah sprint selesai, lakukan handover sesuai docs/WORKFLOW-GIT.md §9.