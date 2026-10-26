// Local-only persistence. The widget task handler (headless JS) reads the
// same AsyncStorage store as the app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { realTodayKey } from './dates';

const NOTE_PREFIX = 'note:';
const SIMULATED_TODAY_KEY = 'simulatedToday';

export async function loadNote(dateKey: string): Promise<string> {
  return (await AsyncStorage.getItem(NOTE_PREFIX + dateKey)) ?? '';
}

export async function saveNote(dateKey: string, text: string): Promise<void> {
  if (text.trim() === '') {
    await AsyncStorage.removeItem(NOTE_PREFIX + dateKey);
  } else {
    await AsyncStorage.setItem(NOTE_PREFIX + dateKey, text);
  }
}

// Returns the subset of dateKeys that have a saved note.
export async function datesWithNotes(dateKeys: string[]): Promise<Set<string>> {
  const pairs = await AsyncStorage.multiGet(dateKeys.map((k) => NOTE_PREFIX + k));
  return new Set(
    pairs.filter(([, value]) => value != null).map(([k]) => k.slice(NOTE_PREFIX.length))
  );
}

export async function loadSimulatedToday(): Promise<string | null> {
  return AsyncStorage.getItem(SIMULATED_TODAY_KEY);
}

export async function saveSimulatedToday(dateKey: string | null): Promise<void> {
  if (dateKey == null) {
    await AsyncStorage.removeItem(SIMULATED_TODAY_KEY);
  } else {
    await AsyncStorage.setItem(SIMULATED_TODAY_KEY, dateKey);
  }
}

// "Today" as seen by the app and the widgets: the simulated date (test feature) if set.
export async function loadEffectiveToday(): Promise<string> {
  return (await loadSimulatedToday()) ?? realTodayKey();
}
