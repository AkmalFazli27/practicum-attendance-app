/**
 * Token desain TapIn — Sprint 2 (Design Refactor Parity + Fitur Izin/AI).
 * Sumber: docs/DESIGN.md & Design Refactor Brief.
 * Jangan menulis kode hex langsung di komponen; impor dari file ini.
 */

export const colors = {
  background: '#F6F8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0E9',
  border: '#E0E5DC',
  borderDashed: '#CBD2C7',
  textPrimary: '#202522',
  textSecondary: '#626A62',
  textMuted: '#7C847B',
  textOnDarkMuted: '#AEB5AE',
  graphite: '#171A1A',
  graphiteSurface: '#242827',
  onGraphite: '#FFFFFF',
  primary: '#C4F15B',
  primaryHover: '#B2DF47',
  primaryPressed: '#A4D139',
  primarySoft: '#EAF5D4',
  onPrimary: '#171A1A',
  disabledBg: '#EDF0E9',
  disabledText: '#7C847B',
  sesiTerjadwalFg: '#374151',
  sesiTerjadwalBg: '#E5E7EB',
  sesiDibukaFg: '#166534',
  sesiDibukaBg: '#DCFCE7',
  sesiSelesaiFg: '#626A62',
  sesiSelesaiBg: '#EDF0E9',
  errorFg: '#991B1B',
  errorBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  izinFg: '#92400E',
  izinBg: '#FEF3C7',
  alpaFg: '#991B1B',
  alpaBg: '#FEE2E2',
} as const;

export const spacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
} as const;

export const radius = {
  button: 14,
  card: 16,
  cardLg: 20,
  badge: 999,
  pill: 999,
  sheet: 26,
} as const;

export const layout = {
  screenPadding: 20,
  buttonHeight: 50,
  touchTarget: 48,
  headerHeight: 76,
  tabBarHeight: 84,
  tabContentBottomPadding: 112,
} as const;

export const shadows = {
  card: {
    shadowColor: '#171A1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  activeCard: {
    shadowColor: '#171A1A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 12,
  },
  toast: {
    shadowColor: '#171A1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10,
  },
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const type = {
  display: {
    fontSize: 44,
    lineHeight: 46,
    fontFamily: fontFamily.extrabold,
    letterSpacing: -1.8,
  },
  h1: {
    fontSize: 29,
    lineHeight: 34,
    fontFamily: fontFamily.extrabold,
    letterSpacing: -0.9,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 19,
    lineHeight: 24,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.4,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.25,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fontFamily.regular,
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamily.semibold,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamily.medium,
  },
  micro: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.6,
  },
} as const;
