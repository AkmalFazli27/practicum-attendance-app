import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Search } from 'lucide-react-native';

import { colors, radius, spacing, type } from '@/theme/tokens';
import { Tombol } from './Tombol';

export interface EmptyStateAksiConfig {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  judul: string;
  pesan: string;
  aksi?: React.ReactNode | EmptyStateAksiConfig;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  judul,
  pesan,
  aksi,
  icon,
  style,
}: EmptyStateProps) {
  const renderAksi = () => {
    if (!aksi) return null;

    if (React.isValidElement(aksi)) {
      return <View style={styles.aksiContainer}>{aksi}</View>;
    }

    if (typeof aksi === 'object' && 'label' in aksi && 'onPress' in aksi) {
      return (
        <View style={styles.aksiContainer}>
          <Tombol variant="sekunder" onPress={aksi.onPress}>
            {aksi.label}
          </Tombol>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.contentWrapper}>
        <View style={styles.iconContainer}>
          {icon ? (
            icon
          ) : (
            <View style={styles.defaultIconTile}>
              <Search size={22} color={colors.textMuted} />
            </View>
          )}
        </View>
        <Text style={styles.judul}>{judul}</Text>
        <Text style={styles.pesan}>{pesan}</Text>
        {renderAksi()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.s8,
    paddingHorizontal: spacing.s5,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: radius.cardLg,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  contentWrapper: {
    maxWidth: 270,
    alignItems: 'center',
    gap: spacing.s1 + 2,
  },
  iconContainer: {
    marginBottom: spacing.s2,
  },
  defaultIconTile: {
    width: 50,
    height: 50,
    borderRadius: radius.card,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  judul: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pesan: {
    ...type.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  aksiContainer: {
    marginTop: spacing.s3,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
