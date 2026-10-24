// src/app/(praktikan)/(tabs)/profil.tsx
import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tombol } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, radius, spacing, type } from '@/theme/tokens';

function inisial(nama: string): string {
  return nama
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('');
}

const LABEL_PERAN: Record<string, string> = {
  praktikan: 'Praktikan',
  asisten: 'Asisten',
};

export default function ProfilScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useSession();

  if (!currentUser) return null; // guard di _layout yang me-redirect

  function keluar() {
    logout();
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s4 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Profil</Text>

        {/* Kartu identitas */}
        <View style={styles.kartuIdentitas}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inisial(currentUser.nama)}</Text>
          </View>
          <View style={styles.identitasTeks}>
            <Text style={styles.nama}>{currentUser.nama}</Text>
            <Text style={styles.subNama}>
              {LABEL_PERAN[currentUser.peran]}
              {currentUser.nim ? ` · ${currentUser.nim}` : ''}
            </Text>
          </View>
        </View>

        {/* Kartu detail */}
        <View style={styles.kartuDetail}>
          <View style={styles.baris}>
            <Text style={styles.label}>Peran</Text>
            <Text style={styles.nilai}>{LABEL_PERAN[currentUser.peran]}</Text>
          </View>
          <View style={styles.pemisah} />
          <View style={styles.baris}>
            <Text style={styles.label}>NIM</Text>
            <Text style={styles.nilai}>{currentUser.nim ?? '—'}</Text>
          </View>
          <View style={styles.pemisah} />
          <View style={styles.baris}>
            <Text style={styles.label}>Kelas</Text>
            <Text style={styles.nilai}>{currentUser.kelas ?? '—'}</Text>
          </View>
        </View>

        <Tombol variant="sekunder" onPress={keluar}>
          Keluar
        </Tombol>

        <Text style={styles.versi}>Sprint 1 · data lokal</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s8,
    gap: spacing.s4,
  },
  h1: { ...type.h1, color: colors.textPrimary, marginBottom: spacing.s2 },

  kartuIdentitas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.bodyStrong, color: colors.graphite },
  identitasTeks: { flex: 1, gap: 2 },
  nama: { ...type.bodyStrong, color: colors.textPrimary },
  subNama: { ...type.caption, color: colors.textSecondary },

  kartuDetail: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.s4,
  },
  baris: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  pemisah: { height: 1, backgroundColor: colors.surfaceMuted },
  label: { ...type.body, color: colors.textSecondary },
  nilai: { ...type.bodyStrong, color: colors.textPrimary },

  versi: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.s2,
  },
});