import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { useToast } from '@/components/ui';
import { isFirebaseConfigured } from '@/config/firebase';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';

import { pesanAlasanPembayaran } from './pesanPembayaran';

const URL_STUB_PEMBAYARAN = 'https://example.com/midtrans-stub';

type HasilMulaiPembayaran =
  | { ok: true; redirectUrl: string; orderId: string }
  | { ok: false; alasan: string };

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
  const { mulaiPembayaran, sinkronPembayaran } = useSession();
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
      if (modeDemo) return true;

      try {
        await sinkronPembayaran(orderId);
        return true;
      } catch {
        tampilkanGalat('JARINGAN');
        return false;
      }
    },
    [modeDemo, sinkronPembayaran, tampilkanGalat],
  );

  const bayar = useCallback(
    async (tagihanId: string) => {
      if (memprosesRef.current) return;

      setGalat(null);
      memprosesRef.current = true;
      setMemproses(true);

      try {
        const hasil = modeDemo
          ? await mulaiPembayaranDemo()
          : await mulaiPembayaran(tagihanId);

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
          const hasilBrowser = await WebBrowser.openBrowserAsync(
            hasil.redirectUrl,
          );
          // Android me-resolve saat browser dibuka ('opened'); iOS saat ditutup.
          // Untuk iOS, sinkronkan langsung karena AppState tidak berubah.
          if (hasilBrowser.type !== 'opened') {
            const orderId = orderMenunggu.current;
            orderMenunggu.current = null;
            if (orderId) await sinkron(orderId);
          }
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
    [isEn, modeDemo, mulaiPembayaran, showToast, sinkron, tampilkanGalat],
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
              ? 'Demo mode: status only changes through Firestore.'
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

  // Android: browser Custom Tab membuka activity lain, jadi AppState berubah.
  // Saat pengguna kembali, minta backend menyinkronkan order yang menunggu.
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
  };
}
