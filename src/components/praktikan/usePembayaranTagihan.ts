import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';

import { useToast } from '@/components/ui';
import { isFirebaseConfigured } from '@/config/firebase';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';

import { pesanAlasanPembayaran } from './pesanPembayaran';
import type { PembayaranLokal } from './tagihanStub';

type HasilMulaiPembayaran =
  | { ok: true; redirectUrl: string; orderId: string }
  | { ok: false; alasan: string };

/**
 * Bridge sementara ke kontrak PM yang belum merge.
 * TODO(sprint4): hapus kontrak lokal ini setelah `mulaiPembayaran`,
 * `sinkronPembayaran`, dan `pembayaran` resmi tersedia di SessionContext.
 */
type KontrakPembayaran = {
  mulaiPembayaran?: (tagihanId: string) => Promise<HasilMulaiPembayaran>;
  sinkronPembayaran?: (orderId: string) => Promise<unknown>;
  pembayaran?: PembayaranLokal[];
};

const URL_STUB_PEMBAYARAN = 'https://example.com/midtrans-stub';

/**
 * Adapter demo khusus mode dummy (tanpa Firebase).
 * Tidak pernah dipakai saat Firebase aktif: status pembayaran asli
 * hanya boleh datang dari backend/Firestore.
 */
async function mulaiPembayaranDemo(): Promise<HasilMulaiPembayaran> {
  return {
    ok: true,
    redirectUrl: URL_STUB_PEMBAYARAN,
    orderId: `demo-${Date.now()}`,
  };
}

export function usePembayaranTagihan() {
  const session = useSession() as ReturnType<typeof useSession> &
    KontrakPembayaran;
  const { language } = usePreferences();
  const { showToast } = useToast();
  const isEn = language === 'en';

  const [memproses, setMemproses] = useState(false);
  const [memeriksa, setMemeriksa] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const memprosesRef = useRef(false);
  const memeriksaRef = useRef(false);
  const orderMenunggu = useRef<string | null>(null);

  const modeDemo = !isFirebaseConfigured;
  const punyaKontrak = Boolean(
    session.mulaiPembayaran && session.sinkronPembayaran,
  );
  const tersedia = punyaKontrak || modeDemo;

  const clearGalat = useCallback(() => setGalat(null), []);

  const tampilkanGalat = useCallback(
    (alasan: string) => {
      const pesan = pesanAlasanPembayaran(alasan, isEn);
      setGalat(pesan);
      showToast(pesan);
    },
    [isEn, showToast],
  );

  const sinkron = useCallback(
    async (orderId: string): Promise<boolean> => {
      const sinkronPembayaran = session.sinkronPembayaran;
      if (!sinkronPembayaran) {
        if (modeDemo) return true;
        tampilkanGalat('PEMBAYARAN_BELUM_TERSEDIA');
        return false;
      }

      try {
        await sinkronPembayaran(orderId);
        return true;
      } catch {
        tampilkanGalat('JARINGAN');
        return false;
      }
    },
    [modeDemo, session.sinkronPembayaran, tampilkanGalat],
  );

  const bayar = useCallback(
    async (tagihanId: string) => {
      if (memprosesRef.current) return;

      const mulaiPembayaran = session.mulaiPembayaran;
      if (!mulaiPembayaran && !modeDemo) {
        tampilkanGalat('PEMBAYARAN_BELUM_TERSEDIA');
        return;
      }

      setGalat(null);
      memprosesRef.current = true;
      setMemproses(true);

      try {
        const hasil = mulaiPembayaran
          ? await mulaiPembayaran(tagihanId)
          : await mulaiPembayaranDemo();

        if (!hasil.ok) {
          tampilkanGalat(hasil.alasan);
          return;
        }

        orderMenunggu.current = hasil.orderId;

        if (modeDemo) {
          showToast(
            isEn
              ? 'Demo mode: opening a payment stub page.'
              : 'Mode demo: membuka halaman stub pembayaran.',
          );
        }

        try {
          await Linking.openURL(hasil.redirectUrl);
        } catch {
          orderMenunggu.current = null;
          tampilkanGalat('JARINGAN');
        }
      } catch {
        tampilkanGalat('JARINGAN');
      } finally {
        memprosesRef.current = false;
        setMemproses(false);
      }
    },
    [
      isEn,
      modeDemo,
      session.mulaiPembayaran,
      showToast,
      tampilkanGalat,
    ],
  );

  const cekStatus = useCallback(
    async (orderId: string) => {
      if (memeriksaRef.current) return;

      memeriksaRef.current = true;
      setMemeriksa(true);
      setGalat(null);

      try {
        const berhasil = await sinkron(orderId);
        if (!berhasil) return;

        if (modeDemo) {
          showToast(
            isEn
              ? 'Demo mode: status comes from Firestore in the real build.'
              : 'Mode demo: status asli hanya berubah lewat Firestore.',
          );
          return;
        }

        showToast(
          isEn ? 'Payment status refreshed.' : 'Status pembayaran diperbarui.',
        );
      } finally {
        memeriksaRef.current = false;
        setMemeriksa(false);
      }
    },
    [isEn, modeDemo, showToast, sinkron],
  );

  // Saat pengguna kembali dari browser pembayaran, minta backend
  // menyinkronkan order yang sedang menunggu.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const orderId = orderMenunggu.current;
      if (!orderId) return;
      orderMenunggu.current = null;
      void sinkron(orderId);
    });
    return () => sub.remove();
  }, [sinkron]);

  return {
    bayar,
    cekStatus,
    memproses,
    memeriksa,
    galat,
    clearGalat,
    tersedia,
  };
}
