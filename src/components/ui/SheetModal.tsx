import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, type } from '@/theme/tokens';

export interface SheetModalProps {
  visible: boolean;
  judul: string;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SheetModal({
  visible,
  judul,
  onClose,
  children,
  dismissible = true,
  footer,
  style,
}: SheetModalProps) {
  const insets = useSafeAreaInsets();

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={() => {
        if (dismissible) {
          onClose();
        }
      }}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog"
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.s4) },
            style,
          ]}
        >
          {/* Grabber bar */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.judul} numberOfLines={1}>
              {judul}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup"
              disabled={!dismissible}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && dismissible && styles.closeButtonPressed,
                !dismissible && styles.closeButtonDisabled,
              ]}
            >
              <Text
                style={[
                  styles.closeIcon,
                  !dismissible && styles.closeIconDisabled,
                ]}
              >
                ✕
              </Text>
            </Pressable>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(23, 26, 26, 0.5)',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: spacing.s2,
    paddingBottom: spacing.s1,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceMuted,
  },
  judul: {
    ...type.h2,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.s2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  closeButtonPressed: {
    opacity: 0.7,
  },
  closeButtonDisabled: {
    opacity: 0.4,
  },
  closeIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  closeIconDisabled: {
    color: colors.disabledText,
  },
  body: {
    paddingHorizontal: spacing.s5,
  },
  bodyContent: {
    paddingVertical: spacing.s4,
    gap: spacing.s3,
  },
  footer: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
});
