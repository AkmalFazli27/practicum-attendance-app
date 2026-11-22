/**
 * Validasi form login/daftar dan pemetaan alasan gagal autentikasi.
 *
 * Bagian ini sengaja murni (tanpa React) dan mengembalikan *kode*, bukan
 * kalimat, supaya layar bisa menampilkan pesan sesuai bahasa aktif tanpa
 * menduplikasi logika. `SessionContext` masih mengembalikan kalimat Indonesia;
 * `kodePesanAuth` mengenali kalimat itu agar bisa diterjemahkan di layar.
 */
import type { TeksLogin } from './teksLogin';

export type AuthMode = 'login' | 'register';
export type AuthField =
  | 'nama'
  | 'nim'
  | 'kelas'
  | 'email'
  | 'password'
  | 'konfirmasi';

export type KodeValidasiLogin =
  | 'nama-pendek'
  | 'nim-invalid'
  | 'kelas-invalid'
  | 'email-tidak-valid'
  | 'sandi-pendek'
  | 'konfirmasi-beda';

export type KodeAuthLogin =
  | 'auth-email-tidak-valid'
  | 'auth-kredensial-salah'
  | 'auth-email-terpakai'
  | 'auth-sandi-lemah'
  | 'auth-jaringan'
  | 'auth-terlalu-banyak'
  | 'auth-akun-nonaktif'
  | 'auth-metode-nonaktif'
  | 'auth-gangguan'
  | 'auth-umum'
  | 'auth-kredensial-kosong'
  | 'auth-sesi-berubah'
  | 'auth-profil-hilang'
  | 'auth-gagal-masuk'
  | 'auth-wajib-isi'
  | 'auth-nim-kelas-wajib'
  | 'auth-gagal-daftar'
  | 'auth-asisten-admin';

export type KodeLogin = KodeValidasiLogin | KodeAuthLogin;

export type FieldErrors = Partial<Record<AuthField, KodeValidasiLogin>>;

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POLA_NIM = /^\d{6,20}$/;
const POLA_KELAS = /^[A-Z]{2,4}-?\d[A-Z]?$/;

export type ValidasiAuthInput = {
  authMode: AuthMode;
  nama: string;
  nim: string;
  kelas: string;
  email: string;
  password: string;
  konfirmasi: string;
};

/**
 * Pendaftaran mandiri hanya untuk praktikan, sehingga NIM dan kelas selalu
 * wajib pada mode register. Ubah bagian ini bila kelak asisten boleh
 * mendaftar sendiri.
 */
export function validateAuthForm({
  authMode,
  nama,
  nim,
  kelas,
  email,
  password,
  konfirmasi,
}: ValidasiAuthInput): FieldErrors {
  const hasil: FieldErrors = {};

  if (authMode === 'register') {
    if (nama.trim().length < 3) {
      hasil.nama = 'nama-pendek';
    }

    if (!POLA_NIM.test(nim.trim())) {
      hasil.nim = 'nim-invalid';
    }

    if (!POLA_KELAS.test(kelas.trim().toUpperCase())) {
      hasil.kelas = 'kelas-invalid';
    }
  }

  if (!POLA_EMAIL.test(email.trim().toLowerCase())) {
    hasil.email = 'email-tidak-valid';
  }

  if (password.length < 6) {
    hasil.password = 'sandi-pendek';
  }

  if (authMode === 'register' && password !== konfirmasi) {
    hasil.konfirmasi = 'konfirmasi-beda';
  }

  return hasil;
}

/** Kode error Firebase Auth yang punya copy khusus di layar login. */
const PETA_KODE_FIREBASE: Record<string, KodeAuthLogin> = {
  'auth/invalid-email': 'auth-email-tidak-valid',
  'auth/missing-email': 'auth-email-tidak-valid',
  'auth/wrong-password': 'auth-kredensial-salah',
  'auth/invalid-credential': 'auth-kredensial-salah',
  'auth/invalid-login-credentials': 'auth-kredensial-salah',
  'auth/user-not-found': 'auth-kredensial-salah',
  'auth/email-already-in-use': 'auth-email-terpakai',
  'auth/weak-password': 'auth-sandi-lemah',
  'auth/network-request-failed': 'auth-jaringan',
  'auth/too-many-requests': 'auth-terlalu-banyak',
  'auth/user-disabled': 'auth-akun-nonaktif',
  'auth/operation-not-allowed': 'auth-metode-nonaktif',
  'auth/internal-error': 'auth-gangguan',
};

/**
 * `SessionContext` mengembalikan kalimat Indonesia jadi, bukan kode. Peta ini
 * membuat layar berbahasa Inggris tetap bisa menerjemahkannya. Kalimat yang
 * tidak dikenal dikembalikan apa adanya.
 */
const PETA_ALASAN_INDONESIA: Record<string, KodeLogin> = {
  'Email atau kata sandi salah.': 'auth-kredensial-salah',
  'Format alamat email tidak valid.': 'auth-email-tidak-valid',
  'Email ini sudah terdaftar. Silakan masuk.': 'auth-email-terpakai',
  'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.': 'auth-sandi-lemah',
  'Kata sandi minimal 6 karakter.': 'sandi-pendek',
  'Email dan kata sandi tidak boleh kosong.': 'auth-kredensial-kosong',
  'Sesi autentikasi berubah. Silakan coba masuk kembali.': 'auth-sesi-berubah',
  'Profil pengguna tidak ditemukan.': 'auth-profil-hilang',
  'Gagal masuk. Periksa kembali email dan kata sandi Anda.': 'auth-gagal-masuk',
  'Akun ini telah dinonaktifkan.': 'auth-akun-nonaktif',
  'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.':
    'auth-terlalu-banyak',
  'Tidak dapat terhubung ke server Firebase. Periksa koneksi internetmu.':
    'auth-jaringan',
  'Tidak dapat terhubung ke server. Periksa koneksi internetmu.': 'auth-jaringan',
  'Nama, email, dan kata sandi wajib diisi.': 'auth-wajib-isi',
  'NIM dan Kelas wajib diisi untuk praktikan.': 'auth-nim-kelas-wajib',
  'Gagal mendaftarkan akun.': 'auth-gagal-daftar',
  'Pendaftaran mandiri hanya untuk Praktikan. Akun Asisten dibuat melalui Admin/Console.':
    'auth-asisten-admin',
};

/**
 * Mengubah kode Firebase (`auth/...`) atau kalimat Indonesia dari context
 * menjadi kode pesan. `null` berarti teks tidak dikenali dan harus dipakai apa
 * adanya.
 */
export function kodePesanAuth(alasan: string): KodeLogin | null {
  if (!alasan) return null;
  if (alasan.startsWith('auth/')) {
    return PETA_KODE_FIREBASE[alasan] ?? 'auth-umum';
  }
  return PETA_ALASAN_INDONESIA[alasan] ?? null;
}

/** Pesan siap tampil untuk alasan gagal autentikasi pada bahasa aktif. */
export function pesanUntukAlasan(alasan: string, teks: TeksLogin): string {
  const kode = kodePesanAuth(alasan);
  return kode ? teks.pesan[kode] : alasan;
}
