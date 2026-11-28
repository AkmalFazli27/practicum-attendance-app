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
  ArrowLeftRight,
  CalendarClock,
  Clock,
  Edit3,
  FileSpreadsheet,
  MapPin,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react-native';

import {
  ConfirmDialogModal,
  DropdownSelect,
  type DropdownOption,
} from '@/components/aslab/lab/AslabUi';
import {
  DAFTAR_HARI_EN,
  DAFTAR_HARI_ID,
  HARI_AKTIF_KAMPUS,
  useAslabStore,
  type IndeksHari,
  type KelasPraktikumItem,
} from '@/components/aslab/lab/aslabStore';
import { EmptyState, FilterChip, useToast } from '@/components/ui';
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

const RE_JAM = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Fitur 3: Kelola Kelas
 * - Tampilan bersih tanpa tombol Bulk CSV bertebaran di luar (plotting CSV menyatu saat Buat Kelas & di modal anggota).
 * - Hapus kelas maupun simpan perubahan jadwal/ruangan (misal ubah ke Lab AP) memakai dialog konfirmasi di tengah layar.
 * - Pilihan hari & ruangan lab memakai DropdownSelect reusable.
 */
export default function KelolaKelasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser, users } = useSession();
  const {
    ruanganLabs,
    kelasList,
    keanggotaanAll,
    ubahJadwalDanInfoKelas,
    hapusKelas,
    pindahKelasAnggota,
    tambahAnggotaKelas,
  } = useAslabStore();

  const s = useMemo(() => buatGaya(tc), [tc]);

  const [filterMk, setFilterMk] = useState<string>('ALL');

  // Modal Edit Jadwal Rutin & Ruangan Kelas
  const [editTarget, setEditTarget] = useState<KelasPraktikumItem | null>(null);
  const [kodeEdit, setKodeEdit] = useState('');
  const [ruangEditId, setRuangEditId] = useState('');
  const [hariEdit, setHariEdit] = useState<IndeksHari>(5);
  const [jamMulaiEdit, setJamMulaiEdit] = useState('09:40');
  const [jamSelesaiEdit, setJamSelesaiEdit] = useState('11:40');
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  // Dialog Konfirmasi Hapus Kelas di Tengah Layar
  const [hapusTarget, setHapusTarget] = useState<KelasPraktikumItem | null>(
    null,
  );

  // Modal Anggota & Pindah Praktikan
  const [rosterTarget, setRosterTarget] = useState<KelasPraktikumItem | null>(
    null,
  );
  const [pindahUid, setPindahUid] = useState<string>('');
  const [keKelasId, setKeKelasId] = useState<string>('');
  const [nimTambahManual, setNimTambahManual] = useState('');
  const [confirmMoveOpen, setConfirmMoveOpen] = useState(false);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const namaHari = (h: IndeksHari) =>
    isEn ? DAFTAR_HARI_EN[h] : DAFTAR_HARI_ID[h];

  const daftarMk = useMemo(
    () =>
      Array.from(new Set(kelasList.map((k) => k.mataKuliah))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [kelasList],
  );

  const kelasTampil = useMemo(
    () =>
      filterMk === 'ALL'
        ? kelasList
        : kelasList.filter((k) => k.mataKuliah === filterMk),
    [kelasList, filterMk],
  );

  const hariOptions = useMemo<DropdownOption[]>(
    () =>
      HARI_AKTIF_KAMPUS.map((h) => ({
        label: namaHari(h),
        value: String(h),
      })),
    [isEn],
  );

  const ruangOptions = useMemo<DropdownOption[]>(
    () =>
      ruanganLabs.map((r) => ({
        label: r.nama,
        value: r.id,
        subtitle: `${r.alamat} · Radius ${r.radius} m`,
      })),
    [ruanganLabs],
  );

  const bukaEditJadwal = (kls: KelasPraktikumItem) => {
    setEditTarget(kls);
    setKodeEdit(kls.kodeKelas);
    setRuangEditId(kls.ruanganLabId);
    setHariEdit(kls.hariRutin);
    setJamMulaiEdit(kls.jamMulai);
    setJamSelesaiEdit(kls.jamSelesai);
  };

  const validasiEditJadwal = () => {
    if (!editTarget) return false;
    if (!kodeEdit.trim()) {
      showToast(tx('Kode kelas wajib diisi.', 'Class code is required.'));
      return false;
    }
    if (!RE_JAM.test(jamMulaiEdit.trim()) || !RE_JAM.test(jamSelesaiEdit.trim())) {
      showToast(
        tx('Format jam wajib HH:mm (misal 09:40).', 'Use HH:mm format.'),
      );
      return false;
    }
    if (jamSelesaiEdit.trim() <= jamMulaiEdit.trim()) {
      showToast(
        tx(
          'Jam selesai harus setelah jam mulai.',
          'End time must be after start time.',
        ),
      );
      return false;
    }
    return true;
  };

  const eksekusiSimpanEdit = () => {
    if (!editTarget) return;
    ubahJadwalDanInfoKelas(
      editTarget.id,
      {
        kodeKelas: kodeEdit.trim(),
        ruanganLabId: ruangEditId,
        hariRutin: hariEdit,
        jamMulai: jamMulaiEdit.trim(),
        jamSelesai: jamSelesaiEdit.trim(),
      },
      true,
    );
    setConfirmEditOpen(false);
    setEditTarget(null);
    showToast(
      tx(
        'Perubahan kelas & jadwal rutin berhasil disimpan.',
        'Class & weekly schedule changes saved.',
      ),
    );
  };

  const konfirmasiHapus = () => {
    if (!hapusTarget) return;
    const nama = hapusTarget.namaKelas;
    hapusKelas(hapusTarget.id);
    setHapusTarget(null);
    showToast(
      tx(`Kelas "${nama}" berhasil dihapus.`, `Class "${nama}" deleted.`),
    );
  };

  const anggotaKelasRoster = useMemo(() => {
    if (!rosterTarget) return [];
    return keanggotaanAll
      .filter((k) => k.labId === rosterTarget.id && k.peran === 'praktikan')
      .map((k) => {
        const u = users.find((x) => x.id === k.uid);
        return {
          uid: k.uid,
          nama: u?.nama ?? k.uid,
          nim: u?.nim ?? '-',
        };
      });
  }, [rosterTarget, keanggotaanAll, users]);

  const kelasTujuanOptions = useMemo<DropdownOption[]>(() => {
    if (!rosterTarget) return [];
    return kelasList
      .filter(
        (k) =>
          k.id !== rosterTarget.id &&
          k.mataKuliah.toLowerCase() === rosterTarget.mataKuliah.toLowerCase(),
      )
      .map((k) => ({
        label: k.namaKelas,
        value: k.id,
        subtitle: `${k.ruanganLabNama} · ${namaHari(k.hariRutin)} ${k.jamMulai}`,
      }));
  }, [rosterTarget, kelasList, isEn]);

  const handleTambahPraktikanManual = async () => {
    if (!rosterTarget || !nimTambahManual.trim()) return;
    const q = nimTambahManual.trim().toLowerCase();
    const cocok = users.find(
      (u) =>
        u.peran === 'praktikan' &&
        ((u.nim ?? '').toLowerCase() === q ||
          (u.email ?? '').toLowerCase() === q),
    );
    if (!cocok) {
      showToast(
        tx(
          'Praktikan dengan NIM/email tersebut belum terdaftar.',
          'Student with that NIM/email not found.',
        ),
      );
      return;
    }
    await tambahAnggotaKelas(rosterTarget.id, 'praktikan', [cocok.id]);
    setNimTambahManual('');
    showToast(
      tx(
        `${cocok.nama} ditambahkan ke ${rosterTarget.namaKelas}.`,
        `${cocok.nama} added to ${rosterTarget.namaKelas}.`,
      ),
    );
  };

  const eksekusiPindahPraktikan = async () => {
    if (!rosterTarget || !pindahUid || !keKelasId) return;
    const res = await pindahKelasAnggota(pindahUid, rosterTarget.id, keKelasId);
    setConfirmMoveOpen(false);
    if (!res.ok) {
      showToast(res.alasan);
      return;
    }
    const tujuan = kelasList.find((k) => k.id === keKelasId);
    setPindahUid('');
    showToast(
      tx(
        `Praktikan dipindahkan ke ${tujuan?.namaKelas ?? 'kelas tujuan'}.`,
        `Student moved to ${tujuan?.namaKelas ?? 'target class'}.`,
      ),
    );
  };

  const namaRuangEditTerpilih =
    ruanganLabs.find((r) => r.id === ruangEditId)?.nama ?? '';

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
          {tx('Kelola Kelas Praktikum', 'Manage Practicum Classes')}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(aslab)/lab/form-kelas' as any)}
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
        {/* Filter per Mata Kuliah + Pintasan Pindah Anggota */}
        <View style={s.topFilterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, flexGrow: 1 }}
          >
            <FilterChip
              label={tx('Semua', 'All')}
              aktif={filterMk === 'ALL'}
              onPress={() => setFilterMk('ALL')}
            />
            {daftarMk.map((mk) => (
              <FilterChip
                key={mk}
                label={mk}
                aktif={filterMk === mk}
                onPress={() => setFilterMk(mk)}
              />
            ))}
          </ScrollView>

          {kelasList.length > 1 ? (
            <Pressable
              onPress={() => router.push('/(aslab)/lab/pindah-anggota' as any)}
              style={({ pressed }) => [s.transferPill, pressed && s.pressed]}
            >
              <ArrowLeftRight size={13} color={tc.textPrimary} />
              <Text style={s.transferPillText}>
                {tx('Pindah', 'Transfer')}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {kelasTampil.length === 0 ? (
          <EmptyState
            judul={tx('Belum ada kelas praktikum', 'No practicum classes yet')}
            pesan={tx(
              'Buat kelas praktikum baru beserta plotting anggota (manual / CSV) dan jadwal rutin mingguannya.',
              'Create a practicum class with its roster (manual / CSV) and weekly schedule.',
            )}
            aksi={{
              label: tx('Buat Kelas Baru', 'Create New Class'),
              onPress: () => router.push('/(aslab)/lab/form-kelas' as any),
            }}
          />
        ) : (
          kelasTampil.map((kls) => (
            <View key={kls.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.kickerMk}>{kls.mataKuliah.toUpperCase()}</Text>
                  <Text style={s.classTitle}>{kls.namaKelas}</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={tx('Hapus kelas', 'Delete class')}
                  onPress={() => setHapusTarget(kls)}
                  style={({ pressed }) => [s.deleteBtn, pressed && s.pressed]}
                >
                  <Trash2 size={15} color={tc.errorFg} />
                </Pressable>
              </View>

              <View style={s.scheduleStrip}>
                <View style={s.scheduleItem}>
                  <Clock size={13} color={tc.sesiDibukaFg} />
                  <Text style={s.scheduleText}>
                    {tx('Setiap', 'Every')} {namaHari(kls.hariRutin)} ·{' '}
                    {kls.jamMulai}–{kls.jamSelesai}
                  </Text>
                </View>
                <View style={s.scheduleItem}>
                  <MapPin size={13} color={tc.textSecondary} />
                  <Text style={s.roomText}>
                    {kls.ruanganLabNama} ({kls.jumlahPertemuan}x)
                  </Text>
                </View>
              </View>

              <View style={s.cardActions}>
                <Pressable
                  onPress={() => bukaEditJadwal(kls)}
                  style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                >
                  <Edit3 size={13} color={tc.textPrimary} />
                  <Text style={s.actionBtnText}>
                    {tx('Ubah Kelas', 'Edit Class')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setRosterTarget(kls);
                    setPindahUid('');
                    const kandidat = kelasList.find(
                      (x) =>
                        x.id !== kls.id &&
                        x.mataKuliah.toLowerCase() ===
                          kls.mataKuliah.toLowerCase(),
                    );
                    setKeKelasId(kandidat?.id ?? '');
                  }}
                  style={({ pressed }) => [s.actionBtn, pressed && s.pressed]}
                >
                  <UserPlus size={13} color={tc.textPrimary} />
                  <Text style={s.actionBtnText}>
                    {tx('Anggota', 'Roster')}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/(aslab)/lab/kelola-sesi' as any,
                      params: { kelasId: kls.id },
                    })
                  }
                  style={({ pressed }) => [
                    s.actionBtnPrimary,
                    pressed && s.pressed,
                  ]}
                >
                  <CalendarClock size={13} color={tc.onPrimary} />
                  <Text style={s.actionBtnPrimaryText}>
                    {tx('Sesi', 'Sessions')}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Ubah Kelas & Jadwal Rutin (memakai DropdownSelect!) */}
      <Modal
        visible={Boolean(editTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTarget(null)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setEditTarget(null)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {tx('Ubah Konfigurasi & Jadwal Kelas', 'Edit Class & Schedule')}
            </Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx('Kode / Nama Kelas (Manual)', 'Class Code (Manual)')}
              </Text>
              <TextInput
                value={kodeEdit}
                onChangeText={setKodeEdit}
                style={s.input}
              />
            </View>

            <DropdownSelect
              label={tx('Ruangan Laboratorium', 'Laboratory Room')}
              value={ruangEditId}
              options={ruangOptions}
              onSelect={setRuangEditId}
            />

            <DropdownSelect
              label={tx('Hari Praktikum Rutin', 'Recurring Weekday')}
              value={String(hariEdit)}
              options={hariOptions}
              onSelect={(val) => setHariEdit(Number(val) as IndeksHari)}
            />

            <View style={s.twoCol}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>{tx('Jam Mulai', 'Start Time')}</Text>
                <TextInput
                  value={jamMulaiEdit}
                  onChangeText={setJamMulaiEdit}
                  placeholder="09:40"
                  style={s.input}
                />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.label}>{tx('Jam Selesai', 'End Time')}</Text>
                <TextInput
                  value={jamSelesaiEdit}
                  onChangeText={setJamSelesaiEdit}
                  placeholder="11:40"
                  style={s.input}
                />
              </View>
            </View>

            <View style={s.modalActions}>
              <Pressable
                onPress={() => setEditTarget(null)}
                style={s.cancelBtn}
              >
                <Text style={s.cancelBtnText}>{tx('Batal', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (validasiEditJadwal()) setConfirmEditOpen(true);
                }}
                style={s.saveBtn}
              >
                <Text style={s.saveBtnText}>
                  {tx('Simpan Perubahan', 'Save Changes')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Anggota Kelas (Tambah Manual / Pindah Kelas / Impor CSV Susulan) */}
      <Modal
        visible={Boolean(rosterTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setRosterTarget(null)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setRosterTarget(null)}
        >
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {rosterTarget?.namaKelas} — {tx('Anggota', 'Roster')}
            </Text>

            {/* Tautan rapi ke Impor CSV susulan (tetap di dalam konteks kelas, tidak di luar) */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => {
                  setRosterTarget(null);
                  router.push('/(aslab)/lab/bulk-praktikan' as any);
                }}
                style={s.csvInlineBtn}
              >
                <FileSpreadsheet size={13} color={tc.textPrimary} />
                <Text style={s.csvInlineText}>
                  {tx('Impor Praktikan (CSV)', 'Import Students (CSV)')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setRosterTarget(null);
                  router.push('/(aslab)/lab/bulk-asprak' as any);
                }}
                style={s.csvInlineBtn}
              >
                <FileSpreadsheet size={13} color={tc.textPrimary} />
                <Text style={s.csvInlineText}>
                  {tx('Impor Asprak (CSV)', 'Import Asprak (CSV)')}
                </Text>
              </Pressable>
            </View>

            <View style={s.fieldWrap}>
              <Text style={s.label}>
                {tx(
                  'Tambah Praktikan Manual (NIM / Email)',
                  'Add Student Manually (NIM / Email)',
                )}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={nimTambahManual}
                  onChangeText={setNimTambahManual}
                  placeholder="2310512001"
                  placeholderTextColor={tc.textMuted}
                  style={[s.input, { flex: 1 }]}
                />
                <Pressable
                  onPress={() => void handleTambahPraktikanManual()}
                  style={s.inlineAddBtn}
                >
                  <Text style={s.saveBtnText}>{tx('Tambah', 'Add')}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={s.label}>
              {tx(
                'Pilih praktikan untuk pindah kelas:',
                'Select a student to transfer:',
              )}
            </Text>
            <ScrollView style={{ maxHeight: 160 }}>
              {anggotaKelasRoster.length === 0 ? (
                <Text style={s.emptyRosterText}>
                  {tx(
                    'Belum ada praktikan di kelas ini.',
                    'No students in this class yet.',
                  )}
                </Text>
              ) : (
                anggotaKelasRoster.map((m) => {
                  const dipilih = pindahUid === m.uid;
                  return (
                    <Pressable
                      key={m.uid}
                      onPress={() => setPindahUid(dipilih ? '' : m.uid)}
                      style={[
                        s.rosterRow,
                        dipilih && { backgroundColor: tc.sesiDibukaBg },
                      ]}
                    >
                      <Text style={s.rosterName}>{m.nama}</Text>
                      <Text style={s.rosterNim}>{m.nim}</Text>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            {pindahUid && kelasTujuanOptions.length > 0 ? (
              <View style={s.fieldWrap}>
                <DropdownSelect
                  label={tx('Kelas Tujuan', 'Destination Class')}
                  value={keKelasId}
                  options={kelasTujuanOptions}
                  onSelect={setKeKelasId}
                />
                <Pressable
                  onPress={() => setConfirmMoveOpen(true)}
                  style={s.saveBtn}
                >
                  <Text style={s.saveBtnText}>
                    {tx('Pindahkan Praktikan', 'Move Student')}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              onPress={() => setRosterTarget(null)}
              style={s.cancelBtn}
            >
              <Text style={s.cancelBtnText}>{tx('Tutup', 'Close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Dialog Konfirmasi Hapus Kelas di TENGAH Halaman */}
      <ConfirmDialogModal
        visible={Boolean(hapusTarget)}
        tone="danger"
        title={tx('Hapus Kelas Praktikum?', 'Delete Practicum Class?')}
        message={tx(
          `Apakah Anda yakin ingin menghapus kelas "${hapusTarget?.namaKelas ?? ''}" beserta sesi terjadwalnya?`,
          `Are you sure you want to delete "${hapusTarget?.namaKelas ?? ''}" and its scheduled sessions?`,
        )}
        confirmLabel={tx('Ya, Hapus Kelas', 'Yes, Delete')}
        onCancel={() => setHapusTarget(null)}
        onConfirm={konfirmasiHapus}
      />

      {/* Dialog Konfirmasi Ubah Kelas / Ruangan (mis. ke Lab AP) di TENGAH Halaman */}
      <ConfirmDialogModal
        visible={confirmEditOpen}
        tone="confirm"
        title={tx('Simpan Perubahan Kelas?', 'Save Class Changes?')}
        message={tx(
          `Apakah Anda yakin ingin mengubah kelas ini menjadi ruangan ${namaRuangEditTerpilih} dengan jadwal setiap ${namaHari(hariEdit)} (${jamMulaiEdit}–${jamSelesaiEdit})?`,
          `Are you sure you want to update this class to ${namaRuangEditTerpilih} every ${namaHari(hariEdit)} (${jamMulaiEdit}–${jamSelesaiEdit})?`,
        )}
        confirmLabel={tx('Ya, Ubah', 'Yes, Update')}
        onCancel={() => setConfirmEditOpen(false)}
        onConfirm={eksekusiSimpanEdit}
      />

      {/* Dialog Konfirmasi Pindah Praktikan di TENGAH Halaman */}
      <ConfirmDialogModal
        visible={confirmMoveOpen}
        tone="confirm"
        title={tx('Pindahkan Praktikan?', 'Transfer Student?')}
        message={tx(
          'Apakah Anda yakin ingin memindahkan praktikan ini ke kelas tujuan tanpa mengubah jadwal sesi?',
          'Are you sure you want to transfer this student to the selected class?',
        )}
        confirmLabel={tx('Ya, Pindahkan', 'Yes, Move')}
        onCancel={() => setConfirmMoveOpen(false)}
        onConfirm={() => void eksekusiPindahPraktikan()}
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
    topFilterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    transferPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    transferPillText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
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
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    kickerMk: {
      ...tipe.micro,
      fontFamily: fontFamily.bold,
      color: w.textMuted,
      letterSpacing: 0.7,
    },
    classTitle: {
      fontSize: 17,
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
    scheduleStrip: {
      padding: 11,
      borderRadius: 14,
      backgroundColor: w.surfaceMuted,
      gap: 5,
    },
    scheduleItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    scheduleText: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    roomText: {
      fontSize: 12,
      fontFamily: fontFamily.medium,
      color: w.textSecondary,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 9,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
    },
    actionBtnText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    actionBtnPrimary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 9,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
    },
    actionBtnPrimaryText: {
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
    csvInlineBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: w.surfaceMuted,
      borderWidth: 1,
      borderColor: w.border,
    },
    csvInlineText: {
      fontSize: 11.5,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    fieldWrap: { gap: 6 },
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
    inlineAddBtn: {
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    twoCol: { flexDirection: 'row', gap: 12 },
    rosterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: w.border,
      borderRadius: 10,
    },
    rosterName: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: w.textPrimary,
    },
    rosterNim: {
      fontSize: 12,
      color: w.textMuted,
    },
    emptyRosterText: {
      ...tipe.caption,
      color: w.textMuted,
      paddingVertical: 12,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
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
      flex: 1.3,
      height: 48,
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
