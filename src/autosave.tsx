// Text bound to one date that saves itself: the daily note (WBS 3.5-3.7) and
// the answer to the daily question (5.4) both use this.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Keyboard, StyleSheet, Text, View } from 'react-native';
import { formatTime } from './dates';
import { TextButton } from './TextButton';
import { fontSize, palette, space } from './theme';
import { showToast } from './toast';

const SAVE_DELAY_MS = 600;

export type SaveStatus =
  | { kind: 'idle' | 'editing' | 'saving' | 'error' }
  | { kind: 'saved'; at: string };

export interface AutosaveStore {
  load: (dateKey: string) => Promise<string>;
  save: (dateKey: string, text: string) => Promise<void>;
  // Toast for a failed save whose day has already left the screen.
  failMessage: string;
  // Runs after each successful save.
  afterSave?: (dateKey: string) => void;
}

// Saves 600ms after typing stops, on blur, when the app leaves the foreground
// and when the date changes; saveNow is the 儲存 button. `store` must be a
// constant defined outside the component, so the save logic keeps one identity.
export function useAutosave(dateKey: string, store: AutosaveStore) {
  // The text is tagged with its date: until the new day's text has loaded,
  // the box is empty and locked.
  const [dayText, setDayText] = useState<{ dateKey: string; text: string } | null>(null);
  const loaded = dayText?.dateKey === dateKey;
  const text = dayText?.dateKey === dateKey ? dayText.text : '';
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });
  // The unsaved edit remembers its own date, so switching days never mixes texts up.
  const pending = useRef<{ dateKey: string; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Only the latest save of the day on screen may change the status line.
  const shownDate = useRef<string | null>(null);
  const saveSeq = useRef(0);

  // Resolves true once the edit is written, false if there was nothing to save or it failed.
  const flush = useCallback((): Promise<boolean> => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const edit = pending.current;
    if (edit == null) return Promise.resolve(false);
    pending.current = null;
    const seq = ++saveSeq.current;
    const isLatestShown = () =>
      edit.dateKey === shownDate.current && seq === saveSeq.current && pending.current == null;
    if (isLatestShown()) setStatus({ kind: 'saving' });
    return store.save(edit.dateKey, edit.text).then(
      () => {
        if (isLatestShown()) setStatus({ kind: 'saved', at: formatTime(new Date()) });
        store.afterSave?.(edit.dateKey);
        return true;
      },
      () => {
        if (edit.dateKey !== shownDate.current) {
          showToast(store.failMessage, 'long');
        } else if (isLatestShown()) {
          // Keep the text as unsaved so the 儲存 button (or the next auto-save) retries it.
          pending.current = edit;
          setStatus({ kind: 'error' });
        }
        return false;
      }
    );
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    shownDate.current = dateKey;
    void store.load(dateKey).then((saved) => {
      if (!cancelled) setDayText({ dateKey, text: saved });
    });
    return () => {
      cancelled = true;
      // This day is leaving the screen; its save result (if any) can no longer show here.
      shownDate.current = null;
      setStatus({ kind: 'idle' });
      flush();
    };
  }, [dateKey, store, flush]);

  // JS timers pause in the background, so save right away when leaving the app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const onChangeText = (newText: string) => {
    setDayText({ dateKey, text: newText });
    setStatus({ kind: 'editing' });
    pending.current = { dateKey, text: newText };
    if (timer.current != null) clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  const saveNow = () => {
    // Flush before dismissing, so the blur that follows finds nothing left to save.
    const saved = flush();
    Keyboard.dismiss();
    void saved.then((ok) => {
      if (ok) showToast('已儲存', 'short');
    });
  };
  const hasUnsaved = status.kind === 'editing' || status.kind === 'error';

  return { text, loaded, status, hasUnsaved, onChangeText, flush, saveNow };
}

interface HeaderProps {
  label: string;
  status: SaveStatus;
  onSave: () => void;
  canSave: boolean;
}

// The line above a text box: its label, the save status and the 儲存 button.
export function AutosaveHeader({ label, status, onSave, canSave }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.label}>{label}</Text>
      <SaveStatusText status={status} />
      <TextButton small label="儲存" onPress={onSave} disabled={!canSave} />
    </View>
  );
}

function SaveStatusText({ status }: { status: SaveStatus }) {
  switch (status.kind) {
    case 'idle':
      return <View style={styles.flex} />;
    case 'editing':
      return <Text style={styles.status}>編輯中…</Text>;
    case 'saving':
      return <Text style={styles.status}>儲存中…</Text>;
    case 'saved':
      return <Text style={[styles.status, styles.statusSaved]}>{`✓ 已儲存 ${status.at}`}</Text>;
    case 'error':
      return <Text style={[styles.status, styles.statusError]}>儲存失敗</Text>;
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.sm,
  },
  label: {
    fontSize: fontSize.label,
    color: palette.heading,
  },
  status: {
    flex: 1,
    fontSize: fontSize.small,
    color: palette.muted,
  },
  statusSaved: {
    color: palette.success,
  },
  statusError: {
    color: palette.danger,
    fontWeight: 'bold',
  },
});
