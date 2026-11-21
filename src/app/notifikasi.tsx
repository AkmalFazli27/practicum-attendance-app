import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  BellOff,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';

import { EmptyState, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  bacaRiwayatNotifikasi,
  hapusRiwayatNotifikasi,
  type NotifikasiRiwayatItem,
} from '@/hooks/useNotifications';
import {
  fontFamily,
  layout,
  radius,
  shadows,
  spacing,
  type,
} from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

function formatWaktuNotif(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const tgl = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
    return `${tgl} · ${titikJam(formatJam(iso))}`;
  } catch {
    return '';
  }
}

export default function NotifikasiScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();

  const isEn = language === 'en';
  const [items, setItems] = useState<NotifikasiRiwayatItem[]>([]);
  const [memuat, setMemuat] = useState(true);

  const muatRiwayat = useCallback(async () => {
    if (!currentUser?.id) return;
    setMemuat(true);
    try {
      const daftar = await bacaRiwayatNotifikasi(currentUser.id);
      setItems(daftar);
    } finally {
      setMemuat(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    void muatRiwayat();
  }, [muatRiwayat]);

  if (!currentUser) return <Redirect href="/" />;

  const handleHapusSemua = async () => {
    await hapusRiwayatNotifikasi(currentUser.id);
    setItems([]);
    showToast(
      isEn ? 'Notification history cleared.' : 'Riwayat notifikasi dibersihkan.',
    );
  };

  const handleTekanItem = (item: NotifikasiRiwayatItem) => {
    if (!item.sesiId) return;
    const pathname =
      currentUser.peran === 'asisten'
        ? '/(asisten)/sesi/[id]'
        : '/(praktikan)/sesi/[id]';
    router.push({ pathname, params: { id: item.sesiId } } as any);
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      {/* Minimalist Top Bar */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: insets.top + spacing.s2,
            backgroundColor: themeColors.background,
            borderBottomColor: themeColors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Back' : 'Kembali'}
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backHit,
              pressed && styles.pressed,
            ]}
          >
            <ChevronLeft size={26} color={themeColors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: themeColors.textPrimary }]}
          >
            {isEn ? 'Notifications' : 'Notifikasi'}
          </Text>
        </View>

        {items.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Clear all' : 'Bersihkan semua'}
            onPress={handleHapusSemua}
            hitSlop={8}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: themeColors.surfaceMuted },
              pressed && styles.pressed,
            ]}
          >
            <Trash2 size={14} color={themeColors.textSecondary} />
            <Text
              style={[
                styles.clearText,
                { color: themeColors.textSecondary },
              ]}
            >
              {isEn ? 'Clear' : 'Bersihkan'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          items.length === 0 && styles.scrollEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {memuat ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            icon={
              <View
                style={[
                  styles.emptyIconTile,
                  { backgroundColor: themeColors.surfaceMuted },
                ]}
              >
                <BellOff size={26} color={themeColors.textMuted} />
              </View>
            }
            judul={isEn ? 'No notifications yet' : 'Belum ada notifikasi'}
            pesan={
              isEn
                ? 'Session alerts, schedule updates, and leave decisions will appear here.'
                : 'Pemberitahuan sesi dibuka, perubahan jadwal, dan keputusan izin akan muncul di sini.'
            }
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                disabled={!item.sesiId}
                onPress={() => handleTekanItem(item)}
                style={({ pressed }) => [
                  styles.notifCard,
                  {
                    backgroundColor: pressed
                      ? themeColors.surfaceMuted
                      : themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.notifIconTile,
                    { backgroundColor: themeColors.primarySoft },
                  ]}
                >
                  <Bell size={18} color={themeColors.textPrimary} />
                </View>

                <View style={styles.notifCopy}>
                  <Text
                    style={[
                      styles.notifTitle,
                      { color: themeColors.textPrimary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.judul}
                  </Text>
                  {item.pesan ? (
                    <Text
                      style={[
                        styles.notifBody,
                        { color: themeColors.textSecondary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.pesan}
                    </Text>
                  ) : null}
                  <Text
                    style={[styles.notifTime, { color: themeColors.textMuted }]}
                  >
                    {formatWaktuNotif(item.waktu)}
                  </Text>
                </View>

                {item.sesiId ? (
                  <ChevronRight size={18} color={themeColors.textMuted} />
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding - 4,
    paddingBottom: spacing.s3,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  backHit: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...type.h1,
    fontSize: 22,
    lineHeight: 28,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  clearText: {
    ...type.micro,
    fontFamily: fontFamily.semibold,
  },
  pressed: {
    opacity: 0.72,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s8,
  },
  scrollEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: spacing.s8,
    alignItems: 'center',
  },
  emptyIconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.s3,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
    padding: spacing.s4,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    ...shadows.card,
  },
  notifIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCopy: {
    flex: 1,
    gap: 3,
  },
  notifTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  notifBody: {
    ...type.caption,
    lineHeight: 18,
  },
  notifTime: {
    ...type.micro,
    marginTop: 2,
  },
});
