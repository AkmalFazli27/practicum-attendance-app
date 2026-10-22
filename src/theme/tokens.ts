/**
 * Token desain TapIn — Sprint 1.
 * Sumber: docs/DESIGN.md §2.
 * Jangan menulis kode hex langsung di komponen; impor dari file ini.
 */

export const colors = {
  background: '#F6F8F4',
  surface: '#FFFFFF',
  surfaceMuted: '#EDF0E9',
  border: '#E0E5DC',
  textPrimary: '#202522',
  textSecondary: '#626A62',
  textMuted: '#7C847B',
  graphite: '#171A1A',
  onGraphite: '#FFFFFF',
  primary: '#C4F15B',
  primaryPressed: '#A4D139',
  primarySoft: '#EAF5D4',
  onPrimary: '#202522',
  disabledBg: '#E5E7EB',
  disabledText: '#9CA3AF',
  sesiTerjadwalFg: '#374151',
  sesiTerjadwalBg: '#E5E7EB',
  sesiDibukaFg: '#166534',
  sesiDibukaBg: '#DCFCE7',
  sesiSelesaiFg: '#202522',
  sesiSelesaiBg: '#EDF0E9',
  errorFg: '#991B1B',
  errorBg: '#FEE2E2',
  // Backlog, belum dipakai di Sprint 1:
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
  badge: 999,
  sheet: 16,
} as const;

export const layout = {
  screenPadding: 20,
  buttonHeight: 50,
  touchTarget: 48,
} as const;

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const type = {
  h1: { fontSize: 26, lineHeight: 32, fontFamily: fontFamily.bold },
  h2: { fontSize: 19, lineHeight: 26, fontFamily: fontFamily.semibold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.regular },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontFamily: fontFamily.semibold },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: fontFamily.medium },
} as const;
