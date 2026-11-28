import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react-native';

import {
  ImportReviewList,
  type FieldDefinisiReview,
  type ItemReviewTampil,
} from '@/components/aslab/lab/ImportReviewList';
import {
  HEADER_CSV,
  pilihDanBacaCsv,
  unduhTemplateCsv,
} from '@/components/aslab/lab/csvLab';
import { useLabI18n } from '@/components/aslab/lab/i18nLab';
import {
  DEFAULT_DENDA_NOMINAL,
  DEFAULT_GRACE_MENIT,
  evaluasiBarisLab,
  type BarisReviewLab,
} from '@/components/aslab/lab/validasiManajemenLab';
import { FilterChip, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { HasilBulk } from '@/data/dummy';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';

type KeyFieldLab =
  | 'nama'
  | 'alamat'
  | 'lat'
  | 'lng'
  | 'radius'
  | 'graceMenit'
  | 'dendaNominal';

/**
 * Layar Bulk Insert Laboratorium berdasarkan satu mata kuliah (FR-28, FR-31).
 */
export default function BulkLabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const { t } = useLabI18n();
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  const { currentUser, labs, createLabsBulk } = useSession();

  const daftarMkAda = useMemo(
    () =>
      Array.from(
        new Set(
          labs
            .map((l) => (l.mataKuliah ?? '').trim())
            .filter((mk) => mk.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [labs],
  );

  const [mataKuliah, setMataKuliah] = useState<string>(daftarMkAda[0] ?? '');
  const [namaFile, setNamaFile] = useState<string | null>(null);
  const [barisCsv, setBarisCsv] = useState<BarisReviewLab[]>([]);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [hasilSimpan, setHasilSimpan] = useState<HasilBulk | null>(null);

  const fields = useMemo<FieldDefinisiReview<KeyFieldLab>[]>(
    () => [
      { key: 'nama', label: t('fieldNamaLab'), placeholder: 'Lab A' },
      { key: 'alamat', label: t('fieldAlamat'), placeholder: 'Gedung E' },
      {
        key: 'lat',
        label: 'Latitude',
        placeholder: '-7.0490375',
        keyboardType: 'numeric',
      },
      {
        key: 'lng',
        label: 'Longitude',
        placeholder: '110.441484',
        keyboardType: 'numeric',
      },
      {
        key: 'radius',
        label: 'Radius (m)',
        placeholder: '100',
        keyboardType: 'numeric',
      },
      {
        key: 'graceMenit',
        label: t('fieldGrace'),
        placeholder: '15',
        keyboardType: 'numeric',
      },
      {
        key: 'dendaNominal',
        label: t('fieldDenda'),
        placeholder: '5000',
        keyboardType: 'numeric',
      },
    ],
    [t],
  );

  const itemsReview = useMemo<ItemReviewTampil<KeyFieldLab>[]>(() => {
    return barisCsv.map((b) => {
      const ev = evaluasiBarisLab(
        b,
        barisCsv,
        mataKuliah,
        labs,
        currentUser?.id,
      );
      const pesanMasalah =
        ev.status === 'invalid' && ev.alasan.length > 0
          ? ev.alasan.map((kode) => t(kode)).join(' · ')
          : ev.status === 'duplikat'
            ? t('sumDuplicate', { count: 1 })
            : undefined;

      return {
        id: b.id,
        nomorBaris: b.nomorBaris,
        diterima: b.diterima,
        status: ev.status,
        judulUtama: b.nama || `Baris #${b.nomorBaris}`,
        subjudul: [
          b.alamat,
          b.radius ? `${b.radius} m` : null,
          b.graceMenit ? `Grace ${b.graceMenit}m` : null,
          b.dendaNominal ? `Rp${b.dendaNominal}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        pesanMasalah,
        nilaiField: {
          nama: b.nama,
          alamat: b.alamat,
          lat: b.lat,
          lng: b.lng,
          radius: b.radius,
          graceMenit: b.graceMenit,
          dendaNominal: b.dendaNominal,
        },
      };
    });
  }, [barisCsv, mataKuliah, labs, currentUser?.id, t]);

  const handleUnduhTemplate = async () => {
    const res = await unduhTemplateCsv('lab');
    showToast(res.ok ? t('templateReadyToast') : t('templateErrorToast'));
  };

  const handlePilihCsv = async () => {
    setErrorCsv(null);
    setHasilSimpan(null);
    const res = await pilihDanBacaCsv('lab');
    if (!res.ok) {
      if (res.canceled) return;
      if (res.errorKind === 'header') {
        setErrorCsv(
          t('csvHeaderError', { cols: HEADER_CSV.lab.join(', ') }),
        );
      } else if (res.errorKind === 'empty') {
        setErrorCsv(t('csvEmptyError'));
      } else {
        setErrorCsv(t('csvCorruptError'));
      }
      return;
    }

    setNamaFile(res.fileName);
    const mapped: BarisReviewLab[] = res.rows.map((r, idx) => ({
      id: `lab-row-${Date.now()}-${idx}`,
      nomorBaris: idx + 1,
      diterima: true,
      nama: r.nama ?? '',
      alamat: r.alamat ?? '',
      lat: r.lat ?? '',
      lng: r.lng ?? '',
      radius: r.radius ?? '',
      graceMenit: r.graceMenit || String(DEFAULT_GRACE_MENIT),
      dendaNominal: r.dendaNominal || String(DEFAULT_DENDA_NOMINAL),
    }));
    setBarisCsv(mapped);
  };

  const handleToggleTerima = useCallback((id: string) => {
    setBarisCsv((prev) =>
      prev.map((b) => (b.id === id ? { ...b, diterima: !b.diterima } : b)),
    );
  }, []);

  const handleTerimaSemuaValid = useCallback(() => {
    setBarisCsv((prev) =>
      prev.map((b) => {
        const ev = evaluasiBarisLab(
          b,
          prev,
          mataKuliah,
          labs,
          currentUser?.id,
        );
        return ev.status === 'valid' ? { ...b, diterima: true } : b;
      }),
    );
  }, [mataKuliah, labs, currentUser?.id]);

  const handleTolakSemua = useCallback(() => {
    setBarisCsv((prev) => prev.map((b) => ({ ...b, diterima: false })));
  }, []);

  const handleUbahField = useCallback(
    (id: string, key: KeyFieldLab, nilai: string) => {
      setHasilSimpan(null);
      setBarisCsv((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [key]: nilai } : b)),
      );
    },
    [],
  );

  const handleSimpan = async () => {
    if (menyimpan) return;
    if (!mataKuliah.trim()) {
      setErrorCsv(t('valMkKosong'));
      return;
    }

    const payloads = barisCsv
      .filter((b) => b.diterima)
      .map((b) =>
        evaluasiBarisLab(b, barisCsv, mataKuliah, labs, currentUser?.id),
      )
      .filter((ev) => ev.status === 'valid' && ev.payload !== null)
      .map((ev) => ev.payload!);

    if (payloads.length === 0) return;

    setMenyimpan(true);
    try {
      const res = await createLabsBulk(mataKuliah.trim(), payloads);
      setHasilSimpan(res);
      if (res.berhasil > 0) {
        showToast(t('resultSuccessCount', { count: res.berhasil }));
      }
    } finally {
      setMenyimpan(false);
    }
  };

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

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
          <Text style={styles.kicker}>{t('bulkLabKicker')}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {t('bulkLabTitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing.s6) + spacing.s6 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>{t('bulkLabSub')}</Text>

        {/* Langkah 1: Mata Kuliah & Unduh Template */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('step1Config')}</Text>
          <Text style={styles.fieldLabel}>{t('fieldMataKuliah')}</Text>
          <TextInput
            value={mataKuliah}
            onChangeText={(txt) => {
              setMataKuliah(txt);
              if (errorCsv) setErrorCsv(null);
            }}
            placeholder={t('placeholderMataKuliah')}
            placeholderTextColor={themeColors.textMuted}
            editable={!menyimpan}
            style={styles.input}
          />

          {daftarMkAda.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {daftarMkAda.map((mk) => (
                <FilterChip
                  key={mk}
                  label={mk}
                  aktif={mataKuliah.trim().toLowerCase() === mk.toLowerCase()}
                  onPress={() => {
                    if (!menyimpan) setMataKuliah(mk);
                  }}
                />
              ))}
            </ScrollView>
          ) : null}

          <Tombol
            variant="sekunder"
            icon={<Download size={16} color={themeColors.textPrimary} />}
            onPress={handleUnduhTemplate}
          >
            {t('downloadTemplate')}
          </Tombol>
        </View>

        {/* Langkah 2: Unggah File CSV */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('step2Upload')}</Text>
          <Tombol
            variant="primer"
            icon={<Upload size={16} color={themeColors.onPrimary} />}
            disabled={menyimpan}
            onPress={handlePilihCsv}
          >
            {namaFile ? t('replaceCsvBtn') : t('pickCsvBtn')}
          </Tombol>
          {namaFile ? (
            <View style={styles.fileInfoRow}>
              <FileSpreadsheet size={16} color={themeColors.sesiDibukaFg} />
              <Text style={styles.fileInfoText}>
                {t('pickedFileLabel', {
                  name: namaFile,
                  count: barisCsv.length,
                })}
              </Text>
            </View>
          ) : null}
          {errorCsv ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorText}>{errorCsv}</Text>
            </View>
          ) : null}
        </View>

        {/* Langkah 3: Review & Koreksi Baris */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{t('step3Review')}</Text>
          <ImportReviewList
            items={itemsReview}
            fields={fields}
            onToggleTerima={handleToggleTerima}
            onTerimaSemuaValid={handleTerimaSemuaValid}
            onTolakSemua={handleTolakSemua}
            onUbahField={handleUbahField}
            onSimpan={handleSimpan}
            menyimpan={menyimpan}
            hasilSimpan={hasilSimpan}
          />
        </View>
      </ScrollView>
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
    pressed: { opacity: 0.75 },
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
    card: {
      padding: spacing.s4,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      gap: spacing.s3,
    },
    sectionWrap: {
      gap: spacing.s2,
    },
    sectionTitle: {
      ...type.bodyStrong,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    fieldLabel: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    input: {
      minHeight: 46,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.background,
      paddingHorizontal: spacing.s3 + 2,
      paddingVertical: 10,
      ...type.body,
      color: w.textPrimary,
    },
    chipRow: {
      gap: spacing.s2,
    },
    fileInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
      padding: spacing.s2 + 2,
      borderRadius: radius.button,
      backgroundColor: w.sesiDibukaBg,
    },
    fileInfoText: {
      ...type.caption,
      fontFamily: fontFamily.semibold,
      color: w.sesiDibukaFg,
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
  });
