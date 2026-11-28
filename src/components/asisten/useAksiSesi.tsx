import React, { useRef, useState } from 'react';
import { DoorOpen, LockKeyhole } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { ConfirmSheet, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { AlasanTolak } from '@/data/dummy';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';

export type AksiSesi = 'buka' | 'tutup';

type Target = { sesiId: string; aksi: AksiSesi };

const KEY_TOLAK: Partial<Record<AlasanTolak, string>> = {
  BELUM_WAKTUNYA: 'asprak.rejectNotYetTime',
  WAKTU_HABIS: 'asprak.rejectTimeUp',
  SESI_SUDAH_DITUTUP: 'asprak.rejectAlreadyClosed',
  SESI_TIDAK_DIBUKA: 'asprak.sessionNotFound',
  DI_LUAR_JAM_OPERASIONAL: 'asprak.aksiOutOfHours',
  JARINGAN: 'asprak.rejectNetwork',
};

export function useAksiSesi(onTidakDitemukan?: () => void) {
  const { t } = useTranslation();
  const { openSession, closeSession, getSesiById } = useSession();
  const { showToast } = useToast();
  const { themeColors } = usePreferences();
  const [target, setTarget] = useState<Target | null>(null);
  const [loading, setLoading] = useState(false);

  const copyMap: Record<
    AksiSesi,
    { judul: string; isi: string; ya: string; toast: string }
  > = {
    buka: {
      judul: t('asprak.aksiOpenTitle'),
      isi: t('asprak.aksiOpenBody'),
      ya: t('asprak.aksiOpenConfirm'),
      toast: t('asprak.aksiOpenToast'),
    },
    tutup: {
      judul: t('asprak.aksiCloseTitle'),
      isi: t('asprak.aksiCloseBody'),
      ya: t('asprak.aksiCloseConfirm'),
      toast: t('asprak.aksiCloseToast'),
    },
  };

  const terakhir = useRef<Target | null>(null);
  if (target) terakhir.current = target;
  const tampil = target ?? terakhir.current;
  const sesiTampil = tampil ? getSesiById(tampil.sesiId) : undefined;
  const copy = tampil ? copyMap[tampil.aksi] : copyMap.buka;

  function mulai(sesiId: string, aksi: AksiSesi) {
    setTarget({ sesiId, aksi });
  }

  function batal() {
    if (loading) return;
    setTarget(null);
  }

  async function konfirmasi() {
    if (!target || loading) return;
    const { sesiId, aksi } = target;

    if (!getSesiById(sesiId)) {
      setTarget(null);
      showToast(t('asprak.sessionNotFound'));
      onTidakDitemukan?.();
      return;
    }

    setLoading(true);
    if (aksi === 'buka') {
      const hasil = await openSession(sesiId);
      setLoading(false);
      setTarget(null);
      if (!hasil.ok) {
        const key = KEY_TOLAK[hasil.alasan];
        showToast(key ? t(key as any) : t('asprak.aksiActionError'));
        return;
      }
      showToast(
        hasil.notifGagal
          ? t('asprak.aksiOpenNotifFailed')
          : copyMap.buka.toast,
      );
      return;
    }

    const berhasil = await closeSession(sesiId);
    setLoading(false);
    setTarget(null);
    showToast(berhasil ? copyMap.tutup.toast : t('asprak.aksiActionError'));
  }

  const isTutup = tampil?.aksi === 'tutup';

  const sheet = (
    <ConfirmSheet
      visible={target !== null}
      title={copy.judul}
      body={copy.isi}
      danger={isTutup}
      loading={loading}
      confirmLabel={copy.ya}
      icon={
        isTutup ? (
          <LockKeyhole size={27} color={themeColors.errorFg} />
        ) : (
          <DoorOpen size={28} color={themeColors.onPrimary} />
        )
      }
      summary={
        sesiTampil
          ? [
              {
                label: t('asprak.summaryPracticum'),
                value: sesiTampil.namaPraktikum,
              },
              {
                label: t('asprak.summaryClassLab'),
                value: `${sesiTampil.kelas} · ${sesiTampil.lab}`,
              },
              {
                label: t('asprak.summarySchedule'),
                value: `${formatHariTanggalSingkat(sesiTampil.tanggal)}, ${titikJam(sesiTampil.jamMulai)}`,
              },
            ]
          : []
      }
      onConfirm={konfirmasi}
      onClose={batal}
    />
  );

  return { mulai, sheet };
}