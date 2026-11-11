import { StyleSheet, Text, View } from 'react-native';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatJam, formatTanggal } from '@/utils/format';

const titik = (jam: string) => jam.replace(':', '.');

export default function RiwayatScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, getKehadiranPraktikan, getSesiById } = useSession();

  if (!currentUser) return null; // guard di _layout yang me-redirect

  // Hanya milik praktikan ini, urut dari waktu terbaru.
  const riwayat = getKehadiranPraktikan(currentUser.id)
    .slice()
    .sort((a, b) => b.waktuHadir.localeCompare(a.waktuHadir));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.s4 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.h1}>Riwayat kehadiran</Text>

        {riwayat.length === 0 ? (
          <EmptyState
            judul="Belum ada catatan"
            pesan="Presensi akan muncul di sini setelah kamu hadir."
          />
        ) : (
          <View style={styles.list}>
            {riwayat.map((k) => {
              const s = getSesiById(k.sesiId);
              if (!s) return null; // data tidak konsisten, lewati baris ini

              return (
                <View key={k.id} style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {s.namaPraktikum}
                  </Text>
                  <Text style={styles.cardMeta}>{formatTanggal(s.tanggal)}</Text>

                  <View style={styles.cardBottom}>
                    <Text style={styles.cardWaktu}>
                      Hadir pukul {titik(formatJam(k.waktuHadir))}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Hadir</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.s5,
    paddingBottom: spacing.s8,
    gap: spacing.s6,
  },
  h1: { ...type.h1, color: colors.textPrimary },

  list: { gap: spacing.s3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s1,
  },
  cardTitle: { ...type.bodyStrong, color: colors.textPrimary },
  cardMeta: { ...type.caption, color: colors.textSecondary },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s2,
    gap: spacing.s2,
  },
  cardWaktu: { ...type.body, color: colors.textSecondary },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.badge,
    backgroundColor: colors.sesiDibukaBg,
  },
  badgeText: { ...type.caption, color: colors.sesiDibukaFg, fontFamily: fontFamily.semibold },
});