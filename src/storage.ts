// Local-only persistence. The widget task handler (headless JS) reads the
// same AsyncStorage store as the app.
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTE_PREFIX = 'note:';
const ANSWER_PREFIX = 'answer:';

// Blank text deletes the saved entry rather than storing it.
async function saveText(key: string, text: string): Promise<void> {
  if (text.trim() === '') {
    await AsyncStorage.removeItem(key);
  } else {
    await AsyncStorage.setItem(key, text);
  }
}

export async function loadNote(dateKey: string): Promise<string> {
  return (await AsyncStorage.getItem(NOTE_PREFIX + dateKey)) ?? '';
}

export async function saveNote(dateKey: string, text: string): Promise<void> {
  await saveText(NOTE_PREFIX + dateKey, text);
}

// The answer to the day's question (questions.ts), kept apart from the note.
export async function loadAnswer(dateKey: string): Promise<string> {
  return (await AsyncStorage.getItem(ANSWER_PREFIX + dateKey)) ?? '';
}

export async function saveAnswer(dateKey: string, text: string): Promise<void> {
  await saveText(ANSWER_PREFIX + dateKey, text);
}

// Returns the subset of dateKeys that have a saved note.
export async function datesWithNotes(dateKeys: string[]): Promise<Set<string>> {
  const pairs = await AsyncStorage.multiGet(dateKeys.map((k) => NOTE_PREFIX + k));
  return new Set(
    pairs.filter(([, value]) => value != null).map(([k]) => k.slice(NOTE_PREFIX.length))
  );
}
