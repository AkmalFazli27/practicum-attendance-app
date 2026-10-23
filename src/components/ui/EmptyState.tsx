import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

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
              <View style={styles.defaultIconInner} />
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
  },
  contentWrapper: {
    maxWidth: 280,
    alignItems: 'center',
    gap: spacing.s2,
  },
  iconContainer: {
    marginBottom: spacing.s2,
  },
  defaultIconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIconInner: {
    width: 20,
    height: 14,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.graphite,
  },
  judul: {
    ...type.bodyStrong,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  pesan: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  aksiContainer: {
    marginTop: spacing.s3,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
});
