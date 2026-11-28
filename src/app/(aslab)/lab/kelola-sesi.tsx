import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CalendarClock,
  Edit3,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';

import {
  ConfirmDialogModal,
  DropdownSelect,
} from '@/components/aslab/lab/AslabUi';
import {
  DAFTAR_HARI_EN,
  DAFTAR_HARI_ID,
  parseYmd,
  useAslabStore,
  type IndeksHari,
  type SesiPertemuan,
} from '@/components/aslab/lab/aslabStore';
import { EmptyState, useToast } from '@/components/ui';
import { usePreferences } from '@/context/PreferencesContext';
import { useSession } from '@/context/SessionContext';
import {
  fontFamily,
  layout,
  radius,
  spacing,
  type as tipe,
  type ThemeColors,
} from '@/theme/tokens';
import { formatTanggalSingkat } from '@/utils/format';

const RE_YMD = /^\d{4}-\d{2}-\d{2}$/;
const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Fitur 4: Kelola Sesi
 * - Pilih kelas praktikum (misal Basis Data B1)
 * - Otomatis menampilkan Pertemuan 1..N yang di-set setiap hari jadwal rutin (misal setiap Jumat)
 * - Bisa auto-ratakan ulang sesuai tanggal minggu pertama atau ubah tanggal/jam per pertemuan
 */
export default function KelolaSesiScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kelasId: paramKelasId } = useLocalSearchParams<{ kelasId?: string }>();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser } = useSession();
  const {
    ruanganLabs,
    kelasList,
    sesiAll,
    generateSesiOtomatisKelas,
    simpanSesiPertemuan,
  } = useAslabStore();

  const s = useMemo(() => buatGaya(tc), [tc]);

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    paramKelasId ?? '',
  );
  const activeKelasId = selectedKelasId || kelasList[0]?.id || '';
  const activeKelas = kelasList.find((k) => k.id === activeKelasId) ?? null;

  // Modal Auto-Set dari tanggal acuan
  const [autoModalOpen, setAutoModalOpen] = useState(false);
  const [tglAcuan, setTglAcuan] = useState('');

  // Modal Edit Sesi Individual
  const [editSesi, setEditSesi] = useState<SesiPertemuan | null>(null);
  const [topikInput, setTopikInput] = useState('');
  const [tanggalInput, setTanggalInput] = useState('');
  const [jamMulaiInput, setJamMulaiInput] = useState('');
  const [jamSelesaiInput, setJamSelesaiInput] = useState('');
  const [ruangInputId, setRuangInputId] = useState('');
  const [confirmSaveSesiOpen, setConfirmSaveSesiOpen] = useState(false);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const namaHari = (h: IndeksHari) =>
    isEn ? DAFTAR_HARI_EN[h] : DAFTAR_HARI_ID[h];

  const sesiKelasIni = useMemo(() => {
    if (!activeKelas) return [];
    const byKelas = sesiAll.filter(
      (item) =>
        item.kelasId === activeKelas.id ||
        (item.namaPraktikum.toLowerCase() ===
          activeKelas.mataKuliah.toLowerCase() &&
          item.kelas.toLowerCase() === activeKelas.kodeKelas.toLowerCase()),
    );
    return [...byKelas].sort(
      (a, b) =>
        (a.pertemuanKe ?? 99) - (b.pertemuanKe ?? 99) ||
        a.tanggal.localeCompare(b.tanggal),
    );
  }, [activeKelas, sesiAll]);

  const bukaEditPertemuan = (item: SesiPertemuan) => {
    setEditSesi(item);
    setTopikInput(
      item.topik ||
        (item.pertemuanKe ? `Pertemuan ${item.pertemuanKe}` : 'Sesi Praktikum'),
    );
    setTanggalInput(item.tanggal);
    setJamMulaiInput(item.jamMulai);
    setJamSelesaiInput(item.jamSelesai);
    setRuangInputId(item.labId || activeKelas?.ruanganLabId || '');
  };

  const validasiInputSesi = () => {
    if (!editSesi || !activeKelas) return false;
    if (!RE_YMD.test(tanggalInput.trim())) {
      showToast(
        tx('Format tanggal wajib YYYY-MM-DD.', 'Date format must be YYYY-MM-DD.'),
      );
      return false;
    }
    if (!RE_JAM.test(jamMulaiInput.trim()) || !RE_JAM.test(jamSelesaiInput.trim())) {
      showToast(
        tx('Format jam wajib HH:mm.', 'Time format must be HH:mm.'),
      );
      return false;
    }
    return true;
  };

  const handleSimpanSesi = async () => {
    if (!editSesi || !activeKelas) return;
    await simpanSesiPertemuan({
      id: editSesi.id,
      kelasId: activeKelas.id,
      pertemuanKe: editSesi.pertemuanKe,
      namaPraktikum: activeKelas.mataKuliah,
      kelas: activeKelas.kodeKelas,
      ruanganLabId: ruangInputId || activeKelas.ruanganLabId,
      topik: topikInput.trim(),
      tanggal: tanggalInput.trim(),
      jamMulai: jamMulaiInput.trim(),
      jamSelesai: jamSelesaiInput.trim(),
    });
    setConfirmSaveSesiOpen(false);
    setEditSesi(null);
    showToast(
      tx('Jadwal pertemuan berhasil diperbarui.', 'Session date updated.'),
    );
  };

  const handleAutoSetRutin = () => {
    if (!activeKelas) return;
    const acuan = tglAcuan.trim() || activeKelas.tanggalMulai;
    if (!RE_YMD.test(acuan)) {
      showToast(
        tx('Format tanggal wajib YYYY-MM-DD.', 'Date format must be YYYY-MM-DD.'),
      );
      return;
    }
    generateSesiOtomatisKelas(activeKelas.id, acuan);
    setAutoModalOpen(false);
    showToast(
      tx(
        `Seluruh ${activeKelas.jumlahPertemuan} pertemuan diatur otomatis setiap ${namaHari(activeKelas.hariRutin)}.`,
        `All ${activeKelas.jumlahPertemuan} meetings auto-set to every ${namaHari(activeKelas.hariRutin)}.`,
      ),
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.topBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [s.backBtn, pressed && s.pressed]}
        >
          <ArrowLeft size={20} color={tc.textPrimary} />
        </Pressable>
        <Text style={s.topBarTitle} numberOfLines={1}>
          {tx('Kelola Sesi Pertemuan', 'Manage Class Sessions')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {kelasList.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada kelas praktikum', 'No practicum classes yet')}
            pesan={tx(
              'Buat kelas praktikum terlebih dahulu di menu Kelola Kelas untuk mengatur sesi pertemuan.',
              'Create a practicum class first to configure its session dates.',
            )}
            aksi={{
              label: tx('Buka Kelola Kelas', 'Open Manage Classes'),
              onPress: () => router.push('/(aslab)/lab/kelola-kelas' as any),
            }}
          />
        ) : (
          <>
            <Text style={s.label}>
              {tx('Pilih Kelas Praktikum', 'Select Practicum Class')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {kelasList.map((kls) => {
                const aktif = kls.id === activeKelasId;
                return (
                  <Pressable
                    key={kls.id}
                    onPress={() => setSelectedKelasId(kls.id)}
                    style={[s.classPill, aktif && s.classPillActive]}
                  >
                    <Text
                      style={[s.classPillText, aktif && s.classPillTextActive]}
                    >
                      {kls.namaKelas}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {activeKelas ? (
              <>
                {/* Banner Jadwal Rutin + Tombol Auto-Set Setiap Hari Jadwal */}
                <View style={s.routineCard}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.routineTitle}>
                      {activeKelas.namaKelas} ({activeKelas.jumlahPertemuan}{' '}
                      {tx('Pertemuan', 'Meetings')})
                    </Text>
                    <Text style={s.routineSub}>
                      {tx('Rutin setiap', 'Every')}{' '}
                      {namaHari(activeKelas.hariRutin)} · {activeKelas.jamMulai}
                      –{activeKelas.jamSelesai} · {activeKelas.ruanganLabNama}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      setTglAcuan(activeKelas.tanggalMulai);
                      setAutoModalOpen(true);
                    }}
                    style={({ pressed }) => [
                      s.autoBtn,
                      pressed && s.pressed,
                    ]}
                  >
                    <RefreshCw size={14} color={tc.onPrimary} />
                    <Text style={s.autoBtnText}>
                      {tx('Auto-Set', 'Auto-Set')}
                    </Text>
                  </Pressable>
                </View>

                {sesiKelasIni.length === 0 ? (
                  <EmptyState
                    judul={tx(
                      'Sesi pertemuan belum digenerate',
                      'Sessions not generated yet',
                    )}
                    pesan={tx(
                      `Klik tombol di bawah untuk meng-generate otomatis ${activeKelas.jumlahPertemuan} pertemuan di setiap hari ${namaHari(activeKelas.hariRutin)}.`,
                      `Generate all ${activeKelas.jumlahPertemuan} sessions automatically.`,
                    )}
                    aksi={{
                      label: tx(
                        `Generate Setiap ${namaHari(activeKelas.hariRutin)}`,
                        `Generate Every ${namaHari(activeKelas.hariRutin)}`,
                      ),
                      onPress: () =>
                        generateSesiOtomatisKelas(
                          activeKelas.id,
                          activeKelas.tanggalMulai,
                        ),
                    }}
                  />
                ) : (
                  <View style={s.listWrap}>
                    {sesiKelasIni.map((item, index) => {
                      const d = parseYmd(item.tanggal);
                      const hariSesi = namaHari(d.getDay() as IndeksHari);
                      const ke = item.pertemuanKe ?? index + 1;

                      return (
                        <View key={item.id} style={s.sesiCard}>
                          <View style={s.numCircle}>
                            <Text style={s.numText}>P{ke}</Text>
                          </View>

                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={s.sesiTitle}>
                              {item.topik || `Pertemuan ${ke}`}
                            </Text>
                            <Text style={s.sesiDate}>
                              {hariSesi}, {formatTanggalSingkat(item.tanggal)} ·{' '}
                              {item.jamMulai}–{item.jamSelesai}
                            </Text>
                            <View style={s.roomRow}>
                              <MapPin size={11} color={tc.textMuted} />
                              <Text style={s.roomName}>{item.lab}</Text>
                            </View>
                          </View>

                          <Pressable
                            onPress={() => bukaEditPertemuan(item)}
                            style={({ pressed }) => [
                              s.editBtn,
                              pressed && s.pressed,
                            ]}
                          >
                            <Edit3 size={14} color={tc.textPrimary} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Modal Auto-Set Setiap Hari Jadwal */}
      <Modal
        visible={autoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAutoModalOpen(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setAutoModalOpen(false)}
        >
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {tx(
                'Auto-Set Jadwal Pertemuan Mingguan',
                'Auto-Set Weekly Session Dates',
              )}
            </Text>
            <Text style={s.modalSub}>
              {activeKelas
                ? tx(
                    `Seluruh ${activeKelas.jumlahPertemuan} pertemuan akan otomatis ditempatkan setiap hari ${namaHari(activeKelas.hariRutin)} (${activeKelas.jamMulai}–${activeKelas.jamSelesai}) mulai dari tanggal acuan berikut:`,
                    `All ${activeKelas.jumlahPertemuan} meetings will be placed on every ${namaHari(activeKelas.hariRutin)} starting from:`,
                  )
                : ''}
            </Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx('Tanggal Mulai Semester (YYYY-MM-DD)', 'Start Date (YYYY-MM-DD)')}
              </Text>
              <TextInput
                value={tglAcuan}
                onChangeText={setTglAcuan}
                placeholder="2026-11-28"
                style={s.input}
              />
            </View>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setAutoModalOpen(false)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>{tx('Batal', 'Cancel')}</Text>
              </Pressable>
              <Pressable onPress={handleAutoSetRutin} style={s.saveBtn}>
                <CalendarClock size={15} color={tc.onPrimary} />
                <Text style={s.saveBtnText}>
                  {tx('Terapkan Otomatis', 'Apply Auto-Dates')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Ubah Tanggal / Jam 1 Pertemuan */}
      <Modal
        visible={Boolean(editSesi)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditSesi(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setEditSesi(null)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {tx('Ubah Jadwal Pertemuan', 'Edit Session Date & Time')}
            </Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx('Judul / Topik Pertemuan', 'Meeting Title / Topic')}
              </Text>
              <TextInput
                value={topikInput}
                onChangeText={setTopikInput}
                style={s.input}
              />
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx('Tanggal Pelaksanaan (YYYY-MM-DD)', 'Date (YYYY-MM-DD)')}
              </Text>
              <TextInput
                value={tanggalInput}
                onChangeText={setTanggalInput}
                placeholder="2026-12-04"
                style={s.input}
              />
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>{tx('Jam Mulai', 'Start Time')}</Text>
                <TextInput
                  value={jamMulaiInput}
                  onChangeText={setJamMulaiInput}
                  style={s.input}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>{tx('Jam Selesai', 'End Time')}</Text>
                <TextInput
                  value={jamSelesaiInput}
                  onChangeText={setJamSelesaiInput}
                  style={s.input}
                />
              </View>
            </View>

            <DropdownSelect
              label={tx('Ruangan Lab', 'Laboratory Room')}
              value={ruangInputId}
              options={ruanganLabs.map((r) => ({
                label: r.nama,
                value: r.id,
                subtitle: `${r.alamat} · Radius ${r.radius} m`,
              }))}
              onSelect={setRuangInputId}
            />

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setEditSesi(null)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>{tx('Batal', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (validasiInputSesi()) setConfirmSaveSesiOpen(true);
                }}
                style={s.saveBtn}
              >
                <Text style={s.saveBtnText}>{tx('Simpan', 'Save')}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialogModal
        visible={confirmSaveSesiOpen}
        tone="confirm"
        title={tx('Simpan Perubahan Pertemuan?', 'Save Session Changes?')}
        message={tx(
          `Apakah Anda yakin ingin mengubah jadwal pertemuan ini ke tanggal ${tanggalInput} (${jamMulaiInput}–${jamSelesaiInput})?`,
          `Update this session to ${tanggalInput} (${jamMulaiInput}–${jamSelesaiInput})?`,
        )}
        confirmLabel={tx('Ya, Simpan', 'Yes, Save')}
        onCancel={() => setConfirmSaveSesiOpen(false)}
        onConfirm={() => void handleSimpanSesi()}
      />
    </View>
  );
}

const buatGaya = (w: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: w.background },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: layout.screenPadding,
      paddingVertical: spacing.s3,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarTitle: {
      ...tipe.h2,
      fontSize: 18,
      color: w.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    content: {
      alignSelf: 'center',
      width: '100%',
      maxWidth: 540,
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing.s2,
      gap: 14,
    },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    classPill: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    classPillActive: {
      backgroundColor: w.graphite,
      borderColor: w.graphite,
    },
    classPillText: {
      fontSize: 13,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    classPillTextActive: {
      color: w.onGraphite,
      fontFamily: fontFamily.bold,
    },
    routineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 15,
      borderRadius: 20,
      backgroundColor: w.sesiDibukaBg,
      borderWidth: 1,
      borderColor: w.radiusInsideBorder,
    },
    routineTitle: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
      color: w.sesiDibukaFg,
    },
    routineSub: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.sesiDibukaFg,
    },
    autoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
    },
    autoBtnText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    listWrap: { gap: 10 },
    sesiCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 18,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    numCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numText: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    sesiTitle: {
      fontSize: 14.5,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    sesiDate: {
      fontSize: 12.5,
      fontFamily: fontFamily.medium,
      color: w.textSecondary,
    },
    roomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    roomName: {
      fontSize: 11.5,
      color: w.textMuted,
    },
    editBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: w.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 22,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 12,
      borderTopWidth: 1,
      borderColor: w.border,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: w.border,
    },
    modalTitle: {
      fontSize: 17,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      textAlign: 'center',
    },
    modalSub: {
      ...tipe.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    fieldWrap: { gap: 6 },
    input: {
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 14,
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
    },
    twoCol: { flexDirection: 'row', gap: 12 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancelBtn: {
      flex: 1,
      height: 48,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    saveBtn: {
      flex: 1.4,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    pressed: { opacity: 0.8 },
  });
