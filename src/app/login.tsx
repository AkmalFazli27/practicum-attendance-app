import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSession } from '@/context/SessionContext';
import { type Peran, type User } from '@/data/dummy';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { Tombol } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { users, currentUser, login } = useSession();

  const [peranTerpilih, setPeranTerpilih] = useState<Peran>('praktikan');
  const [userIdTerpilih, setUserIdTerpilih] = useState<string | null>(null);
  const [sedangMemproses, setSedangMemproses] = useState(false);

  const daftarUserSesuaiPeran = users.filter((u) => u.peran === peranTerpilih);

  useEffect(() => {
    if (!currentUser) return;

    router.replace(
      currentUser.peran === 'praktikan'
        ? '/jadwal'
        : '/sesi',
    );
  }, [currentUser, router]);

  const handleGantiPeran = (peranBaru: Peran) => {
    setPeranTerpilih(peranBaru);
    setUserIdTerpilih(null);
  };

  const handleLoginUser = (user: User) => {
    setSedangMemproses(true);
    setTimeout(() => {
      login(user.id);
      setSedangMemproses(false);
    }, 200);
  };

  const handleLoginSubmit = () => {
    if (!userIdTerpilih) return;
    const user = users.find((u) => u.id === userIdTerpilih);
    if (user) {
      handleLoginUser(user);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.navBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke Beranda"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => router.replace('/')}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.navButtonPressed,
            ]}
          >
            <Text style={styles.navButtonIcon}>‹</Text>
            <Text style={styles.navButtonText}>Kembali</Text>
          </Pressable>
        </View>

        <FlatList
          data={daftarUserSesuaiPeran}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <Text style={styles.title}>Masuk ke Akun</Text>
              <Text style={styles.subtitle}>
                Pilih peran dan nama kamu untuk melanjutkan ke aplikasi praktikum.
              </Text>

              {/* Role Segmented Tabs */}
              <View style={styles.segmentContainer}>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: peranTerpilih === 'praktikan' }}
                  onPress={() => handleGantiPeran('praktikan')}
                  style={[
                    styles.segmentTab,
                    peranTerpilih === 'praktikan' && styles.segmentTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      peranTerpilih === 'praktikan' && styles.segmentTextActive,
                    ]}
                  >
                    Praktikan ({users.filter((u) => u.peran === 'praktikan').length})
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: peranTerpilih === 'asisten' }}
                  onPress={() => handleGantiPeran('asisten')}
                  style={[
                    styles.segmentTab,
                    peranTerpilih === 'asisten' && styles.segmentTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      peranTerpilih === 'asisten' && styles.segmentTextActive,
                    ]}
                  >
                    Asisten ({users.filter((u) => u.peran === 'asisten').length})
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.sectionLabel}>
                Daftar {peranTerpilih === 'praktikan' ? 'Praktikan' : 'Asisten'}:
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = userIdTerpilih === item.id;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setUserIdTerpilih(item.id)}
                style={({ pressed }) => [
                  styles.userCard,
                  isSelected && styles.userCardSelected,
                  pressed && styles.userCardPressed,
                ]}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {item.nama
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.nama}</Text>
                  <Text style={styles.userMeta}>
                    NIM: {item.nim ?? '-'}
                    {item.kelas ? ` • Kelas ${item.kelas}` : ''}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    isSelected && styles.radioCircleSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={styles.footerSection}>
              <Tombol
                variant="primer"
                disabled={!userIdTerpilih || sedangMemproses}
                loading={sedangMemproses}
                onPress={handleLoginSubmit}
              >
                Masuk
              </Tombol>
              <Text style={styles.footerNote}>
                Sistem simulasi lokal. Data sesi & kehadiran tersimpan di state
                aplikasi saat runtime.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s1,
    paddingHorizontal: spacing.s2,
    borderRadius: radius.button,
  },
  navButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  navButtonIcon: {
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 26,
    marginRight: 4,
  },
  navButtonText: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.s5,
    gap: spacing.s3,
  },
  headerSection: {
    marginBottom: spacing.s2,
  },
  title: {
    ...type.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: spacing.s1,
    lineHeight: 22,
  },

  // Role Segments
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: radius.button,
    marginVertical: spacing.s4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: spacing.s3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.button - 2,
  },
  segmentTabActive: {
    backgroundColor: colors.graphite,
  },
  segmentText: {
    ...type.bodyStrong,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.onGraphite,
  },
  sectionLabel: {
    ...type.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.s1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // User Cards
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  userCardSelected: {
    borderColor: colors.graphite,
    backgroundColor: colors.primarySoft,
  },
  userCardPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s3,
  },
  userAvatarText: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  userMeta: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.s2,
  },
  radioCircleSelected: {
    borderColor: colors.graphite,
    backgroundColor: colors.graphite,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onGraphite,
  },

  // Footer
  footerSection: {
    marginTop: spacing.s4,
    paddingBottom: spacing.s6,
    gap: spacing.s2,
  },
  footerNote: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
