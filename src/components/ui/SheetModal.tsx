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
import { X } from 'lucide-react-native';

import { colors, radius, shadows, spacing, type } from '@/theme/tokens';

export interface SheetModalProps {
  visible: boolean;
  judul?: string;
  kicker?: string;
  hideHeader?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SheetModal({
  visible,
  judul = '',
  kicker,
  hideHeader = false,
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
            { paddingBottom: Math.max(insets.bottom, spacing.s5) },
            style,
          ]}
        >
          {/* Grabber bar */}
          <View style={styles.grabberContainer}>
            <View style={styles.grabber} />
          </View>

          {/* Header */}
          {!hideHeader && (
            <View style={styles.header}>
              <View style={styles.headerTextWrap}>
                {kicker && <Text style={styles.kicker}>{kicker}</Text>}
                <Text style={styles.judul} numberOfLines={2}>
                  {judul}
                </Text>
              </View>
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
                <X
                  size={20}
                  color={dismissible ? colors.textPrimary : colors.disabledText}
                />
              </Pressable>
            </View>
          )}

          {/* Body Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
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
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(12, 14, 13, 0.62)',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    maxHeight: '89%',
    ...shadows.sheet,
  },
  grabberContainer: {
    alignItems: 'center',
    paddingTop: spacing.s3,
    paddingBottom: spacing.s2,
  },
  grabber: {
    width: 42,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderDashed,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s1,
    paddingBottom: spacing.s3,
    gap: spacing.s3,
  },
  headerTextWrap: {
    flex: 1,
    gap: 4,
  },
  kicker: {
    ...type.micro,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  judul: {
    ...type.h2,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  closeButtonPressed: {
    backgroundColor: colors.surfaceMuted,
  },
  closeButtonDisabled: {
    opacity: 0.45,
  },
  body: {
    paddingHorizontal: spacing.s5,
  },
  bodyContent: {
    paddingVertical: spacing.s2,
    gap: spacing.s3,
  },
  footer: {
    paddingHorizontal: spacing.s5,
    paddingTop: spacing.s3,
  },
});
