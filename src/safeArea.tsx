// Screen edges the app keeps clear of (iOS: safeArea.ios.tsx). Android draws
// edge-to-edge: the status bar on top, the gesture bar below.
import type { ReactNode } from 'react';
import { StatusBar } from 'react-native';

const insets = { top: StatusBar.currentHeight ?? 0, bottom: 24 };

export function SafeAreaProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useInsets(): { top: number; bottom: number } {
  return insets;
}
