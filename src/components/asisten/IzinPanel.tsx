import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, Sparkles, X } from 'lucide-react-native';

import { ConfirmSheet, StatusBadge, Tombol, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import { type Izin } from '@/data/dummy';
import {
  formatLabelKategoriAi,
  KATEGORI_FALLBACK,
  KATEGORI_IZIN_RESMI,
} from '@/services/ai';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatJam, titikJam } from '@/utils/format';

type Keputusan = 'DITERIMA' | 'DITOLAK';
type Target = { izinId: string; keputusan: Keputusan };

const SEMUA = 'SEMUA';

/** Kategori untuk filter; izin tanpa hasil AI dianggap "Belum Terklasifikasi". */
const kategoriIzin = (i: Izin): string =>
  !i.kategoriAi || i.kategoriAi === KATEGORI_FALLBACK
    ? KATEGORI_FALLBACK
    : i.kategoriAi;

const COPY: Record<Keputusan, { judul: string; isi: string; ya: string; toast: string }> = {
  DITERIMA: {
    judul: 'Terima pengajuan izin?',
    isi: 'Praktikan akan tercatat izin pada sesi ini dan melihat statusnya langsung.',
    ya: 'Ya, terima izin',
    toast: 'Pengajuan izin praktikan diterima.',
  },
  DITOLAK: {
    judul: 'Tolak pengajuan izin?',
    isi: 'Praktikan akan melihat pengajuannya ditolak. Keputusan ini tidak dapat diubah.',
    ya: 'Ya, tolak izin',
    toast: 'Pengajuan izin praktikan ditolak.',
  },
};

/** Penanda hasil klasifikasi AI (Sakit / Izin); AI hanya informasi pendukung, bukan keputusan. */
function AiInfo({ item }: { item: Izin }) {
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';
  const infoAi = formatLabelKategoriAi(item.kategoriAi, item.ringkasanAi, isEn);
  const tidakTersedia = !infoAi.terklasifikasi;
  return (
    <View
      style={[
        styles.aiBox,
        {
          backgroundColor: tidakTersedia
            ? themeColors.surfaceMuted
            : themeColors.primarySoft,
        },
      ]}
    >
      <View style={styles.aiRow}>
        <Sparkles
          size={14}
          color={
            tidakTersedia ? themeColors.textMuted : themeColors.sesiDibukaFg
          }
        />
        <Text
          style={[
            styles.aiTitle,
            {
              color: tidakTersedia
                ? themeColors.textMuted
                : themeColors.sesiDibukaFg,
            },
          ]}
        >
          {tidakTersedia
            ? isEn
              ? 'AI: Unclassified'
              : 'AI: Belum terklasifikasi'
            : `AI: ${infoAi.label}`}
        </Text>
      </View>
      {item.ringkasanAi ? (
        <Text
          style={[styles.aiSummary, { color: themeColors.textSecondary }]}
        >
          {item.ringkasanAi}
        </Text>
      ) : null}
      <Text style={[styles.aiFootnote, { color: themeColors.textMuted }]}>
        {isEn
          ? 'Supporting information — decision is made by the assistant.'
          : 'Informasi pendukung — keputusan ditetapkan oleh asisten.'}
      </Text>
    </View>
  );
}

export function IzinPanel({ sesiId }: { sesiId: string }) {
  const { users, error, clearError, getIzinSesi, reviewIzin } = useSession();
  const { showToast } = useToast();
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>(SEMUA);

  // Pesan error terbaru dari context (mis. 'Akses ditolak oleh server').
  const errorRef = useRef<string | null>(null);
  errorRef.current = error;

  // Simpan target terakhir agar isi sheet tidak berkedip saat animasi tutup.
  const terakhir = useRef<Target | null>(null);
  if (target) terakhir.current = target;

  const daftarIzin = getIzinSesi(sesiId)
    .slice()
    .sort((a, b) => b.waktuPengajuan.localeCompare(a.waktuPengajuan));

  const jumlahPerKategori = new Map<string, number>();
  for (const i of daftarIzin) {
    const k = kategoriIzin(i);
    jumlahPerKategori.set(k, (jumlahPerKategori.get(k) ?? 0) + 1);
  }
  const opsiFilter: string[] = [...KATEGORI_IZIN_RESMI, KATEGORI_FALLBACK].filter(
    (k) => (jumlahPerKategori.get(k) ?? 0) > 0,
  );
  const filterAktif = opsiFilter.some((k) => k === filter) ? filter : SEMUA;
  const daftarTampil =
    filterAktif === SEMUA
      ? daftarIzin
      : daftarIzin.filter((i) => kategoriIzin(i) === filterAktif);

  const infoPraktikan = useMemo(() => {
    const peta = new Map(users.map((u) => [u.id, u]));
    return (item: Izin) => {
      const user = peta.get(item.praktikanId);
      return {
        nama: item.namaPraktikan || user?.nama || 'Praktikan',
        nim: item.nimPraktikan || user?.nim || '-',
      };
    };
  }, [users]);

  const tampil = target ?? terakhir.current;
  const izinTampil = tampil ? daftarIzin.find((i) => i.id === tampil.izinId) : undefined;
  const copy = tampil ? COPY[tampil.keputusan] : COPY.DITERIMA;
  const tolak = tampil?.keputusan === 'DITOLAK';

  const batal = () => {
    if (loading) return;
    setTarget(null);
  };

  const konfirmasi = async () => {
    if (!target || loading) return;
    const { izinId, keputusan } = target;

    const saatIni = getIzinSesi(sesiId).find((i) => i.id === izinId);
    if (!saatIni || saatIni.status !== 'MENUNGGU') {
      setTarget(null);
      showToast('Pengajuan ini sudah diputuskan atau tidak ditemukan.');
      return;
    }

    // Hapus error lama agar pesan yang tampil benar-benar dari aksi ini.
    clearError();
    setLoading(true);
    const hasil = await reviewIzin(izinId, keputusan);
    setLoading(false);
    setTarget(null);

    if (hasil.ok) {
      showToast(
        hasil.notifGagal
          ? `${COPY[keputusan].toast} Namun notifikasi ke praktikan gagal terkirim.`
          : COPY[keputusan].toast,
      );
      return;
    }
    // Beri waktu agar pesan error dari context ter-render, lalu tampilkan alasannya.
    await new Promise((r) => setTimeout(r, 60));
    showToast(
      errorRef.current ??
      'Keputusan belum tersimpan. Muat ulang halaman lalu coba lagi.',
    );
  };

  const menunggu = daftarIzin.filter((i) => i.status === 'MENUNGGU').length;

  return (
    <View
      style={[
        styles.panel,
        {
          borderColor: themeColors.border,
          backgroundColor: themeColors.surface,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: themeColors.textMuted }]}>
          {isEn ? 'LEAVE & AI REVIEW' : 'PEMERIKSAAN IZIN & AI'}
        </Text>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {isEn
            ? `Leave requests (${daftarIzin.length})`
            : `Pengajuan izin (${daftarIzin.length})`}
          {menunggu > 0
            ? ` · ${menunggu} ${isEn ? 'pending' : 'menunggu'}`
            : ''}
        </Text>
      </View>

      {opsiFilter.length >= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {[SEMUA, ...opsiFilter].map((k) => {
            const aktif = k === filterAktif;
            const jumlah =
              k === SEMUA ? daftarIzin.length : jumlahPerKategori.get(k) ?? 0;
            const label =
              k === SEMUA
                ? isEn ? 'All' : 'Semua'
                : k === KATEGORI_FALLBACK
                  ? isEn ? 'Unclassified' : 'Belum terklasifikasi'
                  : k;
            return (
              <Pressable
                key={k}
                accessibilityRole="button"
                accessibilityState={{ selected: aktif }}
                onPress={() => setFilter(k)}
                style={[
                  styles.chip,
                  {
                    borderColor: themeColors.border,
                    backgroundColor: themeColors.surface,
                  },
                  aktif && {
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.primary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: themeColors.textSecondary },
                    aktif && { color: themeColors.onPrimary },
                  ]}
                >
                  {label} · {jumlah}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {daftarIzin.length === 0 ? (
        <Text
          style={[
            styles.empty,
            {
              borderTopColor: themeColors.border,
              color: themeColors.textMuted,
            },
          ]}
        >
          {isEn
            ? 'No leave requests from students for this session yet.'
            : 'Belum ada pengajuan izin dari praktikan pada sesi ini.'}
        </Text>
      ) : (
        <View style={styles.list}>
          {daftarTampil.map((item) => {
            const mhs = infoPraktikan(item);
            return (
              <View
                key={item.id}
                style={[styles.card, { borderTopColor: themeColors.border }]}
              >
                <View style={styles.topRow}>
                  <View style={styles.userInfo}>
                    <Text
                      style={[styles.name, { color: themeColors.textPrimary }]}
                    >
                      {mhs.nama}
                    </Text>
                    <Text
                      style={[styles.nim, { color: themeColors.textMuted }]}
                    >
                      {mhs.nim} · {isEn ? 'Submitted' : 'Diajukan'}{' '}
                      {titikJam(formatJam(item.waktuPengajuan))}
                    </Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text
                  style={[styles.alasan, { color: themeColors.textSecondary }]}
                >
                  "{item.alasan}"
                </Text>

                <AiInfo item={item} />

                {item.status === 'MENUNGGU' && (
                  <View style={styles.actions}>
                    <Tombol
                      variant="danger"
                      icon={<X size={16} color={themeColors.errorFg} />}
                      style={styles.btn}
                      onPress={() =>
                        setTarget({ izinId: item.id, keputusan: 'DITOLAK' })
                      }
                    >
                      {isEn ? 'Reject' : 'Tolak'}
                    </Tombol>
                    <Tombol
                      variant="primer"
                      icon={<Check size={16} color={themeColors.onPrimary} />}
                      style={styles.btn}
                      onPress={() =>
                        setTarget({ izinId: item.id, keputusan: 'DITERIMA' })
                      }
                    >
                      {isEn ? 'Approve leave' : 'Terima izin'}
                    </Tombol>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <ConfirmSheet
        visible={target !== null}
        title={copy.judul}
        body={copy.isi}
        danger={tolak}
        loading={loading}
        confirmLabel={copy.ya}
        summary={
          izinTampil
            ? [
                {
                  label: isEn ? 'Student' : 'Praktikan',
                  value: infoPraktikan(izinTampil).nama,
                },
                {
                  label: isEn ? 'AI Label' : 'Prediksi AI',
                  value: formatLabelKategoriAi(
                    izinTampil.kategoriAi,
                    izinTampil.ringkasanAi,
                    isEn,
                  ).label,
                },
              ]
            : []
        }
        onConfirm={konfirmasi}
        onClose={batal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.s4,
    padding: spacing.s4,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  header: {
    marginBottom: spacing.s3,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  title: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  empty: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    ...type.caption,
    color: colors.textMuted,
  },
  chipScroll: {
    flexGrow: 0,
    marginBottom: spacing.s3,
  },
  chipRow: {
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: {
    ...type.micro,
    fontFamily: fontFamily.semibold,
  },
  list: {
    gap: spacing.s3,
  },
  card: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.s3,
    gap: spacing.s2 + 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  nim: {
    fontSize: 10,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  alasan: {
    ...type.caption,
    color: colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  aiBox: {
    padding: spacing.s3,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    gap: 4,
  },
  aiBoxMuted: {
    backgroundColor: colors.surfaceMuted,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiTitle: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
    flex: 1,
  },
  aiTitleMuted: {
    color: colors.textSecondary,
  },
  aiSummary: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  aiFootnote: {
    fontSize: 10,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.s2,
    marginTop: 2,
  },
  btn: {
    flex: 1,
    minHeight: 42,
  },
});
