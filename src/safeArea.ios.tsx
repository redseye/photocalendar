// Screen edges the app keeps clear of: the notch or Dynamic Island on top, the
// home indicator below. react-native-safe-area-context is linked on iOS only
// (package.json excludes it from Android autolinking).
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export { SafeAreaProvider } from 'react-native-safe-area-context';

export function useInsets(): { top: number; bottom: number } {
  const { top, bottom } = useSafeAreaInsets();
  return { top, bottom };
}
