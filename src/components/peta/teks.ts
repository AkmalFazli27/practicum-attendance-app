/**
 * Teks UI P2 (Peta & Kelola Lab) untuk bahasa Indonesia dan Inggris.
 *
 * Kenapa kamus ini ada di area P2, bukan di `PreferencesContext`: `translations`
 * di context hanya bisa diubah pemiliknya (area PM/P1), sedangkan layar P2 butuh
 * teks terlokalisasi sekarang. Bentuknya sengaja datar dan murni (tanpa React)
 * supaya bisa diuji dengan `node:test` dan mudah dipindahkan ke `t()` bila
 * nanti dipusatkan.
 */
import type { BahasaApp } from '@/context/PreferencesContext';
import type { JenisPermissionBanner } from '@/components/ui';

import type { KodeAlasanLab } from './validasiLab';

export type TeksPeta = {
  judulPeta: string;
  kickerPeta: string;
  judulKelolaLab: string;
  kickerLab: string;
  memuatPeta: string;
  memuatLabs: string;
  coba: string;
  petaKosongJudul: string;
  petaKosongPesan: string;
  petaKosongPesanError: string;
  labKosongPesan: string;
  labKosongPesanError: string;
  pilihLab: string;
  periksaData: string;
  perubahanBelumDisimpan: string;
  dataSesuai: string;
  simpanPerubahan: string;
  toastTersimpan: string;
  toastGagalSimpan: string;
  membacaLokasi: string;
  validasi: Record<KodeAlasanLab, string>;
  kelas: (kelas: string) => string;
  radiusPresensi: (meter: number) => string;
  radiusBelumDiatur: string;
  memuatAktivitas: string;
  sedangBerlangsung: string;
  tidakAdaBerlangsung: string;
  berikutnya: string;
  belumAdaJadwal: string;
  gunakanLokasi: string;
  radiusPresensiLabel: string;
  radiusBantuan: (meter: number | null) => string;
  satuanMeter: string;
  petaWebNotice: string;
  pickerWebNotice: string;
  posisiKamu: (lat: string, lng: string, akurasi: string) => string;
  jarakMeter: (meter: number) => string;
  jarakKm: (km: string) => string;
  banner: Record<
    JenisPermissionBanner,
    { judul: string; pesan: string; aksi: string }
  >;
  a11y: {
    kembali: string;
    muatUlang: string;
    peta: string;
    posisiKamu: string;
    titikLab: string;
    gunakanLokasi: string;
    radiusInput: string;
    latitude: string;
    longitude: string;
    petaPicker: string;
  };
};

const ID: TeksPeta = {
  judulPeta: 'Peta Laboratorium',
  kickerPeta: 'PETA',
  judulKelolaLab: 'Kelola Lab',
  kickerLab: 'LABORATORIUM',
  memuatPeta: 'Memuat peta laboratorium…',
  memuatLabs: 'Memuat data laboratorium…',
  coba: 'Coba lagi',
  petaKosongJudul: 'Belum ada data laboratorium',
  petaKosongPesan:
    'Data lab belum tersedia. Hubungi asisten praktikum atau coba lagi nanti.',
  petaKosongPesanError:
    'Data lab belum bisa dimuat. Periksa koneksi internet lalu coba lagi.',
  labKosongPesan:
    'Data lab belum tersedia. Hubungi pengelola laboratorium atau coba lagi nanti.',
  labKosongPesanError:
    'Data lab belum bisa dimuat. Periksa koneksi lalu coba lagi.',
  pilihLab: 'Pilih laboratorium',
  periksaData: 'Periksa kembali data lab',
  perubahanBelumDisimpan: 'Perubahan belum disimpan.',
  dataSesuai: 'Titik dan radius lab sesuai data tersimpan.',
  simpanPerubahan: 'Simpan perubahan',
  toastTersimpan: 'Data laboratorium tersimpan.',
  toastGagalSimpan:
    'Gagal menyimpan data laboratorium. Periksa koneksi lalu coba lagi.',
  membacaLokasi: 'Membaca lokasi perangkat…',
  validasi: {
    'pilih-lab': 'Pilih laboratorium terlebih dahulu.',
    'titik-belum': 'Tentukan titik laboratorium pada peta.',
    'koordinat-invalid': 'Koordinat laboratorium tidak valid.',
    'radius-invalid': 'Radius harus lebih dari 0 meter.',
  },
  kelas: (kelas) => `Kelas ${kelas}`,
  radiusPresensi: (meter) => `Radius presensi ${meter} meter`,
  radiusBelumDiatur: 'Radius presensi belum diatur',
  memuatAktivitas: 'Memuat aktivitas lab…',
  sedangBerlangsung: 'SEDANG BERLANGSUNG',
  tidakAdaBerlangsung: 'Tidak ada praktikum yang sedang berlangsung.',
  berikutnya: 'BERIKUTNYA',
  belumAdaJadwal: 'Belum ada jadwal berikutnya.',
  gunakanLokasi: 'Gunakan lokasi saat ini',
  radiusPresensiLabel: 'Radius presensi',
  radiusBantuan: (meter) =>
    meter && meter > 0
      ? `Area yang dihitung sah saat praktikan presensi (${Math.round(meter)} m).`
      : 'Area yang dihitung sah saat praktikan presensi.',
  satuanMeter: 'm',
  petaWebNotice:
    'Peta interaktif tersedia di aplikasi mobile. Pilih lab dari daftar berikut.',
  pickerWebNotice:
    'Peta interaktif hanya tersedia di aplikasi mobile. Isi titik lab dengan koordinat di bawah.',
  posisiKamu: (lat, lng, akurasi) =>
    `Posisi kamu: ${lat}, ${lng}${akurasi ? ` (±${akurasi} m)` : ''}`,
  jarakMeter: (meter) => `${meter} m dari posisimu`,
  jarakKm: (km) => `${km} km dari posisimu`,
  banner: {
    'izin-lokasi-ditolak': {
      judul: 'Izin lokasi ditolak',
      pesan:
        'Izin lokasi ditolak. Aktifkan lewat Pengaturan untuk melihat posisimu.',
      aksi: 'Izinkan',
    },
    'gps-mati': {
      judul: 'Lokasi tidak aktif',
      pesan: 'Layanan lokasi mati. Nyalakan GPS untuk melihat posisimu.',
      aksi: 'Coba lagi',
    },
    'koordinat-belum-ada': {
      judul: 'Mencari lokasi',
      pesan: 'Mencari lokasi…',
      aksi: 'Muat ulang',
    },
    'izin-notifikasi-ditolak': {
      judul: 'Izin notifikasi nonaktif',
      pesan:
        'Aktifkan izin notifikasi di pengaturan agar menerima pemberitahuan sesi dan status izin.',
      aksi: 'Pengaturan',
    },
    jaringan: {
      judul: 'Koneksi bermasalah',
      pesan: 'Tidak dapat memuat data. Periksa koneksi internet.',
      aksi: 'Coba lagi',
    },
    error: {
      judul: 'Lokasi gagal dibaca',
      pesan:
        'Lokasi perangkat tidak dapat dibaca. Coba lagi atau periksa pengaturan lokasi.',
      aksi: 'Coba lagi',
    },
  },
  a11y: {
    kembali: 'Kembali',
    muatUlang: 'Muat ulang data laboratorium',
    peta: 'Peta laboratorium',
    posisiKamu: 'Posisi kamu saat ini',
    titikLab: 'Titik laboratorium',
    gunakanLokasi: 'Gunakan lokasi saat ini',
    radiusInput: 'Radius presensi dalam meter',
    latitude: 'Latitude laboratorium',
    longitude: 'Longitude laboratorium',
    petaPicker: 'Peta pengaturan lokasi laboratorium',
  },
};

const EN: TeksPeta = {
  judulPeta: 'Lab Map',
  kickerPeta: 'MAP',
  judulKelolaLab: 'Manage Lab',
  kickerLab: 'LABORATORY',
  memuatPeta: 'Loading laboratory map…',
  memuatLabs: 'Loading laboratory data…',
  coba: 'Try again',
  petaKosongJudul: 'No laboratory data yet',
  petaKosongPesan:
    'Laboratory data is not available yet. Contact a lab assistant or try again later.',
  petaKosongPesanError:
    'Laboratory data could not be loaded. Check your internet connection and try again.',
  labKosongPesan:
    'Laboratory data is not available yet. Contact the lab manager or try again later.',
  labKosongPesanError:
    'Laboratory data could not be loaded. Check your connection and try again.',
  pilihLab: 'Choose laboratory',
  periksaData: 'Check laboratory data again',
  perubahanBelumDisimpan: 'Changes are not saved yet.',
  dataSesuai: 'Point and radius match the saved data.',
  simpanPerubahan: 'Save changes',
  toastTersimpan: 'Laboratory data saved.',
  toastGagalSimpan:
    'Failed to save laboratory data. Check your connection and try again.',
  membacaLokasi: 'Reading device location…',
  validasi: {
    'pilih-lab': 'Choose a laboratory first.',
    'titik-belum': 'Set the laboratory point on the map.',
    'koordinat-invalid': 'Laboratory coordinates are invalid.',
    'radius-invalid': 'Radius must be greater than 0 meters.',
  },
  kelas: (kelas) => `Class ${kelas}`,
  radiusPresensi: (meter) => `Attendance radius ${meter} meters`,
  radiusBelumDiatur: 'Attendance radius is not set',
  memuatAktivitas: 'Loading lab activity…',
  sedangBerlangsung: 'ONGOING',
  tidakAdaBerlangsung: 'No ongoing practicum.',
  berikutnya: 'UP NEXT',
  belumAdaJadwal: 'No upcoming schedule yet.',
  gunakanLokasi: 'Use current location',
  radiusPresensiLabel: 'Attendance radius',
  radiusBantuan: (meter) =>
    meter && meter > 0
      ? `Area counted as valid when a student checks in (${Math.round(meter)} m).`
      : 'Area counted as valid when a student checks in.',
  satuanMeter: 'm',
  petaWebNotice:
    'The interactive map is available in the mobile app. Pick a lab from the list below.',
  pickerWebNotice:
    'The interactive map is only available in the mobile app. Enter the lab point with coordinates below.',
  posisiKamu: (lat, lng, akurasi) =>
    `Your position: ${lat}, ${lng}${akurasi ? ` (±${akurasi} m)` : ''}`,
  jarakMeter: (meter) => `${meter} m from you`,
  jarakKm: (km) => `${km} km from you`,
  banner: {
    'izin-lokasi-ditolak': {
      judul: 'Location permission denied',
      pesan:
        'Location permission was denied. Enable it in Settings to see your position.',
      aksi: 'Allow',
    },
    'gps-mati': {
      judul: 'Location service (GPS) is off',
      pesan: 'Location service is off. Turn on GPS to see your position.',
      aksi: 'Try again',
    },
    'koordinat-belum-ada': {
      judul: 'Location coordinates not available',
      pesan: 'Looking for your location…',
      aksi: 'Reload',
    },
    'izin-notifikasi-ditolak': {
      judul: 'Notification permission is off',
      pesan:
        'Enable notification permission in settings to receive session and permit status updates.',
      aksi: 'Settings',
    },
    jaringan: {
      judul: 'Network connection lost',
      pesan: 'Could not load data. Check your internet connection.',
      aksi: 'Try again',
    },
    error: {
      judul: 'Failed to check device',
      pesan:
        'Device location could not be read. Try again or check your location settings.',
      aksi: 'Try again',
    },
  },
  a11y: {
    kembali: 'Back',
    muatUlang: 'Reload laboratory data',
    peta: 'Laboratory map',
    posisiKamu: 'Your current position',
    titikLab: 'Laboratory point',
    gunakanLokasi: 'Use current location',
    radiusInput: 'Attendance radius in meters',
    latitude: 'Laboratory latitude',
    longitude: 'Laboratory longitude',
    petaPicker: 'Laboratory location settings map',
  },
};

const KAMUS: Record<BahasaApp, TeksPeta> = { id: ID, en: EN };

export function teksPeta(bahasa: BahasaApp): TeksPeta {
  return KAMUS[bahasa] ?? ID;
}
