// Screen edges the app keeps clear of: the status bar, notch or Dynamic Island
// on top, the gesture bar or home indicator below. The insets follow the
// current window, so they stay right when a foldable switches screens.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export { SafeAreaProvider } from 'react-native-safe-area-context';

export function useInsets(): { top: number; bottom: number } {
  const { top, bottom } = useSafeAreaInsets();
  return { top, bottom };
}
