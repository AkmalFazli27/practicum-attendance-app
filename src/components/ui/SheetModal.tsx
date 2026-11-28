import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
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
import { useTranslation } from 'react-i18next';
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
const SHEET_SLIDE_DISTANCE = 420;

function createSheetGestureController() {
  const backdropOpacity = new Animated.Value(0);
  const translateY = new Animated.Value(SHEET_SLIDE_DISTANCE);

  let anim: Animated.CompositeAnimation | null = null;
  let scrollOffset = 0;
  let dismissible = true;
  let isVisible = false;
  let onCloseCb: () => void = () => {};
  let onHiddenCb: () => void = () => {};

  const stopAnim = () => {
    anim?.stop();
    anim = null;
  };

  const playOpen = () => {
    stopAnim();
    scrollOffset = 0;
    anim = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();
  };

  const playClose = (triggerOnClose: boolean) => {
    stopAnim();
    anim = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SHEET_SLIDE_DISTANCE,
        duration: 170,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (!finished) return;
      if (triggerOnClose) {
        onHiddenCb();
        onCloseCb();
      } else if (!isVisible) {
        onHiddenCb();
      }
    });
  };

  const resetPosition = () => {
    stopAnim();
    anim = Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
    ]);
    anim.start();
  };

  const createPanHandlers = (minDy: number, ratioX: number, checkScroll: boolean) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        dismissible &&
        (!checkScroll || scrollOffset <= 0) &&
        gesture.dy > minDy &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx) * ratioX,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
          backdropOpacity.setValue(
            Math.max(0, 1 - gesture.dy / SHEET_SLIDE_DISTANCE),
          );
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          dismissible &&
          (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY)
        ) {
          playClose(true);
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: resetPosition,
    }).panHandlers;

  return {
    backdropOpacity,
    translateY,
    headerPanHandlers: createPanHandlers(8, 1, false),
    sheetPanHandlers: createPanHandlers(14, 1.2, true),
    syncProps(opts: {
      dismissible: boolean;
      visible: boolean;
      onClose: () => void;
      onHidden: () => void;
    }) {
      dismissible = opts.dismissible;
      isVisible = opts.visible;
      onCloseCb = opts.onClose;
      onHiddenCb = opts.onHidden;
    },
    setScrollOffset(y: number) {
      scrollOffset = y;
    },
    playOpen,
    playClose,
  };
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
  const { themeColors } = usePreferences();
  const { t } = useTranslation();

  const [rendered, setRendered] = useState(visible);
  if (visible && !rendered) {
    setRendered(true);
  }

  const [gesture] = useState(createSheetGestureController);

  useEffect(() => {
    gesture.syncProps({
      dismissible,
      visible,
      onClose,
      onHidden: () => setRendered(false),
    });
  }, [gesture, dismissible, visible, onClose]);

  useEffect(() => {
    if (!rendered) return;
    if (visible) {
      gesture.playOpen();
    } else {
      gesture.playClose(false);
    }
  }, [visible, rendered, gesture]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    gesture.setScrollOffset(e.nativeEvent.contentOffset.y);
  };

  const handleBackdropPress = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={rendered}
      onRequestClose={() => {
        if (dismissible) {
          onClose();
        }
      }}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior="padding"
        pointerEvents={visible ? 'auto' : 'none'}
        style={styles.overlay}
      >
        <Animated.View
          style={[styles.backdrop, { opacity: gesture.backdropOpacity }]}
        >
          <Pressable
            style={styles.backdropPress}
            onPress={handleBackdropPress}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
        </Animated.View>

        <Animated.View
          {...gesture.sheetPanHandlers}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: themeColors.background,
              paddingBottom: Math.max(insets.bottom, spacing.s5),
              transform: [{ translateY: gesture.translateY }],
            },
            style,
          ]}
        >
          {/* Grabber & Header (dapat ditarik ke bawah untuk menutup modal) */}
          <View {...gesture.headerPanHandlers}>
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
                  accessibilityLabel={t('common.close')}
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
  backdropPress: {
    flex: 1,
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
    width: 44,
    height: 44,
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
