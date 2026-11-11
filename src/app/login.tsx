import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { Brand, Tombol, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { type Peran } from '@/data/dummy';
import { colors, fontFamily, radius, shadows, spacing, type } from '@/theme/tokens';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { currentUser, loginWithEmail, registerUser } = useSession();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<AuthMode>(
    params.mode === 'register' ? 'register' : 'login',
  );
  const [peran, setPeran] = useState<Peran>('praktikan');
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [kelas, setKelas] = useState('IF-2A');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lihatPassword, setLihatPassword] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [sedangMemproses, setSedangMemproses] = useState(false);

  useEffect(() => {
    if (params.mode === 'register') {
      setAuthMode('register');
    }
  }, [params.mode]);

  useEffect(() => {
    if (!currentUser) return;
    router.replace(
      (currentUser.peran === 'praktikan'
        ? '/beranda-praktikan'
        : '/beranda-asisten') as any,
    );
  }, [currentUser, router]);

  const handleGantiMode = (modeBaru: AuthMode) => {
    setAuthMode(modeBaru);
    setPesanError(null);
  };

  const handleGantiPeran = (peranBaru: Peran) => {
    setPeran(peranBaru);
    setPesanError(null);
  };

  const isFormValid =
    authMode === 'login'
      ? email.trim().length > 0 && password.trim().length > 0
      : nama.trim().length > 0 &&
        nim.trim().length > 0 &&
        (peran === 'asisten' || kelas.trim().length > 0) &&
        email.trim().length > 0 &&
        password.trim().length > 0;

  const handleSubmit = () => {
    if (!isFormValid || sedangMemproses) return;
    setPesanError(null);
    setSedangMemproses(true);

    setTimeout(() => {
      if (authMode === 'login') {
        const res = loginWithEmail(email, password, peran);
        setSedangMemproses(false);
        if (!res.ok) {
          setPesanError(res.alasan);
          return;
        }
        showToast(`Selamat datang kembali, ${res.user.nama.split(' ')[0]}!`);
      } else {
        const res = registerUser({
          nama,
          email,
          password,
          peran,
          nim,
          kelas: peran === 'praktikan' ? kelas : undefined,
        });
        setSedangMemproses(false);
        if (!res.ok) {
          setPesanError(res.alasan);
          return;
        }
        showToast(`Akun ${res.user.nama.split(' ')[0]} berhasil dibuat.`);
      }
    }, 250);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Kembali ke halaman awal"
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.backIconBtn,
                pressed && styles.backIconBtnPressed,
              ]}
            >
              <ArrowLeft size={21} color={colors.onGraphite} />
            </Pressable>
            <Brand compact onDark />
            <View style={styles.topSpacer} />
          </View>

          {/* Intro Center */}
          <View style={styles.introSection}>
            <View style={styles.orbit}>
              <Brand large showWordmark={false} />
            </View>
            <Text style={styles.darkEyebrow}>
              {authMode === 'login' ? 'SELAMAT DATANG' : 'REGISTRASI AKUN'}
            </Text>
            <Text style={styles.introTitle}>
              {authMode === 'login' ? 'Masuk ke TapIn' : 'Buat Akun TapIn'}
            </Text>
            <Text style={styles.introSub}>
              {authMode === 'login'
                ? 'Masuk dengan akun sesuai peranmu untuk melanjutkan.'
                : 'Daftarkan identitas dan peranmu untuk mengakses praktikum.'}
            </Text>
          </View>

          {/* Form Sheet */}
          <View style={styles.formSheet}>
            {/* Mode Switcher: Masuk / Daftar */}
            <View style={styles.modeTabs}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'login' }}
                onPress={() => handleGantiMode('login')}
                style={[
                  styles.modeTab,
                  authMode === 'login' && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    authMode === 'login' && styles.modeTabTextActive,
                  ]}
                >
                  Masuk
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'register' }}
                onPress={() => handleGantiMode('register')}
                style={[
                  styles.modeTab,
                  authMode === 'register' && styles.modeTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    authMode === 'register' && styles.modeTabTextActive,
                  ]}
                >
                  Daftar Akun
                </Text>
              </Pressable>
            </View>

            {/* Role Switch */}
            <Text style={styles.fieldLabel}>
              {authMode === 'login' ? 'Masuk sebagai' : 'Daftar sebagai'}
            </Text>
            <View style={styles.roleSwitch}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: peran === 'praktikan' }}
                onPress={() => handleGantiPeran('praktikan')}
                style={[
                  styles.roleButton,
                  peran === 'praktikan' && styles.roleButtonActive,
                ]}
              >
                <UserRound
                  size={18}
                  color={
                    peran === 'praktikan'
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    peran === 'praktikan' && styles.roleButtonTextActive,
                  ]}
                >
                  Praktikan
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: peran === 'asisten' }}
                onPress={() => handleGantiPeran('asisten')}
                style={[
                  styles.roleButton,
                  peran === 'asisten' && styles.roleButtonActive,
                ]}
              >
                <ShieldCheck
                  size={18}
                  color={
                    peran === 'asisten'
                      ? colors.textPrimary
                      : colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.roleButtonText,
                    peran === 'asisten' && styles.roleButtonTextActive,
                  ]}
                >
                  Asisten
                </Text>
              </Pressable>
            </View>

            {/* Register-only Fields */}
            {authMode === 'register' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Nama lengkap</Text>
                  <TextInput
                    value={nama}
                    onChangeText={setNama}
                    placeholder="Contoh: Alya Ramadhani"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                    <Text style={styles.fieldLabel}>NIM / ID</Text>
                    <TextInput
                      value={nim}
                      onChangeText={setNim}
                      placeholder="2310512001"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      style={styles.input}
                    />
                  </View>

                  {peran === 'praktikan' && (
                    <View style={[styles.fieldGroup, { flex: 0.8 }]}>
                      <Text style={styles.fieldLabel}>Kelas</Text>
                      <TextInput
                        value={kelas}
                        onChangeText={setKelas}
                        placeholder="IF-2A"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="characters"
                        style={styles.input}
                      />
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Email & Password Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Alamat email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={
                  peran === 'asisten'
                    ? 'nama.asisten@tapin.ac.id'
                    : 'nama.praktikan@tapin.ac.id'
                }
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Kata sandi</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!lihatPassword}
                  autoCapitalize="none"
                  style={styles.passwordInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    lihatPassword
                      ? 'Sembunyikan kata sandi'
                      : 'Tampilkan kata sandi'
                  }
                  onPress={() => setLihatPassword((v) => !v)}
                  style={styles.eyeButton}
                >
                  {lihatPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {pesanError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{pesanError}</Text>
              </View>
            )}

            <Tombol
              variant="primer"
              disabled={!isFormValid}
              loading={sedangMemproses}
              onPress={handleSubmit}
              rightIcon={<ArrowRight size={19} color={colors.onPrimary} />}
              style={styles.submitButton}
            >
              {authMode === 'login' ? 'Masuk ke aplikasi' : 'Buat akun sekarang'}
            </Tombol>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                handleGantiMode(authMode === 'login' ? 'register' : 'login')
              }
              style={styles.switchAuthLink}
            >
              <Text style={styles.switchAuthText}>
                {authMode === 'login'
                  ? 'Belum memiliki akun? '
                  : 'Sudah memiliki akun? '}
                <Text style={styles.switchAuthHighlight}>
                  {authMode === 'login' ? 'Daftar di sini' : 'Masuk di sini'}
                </Text>
              </Text>
            </Pressable>

            <Text style={styles.disclaimer}>
              Hak akses layar dan tindakan disesuaikan secara otomatis berdasarkan
              peran akun yang terautentikasi.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.graphite,
  },
  topBar: {
    minHeight: 76,
    paddingHorizontal: spacing.s5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIconBtnPressed: {
    opacity: 0.75,
  },
  topSpacer: {
    width: 42,
  },
  introSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.s6,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s6,
  },
  orbit: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.16)',
    backgroundColor: 'rgba(196, 241, 91, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s4,
  },
  darkEyebrow: {
    ...type.micro,
    color: colors.primary,
    letterSpacing: 1.3,
  },
  introTitle: {
    ...type.h1,
    color: colors.onGraphite,
    marginTop: spacing.s2,
    textAlign: 'center',
  },
  introSub: {
    ...type.caption,
    color: colors.textOnDarkMuted,
    marginTop: spacing.s2,
    textAlign: 'center',
  },
  formSheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s8,
  },
  modeTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.s5,
  },
  modeTab: {
    flex: 1,
    paddingBottom: spacing.s3,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: colors.graphite,
  },
  modeTabText: {
    ...type.bodyStrong,
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  fieldLabel: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.s2,
    marginLeft: 2,
  },
  roleSwitch: {
    flexDirection: 'row',
    gap: 6,
    padding: 5,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.s4,
  },
  roleButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
  },
  roleButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  roleButtonText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  roleButtonTextActive: {
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  },
  rowFields: {
    flexDirection: 'row',
    gap: spacing.s3,
  },
  fieldGroup: {
    marginBottom: spacing.s4,
  },
  input: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s4,
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  passwordWrap: {
    height: 52,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.s4,
    paddingRight: spacing.s2,
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    padding: spacing.s3,
    borderRadius: radius.button,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginBottom: spacing.s3,
  },
  errorText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.errorFg,
  },
  submitButton: {
    marginTop: spacing.s2,
  },
  switchAuthLink: {
    marginTop: spacing.s4,
    paddingVertical: spacing.s1,
    alignItems: 'center',
  },
  switchAuthText: {
    ...type.caption,
    color: colors.textSecondary,
  },
  switchAuthHighlight: {
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  disclaimer: {
    ...type.micro,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s4,
    lineHeight: 16,
  },
});
