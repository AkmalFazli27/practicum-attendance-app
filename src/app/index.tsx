import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  ChevronLeft,
  ChevronsRight,
} from 'lucide-react-native';

import { Brand, Tombol } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Peran } from '@/data/dummy';
import {
  colors,
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';

function berandaUntuk(peran: Peran): '/beranda-asisten' | '/beranda-praktikan' {
  return peran === 'asisten' ? '/beranda-asisten' : '/beranda-praktikan';
}

function SplashLayar() {
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <Brand large onDark />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.splashCaption}>Memeriksa sesi...</Text>
    </View>
  );
}

interface OnboardingSlide {
  id: string;
  image: ImageSourcePropType;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'checkin',
    image: require('../../assets/onboarding/slide-checkin.jpg'),
    titleId: "Tap Once. You're In.",
    titleEn: "Tap Once. You're In.",
    descId:
      'Presensi praktikum dalam hitungan detik melalui verifikasi radius GPS laboratorium dan pemindai kode QR.',
    descEn:
      'Check in to your practicum in seconds with lab GPS radius verification and instant QR code scanning.',
  },
  {
    id: 'map',
    image: require('../../assets/onboarding/slide-map.jpg'),
    titleId: 'Jadwal & Peta Lab',
    titleEn: 'Schedule & Lab Maps',
    descId:
      'Pantau sesi praktikum yang sedang dibuka dan temukan lokasi laboratorium lewat peta kampus interaktif.',
    descEn:
      'Track open practicum sessions in real time and locate laboratory rooms on the interactive campus map.',
  },
  {
    id: 'ai',
    image: require('../../assets/onboarding/slide-ai.jpg'),
    titleId: 'Izin AI & Notifikasi',
    titleEn: 'AI Leave & Alerts',
    descId:
      'Ajukan izin kehadiran berbantuan klasifikasi AI otomatis dan terima notifikasi instan di setiap pembaruan sesi.',
    descEn:
      'Submit leave requests with automatic AI classification and receive instant push alerts for every update.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { currentUser, loading } = useSession();
  const { themeColors, isDark, language } = usePreferences();

  const isEn = language === 'en';
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const redirectAwalSelesai = useRef(false);

  useEffect(() => {
    if (loading || redirectAwalSelesai.current) return;
    redirectAwalSelesai.current = true;
    if (currentUser) {
      router.replace(berandaUntuk(currentUser.peran));
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return <SplashLayar />;
  }

  const handleGetStarted = () => {
    if (currentUser) {
      router.replace(berandaUntuk(currentUser.peran));
      return;
    }
    router.push('/login');
  };

  const goToSlide = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, nextIdx));
    setActiveIndex(clamped);
    scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      goToSlide(activeIndex - 1);
    }
  };

  const handleMomentumScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (!width) return;
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (idx >= 0 && idx < SLIDES.length && idx !== activeIndex) {
      setActiveIndex(idx);
    }
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;
  const artSize = Math.min(width - 48, height * 0.42, 330);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      edges={['top']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        {activeIndex > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Previous slide' : 'Slide sebelumnya'}
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={26} color={themeColors.textPrimary} />
          </Pressable>
        ) : (
          <Brand compact onDark={isDark} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isLastSlide ? "Let's Get Started" : isEn ? 'Skip' : 'Lewati'
          }
          onPress={handleGetStarted}
          hitSlop={12}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
        >
          <Text
            style={[
              styles.skipText,
              {
                color: isLastSlide
                  ? themeColors.textPrimary
                  : themeColors.textMuted,
                fontFamily: isLastSlide
                  ? fontFamily.bold
                  : fontFamily.semibold,
              },
            ]}
          >
            {isLastSlide
              ? isEn
                ? 'Get Started'
                : 'Mulai'
              : isEn
                ? 'Skip'
                : 'Lewati'}
          </Text>
        </Pressable>
      </View>

      {/* Swipeable Onboarding Slides (Vector Art + Copywriting) */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={[styles.slidePage, { width }]}>
            <View
              style={[
                styles.artFrame,
                {
                  width: artSize,
                  height: artSize,
                  borderRadius: isDark ? 36 : 24,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Image
                source={slide.image}
                style={styles.artImage}
                resizeMode="cover"
              />
            </View>

            {/* Pagination Indicator tepat di bawah ilustrasi */}
            <View style={styles.dotsRow}>
              {SLIDES.map((s, idx) => {
                const active = idx === activeIndex;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Slide ${idx + 1}`}
                    onPress={() => goToSlide(idx)}
                    hitSlop={8}
                    style={[
                      styles.dot,
                      active
                        ? {
                            width: 24,
                            backgroundColor: isDark
                              ? themeColors.primary
                              : themeColors.graphite,
                          }
                        : {
                            width: 6,
                            backgroundColor: themeColors.borderDashed,
                          },
                    ]}
                  />
                );
              })}
            </View>

            {/* Headline & Description */}
            <View style={styles.copyWrap}>
              <Text
                style={[styles.titleText, { color: themeColors.textPrimary }]}
              >
                {isEn ? slide.titleEn : slide.titleId}
              </Text>
              <Text
                style={[styles.descText, { color: themeColors.textSecondary }]}
              >
                {isEn ? slide.descEn : slide.descId}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom + spacing.s5, spacing.s6),
          },
        ]}
      >
        {isLastSlide ? (
          <Tombol
            variant="primer"
            onPress={handleGetStarted}
            rightIcon={<ArrowRight size={19} color={themeColors.onPrimary} />}
            style={styles.getStartedBtn}
          >
            {"Let's Get Started"}
          </Tombol>
        ) : (
          <View style={styles.navRow}>
            <Pressable
              accessibilityRole="button"
              onPress={handleGetStarted}
              hitSlop={10}
              style={({ pressed }) => [
                styles.skipFooterBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.skipFooterText,
                  { color: themeColors.textMuted },
                ]}
              >
                {isEn ? 'Skip' : 'Lewati'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Next' : 'Lanjut'}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.nextSquareBtn,
                {
                  backgroundColor: isDark
                    ? themeColors.primary
                    : themeColors.graphite,
                },
                pressed && styles.pressed,
              ]}
            >
              <ChevronsRight
                size={24}
                color={
                  isDark ? themeColors.onPrimary : themeColors.onGraphite
                }
              />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: colors.graphite,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s4,
  },
  splashCaption: {
    ...type.caption,
    color: colors.textOnDarkMuted,
  },
  topBar: {
    height: 58,
    paddingHorizontal: layout.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  skipText: {
    ...type.body,
  },
  pager: {
    flex: 1,
  },
  slidePage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.screenPadding + 8,
  },
  artFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s6,
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.s5,
  },
  dot: {
    height: 6,
    borderRadius: radius.pill,
  },
  copyWrap: {
    alignItems: 'center',
    gap: spacing.s2 + 2,
    maxWidth: 320,
  },
  titleText: {
    ...type.display,
    fontSize: 27,
    lineHeight: 33,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  descText: {
    ...type.body,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: layout.screenPadding + 4,
    paddingTop: spacing.s2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipFooterBtn: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s1,
  },
  skipFooterText: {
    ...type.body,
    fontFamily: fontFamily.semibold,
  },
  nextSquareBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  getStartedBtn: {
    width: '100%',
    height: 54,
  },
  pressed: {
    opacity: 0.76,
  },
});
