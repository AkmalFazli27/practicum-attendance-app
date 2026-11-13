import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
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
  const { height: windowHeight } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const mountedRef = useRef(visible);
  const closingRef = useRef(false);

  const windowHeightRef = useRef(windowHeight);
  windowHeightRef.current = windowHeight;

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(windowHeight)).current;

  const animateOut = useCallback(
    (onFinished?: () => void) => {
      fade.stopAnimation();
      slide.stopAnimation();

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: windowHeightRef.current,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          onFinished?.();
        }
      });
    },
    [fade, slide],
  );

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      mountedRef.current = true;
      setMounted(true);

      fade.stopAnimation();
      slide.stopAnimation();
      fade.setValue(0);
      slide.setValue(windowHeightRef.current);

      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          mass: 0.9,
          overshootClamping: true,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mountedRef.current) {
      return;
    }

    animateOut(() => {
      mountedRef.current = false;
      setMounted(false);
    });
  }, [visible, animateOut, fade, slide]);

  useEffect(
    () => () => {
      fade.stopAnimation();
      slide.stopAnimation();
    },
    [fade, slide],
  );

  const requestClose = () => {
    if (!dismissible || closingRef.current || !mountedRef.current) {
      return;
    }

    closingRef.current = true;
    animateOut(() => {
      mountedRef.current = false;
      setMounted(false);
      closingRef.current = false;
      onCloseRef.current();
    });
  };

  return (
    <Modal
      animationType="none"
      transparent
      visible={mounted}
      onRequestClose={requestClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: fade }]}
        >
          {Platform.OS !== 'android' && (
            <BlurView
              intensity={30}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={[StyleSheet.absoluteFill, styles.backdropTint]} />
        </Animated.View>

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup dialog"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetArea}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, spacing.s5) },
              style,
              { transform: [{ translateY: slide }] },
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
                  onPress={requestClose}
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
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropTint: {
    backgroundColor: colors.graphite,
    opacity: Platform.OS === 'android' ? 0.62 : 0.45,
  },
  sheetArea: {
    flex: 1,
    justifyContent: 'flex-end',
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
