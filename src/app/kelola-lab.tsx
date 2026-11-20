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

import { LocationBanner } from '@/components/peta/LocationBanner';
import { LokasiPicker } from '@/components/peta/LokasiPicker';
import { PetaHeader } from '@/components/peta/PetaHeader';
import {
  bannerLokasiDari,
  bannerPrioritas,
  handlerBanner,
} from '@/components/peta/bannerLokasi';
import { labPunyaKoordinat } from '@/components/peta/region';
import {
  adaPerubahan,
  alasanTidakValid,
  parseRadius,
  type DrafLab,
} from '@/components/peta/validasiLab';
import { EmptyState, FilterChip, Tombol, useToast } from '@/components/ui';
import { useSession } from '@/context/SessionContext';
import type { Lab } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import { colors, layout, radius, spacing, type } from '@/theme/tokens';

export default function KelolaLabScreen() {
  const { currentUser, loading, labs, error, retrySync, updateLab } =
    useSession();
  const { status: statusLokasi, koordinat, pesanError, mintaIzin, coba } =
    useLocation();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [labId, setLabId] = useState<string | null>(null);
  const [titik, setTitik] = useState<DrafLab['titik']>(null);
  const [radiusTeks, setRadiusTeks] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [sudahMencobaSimpan, setSudahMencobaSimpan] = useState(false);

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

  const radius = parseRadius(radiusTeks);
  const draf: DrafLab = {
    labId,
    titik,
    radius: radius ?? Number.NaN,
  };
  const alasan = alasanTidakValid(draf);
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
        radius: radius as number,
      });
      if (berhasil) {
        setSudahMencobaSimpan(false);
        showToast('Data laboratorium tersimpan.');
        return;
      }
      showToast(
        'Gagal menyimpan data laboratorium. Periksa koneksi lalu coba lagi.',
      );
    } finally {
      setMenyimpan(false);
    }
  }, [alasan.length, labId, radius, showToast, titik, updateLab]);

  if (loading) {
    return (
      <View style={styles.root}>
        <PetaHeader judul="Kelola Lab" kicker="LABORATORIUM" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.graphite} />
          <Text style={styles.centerText}>Memuat data laboratorium…</Text>
        </View>
      </View>
    );
  }

  if (!currentUser) return <Redirect href="/" />;
  if (currentUser.peran !== 'asisten') {
    return <Redirect href={'/beranda-praktikan' as never} />;
  }

  // Pesan lokasi hanya relevan saat tombol "gunakan lokasi" belum bisa dipakai.
  const pesanLokasi =
    statusLokasi === 'siap'
      ? null
      : (pesanError ??
        (statusLokasi === 'memuat' ? 'Membaca lokasi perangkat…' : null));

  // Halaman ini memakai lokasi hanya untuk tombol "gunakan lokasi saat ini",
  // jadi status `memuat` cukup tampil sebagai pesan kecil, bukan banner.
  const banner = bannerPrioritas(
    error,
    statusLokasi === 'memuat'
      ? null
      : bannerLokasiDari(statusLokasi, pesanError),
  );

  return (
    <View style={styles.root}>
      <PetaHeader
        judul="Kelola Lab"
        kicker="LABORATORIUM"
        onRefresh={retrySync}
      />

      {banner ? (
        <View style={styles.bannerWrap}>
          <LocationBanner
            jenis={banner.jenis}
            pesan={banner.pesan}
            onRetry={handlerBanner(banner, { mintaIzin, coba, retrySync })}
          />
        </View>
      ) : null}

      {labs.length === 0 ? (
        <View style={styles.center}>
          <EmptyState
            judul="Belum ada data laboratorium"
            pesan="Data lab belum bisa dimuat. Periksa koneksi lalu coba lagi."
            aksi={{ label: 'Coba lagi', onPress: retrySync }}
          />
        </View>
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
            <Text style={styles.label}>Pilih laboratorium</Text>
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
                  onPress={() => pilihLab(lab)}
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
                radius={radius ?? 0}
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
              />

              {sudahMencobaSimpan && alasan.length > 0 ? (
                <View style={styles.validasiBox} accessibilityRole="alert">
                  <View style={styles.validasiJudulRow}>
                    <AlertTriangle size={16} color={colors.errorFg} />
                    <Text style={styles.validasiJudul}>
                      Periksa kembali data lab
                    </Text>
                  </View>
                  {alasan.map((pesan) => (
                    <Text key={pesan} style={styles.validasiPesan}>
                      • {pesan}
                    </Text>
                  ))}
                </View>
              ) : null}

              <Text style={styles.bantuanSimpan}>
                {berubah
                  ? 'Perubahan belum disimpan.'
                  : 'Titik dan radius lab sesuai data tersimpan.'}
              </Text>

              <Tombol
                variant="primer"
                loading={menyimpan}
                disabled={!bisaMencoba}
                onPress={simpan}
              >
                Simpan perubahan
              </Tombol>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textMuted,
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
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  chipRow: {
    gap: spacing.s2,
    paddingRight: layout.screenPadding,
  },
  infoCard: {
    gap: 2,
    padding: spacing.s3,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  infoNama: {
    ...type.bodyStrong,
    color: colors.textPrimary,
  },
  infoAlamat: {
    ...type.caption,
    color: colors.textMuted,
  },
  validasiBox: {
    gap: spacing.s1,
    padding: spacing.s3,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    backgroundColor: colors.errorBg,
  },
  validasiJudulRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  validasiJudul: {
    ...type.bodyStrong,
    color: colors.errorFg,
  },
  validasiPesan: {
    ...type.caption,
    color: colors.errorFg,
    lineHeight: 18,
  },
  bantuanSimpan: {
    ...type.caption,
    color: colors.textMuted,
  },
});
