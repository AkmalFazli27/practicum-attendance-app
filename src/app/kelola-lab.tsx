import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';

import { useLabI18n } from '@/components/aslab/lab/i18nLab';
import {
  DEFAULT_DENDA_NOMINAL,
  DEFAULT_GRACE_MENIT,
  DEFAULT_RADIUS_LAB,
  validasiFormLab,
} from '@/components/aslab/lab/validasiManajemenLab';
import { LokasiPicker } from '@/components/peta/LokasiPicker';
import { PetaHeader } from '@/components/peta/PetaHeader';
import {
  bannerLokasiDari,
  bannerPrioritas,
  handlerBanner,
} from '@/components/peta/bannerLokasi';
import { labPunyaKoordinat, statusTungguLabs } from '@/components/peta/region';
import { teksPeta } from '@/components/peta/teks';
import { parseRadius, type DrafLab } from '@/components/peta/validasiLab';
import {
  EmptyState,
  FilterChip,
  PermissionBanner,
  Tombol,
  useToast,
} from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { Lab } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type,
  type ThemeColors,
} from '@/theme/tokens';

const JEDA_TUNGGU_LABS_MS = 4000;

/**
 * Kelola Lab khusus Aslab (FR-26, FR-27, FR-33).
 * Asprak (`asisten`) dan Praktikan diarahkan ke beranda perannya masing-masing.
 */
export default function KelolaLabScreen() {
  const { currentUser, loading } = useSession();
  const { themeColors, language } = usePreferences();
  const teks = teksPeta(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);

  if (loading) {
    return (
      <View style={styles.root}>
        <PetaHeader judul={teks.judulKelolaLab} kicker={teks.kickerLab} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.graphite} />
          <Text style={styles.centerText}>{teks.memuatLabs}</Text>
        </View>
      </View>
    );
  }

  if (!currentUser) return <Redirect href="/" />;
  if (currentUser.peran !== 'aslab') {
    return (
      <Redirect
        href={
          (currentUser.peran === 'asisten'
            ? '/(asisten)/(tabs)/beranda-asisten'
            : '/(praktikan)/(tabs)/beranda-praktikan') as never
        }
      />
    );
  }

  return <KelolaLabContent />;
}

function KelolaLabContent() {
  const { labs, error, retrySync, updateLab } = useSession();
  const { status: statusLokasi, koordinat, mintaIzin, coba } = useLocation();
  const { showToast } = useToast();
  const { language, themeColors } = usePreferences();
  const { t } = useLabI18n();
  const teks = teksPeta(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();

  const [labId, setLabId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [mataKuliah, setMataKuliah] = useState('');
  const [alamat, setAlamat] = useState('');
  const [titik, setTitik] = useState<DrafLab['titik']>(null);
  const [radiusTeks, setRadiusTeks] = useState('');
  const [graceTeks, setGraceTeks] = useState(String(DEFAULT_GRACE_MENIT));
  const [dendaTeks, setDendaTeks] = useState(String(DEFAULT_DENDA_NOMINAL));
  const [menyimpan, setMenyimpan] = useState(false);
  const [sudahMencobaSimpan, setSudahMencobaSimpan] = useState(false);
  const [jedaLabsHabis, setJedaLabsHabis] = useState(false);

  useEffect(() => {
    if (labs.length > 0 || error) return;
    const id = setTimeout(() => setJedaLabsHabis(true), JEDA_TUNGGU_LABS_MS);
    return () => clearTimeout(id);
  }, [labs.length, error]);

  const menungguLabs =
    statusTungguLabs(false, labs.length, error, jedaLabsHabis) === 'menunggu';

  const labTerpilih = useMemo(
    () => labs.find((lab) => lab.id === labId) ?? null,
    [labs, labId],
  );

  const isiFormDariLab = useCallback((lab: Lab) => {
    setLabId(lab.id);
    setNama(lab.nama);
    setMataKuliah(lab.mataKuliah ?? '');
    setAlamat(lab.alamat);
    setTitik(
      Number.isFinite(lab.lat) && Number.isFinite(lab.lng)
        ? { lat: lab.lat, lng: lab.lng }
        : null,
    );
    setRadiusTeks(
      Number.isFinite(lab.radius)
        ? String(lab.radius)
        : String(DEFAULT_RADIUS_LAB),
    );
    setGraceTeks(
      typeof lab.graceMenit === 'number'
        ? String(lab.graceMenit)
        : String(DEFAULT_GRACE_MENIT),
    );
    setDendaTeks(
      typeof lab.dendaNominal === 'number'
        ? String(lab.dendaNominal)
        : String(DEFAULT_DENDA_NOMINAL),
    );
    setSudahMencobaSimpan(false);
  }, []);

  useEffect(() => {
    if (labId || labs.length === 0) return;
    const awal = labs.find(labPunyaKoordinat) ?? labs[0];
    isiFormDariLab(awal);
  }, [labs, labId, isiFormDariLab]);

  const radiusAngka = parseRadius(radiusTeks);
  const hasilValidasi = useMemo(
    () =>
      validasiFormLab({
        nama,
        mataKuliah,
        alamat,
        titik,
        radiusTeks,
        graceTeks,
        dendaTeks,
      }),
    [nama, mataKuliah, alamat, titik, radiusTeks, graceTeks, dendaTeks],
  );

  const berubah = useMemo(() => {
    if (!labTerpilih) return false;
    const gLama = labTerpilih.graceMenit ?? DEFAULT_GRACE_MENIT;
    const dLama = labTerpilih.dendaNominal ?? DEFAULT_DENDA_NOMINAL;
    return (
      nama.trim() !== labTerpilih.nama ||
      mataKuliah.trim() !== (labTerpilih.mataKuliah ?? '') ||
      alamat.trim() !== labTerpilih.alamat ||
      radiusTeks.trim() !== String(labTerpilih.radius) ||
      graceTeks.trim() !== String(gLama) ||
      dendaTeks.trim() !== String(dLama) ||
      !titik ||
      Math.abs(titik.lat - labTerpilih.lat) > 1e-7 ||
      Math.abs(titik.lng - labTerpilih.lng) > 1e-7
    );
  }, [labTerpilih, nama, mataKuliah, alamat, radiusTeks, graceTeks, dendaTeks, titik]);

  const bisaMencoba = berubah && !menyimpan;

  const pakaiLokasiSaatIni = useCallback(() => {
    if (!koordinat) return;
    setTitik({ lat: koordinat.lat, lng: koordinat.lng });
  }, [koordinat]);

  const simpan = useCallback(async () => {
    setSudahMencobaSimpan(true);
    if (hasilValidasi.errors.length > 0 || !labId || !titik) return;

    setMenyimpan(true);
    try {
      const payloadUpdate = {
        nama: nama.trim(),
        mataKuliah: mataKuliah.trim(),
        alamat: alamat.trim(),
        lat: titik.lat,
        lng: titik.lng,
        radius: hasilValidasi.radius,
        graceMenit: hasilValidasi.graceMenit,
        dendaNominal: hasilValidasi.dendaNominal,
      };
      const berhasil = await updateLab(
        labId,
        payloadUpdate as Parameters<typeof updateLab>[1],
      );
      if (berhasil) {
        setSudahMencobaSimpan(false);
        showToast(t('labUpdatedToast'));
        return;
      }
      showToast(teks.toastGagalSimpan);
    } finally {
      setMenyimpan(false);
    }
  }, [
    hasilValidasi,
    labId,
    titik,
    nama,
    mataKuliah,
    alamat,
    updateLab,
    showToast,
    t,
    teks.toastGagalSimpan,
  ]);

  const pesanLokasi =
    statusLokasi === 'memuat' ? teks.membacaLokasi : null;

  const banner = bannerPrioritas(
    error,
    statusLokasi === 'memuat' ? null : bannerLokasiDari(statusLokasi, null),
  );

  return (
    <View style={styles.root}>
      <PetaHeader
        judul={teks.judulKelolaLab}
        kicker={teks.kickerLab}
        onRefresh={retrySync}
      />

      {banner ? (
        <View style={styles.bannerWrap}>
          <PermissionBanner
            jenis={banner.jenis}
            judul={teks.banner[banner.jenis].judul}
            pesan={banner.pesan ?? teks.banner[banner.jenis].pesan}
            aksiLabel={teks.banner[banner.jenis].aksi}
            onAksi={handlerBanner(banner, { mintaIzin, coba, retrySync })}
          />
        </View>
      ) : null}

      {labs.length === 0 ? (
        menungguLabs ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={themeColors.graphite} />
            <Text style={styles.centerText}>{teks.memuatLabs}</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <EmptyState
              judul={teks.petaKosongJudul}
              pesan={error ? teks.labKosongPesanError : teks.labKosongPesan}
              aksi={{ label: teks.coba, onPress: retrySync }}
            />
          </View>
        )
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, spacing.s6) + spacing.s6 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.label}>{teks.pilihLab}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {labs.map((lab) => (
                <FilterChip
                  key={lab.id}
                  label={lab.nama}
                  aktif={lab.id === labId}
                  onPress={() => {
                    if (menyimpan) return;
                    isiFormDariLab(lab);
                  }}
                  style={menyimpan ? styles.chipNonaktif : undefined}
                />
              ))}
            </ScrollView>
          </View>

          {labTerpilih ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('fieldNamaLab')}</Text>
                <TextInput
                  value={nama}
                  onChangeText={setNama}
                  placeholder={t('placeholderNamaLab')}
                  placeholderTextColor={themeColors.textMuted}
                  editable={!menyimpan}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('fieldMataKuliah')}</Text>
                <TextInput
                  value={mataKuliah}
                  onChangeText={setMataKuliah}
                  placeholder={t('placeholderMataKuliah')}
                  placeholderTextColor={themeColors.textMuted}
                  editable={!menyimpan}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t('fieldAlamat')}</Text>
                <TextInput
                  value={alamat}
                  onChangeText={setAlamat}
                  placeholder={t('placeholderAlamat')}
                  placeholderTextColor={themeColors.textMuted}
                  editable={!menyimpan}
                  style={styles.input}
                />
              </View>

              <LokasiPicker
                titik={titik}
                radius={radiusAngka ?? 0}
                onTitikChange={(nextTitik) => {
                  setTitik(nextTitik);
                  setSudahMencobaSimpan(false);
                }}
                disabled={menyimpan}
                radiusTeks={radiusTeks}
                onRadiusTeksChange={(txt) => {
                  setRadiusTeks(txt);
                  setSudahMencobaSimpan(false);
                }}
                onGunakanLokasi={pakaiLokasiSaatIni}
                bisaGunakanLokasi={Boolean(koordinat)}
                sedangMembacaLokasi={statusLokasi === 'memuat'}
                pesanLokasi={pesanLokasi}
                labId={labId}
              />

              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, styles.halfCol]}>
                  <Text style={styles.fieldLabel}>{t('fieldGrace')}</Text>
                  <TextInput
                    value={graceTeks}
                    onChangeText={setGraceTeks}
                    keyboardType="numeric"
                    editable={!menyimpan}
                    style={styles.input}
                  />
                  <Text style={styles.hint}>{t('hintGrace')}</Text>
                </View>

                <View style={[styles.fieldGroup, styles.halfCol]}>
                  <Text style={styles.fieldLabel}>{t('fieldDenda')}</Text>
                  <TextInput
                    value={dendaTeks}
                    onChangeText={setDendaTeks}
                    keyboardType="numeric"
                    editable={!menyimpan}
                    style={styles.input}
                  />
                  <Text style={styles.hint}>{t('hintDenda')}</Text>
                </View>
              </View>

              {sudahMencobaSimpan && hasilValidasi.errors.length > 0 ? (
                <View style={styles.validasiBox} accessibilityRole="alert">
                  <View style={styles.validasiJudulRow}>
                    <AlertTriangle size={16} color={themeColors.errorFg} />
                    <Text style={styles.validasiJudul}>
                      {teks.periksaData}
                    </Text>
                  </View>
                  {hasilValidasi.errors.map((kode) => (
                    <Text key={kode} style={styles.validasiPesan}>
                      • {t(kode)}
                    </Text>
                  ))}
                </View>
              ) : null}

              <Text style={styles.bantuanSimpan}>
                {berubah
                  ? teks.perubahanBelumDisimpan
                  : teks.dataSesuai}
              </Text>

              <Tombol
                variant="primer"
                loading={menyimpan}
                disabled={!bisaMencoba}
                onPress={simpan}
              >
                {teks.simpanPerubahan}
              </Tombol>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: w.background,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.s3,
      padding: spacing.s5,
    },
    centerText: {
      ...type.caption,
      color: w.textMuted,
      textAlign: 'center',
    },
    bannerWrap: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s3,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s4,
      gap: spacing.s3 + 2,
    },
    section: {
      gap: spacing.s2,
    },
    label: {
      ...type.micro,
      color: w.textMuted,
      letterSpacing: 1.1,
    },
    chipRow: {
      gap: spacing.s2,
      paddingRight: layout.screenPadding,
    },
    chipNonaktif: {
      opacity: 0.5,
    },
    fieldGroup: {
      gap: 6,
    },
    fieldLabel: {
      ...type.caption,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
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
    hint: {
      ...type.micro,
      color: w.textMuted,
      lineHeight: 15,
    },
    rowTwo: {
      flexDirection: 'row',
      gap: spacing.s3,
    },
    halfCol: {
      flex: 1,
    },
    validasiBox: {
      gap: spacing.s1,
      padding: spacing.s3,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: w.dangerBorder,
      backgroundColor: w.errorBg,
    },
    validasiJudulRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.s2,
    },
    validasiJudul: {
      ...type.bodyStrong,
      fontFamily: fontFamily.semibold,
      color: w.errorFg,
    },
    validasiPesan: {
      ...type.caption,
      color: w.errorFg,
      lineHeight: 18,
    },
    bantuanSimpan: {
      ...type.caption,
      color: w.textMuted,
    },
  });
