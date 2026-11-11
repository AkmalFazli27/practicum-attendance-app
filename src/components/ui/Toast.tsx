import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, X } from 'lucide-react-native';

import { colors, radius, shadows, spacing, type } from '@/theme/tokens';

type ToastContextValue = {
  showToast: (message: string) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage('');
  }, []);

  const showToast = useCallback((nextMessage: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setMessage(nextMessage);
    timerRef.current = setTimeout(() => {
      setMessage('');
      timerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      <View style={styles.root}>
        {children}
        {Boolean(message) && (
          <View
            style={[
              styles.toastContainer,
              { top: Math.max(insets.top + spacing.s2, spacing.s4) },
            ]}
            accessibilityRole="alert"
          >
            <CheckCircle2 size={19} color={colors.primary} />
            <Text style={styles.toastText} numberOfLines={2}>
              {message}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tutup notifikasi"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={hideToast}
            >
              <X size={17} color={colors.textOnDarkMuted} />
            </Pressable>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      hideToast: () => {},
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    left: spacing.s4,
    right: spacing.s4,
    zIndex: 999,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s2 + 2,
    paddingHorizontal: spacing.s3 + 2,
    paddingVertical: spacing.s2 + 2,
    borderRadius: radius.button + 1,
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: 'rgba(196, 241, 91, 0.25)',
    ...shadows.toast,
  },
  toastText: {
    ...type.caption,
    color: colors.onGraphite,
    flex: 1,
  },
});

