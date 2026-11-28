import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Info,
} from 'lucide-react-native';

import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { useLabI18n } from '@/components/aslab/lab/i18nLab';
import {
  ConfirmSheet,
  EmptyState,
  FilterChip,
  Tombol,
  useToast,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Keanggotaan, Lab } from '@/data/dummy';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';

/**
 * Layar Pindah Praktikan / Asprak antar lab tanpa memindahkan jadwal atau sesi (FR-32).
 */
export default function PindahAnggotaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const { t } = useLabI18n();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  const {
    currentUser,
    labs: sessionLabs,
    users,
  } = useSession();
  const {
    kelasList,
    keanggotaanAll: keanggotaanLab,
    pindahKelasAnggota,
  } = useAslabStore();

  const labs = useMemo<Lab[]>(() => {
    if (kelasList.length > 0) {
      return kelasList.map((k) => ({
        id: k.id,
        nama: k.namaKelas,
        mataKuliah: k.mataKuliah,
        ruanganLab: k.ruanganLabNama,
        alamat: k.alamat,
        lat: k.lat,
        lng: k.lng,
        radius: k.radius,
      }));
    }
    return sessionLabs;
  }, [kelasList, sessionLabs]);

  const [filterLabId, setFilterLabId] = useState<string>('ALL');
  const [selectedKeanggotaan, setSelectedKeanggotaan] =
    useState<Keanggotaan | null>(null);
  const [tujuanLabId, setTujuanLabId] = useState<string | null>(null);
  const [konfirmasiVisible, setKonfirmasiVisible] = useState(false);
  const [memindahkan, setMemindahkan] = useState(false);

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );
  const labMap = useMemo(
    () => new Map(labs.map((l) => [l.id, l])),
    [labs],
  );

  const daftarAnggota = useMemo(() => {
    if (filterLabId === 'ALL') return keanggotaanLab;
    return keanggotaanLab.filter((k) => k.labId === filterLabId);
  }, [keanggotaanLab, filterLabId]);

  const labTujuanTersedia = useMemo(() => {
    if (!selectedKeanggotaan) return [];
    return labs.filter((l) => l.id !== selectedKeanggotaan.labId);
  }, [labs, selectedKeanggotaan]);

  const handlePilihAnggota = (item: Keanggotaan) => {
    setSelectedKeanggotaan(item);
    const kandidat = labs.find((l) => l.id !== item.labId);
    setTujuanLabId(kandidat?.id ?? null);
  };

  const handleKonfirmasiPindah = async () => {
    if (!selectedKeanggotaan || !tujuanLabId || memindahkan) return;

    if (tujuanLabId === selectedKeanggotaan.labId) {
      showToast(t('moveSameLabError'));
      setKonfirmasiVisible(false);
      return;
    }

    const labTujuan = labMap.get(tujuanLabId);
    if (!labTujuan) {
      showToast(t('moveTargetMissingError'));
      setKonfirmasiVisible(false);
      return;
    }

    setMemindahkan(true);
    try {
      const res = await pindahKelasAnggota(
        selectedKeanggotaan.uid,
        selectedKeanggotaan.labId,
        tujuanLabId,
      );
      setKonfirmasiVisible(false);
      if (!res.ok) {
        showToast(res.alasan);
        return;
      }

      const nama =
        userMap.get(selectedKeanggotaan.uid)?.nama ?? selectedKeanggotaan.uid;
      showToast(t('moveSuccessToast', { nama, lab: labTujuan.nama }));
      setSelectedKeanggotaan(null);
      setTujuanLabId(null);
    } finally {
      setMemindahkan(false);
    }
  };

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const namaTerpilih = selectedKeanggotaan
    ? userMap.get(selectedKeanggotaan.uid)?.nama ?? selectedKeanggotaan.uid
    : '';
  const namaLabAsal = selectedKeanggotaan
    ? labMap.get(selectedKeanggotaan.labId)?.nama ?? selectedKeanggotaan.labId
    : '';
  const namaLabTujuan = tujuanLabId
    ? labMap.get(tujuanLabId)?.nama ?? tujuanLabId
    : '';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.pressed,
          ]}
        >
          <ArrowLeft size={20} color={themeColors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{t('moveKicker')}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {t('moveTitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.s6) + spacing.s6 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t('moveSub')}</Text>

        {/* Banner Catatan: Jadwal dan sesi tidak ikut pindah */}
        <View style={styles.infoNotice}>
          <Info size={16} color={themeColors.sesiDibukaFg} />
          <Text style={styles.infoNoticeText}>{t('moveNotice')}</Text>
        </View>

        {keanggotaanLab.length === 0 ? (
          <EmptyState
            judul={t('noMembersTitle')}
            pesan={t('noMembersDesc')}
          />
        ) : (
          <>
            {/* Filter Lab Asal */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('sourceLabLabel')}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <FilterChip
                  label={t('allLabsFilter')}
                  aktif={filterLabId === 'ALL'}
                  onPress={() => setFilterLabId('ALL')}
                />
                {labs.map((l) => (
                  <FilterChip
                    key={l.id}
                    label={l.nama}
                    aktif={filterLabId === l.id}
                    onPress={() => setFilterLabId(l.id)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Daftar Anggota */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('selectMemberLabel')}</Text>
              <View style={styles.list}>
                {daftarAnggota.map((item) => {
                  const user = userMap.get(item.uid);
                  const labAsal = labMap.get(item.labId);
                  const aktif = selectedKeanggotaan?.id === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => handlePilihAnggota(item)}
                      style={({ pressed }) => [
                        styles.memberCard,
                        aktif && styles.memberCardActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.memberCopy}>
                        <Text style={styles.memberName}>
                          {user?.nama ?? item.uid}
                        </Text>
                        <Text style={styles.memberMeta}>
                          {user?.nim ? `${user.nim} · ` : ''}
                          {item.peran === 'asprak'
                            ? t('roleAsprak')
                            : t('rolePraktikan')}
                        </Text>
                        <Text style={styles.memberLab}>
                          {t('currentLabBadge', {
                            lab: labAsal?.nama ?? item.labId,
                          })}
                        </Text>
                      </View>
                      {aktif ? (
                        <CheckCircle2
                          size={20}
                          color={themeColors.sesiDibukaFg}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Pilih Lab Tujuan & Tombol Pindah */}
            {selectedKeanggotaan ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('destLabLabel')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {labTujuanTersedia.map((l) => (
                    <FilterChip
                      key={l.id}
                      label={
                        l.mataKuliah ? `${l.nama} (${l.mataKuliah})` : l.nama
                      }
                      aktif={tujuanLabId === l.id}
                      onPress={() => setTujuanLabId(l.id)}
                    />
                  ))}
                </ScrollView>

                <Tombol
                  variant="primer"
                  disabled={!tujuanLabId || memindahkan}
                  icon={<ArrowLeftRight size={16} color={themeColors.onPrimary} />}
                  onPress={() => setKonfirmasiVisible(true)}
                >
                  {t('moveBtn')}
                </Tombol>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <ConfirmSheet
        visible={konfirmasiVisible}
        title={t('moveConfirmTitle')}
        body={t('moveConfirmBody')}
        loading={memindahkan}
        confirmLabel={t('moveConfirmYes')}
        summary={[
          { label: t('selectMemberLabel'), value: namaTerpilih },
          { label: t('sourceLabLabel'), value: namaLabAsal },
          { label: t('destLabLabel'), value: namaLabTujuan },
        ]}
        onConfirm={handleKonfirmasiPindah}
        onClose={() => {
          if (!memindahkan) setKonfirmasiVisible(false);
        }}
      />
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: w.background,
    },
    header: {
      minHeight: 64,
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.s2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s3,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
    },
    backBtn: {
      width: 42,
      height: 42,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.78 },
    headerCopy: { flex: 1 },
    kicker: {
      ...type.micro,
      color: w.textMuted,
      letterSpacing: 1.1,
    },
    title: {
      ...type.h2,
      color: w.textPrimary,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s4,
      gap: spacing.s4,
    },
    subtitle: {
      ...type.caption,
      color: w.textSecondary,
      lineHeight: 19,
    },
    infoNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
      backgroundColor: w.primarySoft,
    },
    infoNoticeText: {
      ...type.caption,
      color: w.sesiDibukaFg,
      flex: 1,
      lineHeight: 18,
    },
    section: {
      gap: spacing.s2,
    },
    sectionLabel: {
      ...type.micro,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
      letterSpacing: 1,
    },
    chipRow: {
      gap: spacing.s2,
    },
    list: {
      gap: spacing.s2,
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.s3,
      padding: spacing.s3 + 2,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    memberCardActive: {
      borderColor: w.primaryPressed,
      backgroundColor: w.primarySoft,
    },
    memberCopy: {
      flex: 1,
      gap: 2,
    },
    memberName: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    memberMeta: {
      ...type.caption,
      color: w.textSecondary,
    },
    memberLab: {
      ...type.micro,
      fontFamily: fontFamily.semibold,
      color: w.textMuted,
    },
    card: {
      padding: spacing.s4,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      gap: spacing.s3,
    },
    sectionTitle: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
  });
