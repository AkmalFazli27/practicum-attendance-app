import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle } from 'lucide-react-native';

import { LokasiPicker } from '@/components/peta/LokasiPicker';
import { PetaHeader } from '@/components/peta/PetaHeader';
import {
  bannerLokasiDari,
  bannerPrioritas,
  handlerBanner,
} from '@/components/peta/bannerLokasi';
import { labPunyaKoordinat, statusTungguLabs } from '@/components/peta/region';
import { teksPeta } from '@/components/peta/teks';
import {
  adaPerubahan,
  alasanTidakValid,
  parseRadius,
  type DrafLab,
} from '@/components/peta/validasiLab';
import {
  EmptyState,
  FilterChip,
  PermissionBanner,
  Tombol,
  useToast,
} from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import { usePreferences } from '@/context/PreferencesContext';
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
 * Rute ini berada di luar grup `(asisten)`, jadi guard dibuat manual. Isi layar
 * dipecah supaya `useLocation()` baru berjalan setelah peran terverifikasi:
 * deep link oleh praktikan tidak boleh memicu dialog izin lokasi.
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
  if (currentUser.peran !== 'asisten') {
    return <Redirect href={'/beranda-praktikan' as never} />;
  }

  return <KelolaLabContent />;
}

function KelolaLabContent() {
  const { labs, error, retrySync, updateLab } = useSession();
  const { status: statusLokasi, koordinat, mintaIzin, coba } = useLocation();
  // `pesanError` dari hook selalu berbahasa Indonesia; copy banner dan pesan
  // lokasi diambil dari kamus P2 agar ikut bahasa aplikasi.
  const { showToast } = useToast();
  const { language, themeColors } = usePreferences();
  const teks = teksPeta(language);
  const styles = useMemo(() => buatGaya(themeColors), [themeColors]);
  const insets = useSafeAreaInsets();

  const [labId, setLabId] = useState<string | null>(null);
  const [titik, setTitik] = useState<DrafLab['titik']>(null);
  const [radiusTeks, setRadiusTeks] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [sudahMencobaSimpan, setSudahMencobaSimpan] = useState(false);
  const [jedaLabsHabis, setJedaLabsHabis] = useState(false);

  // Sama seperti Peta: labs datang dari listener sendiri, jadi jangan langsung
  // menampilkan empty state saat data masih dimuat.
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

  // Pilih lab pertama yang punya koordinat agar layar tidak kosong saat dibuka.
  useEffect(() => {
    if (labId || labs.length === 0) return;
    const awal = labs.find(labPunyaKoordinat) ?? labs[0];
    setLabId(awal.id);
    setTitik(
      Number.isFinite(awal.lat) && Number.isFinite(awal.lng)
        ? { lat: awal.lat, lng: awal.lng }
        : null,
    );
    setRadiusTeks(Number.isFinite(awal.radius) ? String(awal.radius) : '');
  }, [labs, labId]);

  const pilihLab = useCallback((lab: Lab) => {
    setLabId(lab.id);
    setTitik(
      Number.isFinite(lab.lat) && Number.isFinite(lab.lng)
        ? { lat: lab.lat, lng: lab.lng }
        : null,
    );
    setRadiusTeks(Number.isFinite(lab.radius) ? String(lab.radius) : '');
    setSudahMencobaSimpan(false);
  }, []);

  const radiusAngka = parseRadius(radiusTeks);
  const draf: DrafLab = {
    labId,
    titik,
    radius: radiusAngka ?? Number.NaN,
  };
  const alasan = alasanTidakValid(draf);
  const pesanValidasi = alasan.map((kode) => teks.validasi[kode]);
  const berubah = labTerpilih ? adaPerubahan(labTerpilih, draf) : false;
  // Tombol tetap aktif saat data tidak valid supaya pesan inline bisa muncul;
  // `simpan` sendiri menolak menyimpan selama `alasan` belum kosong.
  const bisaMencoba = berubah && !menyimpan;

  const pakaiLokasiSaatIni = useCallback(() => {
    if (!koordinat) return;
    setTitik({ lat: koordinat.lat, lng: koordinat.lng });
  }, [koordinat]);

  const simpan = useCallback(async () => {
    setSudahMencobaSimpan(true);
    if (alasan.length > 0 || !labId || !titik) return;

    setMenyimpan(true);
    try {
      const berhasil = await updateLab(labId, {
        lat: titik.lat,
        lng: titik.lng,
        radius: radiusAngka as number,
      });
      if (berhasil) {
        setSudahMencobaSimpan(false);
        showToast(teks.toastTersimpan);
        return;
      }
      showToast(teks.toastGagalSimpan);
    } finally {
      setMenyimpan(false);
    }
  }, [alasan.length, labId, radiusAngka, showToast, titik, updateLab]);

  // Pesan lokasi hanya relevan saat tombol "gunakan lokasi" belum bisa dipakai.
  // Saat status gagal, banner di bawah sudah menjelaskan sebabnya, jadi pesan
  // kecil cukup muncul selama lokasi masih dibaca.
  const pesanLokasi =
    statusLokasi === 'memuat' ? teks.membacaLokasi : null;

  // Halaman ini memakai lokasi hanya untuk tombol "gunakan lokasi saat ini",
  // jadi status `memuat` cukup tampil sebagai pesan kecil, bukan banner.
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
                  // Mengganti lab saat menyimpan akan membuang draf yang
                  // sedang ditulis, jadi chip dikunci selama proses simpan.
                  onPress={() => {
                    if (menyimpan) return;
                    pilihLab(lab);
                  }}
                  style={menyimpan ? styles.chipNonaktif : undefined}
                />
              ))}
            </ScrollView>
          </View>

          {labTerpilih ? (
            <>
              <View style={styles.infoCard}>
                <Text style={styles.infoNama}>{labTerpilih.nama}</Text>
                <Text style={styles.infoAlamat}>{labTerpilih.alamat}</Text>
              </View>

              <LokasiPicker
                titik={titik}
                radius={radiusAngka ?? 0}
                onTitikChange={(t) => {
                  setTitik(t);
                  setSudahMencobaSimpan(false);
                }}
                disabled={menyimpan}
                radiusTeks={radiusTeks}
                onRadiusTeksChange={(teks) => {
                  setRadiusTeks(teks);
                  setSudahMencobaSimpan(false);
                }}
                onGunakanLokasi={pakaiLokasiSaatIni}
                bisaGunakanLokasi={Boolean(koordinat)}
                sedangMembacaLokasi={statusLokasi === 'memuat'}
                pesanLokasi={pesanLokasi}
                labId={labId}
              />

              {sudahMencobaSimpan && alasan.length > 0 ? (
                <View style={styles.validasiBox} accessibilityRole="alert">
                  <View style={styles.validasiJudulRow}>
                    <AlertTriangle size={16} color={themeColors.errorFg} />
                    <Text style={styles.validasiJudul}>
                      {teks.periksaData}
                    </Text>
                  </View>
                  {pesanValidasi.map((pesan) => (
                    <Text key={pesan} style={styles.validasiPesan}>
                      • {pesan}
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
      gap: spacing.s4,
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
    infoCard: {
      gap: 2,
      padding: spacing.s3,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
    },
    infoNama: {
      ...type.bodyStrong,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    infoAlamat: {
      ...type.caption,
      color: w.textMuted,
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
