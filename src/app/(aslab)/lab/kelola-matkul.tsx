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
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit3,
  FileSpreadsheet,
  Plus,
  Sliders,
  Trash2,
} from 'lucide-react-native';

import { ConfirmDialogModal } from '@/components/aslab/lab/AslabUi';
import {
  useAslabStore,
  type KonfigurasiMatkul,
} from '@/components/aslab/lab/aslabStore';
import {
  DEFAULT_DENDA_NOMINAL,
  DEFAULT_GRACE_MENIT,
  DEFAULT_JUMLAH_PERTEMUAN,
} from '@/components/aslab/lab/validasiManajemenLab';
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

/**
 * Fitur 2: Kelola Mata Kuliah
 * - Tambah, ubah, dan hapus mata kuliah praktikum (dialog konfirmasi di tengah layar).
 * - Mengatur jumlah pertemuan 1 semester & aturan seragam (grace period, denda).
 * - Tombol cepat menambahkan kelas praktikum untuk mata kuliah tersebut.
 */
export default function KelolaMatkulScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser } = useSession();
  const {
    mataKuliahList,
    kelasList,
    simpanMataKuliah,
    hapusMataKuliah,
  } = useAslabStore();
  const s = useMemo(() => buatGaya(tc), [tc]);

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [namaMk, setNamaMk] = useState('');
  const [pertemuanTeks, setPertemuanTeks] = useState(
    String(DEFAULT_JUMLAH_PERTEMUAN),
  );
  const [graceTeks, setGraceTeks] = useState(String(DEFAULT_GRACE_MENIT));
  const [dendaTeks, setDendaTeks] = useState(String(DEFAULT_DENDA_NOMINAL));

  // Konfirmasi terpusat di tengah layar (Hapus & Simpan Perubahan)
  const [hapusTarget, setHapusTarget] = useState<KonfigurasiMatkul | null>(
    null,
  );
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const bukaTambahBaru = () => {
    setIsEditingExisting(false);
    setNamaMk('');
    setPertemuanTeks(String(DEFAULT_JUMLAH_PERTEMUAN));
    setGraceTeks(String(DEFAULT_GRACE_MENIT));
    setDendaTeks(String(DEFAULT_DENDA_NOMINAL));
    setModalOpen(true);
  };

  const bukaEditMatkul = (mk: KonfigurasiMatkul) => {
    setIsEditingExisting(true);
    setNamaMk(mk.nama);
    setPertemuanTeks(String(mk.jumlahPertemuan));
    setGraceTeks(String(mk.graceMenit));
    setDendaTeks(String(mk.dendaNominal));
    setModalOpen(true);
  };

  const validasiInput = () => {
    const namaBersih = namaMk.trim();
    const jml = parseInt(pertemuanTeks, 10);
    const grace = parseInt(graceTeks, 10);
    const denda = parseInt(dendaTeks, 10);

    if (!namaBersih) {
      showToast(
        tx('Nama mata kuliah wajib diisi.', 'Course name is required.'),
      );
      return null;
    }
    if (Number.isNaN(jml) || jml < 1 || jml > 20) {
      showToast(
        tx(
          'Jumlah pertemuan harus antara 1 sampai 20.',
          'Meetings count must be between 1 and 20.',
        ),
      );
      return null;
    }
    if (Number.isNaN(grace) || grace < 0 || grace > 60) {
      showToast(
        tx(
          'Grace period harus antara 0 sampai 60 menit.',
          'Grace period must be between 0 and 60 minutes.',
        ),
      );
      return null;
    }
    if (Number.isNaN(denda) || denda <= 0) {
      showToast(
        tx(
          'Nominal denda harus lebih dari Rp0.',
          'Fine amount must be greater than Rp0.',
        ),
      );
      return null;
    }
    return { namaBersih, jml, grace, denda };
  };

  const eksekusiSimpan = () => {
    const valid = validasiInput();
    if (!valid) return;
    simpanMataKuliah({
      nama: valid.namaBersih,
      jumlahPertemuan: valid.jml,
      graceMenit: valid.grace,
      dendaNominal: valid.denda,
    });
    setConfirmEditOpen(false);
    setModalOpen(false);
    showToast(
      tx(
        `Pengaturan "${valid.namaBersih}" (${valid.jml} pertemuan) berhasil disimpan.`,
        `Settings for "${valid.namaBersih}" (${valid.jml} meetings) saved.`,
      ),
    );
  };

  const handleKlikSimpanForm = () => {
    const valid = validasiInput();
    if (!valid) return;
    if (isEditingExisting) {
      setConfirmEditOpen(true);
      return;
    }
    eksekusiSimpan();
  };

  const konfirmasiHapusMatkul = () => {
    if (!hapusTarget) return;
    const nama = hapusTarget.nama;
    hapusMataKuliah(nama);
    setHapusTarget(null);
    showToast(
      tx(
        `Mata kuliah "${nama}" berhasil dihapus.`,
        `Course "${nama}" deleted.`,
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
          {tx('Kelola Mata Kuliah', 'Manage Courses')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={bukaTambahBaru}
          style={({ pressed }) => [s.addIconBtn, pressed && s.pressed]}
        >
          <Plus size={20} color={tc.onPrimary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        <Pressable
          onPress={() => router.push('/(aslab)/lab/bulk-lab' as any)}
          style={({ pressed }) => [s.csvSecondaryBtn, pressed && s.pressed]}
        >
          <FileSpreadsheet size={14} color={tc.textSecondary} />
          <Text style={s.csvSecondaryText}>
            {tx('Impor CSV', 'Import CSV')}
          </Text>
        </Pressable>

        {mataKuliahList.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada mata kuliah', 'No courses yet')}
            pesan={tx(
              'Tambahkan mata kuliah praktikum untuk mengatur jumlah pertemuan dan membuat kelas.',
              'Add a practicum course to set meeting counts and create classes.',
            )}
            aksi={{
              label: tx('Tambah Mata Kuliah', 'Add Course'),
              onPress: bukaTambahBaru,
            }}
          />
        ) : (
          mataKuliahList.map((mk) => {
            const kelasTerkait = kelasList.filter(
              (k) =>
                k.mataKuliah.trim().toLowerCase() ===
                mk.nama.trim().toLowerCase(),
            );
            return (
              <View key={mk.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={s.iconCircle}>
                    <BookOpen size={18} color={tc.sesiDibukaFg} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.courseTitle}>{mk.nama}</Text>
                    <Text style={s.courseSub}>
                      {kelasTerkait.length > 0
                        ? kelasTerkait.map((k) => k.kodeKelas).join(', ')
                        : tx('Belum ada kelas dibuat', 'No classes created yet')}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => bukaEditMatkul(mk)}
                    style={({ pressed }) => [s.editPill, pressed && s.pressed]}
                  >
                    <Edit3 size={13} color={tc.textPrimary} />
                    <Text style={s.editPillText}>{tx('Atur', 'Rules')}</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={tx(
                      'Hapus mata kuliah',
                      'Delete course',
                    )}
                    onPress={() => setHapusTarget(mk)}
                    style={({ pressed }) => [s.deleteBtn, pressed && s.pressed]}
                  >
                    <Trash2 size={15} color={tc.errorFg} />
                  </Pressable>
                </View>

                <View style={s.badgeRow}>
                  <View style={s.metaChip}>
                    <Calendar size={12} color={tc.textSecondary} />
                    <Text style={s.metaChipText}>
                      {mk.jumlahPertemuan} {tx('pertemuan', 'meetings')}
                    </Text>
                  </View>
                  <View style={s.metaChip}>
                    <Sliders size={12} color={tc.textSecondary} />
                    <Text style={s.metaChipText}>Grace {mk.graceMenit} mnt</Text>
                  </View>
                  <View style={s.metaChip}>
                    <Text style={s.metaChipText}>
                      Rp{mk.dendaNominal.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>

                <View style={s.cardFooter}>
                  <Text style={s.classCountText}>
                    {kelasTerkait.length} {tx('kelas terdaftar', 'classes')}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      router.push({
                        pathname: '/(aslab)/lab/form-kelas' as any,
                        params: { mk: mk.nama },
                      })
                    }
                    style={({ pressed }) => [
                      s.addClassBtn,
                      pressed && s.pressed,
                    ]}
                  >
                    <Plus size={14} color={tc.onPrimary} />
                    <Text style={s.addClassBtnText}>
                      {tx('Tambah Kelas', 'Add Class')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Form Tambah / Ubah Aturan Mata Kuliah */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setModalOpen(false)}
        >
          <Pressable
            style={s.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {isEditingExisting
                ? tx('Atur Jadwal & Aturan Matkul', 'Configure Course Rules')
                : tx('Tambah Mata Kuliah Baru', 'Add New Course')}
            </Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx('Nama Mata Kuliah', 'Course Name')}
              </Text>
              <TextInput
                value={namaMk}
                onChangeText={setNamaMk}
                editable={!isEditingExisting}
                placeholder={tx('Contoh: Basis Data', 'e.g. Basis Data')}
                placeholderTextColor={tc.textMuted}
                style={[s.input, isEditingExisting && { opacity: 0.7 }]}
              />
            </View>

            <View style={s.fieldWrap}>
              <View style={s.rowBetween}>
                <Text style={s.label}>
                  {tx(
                    'Jumlah Pertemuan (Jadwal Semester)',
                    'Total Semester Meetings',
                  )}
                </Text>
                <View style={s.pillBadge}>
                  <Text style={s.pillBadgeText}>
                    {pertemuanTeks || 0} {tx('sesi', 'sessions')}
                  </Text>
                </View>
              </View>

              <View style={s.stepperRow}>
                <Pressable
                  onPress={() => {
                    const cur = parseInt(pertemuanTeks, 10) || 8;
                    setPertemuanTeks(String(Math.max(1, cur - 1)));
                  }}
                  style={s.stepBtn}
                >
                  <Text style={s.stepBtnText}>- 1</Text>
                </Pressable>
                <TextInput
                  value={pertemuanTeks}
                  onChangeText={(txt) =>
                    setPertemuanTeks(txt.replace(/[^\d]/g, ''))
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  style={s.centerInput}
                />
                <Pressable
                  onPress={() => {
                    const cur = parseInt(pertemuanTeks, 10) || 8;
                    setPertemuanTeks(String(Math.min(20, cur + 1)));
                  }}
                  style={s.stepBtn}
                >
                  <Text style={s.stepBtnText}>+ 1</Text>
                </Pressable>
              </View>

              <View style={s.presetRow}>
                {[8, 10, 12, 14, 16].map((n) => {
                  const aktif = pertemuanTeks === String(n);
                  return (
                    <Pressable
                      key={n}
                      onPress={() => setPertemuanTeks(String(n))}
                      style={[s.presetChip, aktif && s.presetChipActive]}
                    >
                      <Text
                        style={[
                          s.presetChipText,
                          aktif && s.presetChipTextActive,
                        ]}
                      >
                        {n}x
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={s.twoCol}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>Grace (menit)</Text>
                <TextInput
                  value={graceTeks}
                  onChangeText={(txt) =>
                    setGraceTeks(txt.replace(/[^\d]/g, ''))
                  }
                  keyboardType="number-pad"
                  style={s.input}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>Denda (Rp)</Text>
                <TextInput
                  value={dendaTeks}
                  onChangeText={(txt) =>
                    setDendaTeks(txt.replace(/[^\d]/g, ''))
                  }
                  keyboardType="number-pad"
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setModalOpen(false)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>{tx('Batal', 'Cancel')}</Text>
              </Pressable>
              <Pressable onPress={handleKlikSimpanForm} style={s.saveBtn}>
                <Text style={s.saveBtnText}>
                  {tx('Simpan Mata Kuliah', 'Save Course')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dialog Konfirmasi Hapus Mata Kuliah di Tengah Layar */}
      <ConfirmDialogModal
        visible={Boolean(hapusTarget)}
        tone="danger"
        title={tx('Hapus Mata Kuliah?', 'Delete Course?')}
        message={tx(
          `Apakah Anda yakin ingin menghapus mata kuliah "${hapusTarget?.nama ?? ''}" beserta seluruh kelas dan jadwal di bawahnya?`,
          `Are you sure you want to delete "${hapusTarget?.nama ?? ''}" and all classes under it?`,
        )}
        confirmLabel={tx('Ya, Hapus', 'Yes, Delete')}
        onCancel={() => setHapusTarget(null)}
        onConfirm={konfirmasiHapusMatkul}
      />

      {/* Dialog Konfirmasi Edit Aturan Mata Kuliah di Tengah Layar */}
      <ConfirmDialogModal
        visible={confirmEditOpen}
        tone="confirm"
        title={tx('Simpan Perubahan Aturan?', 'Save Course Rule Changes?')}
        message={tx(
          `Apakah Anda yakin ingin mengubah aturan "${namaMk}" (${pertemuanTeks} pertemuan, grace ${graceTeks} mnt, denda Rp${Number(dendaTeks || 0).toLocaleString('id-ID')}) untuk seluruh kelasnya?`,
          `Apply ${pertemuanTeks} meetings, ${graceTeks}m grace, and Rp${Number(dendaTeks || 0).toLocaleString('id-ID')} fine across all "${namaMk}" classes?`,
        )}
        confirmLabel={tx('Ya, Simpan', 'Yes, Save')}
        onCancel={() => setConfirmEditOpen(false)}
        onConfirm={eksekusiSimpan}
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
    addIconBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
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
    subHeaderRow: {
      gap: 10,
    },
    subtitle: {
      ...tipe.caption,
      color: w.textSecondary,
      lineHeight: 18,
    },
    csvSecondaryBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    csvSecondaryText: {
      fontSize: 11.5,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    card: {
      backgroundColor: w.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: w.border,
      padding: 16,
      gap: 12,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: w.sesiDibukaBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    courseTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    courseSub: {
      ...tipe.caption,
      color: w.textMuted,
    },
    editPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    editPillText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.pill,
      backgroundColor: w.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    metaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
    },
    metaChipText: {
      ...tipe.micro,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: w.border,
    },
    classCountText: {
      ...tipe.caption,
      color: w.textMuted,
    },
    addClassBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
    },
    addClassBtnText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
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
      paddingBottom: 34,
      gap: 14,
      borderTopWidth: 1,
      borderColor: w.border,
    },
    modalHandle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: w.border,
      marginBottom: 4,
    },
    modalTitle: {
      fontSize: 17,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
      textAlign: 'center',
    },
    fieldWrap: { gap: 8 },
    rowBetween: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
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
    pillBadge: {
      backgroundColor: w.primary,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    pillBadgeText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepBtn: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    stepBtnText: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    centerInput: {
      flex: 1,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      textAlign: 'center',
      fontSize: 17,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    presetRow: {
      flexDirection: 'row',
      gap: 8,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
      alignItems: 'center',
    },
    presetChipActive: {
      backgroundColor: w.graphite,
      borderColor: w.graphite,
    },
    presetChipText: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    presetChipTextActive: {
      color: w.onGraphite,
      fontFamily: fontFamily.bold,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 12,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    cancelBtn: {
      flex: 1,
      height: 50,
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
      height: 50,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
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
