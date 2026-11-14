import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
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
type AuthField = 'nama' | 'nim' | 'kelas' | 'email' | 'password';
type FieldErrors = Partial<Record<AuthField, string>>;

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POLA_NIM = /^\d{6,20}$/;
const POLA_KELAS = /^[A-Z]{2,4}-?\d[A-Z]?$/;

const PESAN_ERROR_UMUM =
  'Terjadi kesalahan saat memproses akun. Periksa koneksi internetmu dan coba lagi.';

const berandaUntuk = (peran: Peran) =>
  peran === 'asisten' ? '/beranda-asisten' : '/beranda-praktikan';

function mapAuthError(kode: string): string {
  switch (kode) {
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email atau kata sandi salah.';
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/network-request-failed':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internetmu.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan. Hubungi asisten atau admin.';
    case 'auth/operation-not-allowed':
      return 'Metode login ini belum diaktifkan. Hubungi pengelola aplikasi.';
    case 'auth/internal-error':
      return 'Terjadi gangguan pada layanan autentikasi. Coba lagi.';
    default:
      return PESAN_ERROR_UMUM;
  }
}

function pesanUntukAlasan(alasan: string): string {
  return alasan.startsWith('auth/') ? mapAuthError(alasan) : alasan;
}

type ValidasiAuthInput = {
  authMode: AuthMode;
  peran: Peran;
  nama: string;
  nim: string;
  kelas: string;
  email: string;
  password: string;
};

function validateAuthForm({
  authMode,
  peran,
  nama,
  nim,
  kelas,
  email,
  password,
}: ValidasiAuthInput): FieldErrors {
  const hasil: FieldErrors = {};

  if (authMode === 'register') {
    if (nama.trim().length < 3) {
      hasil.nama = 'Nama lengkap minimal 3 karakter.';
    }

    if (!POLA_NIM.test(nim.trim())) {
      hasil.nim = 'NIM/ID hanya boleh berisi angka (6–20 digit).';
    }

    if (peran === 'praktikan' && !POLA_KELAS.test(kelas.trim().toUpperCase())) {
      hasil.kelas = 'Format kelas tidak valid. Contoh: IF-2A.';
    }
  }

  if (!POLA_EMAIL.test(email.trim().toLowerCase())) {
    hasil.email = 'Masukkan alamat email yang valid.';
  }

  if (password.trim().length < 6) {
    hasil.password = 'Kata sandi minimal 6 karakter.';
  }

  return hasil;
}

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { currentUser, loading, loginWithEmail, registerUser, logout } =
    useSession();
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>(
    {},
  );
  const [submitted, setSubmitted] = useState(false);

  const refNama = useRef<TextInputInstance>(null);
  const refNim = useRef<TextInputInstance>(null);
  const refKelas = useRef<TextInputInstance>(null);
  const refEmail = useRef<TextInputInstance>(null);
  const refPassword = useRef<TextInputInstance>(null);
  const redirectAwalSelesai = useRef(false);

  useEffect(() => {
    if (params.mode === 'register') {
      setAuthMode('register');
    }
  }, [params.mode]);

  useEffect(() => {
    if (loading || redirectAwalSelesai.current) return;
    redirectAwalSelesai.current = true;
    if (currentUser) {
      router.replace(berandaUntuk(currentUser.peran));
    }
  }, [loading, currentUser, router]);

  const bersihkanErrorField = (field: AuthField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const berikutnya = { ...prev };
      delete berikutnya[field];
      return berikutnya;
    });
    setPesanError(null);
  };

  const ubahField =
    (field: AuthField, setter: (nilai: string) => void) =>
    (nilai: string) => {
      setter(nilai);
      bersihkanErrorField(field);
    };

  const tandaiTouched = (field: AuthField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errorField = (field: AuthField) =>
    touched[field] || submitted ? errors[field] : undefined;

  const handleGantiMode = (modeBaru: AuthMode) => {
    setAuthMode(modeBaru);
    setErrors({});
    setPesanError(null);
    setSubmitted(false);
  };

  const handleGantiPeran = (peranBaru: Peran) => {
    setPeran(peranBaru);
    setErrors({});
    setPesanError(null);
    setSubmitted(false);
  };

  const formTerisi =
    authMode === 'login'
      ? email.trim().length > 0 && password.trim().length > 0
      : nama.trim().length > 0 &&
        nim.trim().length > 0 &&
        (peran === 'asisten' || kelas.trim().length > 0) &&
        email.trim().length > 0 &&
        password.trim().length > 0;

  const tanganiKegagalanAuth = async (alasan: string) => {
    // TODO(auth): mitigasi sementara — logout() mencegah fallback user dari
    // SessionContext ikut terpakai saat autentikasi gagal. PM akan memperbaiki
    // fallback tersebut langsung di SessionContext.
    await logout();
    setPesanError(pesanUntukAlasan(alasan));
  };

  const handleSubmit = async () => {
    if (sedangMemproses) return;

    redirectAwalSelesai.current = true;
    setPesanError(null);

    const hasilValidasi = validateAuthForm({
      authMode,
      peran,
      nama,
      nim,
      kelas,
      email,
      password,
    });

    if (Object.keys(hasilValidasi).length > 0) {
      setErrors(hasilValidasi);
      setSubmitted(true);

      const urutanField: AuthField[] =
        authMode === 'register'
          ? peran === 'praktikan'
            ? ['nama', 'nim', 'kelas', 'email', 'password']
            : ['nama', 'nim', 'email', 'password']
          : ['email', 'password'];
      const fieldPertamaTidakValid = urutanField.find(
        (field) => hasilValidasi[field],
      );
      const refsField = {
        nama: refNama,
        nim: refNim,
        kelas: refKelas,
        email: refEmail,
        password: refPassword,
      };

      if (fieldPertamaTidakValid) {
        refsField[fieldPertamaTidakValid].current?.focus();
      }
      return;
    }

    setErrors({});
    Keyboard.dismiss();
    setSedangMemproses(true);

    try {
      if (authMode === 'login') {
        const res = await loginWithEmail(email.trim().toLowerCase(), password);

        if (!res.ok) {
          await tanganiKegagalanAuth(res.alasan);
          return;
        }

        showToast(`Selamat datang kembali, ${res.user.nama.split(' ')[0]}!`);
        router.replace(berandaUntuk(res.user.peran));
        return;
      }

      const res = await registerUser({
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        password,
        peran,
        nim: nim.trim(),
        kelas: peran === 'praktikan' ? kelas.trim().toUpperCase() : undefined,
      });

      if (!res.ok) {
        await tanganiKegagalanAuth(res.alasan);
        return;
      }

      showToast(`Akun ${res.user.nama.split(' ')[0]} berhasil dibuat.`);
      router.replace(berandaUntuk(res.user.peran));
    } catch (err: any) {
      const kode = typeof err?.code === 'string' ? err.code : null;
      setPesanError(kode ? mapAuthError(kode) : PESAN_ERROR_UMUM);
    } finally {
      setSedangMemproses(false);
    }
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
                accessibilityLabel="Tab Masuk"
                accessibilityHint="Tampilkan formulir untuk masuk ke aplikasi."
                accessibilityState={{
                  selected: authMode === 'login',
                  disabled: sedangMemproses,
                }}
                disabled={sedangMemproses}
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
                accessibilityLabel="Tab Daftar Akun"
                accessibilityHint="Tampilkan formulir untuk membuat akun baru."
                accessibilityState={{
                  selected: authMode === 'register',
                  disabled: sedangMemproses,
                }}
                disabled={sedangMemproses}
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
                accessibilityLabel="Peran praktikan"
                accessibilityHint="Pilih peran praktikan untuk akun ini."
                accessibilityState={{
                  selected: peran === 'praktikan',
                  disabled: sedangMemproses,
                }}
                disabled={sedangMemproses}
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
                accessibilityLabel="Peran asisten"
                accessibilityHint="Pilih peran asisten untuk akun ini."
                accessibilityState={{
                  selected: peran === 'asisten',
                  disabled: sedangMemproses,
                }}
                disabled={sedangMemproses}
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
                    ref={refNama}
                    value={nama}
                    onChangeText={ubahField('nama', setNama)}
                    onBlur={() => tandaiTouched('nama')}
                    placeholder="Contoh: Alya Ramadhani"
                    placeholderTextColor={colors.textMuted}
                    editable={!sedangMemproses}
                    accessibilityLabel="Nama lengkap"
                    accessibilityHint="Isi nama lengkap sesuai identitas praktikum."
                    style={[styles.input, errorField('nama') && styles.inputError]}
                  />
                  {errorField('nama') && (
                    <Text style={styles.fieldError}>{errorField('nama')}</Text>
                  )}
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                    <Text style={styles.fieldLabel}>NIM / ID</Text>
                    <TextInput
                      ref={refNim}
                      value={nim}
                      onChangeText={(nilai) => {
                        setNim(nilai.replace(/\D/g, ''));
                        bersihkanErrorField('nim');
                      }}
                      onBlur={() => tandaiTouched('nim')}
                      placeholder="2310512001"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={20}
                      importantForAutofill="yes"
                      editable={!sedangMemproses}
                      accessibilityLabel="NIM atau ID"
                      accessibilityHint="Hanya angka, 6 sampai 20 digit."
                      style={[styles.input, errorField('nim') && styles.inputError]}
                    />
                    {errorField('nim') && (
                      <Text style={styles.fieldError}>{errorField('nim')}</Text>
                    )}
                  </View>

                  {peran === 'praktikan' && (
                    <View style={[styles.fieldGroup, { flex: 0.8 }]}>
                      <Text style={styles.fieldLabel}>Kelas</Text>
                      <TextInput
                        ref={refKelas}
                        value={kelas}
                        onChangeText={ubahField('kelas', setKelas)}
                        onBlur={() => tandaiTouched('kelas')}
                        placeholder="IF-2A"
                        placeholderTextColor={colors.textMuted}
                        autoCapitalize="characters"
                        editable={!sedangMemproses}
                        accessibilityLabel="Kelas"
                        accessibilityHint="Gunakan format seperti IF-2A."
                        style={[
                          styles.input,
                          errorField('kelas') && styles.inputError,
                        ]}
                      />
                      {errorField('kelas') && (
                        <Text style={styles.fieldError}>
                          {errorField('kelas')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Email & Password Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Alamat email</Text>
              <TextInput
                ref={refEmail}
                value={email}
                onChangeText={ubahField('email', setEmail)}
                onBlur={() => tandaiTouched('email')}
                placeholder={
                  peran === 'asisten'
                    ? 'nama.asisten@tapin.ac.id'
                    : 'nama.praktikan@tapin.ac.id'
                }
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!sedangMemproses}
                accessibilityLabel="Alamat email"
                accessibilityHint="Gunakan alamat email aktif yang valid."
                style={[styles.input, errorField('email') && styles.inputError]}
              />
              {errorField('email') && (
                <Text style={styles.fieldError}>{errorField('email')}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Kata sandi</Text>
              <View
                style={[
                  styles.passwordWrap,
                  errorField('password') && styles.inputError,
                ]}
              >
                <TextInput
                  ref={refPassword}
                  value={password}
                  onChangeText={ubahField('password', setPassword)}
                  onBlur={() => tandaiTouched('password')}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!lihatPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={
                    authMode === 'login' ? 'current-password' : 'new-password'
                  }
                  textContentType={
                    authMode === 'login' ? 'password' : 'newPassword'
                  }
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!sedangMemproses}
                  accessibilityLabel="Kata sandi"
                  accessibilityHint="Minimal 6 karakter."
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
              {errorField('password') && (
                <Text style={styles.fieldError}>
                  {errorField('password')}
                </Text>
              )}
            </View>

            {pesanError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{pesanError}</Text>
              </View>
            )}

            <Tombol
              variant="primer"
              disabled={!formTerisi}
              loading={sedangMemproses}
              onPress={handleSubmit}
              rightIcon={<ArrowRight size={19} color={colors.onPrimary} />}
              style={styles.submitButton}
            >
              {authMode === 'login' ? 'Masuk ke aplikasi' : 'Buat akun sekarang'}
            </Tombol>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sedangMemproses }}
              disabled={sedangMemproses}
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
  fieldError: {
    ...type.micro,
    color: colors.errorFg,
    marginTop: 6,
    marginLeft: 2,
  },
  inputError: {
    borderColor: colors.dangerBorder,
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
