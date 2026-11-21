import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Contrast,
  Eye,
  EyeOff,
  Globe,
  Info,
  Lock,
  LogOut,
  Moon,
  Smartphone,
  Sun,
  Trash2,
  User,
} from 'lucide-react-native';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

import {
  SheetModal,
  StatusIzinPerangkat,
  Tombol,
  useToast,
} from '@/components/ui';
import { auth, isFirebaseConfigured } from '@/config/firebase';
import {
  usePreferences,
  type BahasaApp,
  type ModeTema,
} from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';

type ActiveSheet =
  | null
  | 'tema'
  | 'bahasa'
  | 'perizinan'
  | 'akun'
  | 'password'
  | 'tentang';

export default function PengaturanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, logout } = useSession();
  const { showToast } = useToast();
  const {
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    themeColors,
    t,
  } = usePreferences();

  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  // Ganti Password State
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [lihatPasswordLama, setLihatPasswordLama] = useState(false);
  const [lihatPasswordBaru, setLihatPasswordBaru] = useState(false);
  const [lihatKonfirmasi, setLihatKonfirmasi] = useState(false);
  const [sedangSimpanPassword, setSedangSimpanPassword] = useState(false);
  const [pesanErrorPassword, setPesanErrorPassword] = useState<string | null>(
    null,
  );

  // Status Bersihkan Cache & Logout
  const [sedangBersihkanCache, setSedangBersihkanCache] = useState(false);
  const [sedangKeluar, setSedangKeluar] = useState(false);

  const labelTemaSaatIni =
    themeMode === 'terang'
      ? t('theme_light')
      : themeMode === 'gelap'
        ? t('theme_dark')
        : t('theme_system');

  const labelBahasaSaatIni =
    language === 'id' ? t('lang_id') : t('lang_en');

  const handlePilihTema = async (pilihan: ModeTema) => {
    await setThemeMode(pilihan);
    const label =
      pilihan === 'terang'
        ? t('theme_light')
        : pilihan === 'gelap'
          ? t('theme_dark')
          : t('theme_system');
    showToast(`${t('theme_toast')} ${label}`);
    setActiveSheet(null);
  };

  const handlePilihBahasa = async (pilihan: BahasaApp) => {
    await setLanguage(pilihan);
    const label =
      pilihan === 'id' ? 'Bahasa Indonesia' : 'English (US)';
    showToast(
      pilihan === 'id'
        ? `Bahasa diubah ke ${label}`
        : `Language changed to ${label}`,
    );
    setActiveSheet(null);
  };

  const handleSimpanPassword = async () => {
    setPesanErrorPassword(null);

    if (!passwordLama) {
      setPesanErrorPassword(t('pwd_err_empty'));
      return;
    }
    if (passwordBaru.length < 6) {
      setPesanErrorPassword(t('pwd_err_min'));
      return;
    }
    if (passwordBaru !== konfirmasiPassword) {
      setPesanErrorPassword(t('pwd_err_mismatch'));
      return;
    }
    if (passwordLama === passwordBaru) {
      setPesanErrorPassword(t('pwd_err_same'));
      return;
    }

    setSedangSimpanPassword(true);
    try {
      if (isFirebaseConfigured && auth.currentUser?.email) {
        const kredensial = EmailAuthProvider.credential(
          auth.currentUser.email,
          passwordLama,
        );
        await reauthenticateWithCredential(auth.currentUser, kredensial);
        await updatePassword(auth.currentUser, passwordBaru);
      }

      showToast(t('pwd_success'));
      setPasswordLama('');
      setPasswordBaru('');
      setKonfirmasiPassword('');
      setActiveSheet(null);
    } catch (err: any) {
      let pesan =
        language === 'en'
          ? 'Failed to update password. Please try again.'
          : 'Gagal memperbarui kata sandi. Silakan coba lagi.';
      if (
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        pesan =
          language === 'en'
            ? 'Current password is incorrect.'
            : 'Kata sandi saat ini salah.';
      } else if (err?.code === 'auth/weak-password') {
        pesan = t('pwd_err_min');
      } else if (err?.code === 'auth/requires-recent-login') {
        pesan =
          language === 'en'
            ? 'Session expired. Please log out and sign in again.'
            : 'Sesi kedaluwarsa. Silakan keluar dan masuk kembali.';
      } else if (err?.code === 'auth/network-request-failed') {
        pesan =
          language === 'en'
            ? 'Network error. Check your internet connection.'
            : 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
      }
      setPesanErrorPassword(pesan);
    } finally {
      setSedangSimpanPassword(false);
    }
  };

  const handleBersihkanCache = async () => {
    const aksiBersihkan = async () => {
      setSedangBersihkanCache(true);
      try {
        const semuaKeys = await AsyncStorage.getAllKeys();
        const keysHapus = semuaKeys.filter(
          (k) =>
            !k.includes('firebase') &&
            !k.includes('user') &&
            !k.includes('auth') &&
            !k.includes('@tapin_theme_mode') &&
            !k.includes('@tapin_app_language'),
        );
        if (keysHapus.length > 0) {
          await AsyncStorage.multiRemove(keysHapus);
        }
        showToast(t('cache_success'));
      } catch {
        showToast(t('cache_fail'));
      } finally {
        setSedangBersihkanCache(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('cache_confirm'))) {
        await aksiBersihkan();
      }
      return;
    }

    Alert.alert(t('cache_title'), t('cache_confirm'), [
      { text: t('perm_cancel'), style: 'cancel' },
      { text: t('cache_action'), style: 'destructive', onPress: aksiBersihkan },
    ]);
  };

  const handleLogout = () => {
    const jalankanLogout = async () => {
      if (sedangKeluar) return;
      setSedangKeluar(true);
      try {
        const hasil = await logout();
        if (!hasil.ok) {
          showToast(hasil.alasan);
          return;
        }
        showToast(t('profile_logout_success'));
        router.replace('/');
      } finally {
        setSedangKeluar(false);
      }
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(t('logout_confirm_msg'))
      ) {
        void jalankanLogout();
      }
      return;
    }

    Alert.alert(t('logout_confirm_title'), t('logout_confirm_msg'), [
      { text: t('perm_cancel'), style: 'cancel' },
      {
        text: t('settings_logout'),
        style: 'destructive',
        onPress: jalankanLogout,
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      {/* Minimalist Top Bar (referensi screenshot) */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + spacing.s2,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backHit,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeft size={26} color={themeColors.textPrimary} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: themeColors.textPrimary }]}
        >
          {t('settings_title')}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* GROUP 1: AKUN / ACCOUNT */}
        <Text
          style={[styles.groupTitle, { color: themeColors.textPrimary }]}
        >
          {t('settings_group_account')}
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('akun')}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <User size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_account_info')}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: themeColors.textMuted }]}
                numberOfLines={1}
              >
                {currentUser?.nama ?? '-'}
              </Text>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </View>
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setPesanErrorPassword(null);
              setActiveSheet('password');
            }}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <Lock size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_change_password')}
              </Text>
            </View>
            <ChevronRight size={18} color={themeColors.textMuted} />
          </Pressable>
        </View>

        {/* GROUP 2: PREFERENSI / PREFERENCES */}
        <Text
          style={[styles.groupTitle, { color: themeColors.textPrimary }]}
        >
          {t('settings_group_preferences')}
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {/* Tema */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('tema')}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <Contrast size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_theme')}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: themeColors.textMuted }]}
              >
                {labelTemaSaatIni}
              </Text>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </View>
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          {/* Bahasa */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('bahasa')}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <Globe size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_language')}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: themeColors.textMuted }]}
              >
                {labelBahasaSaatIni}
              </Text>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </View>
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          {/* Perizinan Perangkat */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('perizinan')}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <Bell size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_permissions')}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: themeColors.textMuted }]}
              >
                {t('settings_permissions_val')}
              </Text>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </View>
          </Pressable>
        </View>

        {/* GROUP 3: SISTEM & DATA / DATA MANAGEMENT */}
        <Text
          style={[styles.groupTitle, { color: themeColors.textPrimary }]}
        >
          {t('settings_group_system')}
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {/* Bersihkan Cache */}
          <Pressable
            accessibilityRole="button"
            onPress={handleBersihkanCache}
            disabled={sedangBersihkanCache}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              {sedangBersihkanCache ? (
                <ActivityIndicator
                  size="small"
                  color={themeColors.textPrimary}
                />
              ) : (
                <Trash2 size={20} color={themeColors.textPrimary} />
              )}
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_clear_cache')}
              </Text>
            </View>
            <ChevronRight size={18} color={themeColors.textMuted} />
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          {/* Tentang Aplikasi */}
          <Pressable
            accessibilityRole="button"
            onPress={() => setActiveSheet('tentang')}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <Info size={20} color={themeColors.textPrimary} />
              <Text
                style={[styles.rowLabel, { color: themeColors.textPrimary }]}
              >
                {t('settings_about')}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text
                style={[styles.rowValue, { color: themeColors.textMuted }]}
              >
                v1.0.0
              </Text>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </View>
          </Pressable>

          <View
            style={[styles.divider, { backgroundColor: themeColors.border }]}
          />

          {/* Keluar / Logout */}
          <Pressable
            accessibilityRole="button"
            onPress={handleLogout}
            disabled={sedangKeluar}
            style={({ pressed }) => [
              styles.rowItem,
              pressed && { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <View style={styles.rowLeft}>
              <LogOut size={20} color={themeColors.errorFg} />
              <Text
                style={[styles.rowLabel, { color: themeColors.errorFg }]}
              >
                {t('settings_logout')}
              </Text>
            </View>
            <ChevronRight size={18} color={themeColors.errorFg} />
          </Pressable>
        </View>
      </ScrollView>

      {/* ================================================================= */}
      {/* SHEET 1: PILIH TEMA (TERANG / GELAP / SESUAI HP)                  */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'tema'}
        judul={t('theme_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {(
            [
              {
                key: 'terang' as ModeTema,
                title: t('theme_light'),
                desc: t('theme_light_desc'),
                Icon: Sun,
              },
              {
                key: 'gelap' as ModeTema,
                title: t('theme_dark'),
                desc: t('theme_dark_desc'),
                Icon: Moon,
              },
              {
                key: 'sistem' as ModeTema,
                title: t('theme_system'),
                desc: t('theme_system_desc'),
                Icon: Smartphone,
              },
            ] as const
          ).map((item, idx) => {
            const selected = themeMode === item.key;
            const IconComp = item.Icon;
            return (
              <React.Fragment key={item.key}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: themeColors.border },
                    ]}
                  />
                )}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => handlePilihTema(item.key)}
                  style={({ pressed }) => [
                    styles.sheetOptionRow,
                    selected && { backgroundColor: themeColors.primarySoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <View
                      style={[
                        styles.sheetIconTile,
                        {
                          backgroundColor: selected
                            ? themeColors.primary
                            : themeColors.surfaceMuted,
                        },
                      ]}
                    >
                      <IconComp
                        size={18}
                        color={
                          selected
                            ? themeColors.onPrimary
                            : themeColors.textPrimary
                        }
                      />
                    </View>
                    <View style={styles.sheetOptionCopy}>
                      <Text
                        style={[
                          styles.sheetOptionTitle,
                          { color: themeColors.textPrimary },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.sheetOptionDesc,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                  {selected ? (
                    <View
                      style={[
                        styles.radioCheck,
                        { backgroundColor: themeColors.primary },
                      ]}
                    >
                      <Check size={14} color={themeColors.onPrimary} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.radioUncheck,
                        { borderColor: themeColors.border },
                      ]}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      </SheetModal>

      {/* ================================================================= */}
      {/* SHEET 2: PILIH BAHASA                                             */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'bahasa'}
        judul={t('lang_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {(
            [
              {
                key: 'id' as BahasaApp,
                flag: '🇮🇩',
                title: t('lang_id_full'),
                desc: 'Bahasa Indonesia',
              },
              {
                key: 'en' as BahasaApp,
                flag: '🇬🇧',
                title: t('lang_en_full'),
                desc: 'English',
              },
            ] as const
          ).map((item, idx) => {
            const selected = language === item.key;
            return (
              <React.Fragment key={item.key}>
                {idx > 0 && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: themeColors.border },
                    ]}
                  />
                )}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => handlePilihBahasa(item.key)}
                  style={({ pressed }) => [
                    styles.sheetOptionRow,
                    selected && { backgroundColor: themeColors.primarySoft },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.rowLeft}>
                    <Text style={styles.flagEmoji}>{item.flag}</Text>
                    <View style={styles.sheetOptionCopy}>
                      <Text
                        style={[
                          styles.sheetOptionTitle,
                          { color: themeColors.textPrimary },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.sheetOptionDesc,
                          { color: themeColors.textSecondary },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                  {selected ? (
                    <View
                      style={[
                        styles.radioCheck,
                        { backgroundColor: themeColors.primary },
                      ]}
                    >
                      <Check size={14} color={themeColors.onPrimary} />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.radioUncheck,
                        { borderColor: themeColors.border },
                      ]}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      </SheetModal>

      {/* ================================================================= */}
      {/* SHEET 3: PERIZINAN PERANGKAT                                      */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'perizinan'}
        judul={t('perm_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <StatusIzinPerangkat style={{ marginBottom: 0 }} />
      </SheetModal>

      {/* ================================================================= */}
      {/* SHEET 4: INFORMASI AKUN                                           */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'akun'}
        judul={t('acc_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          {[
            { label: t('acc_name'), value: currentUser?.nama ?? '-' },
            { label: t('profile_email'), value: currentUser?.email ?? '-' },
            { label: t('acc_nim'), value: currentUser?.nim ?? '-' },
            { label: t('acc_class'), value: currentUser?.kelas ?? '-' },
            {
              label: t('acc_role'),
              value:
                currentUser?.peran === 'asisten'
                  ? t('role_assistant')
                  : t('role_student'),
            },
          ].map((item, idx) => (
            <React.Fragment key={item.label}>
              {idx > 0 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: themeColors.border },
                  ]}
                />
              )}
              <View style={styles.infoRow}>
                <Text
                  style={[
                    styles.infoLabel,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: themeColors.textPrimary },
                  ]}
                >
                  {item.value}
                </Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </SheetModal>

      {/* ================================================================= */}
      {/* SHEET 5: GANTI KATA SANDI                                         */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'password'}
        judul={t('pwd_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <View style={styles.passwordForm}>
          {pesanErrorPassword ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: themeColors.errorBg,
                  borderColor: themeColors.dangerBorder,
                },
              ]}
            >
              <Text
                style={[styles.errorText, { color: themeColors.errorFg }]}
              >
                {pesanErrorPassword}
              </Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text
              style={[styles.inputLabel, { color: themeColors.textPrimary }]}
            >
              {t('pwd_current_label')}
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                },
              ]}
            >
              <TextInput
                secureTextEntry={!lihatPasswordLama}
                value={passwordLama}
                onChangeText={setPasswordLama}
                placeholder={t('pwd_current_placeholder')}
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  { color: themeColors.textPrimary },
                ]}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setLihatPasswordLama((v) => !v)}
                hitSlop={8}
              >
                {lihatPasswordLama ? (
                  <EyeOff size={18} color={themeColors.textSecondary} />
                ) : (
                  <Eye size={18} color={themeColors.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[styles.inputLabel, { color: themeColors.textPrimary }]}
            >
              {t('pwd_new_label')}
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                },
              ]}
            >
              <TextInput
                secureTextEntry={!lihatPasswordBaru}
                value={passwordBaru}
                onChangeText={setPasswordBaru}
                placeholder={t('pwd_new_placeholder')}
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  { color: themeColors.textPrimary },
                ]}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setLihatPasswordBaru((v) => !v)}
                hitSlop={8}
              >
                {lihatPasswordBaru ? (
                  <EyeOff size={18} color={themeColors.textSecondary} />
                ) : (
                  <Eye size={18} color={themeColors.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[styles.inputLabel, { color: themeColors.textPrimary }]}
            >
              {t('pwd_confirm_label')}
            </Text>
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.surface,
                },
              ]}
            >
              <TextInput
                secureTextEntry={!lihatKonfirmasi}
                value={konfirmasiPassword}
                onChangeText={setKonfirmasiPassword}
                placeholder={t('pwd_confirm_placeholder')}
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  { color: themeColors.textPrimary },
                ]}
                autoCapitalize="none"
              />
              <Pressable
                onPress={() => setLihatKonfirmasi((v) => !v)}
                hitSlop={8}
              >
                {lihatKonfirmasi ? (
                  <EyeOff size={18} color={themeColors.textSecondary} />
                ) : (
                  <Eye size={18} color={themeColors.textSecondary} />
                )}
              </Pressable>
            </View>
          </View>

          <Tombol
            variant="primer"
            onPress={handleSimpanPassword}
            loading={sedangSimpanPassword}
            style={{ marginTop: spacing.s2 }}
          >
            {t('pwd_save_btn')}
          </Tombol>
        </View>
      </SheetModal>

      {/* ================================================================= */}
      {/* SHEET 6: TENTANG APLIKASI                                         */}
      {/* ================================================================= */}
      <SheetModal
        visible={activeSheet === 'tentang'}
        judul={t('about_sheet_title')}
        onClose={() => setActiveSheet(null)}
      >
        <View
          style={[
            styles.sheetCard,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              padding: spacing.s4,
              gap: spacing.s2,
            },
          ]}
        >
          <Text
            style={[
              styles.sheetOptionTitle,
              { color: themeColors.textPrimary },
            ]}
          >
            TapIn Mobile
          </Text>
          <Text
            style={[
              styles.sheetOptionDesc,
              { color: themeColors.textSecondary, lineHeight: 20 },
            ]}
          >
            {t('about_desc')}
          </Text>
          <View
            style={[
              styles.divider,
              { backgroundColor: themeColors.border, marginVertical: spacing.s2 },
            ]}
          />
          <View style={styles.aboutRow}>
            <Text
              style={[styles.infoLabel, { color: themeColors.textSecondary }]}
            >
              {t('about_version')}
            </Text>
            <Text
              style={[styles.infoValue, { color: themeColors.textPrimary }]}
            >
              1.0.0
            </Text>
          </View>
          <View style={styles.aboutRow}>
            <Text
              style={[styles.infoLabel, { color: themeColors.textSecondary }]}
            >
              {t('about_build')}
            </Text>
            <Text
              style={[styles.infoValue, { color: themeColors.textPrimary }]}
            >
              Sprint 3
            </Text>
          </View>
        </View>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.screenPadding - 4,
    paddingBottom: spacing.s3,
    gap: spacing.s2,
  },
  backHit: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...type.h1,
    fontSize: 22,
    lineHeight: 28,
  },
  pressed: {
    opacity: 0.7,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s2,
    paddingBottom: spacing.s8 + 20,
  },
  groupTitle: {
    ...type.body,
    fontFamily: fontFamily.bold,
    marginTop: spacing.s4,
    marginBottom: spacing.s2 + 2,
    paddingLeft: 4,
  },
  groupCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.card,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s4,
    gap: spacing.s3,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3 + 2,
    flex: 1,
  },
  rowLabel: {
    ...type.body,
    fontFamily: fontFamily.medium,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '45%',
  },
  rowValue: {
    ...type.caption,
    fontFamily: fontFamily.medium,
  },
  divider: {
    height: 1,
    marginLeft: spacing.s4,
  },
  sheetCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3 + 2,
    gap: spacing.s3,
  },
  sheetIconTile: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionCopy: {
    flex: 1,
    gap: 2,
  },
  sheetOptionTitle: {
    ...type.body,
    fontFamily: fontFamily.bold,
  },
  sheetOptionDesc: {
    ...type.micro,
  },
  flagEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  radioCheck: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioUncheck: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3 + 2,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    ...type.caption,
  },
  infoValue: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
  passwordForm: {
    gap: spacing.s3,
  },
  errorBox: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: {
    ...type.micro,
    fontFamily: fontFamily.bold,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...type.caption,
    fontFamily: fontFamily.bold,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.s3,
    height: 46,
  },
  textInput: {
    flex: 1,
    ...type.body,
    fontFamily: fontFamily.regular,
    paddingVertical: 0,
  },
});
