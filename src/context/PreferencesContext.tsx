import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { colors, darkColors, type ThemeColors } from '@/theme/tokens';

export type ModeTema = 'terang' | 'gelap' | 'sistem';
export type BahasaApp = 'id' | 'en';

const STORAGE_KEY_TEMA = '@tapin_theme_mode';
const STORAGE_KEY_BAHASA = '@tapin_app_language';
const STORAGE_KEY_PERNAH_LOGIN = '@tapin_has_logged_in';

let activeLanguageCache: BahasaApp = 'id';

/** Mengembalikan bahasa aktif saat ini secara sinkron (default 'id' di perangkat baru). */
export function getActiveLanguage(): BahasaApp {
  return activeLanguageCache;
}

const translations = {
  id: {
    // Tabs
    tab_home: 'Beranda',
    tab_schedule: 'Jadwal',
    tab_qr: 'QR',
    tab_history: 'Riwayat',
    tab_profile: 'Profil',
    tab_sessions: 'Sesi',
    tab_recap: 'Rekap',

    // Header
    header_notif_toast: 'Notifikasi push aktif untuk akunmu.',

    // Profile
    role_student: 'Praktikan',
    role_assistant: 'Asisten',
    profile_class: 'Kelas',
    profile_email: 'Email',
    profile_status: 'Status akun',
    profile_active: 'Aktif',
    profile_total_attendance: 'Total presensi',
    profile_managed_sessions: 'Sesi dikelola',
    profile_sessions_unit: 'sesi',
    profile_settings_title: 'Pengaturan & Preferensi',
    profile_settings_sub: 'Tema, bahasa, perizinan perangkat, & akun',
    profile_logout: 'Keluar dari akun',
    profile_logout_success: 'Anda berhasil keluar.',

    // Settings main
    settings_title: 'Pengaturan',
    settings_group_account: 'Akun',
    settings_group_preferences: 'Preferensi',
    settings_group_system: 'Sistem & Data',
    settings_account_info: 'Informasi Akun',
    settings_change_password: 'Ganti Kata Sandi',
    settings_theme: 'Tema',
    settings_language: 'Bahasa',
    settings_permissions: 'Perizinan Perangkat',
    settings_permissions_val: 'Lokasi, Kamera & Notif',
    settings_clear_cache: 'Bersihkan Cache',
    settings_about: 'Tentang Aplikasi',
    settings_logout: 'Keluar',

    // Theme labels
    theme_light: 'Terang',
    theme_dark: 'Gelap',
    theme_system: 'Sesuai HP',
    theme_light_desc: 'Tampilan cerah dengan kontras bersih',
    theme_dark_desc: 'Tampilan gelap ramah mata & hemat daya',
    theme_system_desc: 'Menyesuaikan mode terang/gelap perangkat',
    theme_sheet_title: 'Pilih Tema Tampilan',
    theme_toast: 'Tema diubah ke',

    // Language labels
    lang_id: 'Indonesia',
    lang_en: 'English',
    lang_id_full: 'Bahasa Indonesia',
    lang_en_full: 'English (US)',
    lang_sheet_title: 'Pilih Bahasa Aplikasi',
    lang_toast: 'Bahasa diubah ke',

    // Permissions
    perm_sheet_title: 'Perizinan Perangkat',
    perm_card_kicker: 'IZIN & KONDISI PERANGKAT',
    perm_refresh: 'Segarkan',
    perm_loc_title: 'Lokasi & GPS',
    perm_loc_sub: 'Verifikasi jarak radius laboratorium saat presensi',
    perm_notif_title: 'Push Notification',
    perm_notif_sub: 'Info sesi dibuka, jadwal berubah, dan keputusan izin',
    perm_cam_title: 'Kamera',
    perm_cam_sub: 'Memindai kode QR presensi praktikum',
    perm_gps_off: 'GPS Mati',
    perm_settings_link: 'Pengaturan',
    perm_checking: 'Memeriksa…',
    perm_disable_title: 'Nonaktifkan',
    perm_disable_msg:
      'Untuk menonaktifkan izin ini, silakan ubah melalui Pengaturan perangkat.',
    perm_open_settings: 'Buka Pengaturan',
    perm_cancel: 'Batal',

    // Account info sheet
    acc_sheet_title: 'Informasi Akun',
    acc_name: 'Nama Lengkap',
    acc_nim: 'NIM / ID',
    acc_class: 'Kelas',
    acc_role: 'Peran',

    // Change password sheet
    pwd_sheet_title: 'Ganti Kata Sandi',
    pwd_current_label: 'Kata Sandi Saat Ini',
    pwd_current_placeholder: 'Masukkan kata sandi saat ini',
    pwd_new_label: 'Kata Sandi Baru',
    pwd_new_placeholder: 'Minimal 6 karakter',
    pwd_confirm_label: 'Konfirmasi Kata Sandi Baru',
    pwd_confirm_placeholder: 'Ulangi kata sandi baru',
    pwd_save_btn: 'Simpan Kata Sandi Baru',
    pwd_err_empty: 'Kata sandi saat ini wajib diisi.',
    pwd_err_min: 'Kata sandi baru minimal 6 karakter.',
    pwd_err_mismatch: 'Konfirmasi kata sandi tidak cocok.',
    pwd_err_same: 'Kata sandi baru tidak boleh sama dengan sebelumnya.',
    pwd_success: 'Kata sandi berhasil diperbarui.',

    // Cache & About & Logout
    cache_title: 'Bersihkan Cache',
    cache_confirm: 'Bersihkan data cache sementara aplikasi?',
    cache_action: 'Bersihkan',
    cache_success: 'Cache lokal aplikasi berhasil dibersihkan.',
    cache_fail: 'Gagal membersihkan cache lokal.',
    about_sheet_title: 'Tentang TapIn',
    about_desc:
      'Aplikasi presensi praktikum berbasis lokasi, peta laboratorium, dan notifikasi real-time.',
    about_version: 'Versi',
    about_build: 'Build',
    logout_confirm_title: 'Keluar dari Akun',
    logout_confirm_msg: 'Apakah Anda yakin ingin keluar dari akun ini?',

    // QR Scanner
    qr_title: 'Scan QR Code',
    qr_instruction_title: 'Posisikan kode QR di dalam bingkai',
    qr_instruction_sub:
      'Kamera akan otomatis memindai saat kode QR terdeteksi',
    qr_perm_title: 'Izin Kamera Diperlukan',
    qr_perm_sub:
      'Aktifkan izin kamera untuk memindai kode QR presensi praktikum.',
    qr_perm_btn: 'Izinkan Kamera',
    qr_loc_loading: 'Mencari koordinat GPS…',
    qr_no_active_session:
      'QR terbaca, namun belum ada sesi aktif yang cocok.',
  },
  en: {
    // Tabs
    tab_home: 'Home',
    tab_schedule: 'Schedule',
    tab_qr: 'QR',
    tab_history: 'History',
    tab_profile: 'Profile',
    tab_sessions: 'Sessions',
    tab_recap: 'Recap',

    // Header
    header_notif_toast: 'Push notifications are active for your account.',

    // Profile
    role_student: 'Student',
    role_assistant: 'Assistant',
    profile_class: 'Class',
    profile_email: 'Email',
    profile_status: 'Account status',
    profile_active: 'Active',
    profile_total_attendance: 'Total attendance',
    profile_managed_sessions: 'Managed sessions',
    profile_sessions_unit: 'sessions',
    profile_settings_title: 'Settings & Preferences',
    profile_settings_sub: 'Theme, language, device permissions, & account',
    profile_logout: 'Log out',
    profile_logout_success: 'You have been logged out.',

    // Settings main
    settings_title: 'Settings',
    settings_group_account: 'Account',
    settings_group_preferences: 'Preferences',
    settings_group_system: 'System & Data',
    settings_account_info: 'Account Info',
    settings_change_password: 'Change Password',
    settings_theme: 'Theme',
    settings_language: 'Language',
    settings_permissions: 'Device Permissions',
    settings_permissions_val: 'Location, Cam & Notif',
    settings_clear_cache: 'Clear Cache',
    settings_about: 'About App',
    settings_logout: 'Logout',

    // Theme labels
    theme_light: 'Light Mode',
    theme_dark: 'Dark Mode',
    theme_system: 'System Default',
    theme_light_desc: 'Bright appearance with crisp contrast',
    theme_dark_desc: 'Dark appearance easy on the eyes',
    theme_system_desc: 'Automatically matches your device theme',
    theme_sheet_title: 'Select Theme Mode',
    theme_toast: 'Theme changed to',

    // Language labels
    lang_id: 'Indonesia',
    lang_en: 'English',
    lang_id_full: 'Bahasa Indonesia',
    lang_en_full: 'English (US)',
    lang_sheet_title: 'Select App Language',
    lang_toast: 'Language changed to',

    // Permissions
    perm_sheet_title: 'Device Permissions',
    perm_card_kicker: 'DEVICE PERMISSIONS',
    perm_refresh: 'Refresh',
    perm_loc_title: 'Location & GPS',
    perm_loc_sub: 'Verify lab radius distance during attendance check-in',
    perm_notif_title: 'Push Notifications',
    perm_notif_sub: 'Session alerts, schedule updates, and leave decisions',
    perm_cam_title: 'Camera',
    perm_cam_sub: 'Scan QR codes for practicum attendance',
    perm_gps_off: 'GPS Off',
    perm_settings_link: 'Settings',
    perm_checking: 'Checking…',
    perm_disable_title: 'Disable',
    perm_disable_msg:
      'To disable this permission, please change it in your device Settings.',
    perm_open_settings: 'Open Settings',
    perm_cancel: 'Cancel',

    // Account info sheet
    acc_sheet_title: 'Account Information',
    acc_name: 'Full Name',
    acc_nim: 'Student ID',
    acc_class: 'Class',
    acc_role: 'Role',

    // Change password sheet
    pwd_sheet_title: 'Change Password',
    pwd_current_label: 'Current Password',
    pwd_current_placeholder: 'Enter current password',
    pwd_new_label: 'New Password',
    pwd_new_placeholder: 'Minimum 6 characters',
    pwd_confirm_label: 'Confirm New Password',
    pwd_confirm_placeholder: 'Re-enter new password',
    pwd_save_btn: 'Save New Password',
    pwd_err_empty: 'Current password is required.',
    pwd_err_min: 'New password must be at least 6 characters.',
    pwd_err_mismatch: 'Password confirmation does not match.',
    pwd_err_same: 'New password must differ from current password.',
    pwd_success: 'Password updated successfully.',

    // Cache & About & Logout
    cache_title: 'Clear Cache',
    cache_confirm: 'Clear temporary local cache data?',
    cache_action: 'Clear',
    cache_success: 'Local app cache cleared successfully.',
    cache_fail: 'Failed to clear local cache.',
    about_sheet_title: 'About TapIn',
    about_desc:
      'Location-based practicum attendance app with lab maps and real-time push notifications.',
    about_version: 'Version',
    about_build: 'Build',
    logout_confirm_title: 'Log Out',
    logout_confirm_msg: 'Are you sure you want to log out of your account?',

    // QR Scanner
    qr_title: 'Scan QR Code',
    qr_instruction_title: 'Position the QR code within the larger frame',
    qr_instruction_sub:
      'The camera will automatically scan when a QR code is detected',
    qr_perm_title: 'Camera Permission Needed',
    qr_perm_sub:
      'Allow camera access to scan QR codes for practicum attendance.',
    qr_perm_btn: 'Allow Camera',
    qr_loc_loading: 'Fetching GPS coordinates…',
    qr_no_active_session:
      'QR scanned, but no matching active session was found.',
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

export interface PreferencesContextValue {
  themeMode: ModeTema;
  setThemeMode: (mode: ModeTema) => Promise<void>;
  language: BahasaApp;
  setLanguage: (lang: BahasaApp) => Promise<void>;
  markLoggedIn: () => Promise<void>;
  isDark: boolean;
  themeColors: ThemeColors;
  t: (key: TranslationKey) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ModeTema>('sistem');
  const [language, setLanguageState] = useState<BahasaApp>('id');

  useEffect(() => {
    let aktif = true;
    void (async () => {
      try {
        const [savedTema, savedBahasa, pernahLogin] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_TEMA),
          AsyncStorage.getItem(STORAGE_KEY_BAHASA),
          AsyncStorage.getItem(STORAGE_KEY_PERNAH_LOGIN),
        ]);
        if (!aktif) return;
        if (
          savedTema === 'terang' ||
          savedTema === 'gelap' ||
          savedTema === 'sistem'
        ) {
          setThemeModeState(savedTema);
        }
        // Perangkat baru yang belum pernah login selalu default Bahasa Indonesia ('id').
        // Jika pengguna sudah pernah login, ikuti bahasa sesi terakhir yang tersimpan.
        if (
          pernahLogin === '1' &&
          (savedBahasa === 'id' || savedBahasa === 'en')
        ) {
          activeLanguageCache = savedBahasa;
          setLanguageState(savedBahasa);
        } else {
          activeLanguageCache = 'id';
          setLanguageState('id');
        }
      } catch {
        // Fallback default
      }
    })();
    return () => {
      aktif = false;
    };
  }, []);

  const setThemeMode = useCallback(async (mode: ModeTema) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TEMA, mode);
    } catch {
      // Abaikan kegagalan storage
    }
  }, []);

  const setLanguage = useCallback(async (lang: BahasaApp) => {
    activeLanguageCache = lang;
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_BAHASA, lang);
    } catch {
      // Abaikan kegagalan storage
    }
  }, []);

  const markLoggedIn = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PERNAH_LOGIN, '1');
    } catch {
      // Abaikan kegagalan storage
    }
  }, []);

  const isDark =
    themeMode === 'gelap' ||
    (themeMode === 'sistem' && systemScheme === 'dark');

  const themeColors = isDark ? darkColors : colors;

  const t = useCallback(
    (key: TranslationKey) => translations[language][key],
    [language],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      themeMode,
      setThemeMode,
      language,
      setLanguage,
      markLoggedIn,
      isDark,
      themeColors,
      t,
    }),
    [
      themeMode,
      setThemeMode,
      language,
      setLanguage,
      markLoggedIn,
      isDark,
      themeColors,
      t,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    // Fallback aman bila dipanggil di luar provider
    return {
      themeMode: 'terang',
      setThemeMode: async () => {},
      language: 'id',
      setLanguage: async () => {},
      markLoggedIn: async () => {},
      isDark: false,
      themeColors: colors,
      t: (key: TranslationKey) => translations.id[key],
    };
  }
  return ctx;
}
