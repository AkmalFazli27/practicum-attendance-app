import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Download,
  FileSpreadsheet,
  Upload,
} from 'lucide-react-native';

import {
  EmptyState,
  FilterChip,
  Tombol,
  useToast,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { HasilBulk, Keanggotaan, Lab } from '@/data/dummy';
import { useAslabStore } from './aslabStore';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';
import {
  ImportReviewList,
  type FieldDefinisiReview,
  type ItemReviewTampil,
} from './ImportReviewList';
import { HEADER_CSV, pilihDanBacaCsv, unduhTemplateCsv } from './csvLab';
import { useLabI18n } from './i18nLab';
import {
  evaluasiBarisAnggota,
  type BarisReviewAnggota,
} from './validasiManajemenLab';

type KeyFieldAnggota = 'nim' | 'email' | 'nama';

export interface BulkAnggotaViewProps {
  peranTarget: Keanggotaan['peran'];
}

/**
 * Tampilan untuk layar Bulk Insert Praktikan atau Bulk Insert Asprak.
 * Dipakai oleh dua route dan template terpisah (`bulk-praktikan` dan `bulk-asprak`).
 */
export function BulkAnggotaView({ peranTarget }: BulkAnggotaViewProps) {
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
  const { kelasList, keanggotaanAll: keanggotaanLab, tambahAnggotaKelas } =
    useAslabStore();

  const labs = useMemo<Lab[]>(() => {
    if (kelasList.length > 0) {
      return kelasList.map((k) => ({
        id: k.id,
        nama: k.namaKelas,
        mataKuliah: k.mataKuliah,
        ruanganLab: k.ruanganLabNama,
        jumlahPertemuan: k.jumlahPertemuan,
        alamat: k.alamat,
        lat: k.lat,
        lng: k.lng,
        radius: k.radius,
        graceMenit: k.graceMenit,
        dendaNominal: k.dendaNominal,
      }));
    }
    return sessionLabs;
  }, [kelasList, sessionLabs]);

  const isPraktikan = peranTarget === 'praktikan';
  const jenisCsv = isPraktikan ? 'praktikan' : 'asprak';

  const [labId, setLabId] = useState<string | null>(labs[0]?.id ?? null);
  const [namaFile, setNamaFile] = useState<string | null>(null);
  const [barisCsv, setBarisCsv] = useState<BarisReviewAnggota[]>([]);
  const [errorCsv, setErrorCsv] = useState<string | null>(null);
  const [menyimpan, setMenyimpan] = useState(false);
  const [hasilSimpan, setHasilSimpan] = useState<HasilBulk | null>(null);

  useEffect(() => {
    if (!labId && labs.length > 0) {
      setLabId(labs[0].id);
    }
  }, [labId, labs]);

  const labTerpilih = useMemo(
    () => labs.find((l) => l.id === labId) ?? null,
    [labs, labId],
  );

  const fields = useMemo<FieldDefinisiReview<KeyFieldAnggota>[]>(
    () => [
      {
        key: 'nim',
        label: 'NIM / ID',
        placeholder: t('placeholderNim'),
        keyboardType: 'numeric',
      },
      {
        key: 'email',
        label: 'Email',
        placeholder: t('placeholderEmail'),
        keyboardType: 'email-address',
      },
      {
        key: 'nama',
        label: isPraktikan ? t('rolePraktikan') : t('roleAsprak'),
        placeholder: 'Opsional (nama)',
      },
    ],
    [t, isPraktikan],
  );

  const itemsReview = useMemo<ItemReviewTampil<KeyFieldAnggota>[]>(() => {
    return barisCsv.map((b) => {
      const ev = evaluasiBarisAnggota(
        b,
        barisCsv,
        labTerpilih,
        peranTarget,
        users,
        keanggotaanLab,
      );
      let pesanMasalah: string | undefined;
      if (ev.status === 'invalid' && ev.alasanKode) {
        pesanMasalah = t(ev.alasanKode);
      } else if (ev.status === 'belum-terdaftar') {
        pesanMasalah = t('memberNotRegistered');
      } else if (ev.status === 'duplikat') {
        pesanMasalah = t('memberAlreadyInLab');
      }

      const judulUtama =
        ev.matchedUser?.nama || b.nama || b.email || b.nim || `Baris #${b.nomorBaris}`;
      const subParts = [
        b.nim ? `NIM: ${b.nim}` : null,
        b.email || null,
      ].filter(Boolean);

      return {
        id: b.id,
        nomorBaris: b.nomorBaris,
        diterima: b.diterima,
        status: ev.status,
        judulUtama,
        subjudul: subParts.join(' · '),
        pesanMasalah,
        nilaiField: {
          nim: b.nim,
          email: b.email,
          nama: b.nama,
        } as Record<KeyFieldAnggota, string>,
      };
    });
  }, [barisCsv, labTerpilih, peranTarget, users, keanggotaanLab, t]);

  const handleUnduhTemplate = async () => {
    const res = await unduhTemplateCsv(jenisCsv);
    showToast(res.ok ? t('templateReadyToast') : t('templateErrorToast'));
  };

  const handlePilihCsv = async () => {
    setErrorCsv(null);
    setHasilSimpan(null);
    const res = await pilihDanBacaCsv(jenisCsv);
    if (!res.ok) {
      if (res.canceled) return;
      if (res.errorKind === 'header') {
        setErrorCsv(
          t('csvHeaderError', { cols: HEADER_CSV[jenisCsv].join(', ') }),
        );
      } else if (res.errorKind === 'empty') {
        setErrorCsv(t('csvEmptyError'));
      } else {
        setErrorCsv(t('csvCorruptError'));
      }
      return;
    }

    setNamaFile(res.fileName);
    const mapped: BarisReviewAnggota[] = res.rows.map((r, idx) => ({
      id: `row-${Date.now()}-${idx}`,
      nomorBaris: idx + 1,
      diterima: true,
      nim: r.nim ?? '',
      email: r.email ?? '',
      nama: r.nama ?? '',
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
        const ev = evaluasiBarisAnggota(
          b,
          prev,
          labTerpilih,
          peranTarget,
          users,
          keanggotaanLab,
        );
        return ev.status === 'valid' ? { ...b, diterima: true } : b;
      }),
    );
  }, [labTerpilih, peranTarget, users, keanggotaanLab]);

  const handleTolakSemua = useCallback(() => {
    setBarisCsv((prev) => prev.map((b) => ({ ...b, diterima: false })));
  }, []);

  const handleUbahField = useCallback(
    (id: string, key: KeyFieldAnggota, nilai: string) => {
      setHasilSimpan(null);
      setBarisCsv((prev) =>
        prev.map((b) => (b.id === id ? { ...b, [key]: nilai } : b)),
      );
    },
    [],
  );

  const handleSimpan = async () => {
    if (menyimpan) return;
    if (!labTerpilih) {
      setErrorCsv(t('valPilihLab'));
      return;
    }

    const siapSimpan = barisCsv.filter((b) => {
      if (!b.diterima) return false;
      const ev = evaluasiBarisAnggota(
        b,
        barisCsv,
        labTerpilih,
        peranTarget,
        users,
        keanggotaanLab,
      );
      return ev.status === 'valid';
    });

    if (siapSimpan.length === 0) return;

    setMenyimpan(true);
    try {
      const matchedUids: string[] = [];
      for (const b of siapSimpan) {
        const ev = evaluasiBarisAnggota(
          b,
          barisCsv,
          labTerpilih,
          peranTarget,
          users,
          keanggotaanLab,
        );
        if (ev.matchedUser) matchedUids.push(ev.matchedUser.id);
      }
      const berhasil = await tambahAnggotaKelas(
        labTerpilih.id,
        peranTarget,
        matchedUids,
      );
      const res: HasilBulk = { berhasil, gagal: [] };
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
          <Text style={styles.kicker}>
            {isPraktikan ? t('bulkPraktikanKicker') : t('bulkAsprakKicker')}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {isPraktikan ? t('bulkPraktikanTitle') : t('bulkAsprakTitle')}
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
        <Text style={styles.subtitle}>
          {isPraktikan ? t('bulkPraktikanSub') : t('bulkAsprakSub')}
        </Text>

        {labs.length === 0 ? (
          <EmptyState
            judul={t('emptyLabsTitle')}
            pesan={t('emptyLabsDesc')}
          />
        ) : (
          <>
            {/* Langkah 1: Pilih Lab & Unduh Template CSV */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('step1Config')}</Text>
              <Text style={styles.fieldLabel}>{t('targetLabLabel')}</Text>
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
                  <FileSpreadsheet
                    size={16}
                    color={themeColors.sesiDibukaFg}
                  />
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
          </>
        )}
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
    headerCopy: {
      flex: 1,
    },
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
