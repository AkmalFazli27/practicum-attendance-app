import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';

/**
 * Memuat font Inter untuk seluruh aplikasi.
 *
 * Mengembalikan `true` bila font siap dipakai ATAU gagal dimuat.
 * Saat gagal, aplikasi tetap dirender dan React Native memakai font sistem.
 * Pemakaian: panggil di root layout, lalu render aplikasi tanpa menunggu.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return loaded || Boolean(error);
}
