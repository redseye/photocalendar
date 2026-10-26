// Short, non-blocking message: the system toast on Android (iOS: toast.ios.tsx).
import { ToastAndroid } from 'react-native';

export function showToast(message: string, duration: 'short' | 'long'): void {
  ToastAndroid.show(message, duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT);
}

// The system toast needs nothing in the app's own view tree.
export function ToastHost() {
  return null;
}
