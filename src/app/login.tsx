import React, { useState } from 'react';
import {
  Alert,
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
import { SheetModal, Tombol } from '@/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { users, currentUser, login, logout } = useSession();

  const [peranTerpilih, setPeranTerpilih] = useState<Peran>('praktikan');
  const [userIdTerpilih, setUserIdTerpilih] = useState<string | null>(null);
  const [sedangMemproses, setSedangMemproses] = useState(false);
  const [modalSukses, setModalSukses] = useState(false);
  const [infoLogin, setInfoLogin] = useState<User | null>(null);

  const daftarUserSesuaiPeran = users.filter((u) => u.peran === peranTerpilih);

  const handleGantiPeran = (peranBaru: Peran) => {
    setPeranTerpilih(peranBaru);
    setUserIdTerpilih(null);
  };

  const handleLoginUser = (user: User) => {
    setSedangMemproses(true);
    setTimeout(() => {
      login(user.id);
      setSedangMemproses(false);
      setInfoLogin(user);

      // Coba navigasi ke route peran masing-masing jika sudah ada
      try {
        if (user.peran === 'praktikan') {
          router.replace('/(praktikan)' as any);
        } else {
          router.replace('/(asisten)' as any);
        }
      } catch {
        // Jika route belum di-merge oleh rekan tim (Eileen/Nouvella), tampilkan modal konfirmasi
        setModalSukses(true);
      }
    }, 200);
  };

  const handleLoginSubmit = () => {
    if (!userIdTerpilih) return;
    const user = users.find((u) => u.id === userIdTerpilih);
    if (user) {
      handleLoginUser(user);
    }
  };

  // Shortcut login cepat untuk mode dummy sprint awal
  const handleQuickLogin = (peran: Peran) => {
    const defaultUser = users.find((u) => u.peran === peran);
    if (defaultUser) {
      handleLoginUser(defaultUser);
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

          {currentUser && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Keluar dari akun saat ini"
              onPress={() => {
                logout();
                Alert.alert('Keluar', 'Kamu telah keluar dari akun.');
              }}
              style={styles.badgeKeluar}
            >
              <Text style={styles.badgeKeluarText}>
                Keluar ({currentUser.nama.split(' ')[0]})
              </Text>
            </Pressable>
          )}
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
                Pilih peran dan akun kamu untuk melanjutkan simulasi presensi
                praktikum (Sprint 1 - Data Dummy).
              </Text>

              {/* Quick Demo Login Box */}
              <View style={styles.quickLoginCard}>
                <View style={styles.quickLoginHeader}>
                  <View style={styles.quickLoginDot} />
                  <Text style={styles.quickLoginTitle}>
                    Akses Cepat (Demo Praktikum)
                  </Text>
                </View>
                <Text style={styles.quickLoginDesc}>
                  Pilih salah satu tombol di bawah untuk langsung mencoba peran
                  tanpa konfigurasi manual:
                </Text>

                <View style={styles.quickButtonRow}>
                  <View style={styles.quickButtonCol}>
                    <Tombol
                      variant="primer"
                      onPress={() => handleQuickLogin('praktikan')}
                    >
                      Masuk Praktikan
                    </Tombol>
                    <Text style={styles.quickRoleCaption}>
                      Sebagai: Andi Pratama (IF-2A)
                    </Text>
                  </View>

                  <View style={styles.quickButtonCol}>
                    <Tombol
                      variant="graphite"
                      onPress={() => handleQuickLogin('asisten')}
                    >
                      Masuk Asisten
                    </Tombol>
                    <Text style={styles.quickRoleCaption}>
                      Sebagai: Budi Santoso
                    </Text>
                  </View>
                </View>
              </View>

              {/* Divider / Manual Selection Label */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ATAU PILIH DARI DAFTAR</Text>
                <View style={styles.dividerLine} />
              </View>

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
                Masuk ke Akun Terpilih
              </Tombol>
              <Text style={styles.footerNote}>
                Sistem simulasi lokal. Data sesi & kehadiran tersimpan di state
                aplikasi saat runtime.
              </Text>
            </View>
          }
        />

        {/* Modal Konfirmasi Sukses jika route tujuan belum ada di repo */}
        <SheetModal
          visible={modalSukses}
          judul="Login Berhasil"
          onClose={() => setModalSukses(false)}
          footer={
            <Tombol variant="primer" onPress={() => router.replace('/')}>
              Kembali ke Beranda Jadwal
            </Tombol>
          }
        >
          <View style={styles.modalContent}>
            <View style={styles.modalSuccessBadge}>
              <Text style={styles.modalSuccessCheck}>✓</Text>
            </View>
            <Text style={styles.modalSuccessTitle}>
              Selamat datang, {infoLogin?.nama}!
            </Text>
            <Text style={styles.modalSuccessDesc}>
              Status login kamu telah tersimpan sebagai{' '}
              <Text style={{ fontWeight: '700' }}>
                {infoLogin?.peran === 'praktikan' ? 'Praktikan' : 'Asisten'}
              </Text>
              . Data profil dan hak akses sudah aktif di sistem SessionContext.
            </Text>
          </View>
        </SheetModal>
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
  badgeKeluar: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.badge,
    backgroundColor: colors.surfaceMuted,
  },
  badgeKeluarText: {
    ...type.caption,
    color: colors.textSecondary,
    fontWeight: '600',
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

  // Quick Demo Box
  quickLoginCard: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.s2,
  },
  quickLoginHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  quickLoginDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryPressed,
  },
  quickLoginTitle: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  quickLoginDesc: {
    ...type.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  quickButtonRow: {
    flexDirection: 'row',
    gap: spacing.s3,
    marginTop: spacing.s2,
  },
  quickButtonCol: {
    flex: 1,
    gap: spacing.s1,
  },
  quickRoleCaption: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.s5,
    gap: spacing.s3,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },

  // Role Segments
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    padding: 4,
    borderRadius: radius.button,
    marginBottom: spacing.s4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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

  // Modal
  modalContent: {
    alignItems: 'center',
    paddingVertical: spacing.s3,
    gap: spacing.s2,
  },
  modalSuccessBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.sesiDibukaBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s2,
  },
  modalSuccessCheck: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.sesiDibukaFg,
  },
  modalSuccessTitle: {
    ...type.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  modalSuccessDesc: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
