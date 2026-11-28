import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import {
  AlertTriangle,
  Camera as CameraIcon,
  ChevronsLeft,
  KeyRound,
  MapPin,
  Minus,
  Plus,
  Zap,
  ZapOff,
} from 'lucide-react-native';

import { SheetModal, Tombol, useToast } from '@/components/ui';
import { formatRupiah } from '@/components/praktikan/formatTagihan';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import type { AlasanTolak, Sesi, StatusIzin } from '@/data/dummy';
import { useLocation } from '@/hooks/useLocation';
import {
  colors,
  fontFamily,
  radius,
  spacing,
  type,
} from '@/theme/tokens';
import { titikJam } from '@/utils/format';
import { cekValiditasQr } from '@/utils/statusSesi';

function normKelas(k?: string): string {
  return (k ?? '').trim().toUpperCase();
}

function terjemahkanAlasanTolak(
  alasan: AlasanTolak,
  isEn: boolean,
  opsi: {
    jamMulai?: string;
    jamSelesai?: string;
    radiusLab?: number | null;
    izinStatus?: StatusIzin;
  },
): { judul: string; pesan: string } {
  switch (alasan) {
    case 'SUDAH_PRESENSI':
      return {
        judul: isEn ? 'Attendance already recorded' : 'Presensi sudah tercatat',
        pesan: isEn
          ? 'You are already marked present for this practicum session.'
          : 'Kamu sudah tercatat hadir pada sesi praktikum ini.',
      };
    case 'SUDAH_IZIN':
      if (opsi.izinStatus === 'DITERIMA') {
        return {
          judul: isEn ? 'Leave approved' : 'Izin diterima',
          pesan: isEn
            ? 'You are recorded as excused absent and are not fined.'
            : 'Kamu tercatat tidak hadir dengan izin dan bebas denda.',
        };
      }
      return {
        judul: isEn ? 'Leave request pending' : 'Izin sedang diproses',
        pesan: isEn
          ? "Your leave request is still awaiting the assistant's decision."
          : 'Pengajuan izinmu masih menunggu keputusan Asprak.',
      };
    case 'LUAR_RADIUS':
      return {
        judul: isEn
          ? 'Outside laboratory radius'
          : 'Di luar radius laboratorium',
        pesan:
          typeof opsi.radiusLab === 'number'
            ? isEn
              ? `Your position is outside the ${opsi.radiusLab} m laboratory radius. Move closer to the lab and try again.`
              : `Posisimu berada di luar radius laboratorium (${opsi.radiusLab} m). Mendekatlah ke ruang lab lalu coba lagi.`
            : isEn
              ? 'Your position is outside the laboratory radius limit. Move closer to the lab and try again.'
              : 'Posisimu berada di luar batas radius laboratorium. Mendekatlah ke ruang praktikum lalu coba lagi.',
      };
    case 'BELUM_WAKTUNYA':
      return {
        judul: isEn ? 'Session has not started' : 'Sesi belum dimulai',
        pesan: opsi.jamMulai
          ? isEn
            ? `This session starts at ${titikJam(opsi.jamMulai)} WIB.`
            : `Jadwal sesi ini baru dimulai pukul ${titikJam(opsi.jamMulai)} WIB.`
          : isEn
            ? 'Attendance time for this session has not started yet.'
            : 'Waktu presensi untuk sesi ini belum dimulai.',
      };
    case 'WAKTU_HABIS':
      return {
        judul: isEn
          ? 'Attendance time has ended'
          : 'Waktu presensi telah berakhir',
        pesan: opsi.jamSelesai
          ? isEn
            ? `The attendance deadline ended at ${titikJam(opsi.jamSelesai)} WIB.`
            : `Batas waktu presensi sesi ini telah berakhir pada pukul ${titikJam(opsi.jamSelesai)} WIB.`
          : isEn
            ? 'This practicum session has ended.'
            : 'Waktu pelaksanaan sesi praktikum ini telah berakhir.',
      };
    case 'SESI_SUDAH_DITUTUP':
      return {
        judul: isEn ? 'Session already closed' : 'Sesi sudah ditutup',
        pesan: isEn
          ? 'This practicum session has been closed by the assistant and no longer accepts attendance.'
          : 'Sesi praktikum ini telah ditutup oleh asisten dan tidak lagi menerima presensi.',
      };
    case 'SESI_TIDAK_DIBUKA':
      return {
        judul: isEn ? 'Session not opened yet' : 'Sesi belum dibuka asisten',
        pesan: isEn
          ? 'Attendance is only available once the assistant opens this practicum session.'
          : 'Presensi hanya dapat dilakukan saat asisten telah membuka sesi praktikum ini.',
      };
    case 'KOORDINAT_TIDAK_ADA':
      return {
        judul: isEn ? 'GPS location unavailable' : 'Lokasi GPS tidak terbaca',
        pesan: isEn
          ? 'Your device GPS coordinates are unavailable. Ensure GPS is enabled and location permission is granted.'
          : 'Titik koordinat GPS perangkatmu belum terbaca. Pastikan GPS aktif dan izin lokasi diberikan.',
      };
    case 'LAB_BELUM_DIATUR':
      return {
        judul: isEn ? 'Lab location not set' : 'Lokasi lab belum diatur',
        pesan: isEn
          ? 'This session does not have valid laboratory coordinates yet. Contact your assistant.'
          : 'Sesi ini belum memiliki titik koordinat laboratorium yang valid. Hubungi asisten praktikum.',
      };
    case 'TIDAK_BERHAK':
      return {
        judul: isEn ? 'Cannot check in' : 'Tidak dapat melakukan presensi',
        pesan: isEn
          ? 'Your account or class is not registered for this practicum session.'
          : 'Akun atau kelas praktikum kamu tidak terdaftar untuk melakukan presensi pada sesi ini.',
      };
    case 'JARINGAN':
    default:
      return {
        judul: isEn ? 'Network connection issue' : 'Koneksi jaringan bermasalah',
        pesan: isEn
          ? 'Failed to reach the server while recording attendance. Check your internet connection and try again.'
          : 'Gagal menghubungi server saat mencatat presensi. Periksa koneksi internetmu lalu coba lagi.',
      };
  }
}

export default function ScanQrScreen() {
  const { sesiId } = useLocalSearchParams<{ sesiId?: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    sesi,
    labs,
    tagihan,
    currentUser,
    getStatusEfektif,
    sudahPresensi,
    getIzinBySesiPraktikan,
    markAttendance,
  } = useSession();
  const { showToast } = useToast();
  const { themeColors, language, t } = usePreferences();
  const isEn = language === 'en';

  const [permission, requestPermission] = useCameraPermissions();
  const {
    status: statusLokasi,
    koordinat,
    pesanError: pesanErrorLokasi,
    mintaIzin: mintaIzinLokasi,
    coba: cobaLokasi,
  } = useLocation();

  const [torchOn, setTorchOn] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [memproses, setMemproses] = useState(false);
  const [kodeModalBuka, setKodeModalBuka] = useState(false);
  const [kodeInput, setKodeInput] = useState('');
  const [galatKode, setGalatKode] = useState<string | null>(null);
  const [galatModal, setGalatModal] = useState<{
    judul: string;
    pesan: string;
    jenis?: 'lokasi-izin' | 'lokasi-ulang';
  } | null>(null);
  const scannedLock = useRef(false);

  // Minta izin kamera otomatis saat pertama kali membuka layar Scan QR
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const sesiTargetParam = useMemo(
    () => (sesiId ? sesi.find((item) => item.id === sesiId) : undefined),
    [sesi, sesiId],
  );

  const lokasiBermasalah =
    statusLokasi === 'gps-mati' ||
    statusLokasi === 'izin-ditolak' ||
    statusLokasi === 'koordinat-belum-ada' ||
    statusLokasi === 'error';

  const handleAdjustZoom = (delta: number) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      return Math.max(0, Math.min(1, next));
    });
  };

  const unlockLater = () => {
    setTimeout(() => {
      scannedLock.current = false;
    }, 2200);
  };

  const tampilkanGalatLokasi = () => {
    const pesan =
      pesanErrorLokasi ??
      (isEn
        ? 'Device GPS location is not available yet. Make sure GPS is active and try again.'
        : 'Lokasi GPS perangkat belum tersedia. Pastikan GPS aktif lalu coba lagi.');
    const judul =
      statusLokasi === 'izin-ditolak'
        ? isEn
          ? 'Location permission denied'
          : 'Izin lokasi ditolak'
        : statusLokasi === 'gps-mati'
          ? isEn
            ? 'GPS is turned off'
            : 'GPS perangkat mati'
          : isEn
            ? 'GPS location unavailable'
            : 'Lokasi GPS belum terbaca';

    showToast(pesan);
    setGalatModal({
      judul,
      pesan,
      jenis: statusLokasi === 'izin-ditolak' ? 'lokasi-izin' : 'lokasi-ulang',
    });
  };

  const kirimPresensi = async (sesiTarget: Sesi, tokenKode: string) => {
    if (memproses) return;
    const kelasSaya = normKelas(currentUser?.kelas);

    if (kelasSaya && normKelas(sesiTarget.kelas) !== kelasSaya) {
      const msg = isEn
        ? `This session is for class ${sesiTarget.kelas}, not your class (${currentUser?.kelas}).`
        : `Sesi ini untuk kelas ${sesiTarget.kelas}, bukan kelasmu (${currentUser?.kelas}).`;
      showToast(msg);
      unlockLater();
      return;
    }

    const statusEfektif = getStatusEfektif(sesiTarget);
    if (statusEfektif === 'SELESAI') {
      const msg = isEn
        ? 'Attendance time for this session has ended.'
        : 'Waktu presensi untuk sesi ini telah berakhir.';
      showToast(msg);
      setGalatModal({
        judul: isEn ? 'Session ended' : 'Waktu presensi berakhir',
        pesan: msg,
      });
      unlockLater();
      return;
    }
    if (statusEfektif !== 'DIBUKA') {
      const msg = isEn
        ? 'This practicum session has not been opened yet.'
        : 'Sesi praktikum ini belum dibuka oleh asisten.';
      showToast(msg);
      setGalatModal({
        judul: isEn ? 'Session not opened' : 'Sesi belum dibuka',
        pesan: msg,
      });
      unlockLater();
      return;
    }

    const cekQr = cekValiditasQr(sesiTarget, tokenKode);
    if (!cekQr.ok) {
      const msg =
        cekQr.alasan === 'WAKTU_HABIS'
          ? isEn
            ? 'Attendance time for this session has ended.'
            : 'Waktu presensi untuk sesi ini telah berakhir.'
          : cekQr.alasan === 'QR_EXPIRED'
            ? isEn
              ? 'QR / code has expired. Ask your assistant to renew it.'
              : 'QR / kode sudah kedaluwarsa. Minta asisten memperbaruinya.'
            : isEn
              ? 'Attendance code does not match.'
              : 'Kode presensi tidak cocok.';
      if (kodeModalBuka) {
        setGalatKode(msg);
      } else {
        showToast(msg);
      }
      unlockLater();
      return;
    }

    if (currentUser && sudahPresensi(sesiTarget.id, currentUser.id)) {
      showToast(
        isEn ? 'You have already checked in.' : 'Kamu sudah presensi pada sesi ini.',
      );
      setKodeModalBuka(false);
      router.replace({
        pathname: '/(praktikan)/sesi/[id]',
        params: { id: sesiTarget.id },
      } as any);
      return;
    }

    const izinSaya = currentUser
      ? getIzinBySesiPraktikan(sesiTarget.id, currentUser.id)
      : undefined;
    if (izinSaya?.status === 'DITERIMA') {
      const info = terjemahkanAlasanTolak('SUDAH_IZIN', isEn, {
        izinStatus: izinSaya.status,
      });
      showToast(info.judul);
      setKodeModalBuka(false);
      setGalatModal(info);
      unlockLater();
      return;
    }

    if (!koordinat) {
      setKodeModalBuka(false);
      tampilkanGalatLokasi();
      unlockLater();
      return;
    }

    const labSesi = sesiTarget.labId
      ? labs.find((l) => l.id === sesiTarget.labId)
      : labs.find(
          (l) =>
            l.nama.trim().toLowerCase() === sesiTarget.lab.trim().toLowerCase(),
        );

    setMemproses(true);
    try {
      const hasil = await markAttendance(sesiTarget.id, koordinat);
      setMemproses(false);

      if (hasil.ok) {
        setKodeModalBuka(false);
        const hasilEkstra = hasil as typeof hasil & {
          status?: 'TEPAT_WAKTU' | 'TERLAMBAT';
          menitTerlambat?: number;
          tagihanId?: string;
        };
        if (hasilEkstra.status === 'TEPAT_WAKTU') {
          showToast(
            isEn
              ? 'Attendance recorded on time.'
              : 'Presensi tercatat tepat waktu.',
          );
        } else if (hasilEkstra.status === 'TERLAMBAT') {
          const menit = hasilEkstra.menitTerlambat;
          const nominal =
            tagihan.find((item) => item.id === hasilEkstra.tagihanId)?.nominal ??
            labSesi?.dendaNominal;
          const dendaTeks =
            typeof nominal === 'number' && nominal > 0
              ? isEn
                ? ` Fine ${formatRupiah(nominal)}.`
                : ` Denda ${formatRupiah(nominal)}.`
              : '';
          showToast(
            isEn
              ? `Attendance recorded late${menit ? ` by ${menit} min` : ''}.${dendaTeks}`
              : `Presensi tercatat terlambat${menit ? ` ${menit} menit` : ''}.${dendaTeks}`,
          );
        } else {
          const jarakTeks =
            typeof hasil.jarak === 'number'
              ? isEn
                ? ` (${hasil.jarak} m from lab)`
                : ` (${hasil.jarak} m dari lab)`
              : '';
          showToast(
            isEn
              ? `Attendance recorded successfully${jarakTeks}.`
              : `Presensi berhasil dicatat${jarakTeks}.`,
          );
        }

        router.replace({
          pathname: '/(praktikan)/sesi/[id]',
          params: { id: sesiTarget.id },
        } as any);
        return;
      }

      const info = terjemahkanAlasanTolak(hasil.alasan, isEn, {
        jamMulai: sesiTarget.jamMulai,
        jamSelesai: sesiTarget.jamSelesai,
        radiusLab: labSesi?.radius ?? null,
        izinStatus: izinSaya?.status,
      });
      setKodeModalBuka(false);
      showToast(info.judul);
      setGalatModal({
        ...info,
        jenis:
          hasil.alasan === 'KOORDINAT_TIDAK_ADA' ? 'lokasi-ulang' : undefined,
      });
      unlockLater();
    } catch {
      setMemproses(false);
      const info = terjemahkanAlasanTolak('JARINGAN', isEn, {});
      setKodeModalBuka(false);
      showToast(info.judul);
      setGalatModal(info);
      unlockLater();
    }
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (
      scannedLock.current ||
      memproses ||
      kodeModalBuka ||
      galatModal !== null
    ) {
      return;
    }
    scannedLock.current = true;

    const raw = (result.data ?? '').trim();
    const kelasSaya = normKelas(currentUser?.kelas);

    const matchPath = raw.match(/presensi\/([^/?#\s]+)/i);
    const matchToken = raw.match(/[?&]token=([^&#\s]+)/i);
    const tokenQr = matchToken ? decodeURIComponent(matchToken[1]) : null;
    const kandidatId = matchPath?.[1] ?? raw;
    const sesiDitemukan = sesi.find((s) => s.id === kandidatId);

    if (sesiDitemukan) {
      if (sesiId && sesiDitemukan.id !== sesiId) {
        showToast(
          isEn
            ? `This QR belongs to ${sesiDitemukan.namaPraktikum}, not the selected session.`
            : `QR ini untuk ${sesiDitemukan.namaPraktikum}, bukan sesi yang dipilih.`,
        );
        unlockLater();
        return;
      }
      void kirimPresensi(sesiDitemukan, tokenQr ?? sesiDitemukan.qrToken ?? '');
      return;
    }

    const sesiKelasLain = sesi.find(
      (s) =>
        kelasSaya &&
        normKelas(s.kelas) !== kelasSaya &&
        (raw.toUpperCase().includes(normKelas(s.kelas)) ||
          raw.toLowerCase().includes(s.namaPraktikum.toLowerCase())),
    );
    if (sesiKelasLain) {
      showToast(
        isEn
          ? `This QR code belongs to ${sesiKelasLain.namaPraktikum} (${sesiKelasLain.kelas}), not your class.`
          : `Kode QR ini milik ${sesiKelasLain.namaPraktikum} kelas ${sesiKelasLain.kelas}, bukan kelasmu.`,
      );
      unlockLater();
      return;
    }

    showToast(
      isEn
        ? 'QR code is not recognized or not for your active class.'
        : 'Kode QR tidak dikenali atau bukan untuk sesi aktif kelasmu.',
    );
    unlockLater();
  };

  const handleBukaModalKode = () => {
    setGalatKode(null);
    setKodeInput('');
    setKodeModalBuka(true);
  };

  const handleSubmitKode = () => {
    const kodeBersih = kodeInput.trim().toUpperCase();
    if (!kodeBersih) {
      setGalatKode(
        isEn
          ? 'Enter the attendance code from your assistant.'
          : 'Masukkan kode presensi dari asisten.',
      );
      return;
    }
    setGalatKode(null);

    if (sesiTargetParam) {
      void kirimPresensi(sesiTargetParam, kodeBersih);
      return;
    }

    const kelasSaya = normKelas(currentUser?.kelas);
    const sesiDibuka = sesi.filter((s) => getStatusEfektif(s) === 'DIBUKA');
    const cocokKelasSaya = sesiDibuka.find(
      (s) =>
        (!kelasSaya || normKelas(s.kelas) === kelasSaya) &&
        (s.qrToken ?? '').trim().toUpperCase() === kodeBersih,
    );

    if (cocokKelasSaya) {
      void kirimPresensi(cocokKelasSaya, kodeBersih);
      return;
    }

    const cocokKelasLain = sesiDibuka.find(
      (s) =>
        kelasSaya &&
        normKelas(s.kelas) !== kelasSaya &&
        (s.qrToken ?? '').trim().toUpperCase() === kodeBersih,
    );
    if (cocokKelasLain) {
      setGalatKode(
        isEn
          ? `This code belongs to class ${cocokKelasLain.kelas}, not your class (${currentUser?.kelas}).`
          : `Kode presensi ini untuk kelas ${cocokKelasLain.kelas}, bukan kelasmu (${currentUser?.kelas}).`,
      );
      return;
    }

    setGalatKode(
      isEn
        ? 'Code does not match any open session or has expired. Ask your assistant to renew it.'
        : 'Kode tidak cocok dengan sesi aktif atau sudah kedaluwarsa. Minta asisten memperbarui kode.',
    );
  };

  const handleRequestOrSettings = async () => {
    if (permission && !permission.canAskAgain && Platform.OS !== 'web') {
      await Linking.openSettings().catch(() => {});
      return;
    }
    await requestPermission();
  };

  const handleCobaGpsDariPill = () => {
    if (statusLokasi === 'izin-ditolak') {
      void mintaIzinLokasi();
    } else if (lokasiBermasalah) {
      void cobaLokasi();
    }
    if (pesanErrorLokasi) {
      showToast(pesanErrorLokasi);
    }
  };

  const modalKode = (
    <SheetModal
      visible={kodeModalBuka}
      kicker={isEn ? 'ATTENDANCE CODE' : 'KODE PRESENSI'}
      judul={
        sesiTargetParam
          ? sesiTargetParam.namaPraktikum
          : isEn
            ? 'Enter Attendance Code'
            : 'Masukkan Kode Presensi'
      }
      onClose={() => {
        if (!memproses) setKodeModalBuka(false);
      }}
      footer={
        <View style={styles.modalFooterActions}>
          <Tombol
            variant="primer"
            loading={memproses}
            disabled={kodeInput.trim().length === 0 || memproses}
            onPress={handleSubmitKode}
          >
            {memproses
              ? isEn
                ? 'Verifying location…'
                : 'Memverifikasi lokasi…'
              : isEn
                ? 'Check In Now'
                : 'Presensi Sekarang'}
          </Tombol>
          <Tombol
            variant="sekunder"
            disabled={memproses}
            onPress={() => setKodeModalBuka(false)}
          >
            {isEn ? 'Cancel' : 'Batal'}
          </Tombol>
        </View>
      }
    >
      <View style={styles.kodeModalBody}>
        <Text style={[styles.kodeModalSub, { color: themeColors.textSecondary }]}>
          {sesiTargetParam
            ? isEn
              ? `Enter the 6-character code shown by the assistant for class ${sesiTargetParam.kelas}. Location is verified automatically.`
              : `Masukkan kode 6 karakter dari asisten untuk kelas ${sesiTargetParam.kelas}. Lokasi diverifikasi otomatis.`
            : isEn
              ? 'Enter the 6-character code shown by your assistant. Location is verified automatically.'
              : 'Masukkan kode 6 karakter yang ditampilkan asisten. Lokasi akan diverifikasi otomatis.'}
        </Text>

        <View
          style={[
            styles.kodeInputBox,
            {
              backgroundColor: themeColors.background,
              borderColor: galatKode
                ? themeColors.dangerBorder
                : themeColors.border,
            },
          ]}
        >
          <KeyRound size={18} color={themeColors.textMuted} />
          <TextInput
            value={kodeInput}
            onChangeText={(txt) => {
              setKodeInput(txt.replace(/[^a-zA-Z0-9]/g, '').toUpperCase());
              if (galatKode) setGalatKode(null);
            }}
            editable={!memproses}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            placeholder={
              isEn ? 'Enter 6-character code' : 'Masukkan kode 6 karakter'
            }
            placeholderTextColor={themeColors.textMuted}
            style={[styles.kodeTextInput, { color: themeColors.textPrimary }]}
            onSubmitEditing={handleSubmitKode}
          />
        </View>

        {galatKode ? (
          <Text style={[styles.kodeErrorText, { color: themeColors.errorFg }]}>
            {galatKode}
          </Text>
        ) : null}

        {lokasiBermasalah && pesanErrorLokasi ? (
          <View
            style={[
              styles.kodeGpsWarn,
              {
                backgroundColor: themeColors.gpsOffBg,
                borderColor: themeColors.gpsOffBorder,
              },
            ]}
          >
            <AlertTriangle size={15} color={themeColors.gpsOffFg} />
            <Text style={[styles.kodeGpsWarnText, { color: themeColors.gpsOffFg }]}>
              {pesanErrorLokasi}
            </Text>
          </View>
        ) : null}
      </View>
    </SheetModal>
  );

  const modalGalat = (
    <SheetModal
      visible={galatModal !== null}
      kicker={isEn ? 'ATTENDANCE VERIFICATION' : 'VERIFIKASI PRESENSI'}
      judul={galatModal?.judul ?? ''}
      onClose={() => setGalatModal(null)}
      footer={
        <View style={styles.modalFooterActions}>
          {galatModal?.jenis === 'lokasi-izin' ? (
            <Tombol
              variant="primer"
              onPress={() => {
                setGalatModal(null);
                void mintaIzinLokasi();
              }}
            >
              {isEn ? 'Allow Location' : 'Izinkan Lokasi'}
            </Tombol>
          ) : galatModal?.jenis === 'lokasi-ulang' ? (
            <Tombol
              variant="primer"
              onPress={() => {
                setGalatModal(null);
                void cobaLokasi();
              }}
            >
              {isEn ? 'Retry GPS' : 'Coba Lagi GPS'}
            </Tombol>
          ) : null}
          <Tombol variant="sekunder" onPress={() => setGalatModal(null)}>
            {isEn ? 'Close' : 'Tutup'}
          </Tombol>
        </View>
      }
    >
      <View style={styles.errorRow}>
        <View
          style={[styles.errorIcon, { backgroundColor: themeColors.errorBg }]}
        >
          <Text style={[styles.errorIconText, { color: themeColors.errorFg }]}>
            !
          </Text>
        </View>
        <Text style={[styles.errorPesan, { color: themeColors.textPrimary }]}>
          {galatModal?.pesan}
        </Text>
      </View>
    </SheetModal>
  );

  // Tampilan saat izin kamera belum diberikan (tetap sediakan tombol Gunakan Kode)
  if (!permission || !permission.granted) {
    return (
      <View
        style={[
          styles.permRoot,
          {
            backgroundColor: themeColors.background,
            paddingTop: insets.top + spacing.s3,
            paddingBottom: Math.max(insets.bottom, spacing.s6),
          },
        ]}
      >
        <View style={styles.permHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Back' : 'Kembali'}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.permBackBtn,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ChevronsLeft size={22} color={themeColors.textPrimary} />
          </Pressable>
          <Text
            style={[styles.permHeaderTitle, { color: themeColors.textPrimary }]}
          >
            {t('qr_title')}
          </Text>
          <View style={styles.permBackSpacer} />
        </View>

        <View style={styles.permBody}>
          <View
            style={[
              styles.permIconCircle,
              { backgroundColor: themeColors.primarySoft },
            ]}
          >
            <CameraIcon size={36} color={themeColors.textPrimary} />
          </View>
          <Text style={[styles.permTitle, { color: themeColors.textPrimary }]}>
            {t('qr_perm_title')}
          </Text>
          <Text style={[styles.permSub, { color: themeColors.textSecondary }]}>
            {t('qr_perm_sub')}
          </Text>
          <Tombol
            variant="primer"
            onPress={handleRequestOrSettings}
            style={styles.permBtn}
          >
            {permission && !permission.canAskAgain
              ? t('perm_open_settings')
              : t('qr_perm_btn')}
          </Tombol>
          <Tombol
            variant="sekunder"
            icon={<KeyRound size={17} color={themeColors.textPrimary} />}
            onPress={handleBukaModalKode}
            style={styles.permSecondaryBtn}
          >
            {isEn ? 'Use Attendance Code' : 'Gunakan Kode Presensi'}
          </Tombol>
        </View>

        {modalKode}
        {modalGalat}
      </View>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        zoom={zoom}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Overlay UI kamera */}
      <View
        style={[
          styles.overlay,
          {
            paddingTop: insets.top + spacing.s3,
            paddingBottom: Math.max(insets.bottom, spacing.s6) + spacing.s4,
          },
        ]}
      >
        {/* Top Bar: Back, Pill Title, Torch */}
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Back' : 'Kembali'}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.circleGlassBtn,
              pressed && styles.pressed,
            ]}
          >
            <ChevronsLeft size={22} color={colors.onGraphite} />
          </Pressable>

          <View style={styles.titlePill}>
            <Text style={styles.titlePillText} numberOfLines={1}>
              {sesiTargetParam ? sesiTargetParam.namaPraktikum : t('qr_title')}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle Flash"
            onPress={() => setTorchOn((v) => !v)}
            style={({ pressed }) => [
              styles.circleGlassBtn,
              torchOn && styles.circleGlassBtnActive,
              pressed && styles.pressed,
            ]}
          >
            {torchOn ? (
              <Zap size={20} color={colors.onPrimary} />
            ) : (
              <ZapOff size={20} color={colors.onGraphite} />
            )}
          </Pressable>
        </View>

        {/* Center Frame dengan 4 sudut membulat */}
        <View style={styles.frameWrap}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        {/* Bottom Controls: Live GPS Pill, Zoom - / % / +, Instructions, Gunakan Kode */}
        <View style={styles.bottomWrap}>
          <Pressable
            accessibilityRole={lokasiBermasalah ? 'button' : undefined}
            disabled={!lokasiBermasalah}
            onPress={handleCobaGpsDariPill}
            style={({ pressed }) => [
              styles.gpsPill,
              lokasiBermasalah && { backgroundColor: themeColors.errorBg },
              pressed && lokasiBermasalah && styles.pressed,
            ]}
          >
            {lokasiBermasalah ? (
              <AlertTriangle size={15} color={themeColors.errorFg} />
            ) : (
              <MapPin size={15} color={colors.primary} />
            )}
            <Text
              style={[
                styles.gpsText,
                lokasiBermasalah && { color: themeColors.errorFg },
              ]}
              numberOfLines={1}
            >
              {koordinat
                ? `${koordinat.lat.toFixed(6)}, ${koordinat.lng.toFixed(6)}`
                : lokasiBermasalah
                  ? statusLokasi === 'izin-ditolak'
                    ? isEn
                      ? 'Location denied · Tap to allow'
                      : 'Izin lokasi ditolak · Tap untuk izinkan'
                    : statusLokasi === 'gps-mati'
                      ? isEn
                        ? 'GPS off · Tap to retry'
                        : 'GPS mati · Tap untuk coba lagi'
                      : isEn
                        ? 'GPS unavailable · Tap to retry'
                        : 'GPS belum terbaca · Tap untuk coba lagi'
                  : t('qr_loc_loading')}
            </Text>
          </Pressable>

          <View style={styles.zoomRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Zoom out' : 'Perkecil zoom'}
              onPress={() => handleAdjustZoom(-0.1)}
              style={({ pressed }) => [
                styles.zoomBtn,
                pressed && styles.pressed,
              ]}
            >
              <Minus size={18} color={colors.onGraphite} />
            </Pressable>

            <View style={styles.zoomPill}>
              <Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Zoom in' : 'Perbesar zoom'}
              onPress={() => handleAdjustZoom(0.1)}
              style={({ pressed }) => [
                styles.zoomBtn,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={18} color={colors.onGraphite} />
            </Pressable>
          </View>

          <View style={styles.instructionWrap}>
            <Text style={styles.instructionTitle}>
              {t('qr_instruction_title')}
            </Text>
            <Text style={styles.instructionSub}>{t('qr_instruction_sub')}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isEn ? 'Use attendance code' : 'Gunakan kode presensi'
            }
            disabled={memproses}
            onPress={handleBukaModalKode}
            style={({ pressed }) => [
              styles.useCodeBtn,
              { backgroundColor: themeColors.primary },
              pressed && styles.pressed,
            ]}
          >
            <KeyRound size={17} color={themeColors.onPrimary} />
            <Text style={[styles.useCodeText, { color: themeColors.onPrimary }]}>
              {isEn ? 'Use Attendance Code' : 'Gunakan Kode Presensi'}
            </Text>
          </Pressable>
        </View>
      </View>

      {memproses && !kodeModalBuka ? (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <View
            style={[
              styles.loadingCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text
              style={[styles.loadingTitle, { color: themeColors.textPrimary }]}
            >
              {isEn ? 'Verifying attendance…' : 'Memverifikasi presensi…'}
            </Text>
            <Text
              style={[styles.loadingSub, { color: themeColors.textSecondary }]}
            >
              {isEn
                ? 'Checking location and recording your check-in.'
                : 'Memeriksa lokasi dan mencatat kehadiranmu.'}
            </Text>
          </View>
        </View>
      ) : null}

      {modalKode}
      {modalGalat}
    </View>
  );
}

const CORNER_SIZE = 34;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  cameraRoot: {
    flex: 1,
    backgroundColor: colors.graphite,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s2,
  },
  circleGlassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 26, 26, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleGlassBtnActive: {
    backgroundColor: colors.primary,
  },
  titlePill: {
    flexShrink: 1,
    paddingHorizontal: spacing.s5,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.62)',
  },
  titlePillText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  frameWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 16,
  },
  bottomWrap: {
    alignItems: 'center',
    gap: spacing.s3 + 2,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.s4,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    maxWidth: '100%',
  },
  gpsText: {
    ...type.caption,
    fontFamily: fontFamily.semibold,
    color: colors.onGraphite,
    flexShrink: 1,
  },
  zoomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s3,
  },
  zoomBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomPill: {
    minWidth: 58,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s3,
  },
  zoomText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
  },
  instructionWrap: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s3,
  },
  instructionTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    color: colors.onGraphite,
    textAlign: 'center',
  },
  instructionSub: {
    ...type.caption,
    color: colors.textOnDarkMuted,
    textAlign: 'center',
  },
  useCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s5,
    minHeight: 46,
    borderRadius: radius.pill,
  },
  useCodeText: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  pressed: {
    opacity: 0.75,
  },
  loadingOverlay: {
    backgroundColor: 'rgba(23, 26, 26, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s6,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    padding: spacing.s5,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    alignItems: 'center',
    gap: spacing.s3,
  },
  loadingTitle: {
    ...type.h3,
    textAlign: 'center',
  },
  loadingSub: {
    ...type.caption,
    textAlign: 'center',
  },
  modalFooterActions: {
    gap: spacing.s2,
  },
  kodeModalBody: {
    gap: spacing.s3,
  },
  kodeModalSub: {
    ...type.caption,
    lineHeight: 18,
  },
  kodeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
    paddingHorizontal: spacing.s3,
    minHeight: 48,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  kodeTextInput: {
    flex: 1,
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
    letterSpacing: 2,
    paddingVertical: 10,
  },
  kodeErrorText: {
    ...type.micro,
    lineHeight: 16,
  },
  kodeGpsWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.button,
    borderWidth: 1,
  },
  kodeGpsWarnText: {
    ...type.micro,
    flex: 1,
    lineHeight: 16,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s3,
  },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconText: {
    ...type.bodyStrong,
  },
  errorPesan: {
    ...type.body,
    flex: 1,
  },
  // Permission fallback view
  permRoot: {
    flex: 1,
    paddingHorizontal: spacing.s5,
  },
  permHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permBackBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permHeaderTitle: {
    ...type.bodyStrong,
    fontFamily: fontFamily.bold,
  },
  permBackSpacer: {
    width: 42,
  },
  permBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s3,
    paddingHorizontal: spacing.s4,
  },
  permIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s2,
  },
  permTitle: {
    ...type.h2,
    textAlign: 'center',
  },
  permSub: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  permBtn: {
    width: '100%',
    marginTop: spacing.s3,
  },
  permSecondaryBtn: {
    width: '100%',
  },
});
