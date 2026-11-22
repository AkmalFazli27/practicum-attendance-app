/**
 * Teks layar pembuka (splash + onboarding) untuk bahasa Indonesia dan Inggris.
 *
 * Kamus lokal dengan pola yang sama seperti `components/peta/teks.ts` dan
 * `components/auth/teksLogin.ts`: datar dan murni supaya bisa diuji dengan
 * `node:test`, tanpa mengubah `translations` di `PreferencesContext`.
 * Copy slide onboarding masih berada di `index.tsx` karena berbentuk data
 * pasangan `titleId`/`titleEn`; yang dipindahkan ke sini hanya teks splash.
 */
import type { BahasaApp } from '@/context/PreferencesContext';

export type TeksOnboarding = {
  memeriksaSesi: string;
};

const ID: TeksOnboarding = {
  memeriksaSesi: 'Memeriksa sesi...',
};

const EN: TeksOnboarding = {
  memeriksaSesi: 'Checking session...',
};

const KAMUS: Record<BahasaApp, TeksOnboarding> = { id: ID, en: EN };

export function teksOnboarding(bahasa: BahasaApp): TeksOnboarding {
  return KAMUS[bahasa] ?? ID;
}
