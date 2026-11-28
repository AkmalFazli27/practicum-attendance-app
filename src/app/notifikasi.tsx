import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { dismissAllNotificationsAsync } from 'expo-notifications';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
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
  sinkronkanNotifikasiTerkirim,
  subscribeRiwayatNotifikasi,
  tandaiNotifikasiDibaca,
  tandaiSemuaNotifikasiDibaca,
  tujuanNotifikasi,
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

function formatWaktuNotif(iso: string, isEn: boolean): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const tgl = d.toLocaleDateString(isEn ? 'en-GB' : 'id-ID', {
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
  const { themeColors } = usePreferences();
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';
  const uid = currentUser?.id;
  const [state, setState] = useState<{
    uid?: string;
    items: NotifikasiRiwayatItem[];
  }>({ items: [] });

  const memuat = Boolean(uid) && state.uid !== uid;
  const items = uid && state.uid === uid ? state.items : [];

  useEffect(() => {
    if (!uid) return;
    let aktif = true;
    const muat = async () => {
      await sinkronkanNotifikasiTerkirim(uid);
      await tandaiSemuaNotifikasiDibaca(uid);
      const daftar = await bacaRiwayatNotifikasi(uid);
      if (aktif) {
        setState({ uid, items: daftar });
      }
    };
    void muat();
    const unsub = subscribeRiwayatNotifikasi(() => {
      void bacaRiwayatNotifikasi(uid).then((daftar) => {
        if (aktif) {
          setState({ uid, items: daftar });
        }
      });
    });
    return () => {
      aktif = false;
      unsub();
    };
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      if (uid) {
        void tandaiSemuaNotifikasiDibaca(uid);
      }
    }, [uid]),
  );

  if (!currentUser) return <Redirect href="/" />;

  const handleHapusSemua = async () => {
    await hapusRiwayatNotifikasi(currentUser.id);
    if (Platform.OS !== 'web') {
      await dismissAllNotificationsAsync().catch(() => {});
    }
    setState({ uid: currentUser.id, items: [] });
    showToast(t('notifikasi.cleared'));
  };

  const handleTekanItem = (item: NotifikasiRiwayatItem) => {
    const tujuan = tujuanNotifikasi(item, currentUser.peran);
    if (!tujuan) return;
    void tandaiNotifikasiDibaca(currentUser.id, item.id);
    router.push(tujuan as any);
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
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backHit,
              {
                borderColor: themeColors.border,
                backgroundColor: pressed
                  ? themeColors.surfaceMuted
                  : themeColors.surface,
              },
            ]}
          >
            <ChevronLeft size={20} color={themeColors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.headerTitle, { color: themeColors.textPrimary }]}
          >
            {t('notifikasi.title')}
          </Text>
        </View>

        {items.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('notifikasi.clearAria')}
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
              {t('notifikasi.clear')}
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
            judul={t('notifikasi.emptyTitle')}
            pesan={t('notifikasi.emptyBody')}
          />
        ) : (
          <View style={styles.list}>
            {items.map((item) => {
              const tujuan = tujuanNotifikasi(item, currentUser.peran);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  disabled={!tujuan}
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
                    <View style={styles.notifTitleRow}>
                      {item.dibaca === false ? (
                        <View
                          style={[
                            styles.unreadDot,
                            { backgroundColor: themeColors.errorFg },
                          ]}
                        />
                      ) : null}
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: themeColors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.judul}
                      </Text>
                    </View>
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
                      {formatWaktuNotif(item.waktu, isEn)}
                    </Text>
                  </View>

                  {tujuan ? (
                    <ChevronRight size={18} color={themeColors.textMuted} />
                  ) : null}
                </Pressable>
              );
            })}
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
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.s3,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  backHit: {
    width: 44,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
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
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  notifTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    flex: 1,
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
