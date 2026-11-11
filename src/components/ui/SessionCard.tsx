import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Users,
} from 'lucide-react-native';

import { type Sesi, type StatusIzin } from '@/data/dummy';
import { colors, fontFamily, radius, spacing, type } from '@/theme/tokens';
import { formatHariTanggalSingkat, titikJam } from '@/utils/format';
import { StatusBadge } from './StatusBadge';

export interface SessionCardProps {
  session: Sesi;
  attendance?: number;
  attendanceTotal?: number;
  assistant?: boolean;
  attendedTime?: string;
  izinStatus?: StatusIzin;
  pendingIzinCount?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SessionCard({
  session,
  attendance = 0,
  attendanceTotal,
  assistant = false,
  attendedTime,
  izinStatus,
  pendingIzinCount = 0,
  onPress,
  style,
}: SessionCardProps) {
  const kapasitas = attendanceTotal ?? session.kapasitas ?? 32;
  const topik = session.topik ?? session.deskripsi;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${session.namaPraktikum}, status ${session.status}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
        style,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.iconTile}>
          <BookOpen size={20} color={colors.textPrimary} />
        </View>
        <StatusBadge status={session.status} />
      </View>

      <Text style={styles.sessionName} numberOfLines={1}>
        {session.namaPraktikum}
      </Text>
      <Text style={styles.sessionTopic} numberOfLines={1}>
        {topik}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <CalendarDays size={15} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {formatHariTanggalSingkat(session.tanggal)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Clock3 size={15} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {titikJam(session.jamMulai)}–{titikJam(session.jamSelesai)}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.metaItemFlex}>
          <MapPin size={15} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {session.kelas} · {session.lab}
          </Text>
        </View>

        {assistant && (
          <View style={styles.assistantBadges}>
            {pendingIzinCount > 0 && (
              <View style={styles.izinAlertBadge}>
                <FileText size={13} color={colors.izinFg} />
                <Text style={styles.izinAlertText}>{pendingIzinCount} izin</Text>
              </View>
            )}
            <View style={styles.attendanceCountWrap}>
              <Users size={15} color={colors.sesiDibukaFg} />
              <Text style={styles.attendanceCountText}>
                {attendance}/{kapasitas}
              </Text>
            </View>
          </View>
        )}

        {!assistant && attendedTime && (
          <View style={styles.studentPresentWrap}>
            <CheckCircle2 size={14} color={colors.sesiDibukaFg} />
            <Text style={styles.studentPresentText}>Hadir {attendedTime}</Text>
          </View>
        )}

        {!assistant && !attendedTime && izinStatus && (
          <View
            style={[
              styles.studentIzinWrap,
              izinStatus === 'DITERIMA'
                ? styles.izinDiterima
                : izinStatus === 'DITOLAK'
                  ? styles.izinDitolak
                  : styles.izinMenunggu,
            ]}
          >
            <FileText
              size={13}
              color={
                izinStatus === 'DITERIMA'
                  ? colors.sesiDibukaFg
                  : izinStatus === 'DITOLAK'
                    ? colors.errorFg
                    : colors.izinFg
              }
            />
            <Text
              style={[
                styles.studentIzinText,
                izinStatus === 'DITERIMA'
                  ? { color: colors.sesiDibukaFg }
                  : izinStatus === 'DITOLAK'
                    ? { color: colors.errorFg }
                    : { color: colors.izinFg },
              ]}
            >
              {izinStatus === 'DITERIMA'
                ? 'Izin Diterima'
                : izinStatus === 'DITOLAK'
                  ? 'Izin Ditolak'
                  : 'Izin Menunggu'}
            </Text>
          </View>
        )}

        <ChevronRight size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
  },
  cardPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionName: {
    ...type.cardTitle,
    color: colors.textPrimary,
    marginTop: spacing.s3 + 1,
  },
  sessionTopic: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s3 + 1,
    marginTop: spacing.s3 + 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaItemFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...type.caption,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
    marginTop: spacing.s3 + 2,
    paddingTop: spacing.s3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  assistantBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2,
  },
  izinAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.izinBg,
  },
  izinAlertText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.izinFg,
  },
  attendanceCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attendanceCountText: {
    ...type.caption,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  studentPresentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.sesiDibukaBg,
  },
  studentPresentText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.sesiDibukaFg,
  },
  studentIzinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  izinMenunggu: {
    backgroundColor: colors.izinBg,
  },
  izinDiterima: {
    backgroundColor: colors.sesiDibukaBg,
  },
  izinDitolak: {
    backgroundColor: colors.errorBg,
  },
  studentIzinText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
  },
});

