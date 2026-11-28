import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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
  UserRound,
} from 'lucide-react-native';

import {
  pesanUntukAlasan,
  validateAuthForm,
  type AuthField,
  type AuthMode,
  type FieldErrors,
} from '@/components/auth/validasiLogin';
import { teksLogin } from '@/components/auth/teksLogin';
import { Brand, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Peran } from '@/data/dummy';
import { fontFamily, radius, spacing, type, type ThemeColors } from '@/theme/tokens';

const berandaUntuk = (peran: Peran): string => {
  if (peran === 'aslab') return '/(aslab)/(tabs)/beranda-aslab';
  if (peran === 'asisten') return '/(asisten)/(tabs)/beranda-asisten';
  return '/(praktikan)/(tabs)/beranda-praktikan';
};

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { currentUser, loading, loginWithEmail, registerUser } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const teks = teksLogin(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  const [authMode, setAuthMode] = useState<AuthMode>(
    params.mode === 'register' ? 'register' : 'login',
  );
  const [nama, setNama] = useState('');
  const [nim, setNim] = useState('');
  const [kelas, setKelas] = useState('IF-2A');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
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
  const refKonfirmasi = useRef<TextInputInstance>(null);
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
      router.replace(berandaUntuk(currentUser.peran) as any);
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

  const kodeErrorField = (field: AuthField) =>
    touched[field] || submitted ? errors[field] : undefined;

  /** Pesan inline siap tampil; kode dari validasi diterjemahkan di sini. */
  const errorField = (field: AuthField) => {
    const kode = kodeErrorField(field);
    return kode ? teks.pesan[kode] : undefined;
  };

  const handleGantiMode = (modeBaru: AuthMode) => {
    setAuthMode(modeBaru);
    setKonfirmasiPassword('');
    setErrors({});
    setPesanError(null);
    setSubmitted(false);
  };

  const formTerisi =
    authMode === 'login'
      ? email.trim().length > 0 && password.length > 0
      : nama.trim().length > 0 &&
        nim.trim().length > 0 &&
        kelas.trim().length > 0 &&
        email.trim().length > 0 &&
        password.length > 0 &&
        konfirmasiPassword.length > 0;

  const tanganiKegagalanAuth = (alasan: string) => {
    setPesanError(pesanUntukAlasan(alasan, teks));
  };

  const handleSubmit = async () => {
    if (sedangMemproses) return;

    redirectAwalSelesai.current = true;
    setPesanError(null);

    const hasilValidasi = validateAuthForm({
      authMode,
      nama,
      nim,
      kelas,
      email,
      password,
      konfirmasi: konfirmasiPassword,
    });

    if (Object.keys(hasilValidasi).length > 0) {
      setErrors(hasilValidasi);
      setSubmitted(true);

      const urutanField: AuthField[] =
        authMode === 'register'
          ? ['nama', 'nim', 'kelas', 'email', 'password', 'konfirmasi']
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
        konfirmasi: refKonfirmasi,
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
          tanganiKegagalanAuth(res.alasan);
          return;
        }

        showToast(teks.toast.selamatDatang(res.user.nama.split(' ')[0]));
        router.replace(berandaUntuk(res.user.peran) as any);
        return;
      }

      const res = await registerUser({
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        password,
        peran: 'praktikan',
        nim: nim.trim(),
        kelas: kelas.trim().toUpperCase(),
      });

      if (!res.ok) {
        tanganiKegagalanAuth(res.alasan);
        return;
      }

      showToast(teks.toast.akunDibuat(res.user.nama.split(' ')[0]));
      router.replace(berandaUntuk(res.user.peran) as any);
    } catch (err: any) {
      const kode = typeof err?.code === 'string' ? err.code : null;
      setPesanError(
        kode ? pesanUntukAlasan(kode, teks) : teks.pesan['auth-umum'],
      );
    } finally {
      setSedangMemproses(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Panel atas selalu bernada graphite, jadi status bar tetap terang. */}
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={teks.a11y.kembali}
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.backIconBtn,
                pressed && styles.backIconBtnPressed,
              ]}
            >
              <ArrowLeft size={21} color={themeColors.onGraphite} />
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
              {authMode === 'login' ? teks.selamatDatang : teks.registrasiAkun}
            </Text>
            <Text style={styles.introTitle}>
              {authMode === 'login' ? teks.judulMasuk : teks.judulDaftar}
            </Text>
            <Text style={styles.introSub}>
              {authMode === 'login' ? teks.subMasuk : teks.subDaftar}
            </Text>
          </View>

          {/* Form Sheet */}
          <View style={styles.formSheet}>
            {/* Mode Switcher: Masuk / Daftar */}
            <View style={styles.modeTabs}>
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={teks.a11y.tabMasuk}
                accessibilityHint={teks.a11y.tabMasukHint}
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
                  {teks.masuk}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityLabel={teks.a11y.tabDaftar}
                accessibilityHint={teks.a11y.tabDaftarHint}
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
                  {teks.daftarAkun}
                </Text>
              </Pressable>
            </View>

            {/* Info Registrasi */}
            {authMode === 'register' && (
              <View style={styles.registerInfo}>
                <UserRound size={16} color={themeColors.textSecondary} />
                <Text style={styles.registerInfoText}>{teks.infoDaftar}</Text>
              </View>
            )}

            {/* Register-only Fields */}
            {authMode === 'register' && (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{teks.namaLengkap}</Text>
                  <TextInput
                    ref={refNama}
                    value={nama}
                    onChangeText={ubahField('nama', setNama)}
                    onBlur={() => tandaiTouched('nama')}
                    placeholder={teks.placeholderNama}
                    placeholderTextColor={themeColors.textMuted}
                    editable={!sedangMemproses}
                    accessibilityLabel={teks.a11y.namaLengkap}
                    accessibilityHint={teks.a11y.namaLengkapHint}
                    style={[styles.input, errorField('nama') && styles.inputError]}
                  />
                  {errorField('nama') && (
                    <Text style={styles.fieldError}>{errorField('nama')}</Text>
                  )}
                </View>

                <View style={styles.rowFields}>
                  <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                    <Text style={styles.fieldLabel}>{teks.nimId}</Text>
                    <TextInput
                      ref={refNim}
                      value={nim}
                      onChangeText={(nilai) => {
                        setNim(nilai.replace(/\D/g, ''));
                        bersihkanErrorField('nim');
                      }}
                      onBlur={() => tandaiTouched('nim')}
                      placeholder={teks.placeholderNim}
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="number-pad"
                      maxLength={20}
                      importantForAutofill="yes"
                      editable={!sedangMemproses}
                      accessibilityLabel={teks.a11y.nimId}
                      accessibilityHint={teks.a11y.nimIdHint}
                      style={[styles.input, errorField('nim') && styles.inputError]}
                    />
                    {errorField('nim') && (
                      <Text style={styles.fieldError}>{errorField('nim')}</Text>
                    )}
                  </View>

                  <View style={[styles.fieldGroup, { flex: 0.8 }]}>
                    <Text style={styles.fieldLabel}>{teks.kelas}</Text>
                    <TextInput
                      ref={refKelas}
                      value={kelas}
                      onChangeText={ubahField('kelas', setKelas)}
                      onBlur={() => tandaiTouched('kelas')}
                      placeholder={teks.placeholderKelas}
                      placeholderTextColor={themeColors.textMuted}
                      autoCapitalize="characters"
                      editable={!sedangMemproses}
                      accessibilityLabel={teks.a11y.kelas}
                      accessibilityHint={teks.a11y.kelasHint}
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
                </View>
              </>
            )}

            {/* Email & Password Fields */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{teks.alamatEmail}</Text>
              <TextInput
                ref={refEmail}
                value={email}
                onChangeText={ubahField('email', setEmail)}
                onBlur={() => tandaiTouched('email')}
                placeholder={teks.placeholderEmail}
                placeholderTextColor={themeColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                editable={!sedangMemproses}
                accessibilityLabel={teks.a11y.alamatEmail}
                accessibilityHint={teks.a11y.alamatEmailHint}
                style={[styles.input, errorField('email') && styles.inputError]}
              />
              {errorField('email') && (
                <Text style={styles.fieldError}>{errorField('email')}</Text>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{teks.kataSandi}</Text>
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
                  placeholder={teks.placeholderSandi}
                  placeholderTextColor={themeColors.textMuted}
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
                  accessibilityLabel={teks.a11y.kataSandi}
                  accessibilityHint={teks.a11y.kataSandiHint}
                  style={styles.passwordInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    lihatPassword
                      ? teks.a11y.sembunyikanSandi
                      : teks.a11y.tampilkanSandi
                  }
                  onPress={() => setLihatPassword((v) => !v)}
                  style={styles.eyeButton}
                >
                  {lihatPassword ? (
                    <EyeOff size={18} color={themeColors.textMuted} />
                  ) : (
                    <Eye size={18} color={themeColors.textMuted} />
                  )}
                </Pressable>
              </View>
              {authMode === 'register' ? (
                <Text
                  style={[
                    styles.passwordHint,
                    (touched.password || submitted) &&
                      password.length < 6 &&
                      styles.passwordHintError,
                  ]}
                >
                  {teks.bantuanSandi}
                </Text>
              ) : (
                errorField('password') && (
                  <Text style={styles.fieldError}>
                    {errorField('password')}
                  </Text>
                )
              )}
            </View>

            {authMode === 'register' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{teks.konfirmasiSandi}</Text>
                <View
                  style={[
                    styles.passwordWrap,
                    errorField('konfirmasi') && styles.inputError,
                  ]}
                >
                  <TextInput
                    ref={refKonfirmasi}
                    value={konfirmasiPassword}
                    onChangeText={ubahField(
                      'konfirmasi',
                      setKonfirmasiPassword,
                    )}
                    onBlur={() => tandaiTouched('konfirmasi')}
                    placeholder={teks.placeholderKonfirmasi}
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry={!lihatPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    editable={!sedangMemproses}
                    accessibilityLabel={teks.a11y.konfirmasiSandi}
                    accessibilityHint={teks.a11y.konfirmasiSandiHint}
                    style={styles.passwordInput}
                  />
                </View>
                {errorField('konfirmasi') && (
                  <Text style={styles.fieldError}>
                    {errorField('konfirmasi')}
                  </Text>
                )}
              </View>
            )}

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
              rightIcon={<ArrowRight size={19} color={themeColors.onPrimary} />}
              style={styles.submitButton}
            >
              {authMode === 'login' ? teks.tombolMasuk : teks.tombolDaftar}
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
                  ? teks.belumPunyaAkun
                  : teks.sudahPunyaAkun}
                <Text style={styles.switchAuthHighlight}>
                  {authMode === 'login' ? teks.daftarDiSini : teks.masukDiSini}
                </Text>
              </Text>
            </Pressable>

            <Text style={styles.disclaimer}>{teks.disclaimer}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: w.graphite,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      backgroundColor: w.graphite,
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
      color: w.primary,
      letterSpacing: 1.3,
    },
    introTitle: {
      ...type.h1,
      color: w.onGraphite,
      marginTop: spacing.s2,
      textAlign: 'center',
    },
    introSub: {
      ...type.caption,
      color: w.textOnDarkMuted,
      marginTop: spacing.s2,
      textAlign: 'center',
    },
    formSheet: {
      flex: 1,
      backgroundColor: w.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.s5,
      paddingTop: spacing.s6,
      paddingBottom: spacing.s8,
    },
    modeTabs: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: w.border,
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
      // Garis bawah memakai warna teks agar tetap terbaca di mode gelap.
      borderBottomColor: w.textPrimary,
    },
    modeTabText: {
      ...type.bodyStrong,
      color: w.textMuted,
    },
    modeTabTextActive: {
      color: w.textPrimary,
      fontFamily: fontFamily.bold,
    },
    fieldLabel: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      marginBottom: spacing.s2,
      marginLeft: 2,
    },
    registerInfo: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: 12,
      backgroundColor: w.surfaceMuted,
      marginBottom: spacing.s4,
    },
    registerInfoText: {
      ...type.caption,
      fontFamily: fontFamily.regular,
      color: w.textSecondary,
      flex: 1,
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
      borderColor: w.border,
      backgroundColor: w.surface,
      paddingHorizontal: spacing.s4,
      ...type.bodyStrong,
      color: w.textPrimary,
    },
    passwordWrap: {
      height: 52,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.s4,
      paddingRight: spacing.s2,
    },
    passwordInput: {
      flex: 1,
      height: '100%',
      ...type.bodyStrong,
      color: w.textPrimary,
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
      backgroundColor: w.errorBg,
      borderWidth: 1,
      borderColor: w.dangerBorder,
      marginBottom: spacing.s3,
    },
    errorText: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.errorFg,
    },
    fieldError: {
      ...type.micro,
      color: w.errorFg,
      marginTop: 6,
      marginLeft: 2,
    },
    passwordHint: {
      ...type.micro,
      fontFamily: fontFamily.regular,
      color: w.textMuted,
      marginTop: 6,
      marginLeft: 2,
    },
    passwordHintError: {
      color: w.errorFg,
    },
    inputError: {
      borderColor: w.dangerBorder,
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
      color: w.textSecondary,
    },
    switchAuthHighlight: {
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    disclaimer: {
      ...type.micro,
      fontFamily: fontFamily.regular,
      color: w.textMuted,
      textAlign: 'center',
      marginTop: spacing.s4,
      lineHeight: 16,
    },
  });
