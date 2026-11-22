import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { usePreferences } from '@/context/PreferencesContext';
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

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.65;

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
  const { themeColors, language } = usePreferences();
  const isEn = language === 'en';

  const translateY = useRef(new Animated.Value(0)).current;
  const scrollOffsetRef = useRef(0);
  const dismissibleRef = useRef(dismissible);
  const onCloseRef = useRef(onClose);

  dismissibleRef.current = dismissible;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      scrollOffsetRef.current = 0;
    }
  }, [visible, translateY]);

  const tutupDenganAnimasi = () => {
    Animated.timing(translateY, {
      toValue: 420,
      duration: 170,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(0);
      onCloseRef.current();
    });
  };

  const kembalikanPosisi = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  // Gestur geser ke bawah pada area grabber & header
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        dismissibleRef.current &&
        gesture.dy > 8 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          dismissibleRef.current &&
          (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY)
        ) {
          tutupDenganAnimasi();
        } else {
          kembalikanPosisi();
        }
      },
      onPanResponderTerminate: () => {
        kembalikanPosisi();
      },
    }),
  ).current;

  // Gestur geser ke bawah pada body sheet saat posisi scroll berada di paling atas
  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        dismissibleRef.current &&
        scrollOffsetRef.current <= 0 &&
        gesture.dy > 14 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          dismissibleRef.current &&
          (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY)
        ) {
          tutupDenganAnimasi();
        } else {
          kembalikanPosisi();
        }
      },
      onPanResponderTerminate: () => {
        kembalikanPosisi();
      },
    }),
  ).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
  };

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
      <KeyboardAvoidingView behavior="padding" style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={handleBackdropPress}
          accessibilityRole="button"
          accessibilityLabel={isEn ? 'Close dialog' : 'Tutup dialog'}
        />

        <Animated.View
          {...sheetPanResponder.panHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: themeColors.background,
              paddingBottom: Math.max(insets.bottom, spacing.s5),
              transform: [{ translateY }],
            },
            style,
          ]}
        >
          {/* Grabber & Header (dapat ditarik ke bawah untuk menutup modal) */}
          <View {...headerPanResponder.panHandlers}>
            <View style={styles.grabberContainer}>
              <View
                style={[
                  styles.grabber,
                  { backgroundColor: themeColors.borderDashed },
                ]}
              />
            </View>

            {!hideHeader && (
              <View style={styles.header}>
                <View style={styles.headerTextWrap}>
                  {kicker && (
                    <Text
                      style={[styles.kicker, { color: themeColors.textMuted }]}
                    >
                      {kicker}
                    </Text>
                  )}
                  <Text
                    style={[styles.judul, { color: themeColors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {judul}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? 'Close' : 'Tutup'}
                  disabled={!dismissible}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    {
                      borderColor: themeColors.border,
                      backgroundColor:
                        pressed && dismissible
                          ? themeColors.surfaceMuted
                          : themeColors.surface,
                    },
                    !dismissible && styles.closeButtonDisabled,
                  ]}
                >
                  <X
                    size={20}
                    color={
                      dismissible
                        ? themeColors.textPrimary
                        : themeColors.disabledText
                    }
                  />
                </Pressable>
              </View>
            )}
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {children}
          </ScrollView>

          {/* Optional Footer */}
          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
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
