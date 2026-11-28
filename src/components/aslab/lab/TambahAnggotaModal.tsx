import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CheckCircle2, UserRound } from 'lucide-react-native';

import { FilterChip, SheetModal, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Keanggotaan } from '@/data/dummy';
import {
  fontFamily,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import { useLabI18n } from './i18nLab';
import {
  adaKonflikPeranMatkul,
  cariUserTerdaftar,
} from './validasiManajemenLab';

export interface TambahAnggotaModalProps {
  visible: boolean;
  defaultLabId?: string | null;
  onClose: () => void;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_NIM = /^\d{6,20}$/;

/**
 * Form Single Insert untuk menambahkan 1 Praktikan atau 1 Asprak ke lab tertentu (FR-29, FR-30).
 */
export function TambahAnggotaModal({
  visible,
  defaultLabId = null,
  onClose,
}: TambahAnggotaModalProps) {
  const { labs, users, keanggotaanLab, addAnggotaBulk } = useSession();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const { t } = useLabI18n();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  const [peran, setPeran] = useState<Keanggotaan['peran']>('praktikan');
  const [labId, setLabId] = useState<string | null>(defaultLabId);
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [galat, setGalat] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPeran('praktikan');
    setLabId(defaultLabId ?? labs[0]?.id ?? null);
    setNim('');
    setEmail('');
    setGalat(null);
    setMenyimpan(false);
  }, [visible, defaultLabId, labs]);

  const labDipilih = useMemo(
    () => labs.find((l) => l.id === labId) ?? null,
    [labs, labId],
  );

  const userCocok = useMemo(() => {
    if (!nim.trim() && !email.trim()) return null;
    return cariUserTerdaftar(users, nim, email);
  }, [users, nim, email]);

  const handleSimpan = async () => {
    if (menyimpan) return;
    setGalat(null);

    if (!labDipilih) {
      setGalat(t('valPilihLab'));
      return;
    }

    const cleanNim = nim.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanNim && !cleanEmail) {
      setGalat(t('valNimEmailKosong'));
      return;
    }
    if (cleanEmail && !RE_EMAIL.test(cleanEmail)) {
      setGalat(t('valEmailInvalid'));
      return;
    }
    if (cleanNim && !RE_NIM.test(cleanNim)) {
      setGalat(t('valNimInvalid'));
      return;
    }

    if (users.length > 0) {
      if (!userCocok) {
        setGalat(t('memberNotRegistered'));
        return;
      }
      const peranSesuai =
        peran === 'praktikan'
          ? userCocok.peran === 'praktikan'
          : userCocok.peran === 'asisten';
      if (!peranSesuai) {
        setGalat(t('memberRoleMismatch'));
        return;
      }
      if (
        adaKonflikPeranMatkul(userCocok, labDipilih, peran, users, keanggotaanLab)
      ) {
        setGalat(t('memberRoleConflictCourse'));
        return;
      }
      const sudahAda = keanggotaanLab.some(
        (k) => k.labId === labDipilih.id && k.uid === userCocok.id,
      );
      if (sudahAda) {
        setGalat(t('memberAlreadyInLab'));
        return;
      }
    }

    setMenyimpan(true);
    try {
      const res = await addAnggotaBulk(labDipilih.id, peran, [
        {
          nim: cleanNim || undefined,
          email: cleanEmail || undefined,
        },
      ]);
      if (res.berhasil > 0) {
        showToast(t('memberAddedToast'));
        onClose();
        return;
      }
      const alasanGagal = res.gagal[0]?.alasan;
      setGalat(alasanGagal || t('stubNotReady'));
    } finally {
      setMenyimpan(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      kicker={t('singleMemberKicker')}
      judul={t('singleMemberTitle')}
      dismissible={!menyimpan}
      onClose={onClose}
      footer={
        <View style={styles.footerRow}>
          <Tombol
            variant="sekunder"
            disabled={menyimpan}
            onPress={onClose}
            style={styles.cancelBtn}
          >
            {t('cancel')}
          </Tombol>
          <Tombol
            variant="primer"
            loading={menyimpan}
            disabled={menyimpan}
            onPress={handleSimpan}
            style={styles.submitBtn}
          >
            {menyimpan ? t('saving') : t('addMemberBtn')}
          </Tombol>
        </View>
      }
    >
      {/* Pilih Peran (Praktikan atau Asprak) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('roleLabel')}</Text>
        <View style={styles.roleRow}>
          <Pressable
            accessibilityRole="button"
            disabled={menyimpan}
            onPress={() => {
              setPeran('praktikan');
              setGalat(null);
            }}
            style={[
              styles.roleBtn,
              peran === 'praktikan' && styles.roleBtnActive,
            ]}
          >
            <Text
              style={[
                styles.roleBtnText,
                peran === 'praktikan' && styles.roleBtnTextActive,
              ]}
            >
              {t('rolePraktikan')}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={menyimpan}
            onPress={() => {
              setPeran('asprak');
              setGalat(null);
            }}
            style={[
              styles.roleBtn,
              peran === 'asprak' && styles.roleBtnActive,
            ]}
          >
            <Text
              style={[
                styles.roleBtnText,
                peran === 'asprak' && styles.roleBtnTextActive,
              ]}
            >
              {t('roleAsprak')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Pilih Lab Tujuan */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('targetLabLabel')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {labs.map((l) => (
            <FilterChip
              key={l.id}
              label={
                l.mataKuliah ? `${l.nama} (${l.mataKuliah})` : l.nama
              }
              aktif={l.id === labId}
              onPress={() => {
                if (!menyimpan) setLabId(l.id);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Input NIM & Email */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>{t('nimOrEmailLabel')}</Text>
        <TextInput
          value={nim}
          onChangeText={(txt) => {
            setNim(txt);
            if (galat) setGalat(null);
          }}
          placeholder={t('placeholderNim')}
          placeholderTextColor={themeColors.textMuted}
          keyboardType="numeric"
          editable={!menyimpan}
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={(txt) => {
            setEmail(txt);
            if (galat) setGalat(null);
          }}
          placeholder={t('placeholderEmail')}
          placeholderTextColor={themeColors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!menyimpan}
          style={styles.input}
        />
      </View>

      {userCocok ? (
        <View style={styles.previewBox}>
          <CheckCircle2 size={16} color={themeColors.sesiDibukaFg} />
          <Text style={styles.previewText}>
            {t('memberFound', {
              nama: userCocok.nama,
              peran:
                userCocok.peran === 'asisten'
                  ? t('roleAsprak')
                  : t('rolePraktikan'),
            })}
          </Text>
        </View>
      ) : (nim.trim().length >= 6 || email.trim().includes('@')) &&
        users.length > 0 ? (
        <View style={styles.warnBox}>
          <UserRound size={15} color={themeColors.gpsOffFg} />
          <Text style={styles.warnText}>{t('memberNotRegistered')}</Text>
        </View>
      ) : null}

      {galat ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <Text style={styles.errorText}>{galat}</Text>
        </View>
      ) : null}
    </SheetModal>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    fieldGroup: {
      gap: 6,
    },
    label: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    roleRow: {
      flexDirection: 'row',
      gap: spacing.s2,
    },
    roleBtn: {
      flex: 1,
      minHeight: 42,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.s3,
    },
    roleBtnActive: {
      borderColor: w.primaryPressed,
      backgroundColor: w.primarySoft,
    },
    roleBtnText: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    roleBtnTextActive: {
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    chipRow: {
      gap: spacing.s2,
    },
    input: {
      minHeight: 46,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      paddingHorizontal: spacing.s3 + 2,
      paddingVertical: 10,
      ...type.body,
      color: w.textPrimary,
    },
    previewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: radius.button,
      backgroundColor: w.sesiDibukaBg,
    },
    previewText: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.sesiDibukaFg,
      flex: 1,
    },
    warnBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      padding: spacing.s3,
      borderRadius: radius.button,
      backgroundColor: w.gpsOffBg,
    },
    warnText: {
      ...type.caption,
      color: w.gpsOffFg,
      flex: 1,
    },
    errorBox: {
      padding: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.dangerBorder,
      backgroundColor: w.errorBg,
    },
    errorText: {
      ...type.caption,
      color: w.errorFg,
    },
    footerRow: {
      flexDirection: 'row',
      gap: spacing.s2 + 2,
      paddingBottom: spacing.s2,
    },
    cancelBtn: {
      flex: 0.85,
    },
    submitBtn: {
      flex: 1.15,
    },
  });
