import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, MapPin } from 'lucide-react-native';

import { ConfirmDialogModal } from '@/components/aslab/lab/AslabUi';
import { useAslabStore } from '@/components/aslab/lab/aslabStore';
import { useToast } from '@/components/ui';
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
 * Fitur 1: Kelola Lab — Mengatur radius presensi per ruangan laboratorium fisik.
 */
export default function KelolaRuangLabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { themeColors: tc, language } = usePreferences();
  const isEn = language === 'en';
  const tx = (id: string, en: string) => (isEn ? en : id);

  const { currentUser } = useSession();
  const { ruanganLabs, simpanRadiusRuang } = useAslabStore();
  const s = useMemo(() => buatGaya(tc), [tc]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [radiusInput, setRadiusInput] = useState<string>('100');
  const [alamatInput, setAlamatInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);

  const activeId = selectedId || ruanganLabs[0]?.id || '';
  const activeRoom = ruanganLabs.find((r) => r.id === activeId);

  useEffect(() => {
    if (!activeRoom) return;
    setRadiusInput(String(activeRoom.radius));
    setAlamatInput(activeRoom.alamat);
  }, [activeRoom?.id]);

  if (currentUser && currentUser.peran !== 'aslab') {
    return <Redirect href="/" />;
  }

  const handleSelectRoom = (id: string) => {
    setSelectedId(id);
    const r = ruanganLabs.find((item) => item.id === id);
    if (r) {
      setRadiusInput(String(r.radius));
      setAlamatInput(r.alamat);
    }
  };

  const mintaKonfirmasiSimpan = () => {
    if (!activeRoom || saving) return;
    const nilaiRadius = parseInt(radiusInput, 10);
    if (Number.isNaN(nilaiRadius) || nilaiRadius < 10 || nilaiRadius > 500) {
      showToast(
        tx(
          'Radius presensi harus antara 10 sampai 500 meter.',
          'Attendance radius must be between 10 and 500 meters.',
        ),
      );
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleSave = async () => {
    if (!activeRoom || saving) return;
    const nilaiRadius = parseInt(radiusInput, 10);
    setSaving(true);
    try {
      await simpanRadiusRuang(activeRoom.id, {
        radius: nilaiRadius,
        alamat: alamatInput.trim() || activeRoom.alamat,
      });
      setConfirmSaveOpen(false);
      showToast(
        tx(
          `Perubahan ${activeRoom.nama} (${nilaiRadius} m) berhasil disimpan.`,
          `${activeRoom.nama} (${nilaiRadius} m) changes saved.`,
        ),
      );
    } finally {
      setSaving(false);
    }
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
          {tx('Kelola Ruangan Lab', 'Manage Lab Rooms')}
        </Text>
        <View style={s.topBarSide} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.content,
            { paddingBottom: insets.bottom + 32 },
          ]}
        >
          <Text style={s.sectionTitle}>
            {tx('Pilih Ruangan Laboratorium', 'Select Laboratory Room')}
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.pillRow}
          >
            {ruanganLabs.map((room) => {
              const aktif = room.id === activeId;
              return (
                <Pressable
                  key={room.id}
                  accessibilityRole="button"
                  onPress={() => handleSelectRoom(room.id)}
                  style={[s.roomPill, aktif && s.roomPillActive]}
                >
                  <Text style={[s.roomPillText, aktif && s.roomPillTextActive]}>
                    {room.nama}
                  </Text>
                  <View
                    style={[
                      s.roomRadiusBadge,
                      aktif && s.roomRadiusBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        s.roomRadiusBadgeText,
                        aktif && s.roomRadiusBadgeTextActive,
                      ]}
                    >
                      {room.radius} m
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {activeRoom ? (
            <>
              {/* Info Ruangan */}
              <View style={s.card}>
                <View style={s.roomHeader}>
                  <View style={s.roomIcon}>
                    <Building2 size={20} color={tc.onPrimary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.cardTitle}>{activeRoom.nama}</Text>
                    <View style={s.coordRow}>
                      <MapPin size={12} color={tc.textMuted} />
                      <Text style={s.coordText}>
                        {activeRoom.lat.toFixed(6)}, {activeRoom.lng.toFixed(6)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={s.label}>
                    {tx('Gedung / Detail Ruangan', 'Building / Room Address')}
                  </Text>
                  <TextInput
                    value={alamatInput}
                    onChangeText={setAlamatInput}
                    placeholder="Gedung E FSM UNDIP, Lantai 2"
                    placeholderTextColor={tc.textMuted}
                    style={s.input}
                  />
                </View>
              </View>

              {/* Kartu Radius Presensi */}
              <View style={s.card}>
                <View style={s.radiusTopRow}>
                  <Text style={s.cardTitle}>
                    {tx('Radius Presensi', 'Attendance Radius')}
                  </Text>
                  <View style={s.valueBadge}>
                    <Text style={s.valueBadgeText}>
                      {radiusInput || 0} m
                    </Text>
                  </View>
                </View>

                <View style={s.stepperRow}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      const cur = parseInt(radiusInput, 10) || 50;
                      setRadiusInput(String(Math.max(10, cur - 10)));
                    }}
                    style={({ pressed }) => [
                      s.stepBtn,
                      pressed && s.pressed,
                    ]}
                  >
                    <Text style={s.stepBtnText}>- 10m</Text>
                  </Pressable>

                  <TextInput
                    value={radiusInput}
                    onChangeText={(txt) =>
                      setRadiusInput(txt.replace(/[^\d]/g, ''))
                    }
                    keyboardType="number-pad"
                    maxLength={3}
                    style={s.centerInput}
                  />

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => {
                      const cur = parseInt(radiusInput, 10) || 50;
                      setRadiusInput(String(Math.min(500, cur + 10)));
                    }}
                    style={({ pressed }) => [
                      s.stepBtn,
                      pressed && s.pressed,
                    ]}
                  >
                    <Text style={s.stepBtnText}>+ 10m</Text>
                  </Pressable>
                </View>

                <View style={s.presetRow}>
                  {[30, 50, 75, 100, 150].map((r) => {
                    const aktif = radiusInput === String(r);
                    return (
                      <Pressable
                        key={r}
                        accessibilityRole="button"
                        onPress={() => setRadiusInput(String(r))}
                        style={[s.presetChip, aktif && s.presetChipActive]}
                      >
                        <Text
                          style={[
                            s.presetChipText,
                            aktif && s.presetChipTextActive,
                          ]}
                        >
                          {r}m
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                accessibilityRole="button"
                disabled={saving}
                onPress={mintaKonfirmasiSimpan}
                style={({ pressed }) => [
                  s.saveBtn,
                  saving && { opacity: 0.6 },
                  pressed && s.pressed,
                ]}
              >
                <Text style={s.saveBtnText}>
                  {saving
                    ? tx('Menyimpan…', 'Saving…')
                    : tx('Simpan Pengaturan Ruangan', 'Save Room Settings')}
                </Text>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialogModal
        visible={confirmSaveOpen}
        tone="confirm"
        loading={saving}
        title={tx(
          `Ubah Pengaturan ${activeRoom?.nama ?? 'Lab'}?`,
          `Update ${activeRoom?.nama ?? 'Lab'} Settings?`,
        )}
        message={tx(
          `Apakah Anda yakin ingin mengubah pengaturan ${activeRoom?.nama ?? ''} menjadi radius ${radiusInput || 0} meter?`,
          `Are you sure you want to update ${activeRoom?.nama ?? ''} with an attendance radius of ${radiusInput || 0} meters?`,
        )}
        confirmLabel={tx('Ya, Simpan', 'Yes, Save')}
        onCancel={() => setConfirmSaveOpen(false)}
        onConfirm={() => void handleSave()}
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
    topBarSide: { width: 44, height: 44 },
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
      gap: 16,
    },
    sectionTitle: {
      ...tipe.cardTitle,
      color: w.textPrimary,
    },
    pillRow: {
      flexDirection: 'row',
      gap: 8,
    },
    roomPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: radius.pill,
      backgroundColor: w.surface,
      borderWidth: 1,
      borderColor: w.border,
    },
    roomPillActive: {
      backgroundColor: w.graphite,
      borderColor: w.graphite,
    },
    roomPillText: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
    },
    roomPillTextActive: {
      color: w.onGraphite,
      fontFamily: fontFamily.bold,
    },
    roomRadiusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: w.surfaceMuted,
    },
    roomRadiusBadgeActive: {
      backgroundColor: w.primary,
    },
    roomRadiusBadgeText: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: w.textSecondary,
    },
    roomRadiusBadgeTextActive: {
      color: w.onPrimary,
    },
    card: {
      backgroundColor: w.surface,
      borderColor: w.border,
      borderWidth: 1,
      borderRadius: 24,
      padding: 18,
      gap: 14,
    },
    roomHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    roomIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    cardSubtitle: {
      ...tipe.caption,
      color: w.textSecondary,
      marginTop: 2,
      lineHeight: 17,
    },
    coordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    coordText: {
      ...tipe.micro,
      color: w.textMuted,
    },
    label: {
      fontSize: 12,
      fontFamily: fontFamily.semibold,
      color: w.textSecondary,
      marginLeft: 4,
    },
    input: {
      height: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      paddingHorizontal: 14,
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: w.textPrimary,
    },
    radiusTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    valueBadge: {
      backgroundColor: w.primary,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    valueBadgeText: {
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
      paddingVertical: 11,
      borderRadius: 14,
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
      height: 46,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: w.border,
      backgroundColor: w.surfaceMuted,
      textAlign: 'center',
      fontSize: 18,
      fontFamily: fontFamily.bold,
      color: w.textPrimary,
    },
    presetRow: {
      flexDirection: 'row',
      gap: 8,
    },
    presetChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 12,
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
    saveBtn: {
      height: 54,
      borderRadius: radius.pill,
      backgroundColor: w.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    saveBtnText: {
      fontSize: 15,
      fontFamily: fontFamily.bold,
      color: w.onPrimary,
    },
    pressed: { opacity: 0.8 },
  });
