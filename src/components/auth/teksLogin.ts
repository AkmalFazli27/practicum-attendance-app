/**
 * Teks UI login/daftar untuk bahasa Indonesia dan Inggris.
 *
 * Pola ini sama dengan `src/components/peta/teks.ts`: kamus lokal supaya area
 * login tidak perlu mengubah `translations` di `PreferencesContext` (milik
 * PM/P1), bentuknya datar dan murni agar bisa diuji dengan `node:test`.
 */
import type { BahasaApp } from '@/context/PreferencesContext';

import type { KodeLogin } from './validasiLogin';

export type TeksLogin = {
  /** Judul tab mode form. */
  masuk: string;
  daftarAkun: string;
  /** Eyebrow dan judul panel atas. */
  selamatDatang: string;
  registrasiAkun: string;
  judulMasuk: string;
  judulDaftar: string;
  subMasuk: string;
  subDaftar: string;
  /** Info bahwa pendaftaran mandiri hanya untuk praktikan. */
  infoDaftar: string;
  /** Label field. */
  namaLengkap: string;
  nimId: string;
  kelas: string;
  alamatEmail: string;
  kataSandi: string;
  konfirmasiSandi: string;
  /** Placeholder input. */
  placeholderNama: string;
  placeholderNim: string;
  placeholderKelas: string;
  placeholderEmail: string;
  placeholderSandi: string;
  placeholderKonfirmasi: string;
  /** Teks bantuan di bawah input kata sandi. */
  bantuanSandi: string;
  /** Tombol utama. */
  tombolMasuk: string;
  tombolDaftar: string;
  /** Tautan ganti mode. Spasi di akhir sengaja dipertahankan. */
  belumPunyaAkun: string;
  sudahPunyaAkun: string;
  daftarDiSini: string;
  masukDiSini: string;
  disclaimer: string;
  /** Semua pesan validasi dan kegagalan autentikasi. */
  pesan: Record<KodeLogin, string>;
  toast: {
    selamatDatang: (namaDepan: string) => string;
    akunDibuat: (namaDepan: string) => string;
  };
  a11y: {
    kembali: string;
    tabMasuk: string;
    tabMasukHint: string;
    tabDaftar: string;
    tabDaftarHint: string;
    namaLengkap: string;
    namaLengkapHint: string;
    nimId: string;
    nimIdHint: string;
    kelas: string;
    kelasHint: string;
    alamatEmail: string;
    alamatEmailHint: string;
    kataSandi: string;
    kataSandiHint: string;
    tampilkanSandi: string;
    sembunyikanSandi: string;
    konfirmasiSandi: string;
    konfirmasiSandiHint: string;
  };
};

const ID: TeksLogin = {
  masuk: 'Masuk',
  daftarAkun: 'Daftar Akun',
  selamatDatang: 'SELAMAT DATANG',
  registrasiAkun: 'REGISTRASI AKUN',
  judulMasuk: 'Masuk ke TapIn',
  judulDaftar: 'Buat Akun TapIn',
  subMasuk:
    'Masuk dengan email dan kata sandi akunmu. Peran akun dikenali otomatis.',
  subDaftar:
    'Daftarkan identitasmu untuk mengakses praktikum sebagai Praktikan.',
  infoDaftar:
    'Pendaftaran mandiri hanya untuk Praktikan. Akun Asprak dan Aslab didaftarkan oleh pengelola laboratorium.',
  namaLengkap: 'Nama lengkap',
  nimId: 'NIM / ID',
  kelas: 'Kelas',
  alamatEmail: 'Alamat email',
  kataSandi: 'Kata sandi',
  konfirmasiSandi: 'Konfirmasi kata sandi',
  placeholderNama: 'Contoh: Alya Ramadhani',
  placeholderNim: '2310512001',
  placeholderKelas: 'IF-2A',
  placeholderEmail: 'nama@tapin.ac.id',
  placeholderSandi: 'Minimal 6 karakter',
  placeholderKonfirmasi: 'Ulangi kata sandi',
  bantuanSandi: 'Minimal 6 karakter.',
  tombolMasuk: 'Masuk ke aplikasi',
  tombolDaftar: 'Buat akun sekarang',
  belumPunyaAkun: 'Belum memiliki akun? ',
  sudahPunyaAkun: 'Sudah memiliki akun? ',
  daftarDiSini: 'Daftar di sini',
  masukDiSini: 'Masuk di sini',
  disclaimer:
    'Hak akses layar dan tindakan disesuaikan secara otomatis berdasarkan peran akun yang terautentikasi.',
  pesan: {
    'nama-pendek': 'Nama lengkap minimal 3 karakter.',
    'nim-invalid': 'NIM/ID hanya boleh berisi angka (6–20 digit).',
    'kelas-invalid': 'Format kelas tidak valid. Contoh: IF-2A.',
    'email-tidak-valid': 'Masukkan alamat email yang valid.',
    'sandi-pendek': 'Kata sandi minimal 6 karakter.',
    'konfirmasi-beda': 'Konfirmasi kata sandi tidak cocok.',
    'auth-email-tidak-valid': 'Format alamat email tidak valid.',
    'auth-kredensial-salah': 'Email atau kata sandi salah.',
    'auth-email-terpakai': 'Email ini sudah terdaftar. Silakan masuk.',
    'auth-sandi-lemah':
      'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.',
    'auth-jaringan':
      'Tidak dapat terhubung ke server. Periksa koneksi internetmu.',
    'auth-terlalu-banyak':
      'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
    'auth-akun-nonaktif': 'Akun ini dinonaktifkan. Hubungi asisten atau admin.',
    'auth-metode-nonaktif':
      'Metode login ini belum diaktifkan. Hubungi pengelola aplikasi.',
    'auth-gangguan':
      'Terjadi gangguan pada layanan autentikasi. Coba lagi.',
    'auth-umum':
      'Terjadi kesalahan saat memproses akun. Periksa koneksi internetmu dan coba lagi.',
    'auth-kredensial-kosong': 'Email dan kata sandi tidak boleh kosong.',
    'auth-sesi-berubah':
      'Sesi autentikasi berubah. Silakan coba masuk kembali.',
    'auth-profil-hilang': 'Profil pengguna tidak ditemukan.',
    'auth-gagal-masuk':
      'Gagal masuk. Periksa kembali email dan kata sandi Anda.',
    'auth-wajib-isi': 'Nama, email, dan kata sandi wajib diisi.',
    'auth-nim-kelas-wajib': 'NIM dan Kelas wajib diisi untuk praktikan.',
    'auth-gagal-daftar': 'Gagal mendaftarkan akun.',
    'auth-asisten-admin':
      'Pendaftaran mandiri hanya untuk Praktikan. Akun Asisten dibuat melalui Admin/Console.',
  },
  toast: {
    selamatDatang: (namaDepan) => `Selamat datang kembali, ${namaDepan}!`,
    akunDibuat: (namaDepan) => `Akun ${namaDepan} berhasil dibuat.`,
  },
  a11y: {
    kembali: 'Kembali ke halaman awal',
    tabMasuk: 'Tab Masuk',
    tabMasukHint: 'Tampilkan formulir untuk masuk ke aplikasi.',
    tabDaftar: 'Tab Daftar Akun',
    tabDaftarHint: 'Tampilkan formulir untuk membuat akun baru.',
    namaLengkap: 'Nama lengkap',
    namaLengkapHint: 'Isi nama lengkap sesuai identitas praktikum.',
    nimId: 'NIM atau ID',
    nimIdHint: 'Hanya angka, 6 sampai 20 digit.',
    kelas: 'Kelas',
    kelasHint: 'Gunakan format seperti IF-2A.',
    alamatEmail: 'Alamat email',
    alamatEmailHint: 'Gunakan alamat email aktif yang valid.',
    kataSandi: 'Kata sandi',
    kataSandiHint: 'Minimal 6 karakter.',
    tampilkanSandi: 'Tampilkan kata sandi',
    sembunyikanSandi: 'Sembunyikan kata sandi',
    konfirmasiSandi: 'Konfirmasi kata sandi',
    konfirmasiSandiHint: 'Ulangi kata sandi yang sama.',
  },
};

const EN: TeksLogin = {
  masuk: 'Sign in',
  daftarAkun: 'Create Account',
  selamatDatang: 'WELCOME',
  registrasiAkun: 'CREATE ACCOUNT',
  judulMasuk: 'Sign in to TapIn',
  judulDaftar: 'Create a TapIn Account',
  subMasuk:
    'Sign in with your account email and password. Your role is detected automatically.',
  subDaftar: 'Register your identity to join practicum as a Student.',
  infoDaftar:
    'Self-registration is only for Students. Asprak and Aslab accounts are provisioned by the laboratory admin.',
  namaLengkap: 'Full name',
  nimId: 'Student ID',
  kelas: 'Class',
  alamatEmail: 'Email address',
  kataSandi: 'Password',
  konfirmasiSandi: 'Confirm password',
  placeholderNama: 'e.g. Alya Ramadhani',
  placeholderNim: '2310512001',
  placeholderKelas: 'IF-2A',
  placeholderEmail: 'name@tapin.ac.id',
  placeholderSandi: 'At least 6 characters',
  placeholderKonfirmasi: 'Repeat your password',
  bantuanSandi: 'At least 6 characters.',
  tombolMasuk: 'Sign in to app',
  tombolDaftar: 'Create account now',
  belumPunyaAkun: 'No account yet? ',
  sudahPunyaAkun: 'Already have an account? ',
  daftarDiSini: 'Sign up here',
  masukDiSini: 'Sign in here',
  disclaimer:
    'Screen access and actions are adjusted automatically based on the authenticated account role.',
  pesan: {
    'nama-pendek': 'Full name must be at least 3 characters.',
    'nim-invalid': 'Student ID must contain digits only (6–20 digits).',
    'kelas-invalid': 'Invalid class format. Example: IF-2A.',
    'email-tidak-valid': 'Enter a valid email address.',
    'sandi-pendek': 'Password must be at least 6 characters.',
    'konfirmasi-beda': 'Password confirmation does not match.',
    'auth-email-tidak-valid': 'The email address format is invalid.',
    'auth-kredensial-salah': 'Incorrect email or password.',
    'auth-email-terpakai': 'This email is already registered. Please sign in.',
    'auth-sandi-lemah': 'Password is too weak. Use at least 6 characters.',
    'auth-jaringan':
      'Unable to reach the server. Check your internet connection.',
    'auth-terlalu-banyak': 'Too many attempts. Try again in a moment.',
    'auth-akun-nonaktif':
      'This account is disabled. Contact an assistant or admin.',
    'auth-metode-nonaktif':
      'This sign-in method is not enabled. Contact the app manager.',
    'auth-gangguan': 'The authentication service is having trouble. Try again.',
    'auth-umum':
      'Something went wrong while processing your account. Check your internet connection and try again.',
    'auth-kredensial-kosong': 'Email and password are required.',
    'auth-sesi-berubah': 'Your authentication session changed. Please sign in again.',
    'auth-profil-hilang': 'User profile not found.',
    'auth-gagal-masuk': 'Sign-in failed. Check your email and password again.',
    'auth-wajib-isi': 'Name, email, and password are required.',
    'auth-nim-kelas-wajib': 'Student ID and class are required for students.',
    'auth-gagal-daftar': 'Failed to register the account.',
    'auth-asisten-admin':
      'Self-registration is only for Students. Assistant accounts are created via Admin/Console.',
  },
  toast: {
    selamatDatang: (namaDepan) => `Welcome back, ${namaDepan}!`,
    akunDibuat: (namaDepan) => `Account ${namaDepan} created successfully.`,
  },
  a11y: {
    kembali: 'Back to the start page',
    tabMasuk: 'Sign in tab',
    tabMasukHint: 'Show the form to sign in to the app.',
    tabDaftar: 'Create account tab',
    tabDaftarHint: 'Show the form to create a new account.',
    namaLengkap: 'Full name',
    namaLengkapHint: 'Enter your full name as listed in the practicum roster.',
    nimId: 'Student ID',
    nimIdHint: 'Digits only, 6 to 20 digits.',
    kelas: 'Class',
    kelasHint: 'Use a format like IF-2A.',
    alamatEmail: 'Email address',
    alamatEmailHint: 'Use a valid, active email address.',
    kataSandi: 'Password',
    kataSandiHint: 'At least 6 characters.',
    tampilkanSandi: 'Show password',
    sembunyikanSandi: 'Hide password',
    konfirmasiSandi: 'Confirm password',
    konfirmasiSandiHint: 'Repeat the same password.',
  },
};

const KAMUS: Record<BahasaApp, TeksLogin> = { id: ID, en: EN };

export function teksLogin(bahasa: BahasaApp): TeksLogin {
  return KAMUS[bahasa] ?? ID;
}
