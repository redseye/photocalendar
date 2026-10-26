// Short, non-blocking message. iOS has no system toast, so ToastHost (rendered
// once in App) draws one near the top of the screen, clear of the keyboard.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { colors } from './colors';
import { useInsets } from './safeArea';

// As long as Android's Toast.LENGTH_SHORT / LENGTH_LONG.
const DURATION_MS = { short: 2000, long: 3500 };

let show: ((message: string, ms: number) => void) | null = null;

export function showToast(message: string, duration: 'short' | 'long'): void {
  show?.(message, DURATION_MS[duration]);
  AccessibilityInfo.announceForAccessibility(message);
}

export function ToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const insets = useInsets();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    show = (text, ms) => {
      if (timer != null) clearTimeout(timer);
      setMessage(text);
      timer = setTimeout(() => setMessage(null), ms);
    };
    return () => {
      show = null;
      if (timer != null) clearTimeout(timer);
    };
  }, []);

  if (message == null) return null;
  return (
    <View style={[styles.overlay, { top: insets.top + 8 }]}>
      <Text style={styles.toast}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.text,
    fontSize: 14,
    color: colors.surface,
  },
});
