import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from './colors';
import { addDays, formatLong, formatTime } from './dates';
import { iosWidgetShowsDate, updateIosWidget } from './iosWidget';
import { photoFor } from './photo';
import { useInsets } from './safeArea';
import { loadEffectiveToday, loadNote, saveNote } from './storage';
import { TextButton } from './TextButton';
import { showToast } from './toast';
import { updateAllWidgets } from './widget';

const SAVE_DELAY_MS = 600;

type SaveStatus =
  | { kind: 'idle' | 'editing' | 'saving' | 'error' }
  | { kind: 'saved'; at: string };

interface Props {
  dateKey: string;
  today: string;
  simulatedToday: string | null;
  onChangeDate: (dateKey: string) => void;
  onOpenMonth: () => void;
  onSetSimulatedToday: (dateKey: string | null) => void;
}

export function DayView({
  dateKey,
  today,
  simulatedToday,
  onChangeDate,
  onOpenMonth,
  onSetSimulatedToday,
}: Props) {
  // The note text is tagged with its date: until the new day's note has loaded,
  // the box is empty and locked.
  const [dayNote, setDayNote] = useState<{ dateKey: string; text: string } | null>(null);
  const loaded = dayNote?.dateKey === dateKey;
  const note = dayNote?.dateKey === dateKey ? dayNote.text : '';
  const [status, setStatus] = useState<SaveStatus>({ kind: 'idle' });
  // The unsaved edit remembers its own date, so switching days never mixes notes up.
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
    return saveNote(edit.dateKey, edit.text).then(
      () => {
        if (isLatestShown()) setStatus({ kind: 'saved', at: formatTime(new Date()) });
        void loadEffectiveToday().then(async (effectiveToday) => {
          // Widgets only show today's note, so other days don't need a redraw;
          // only the iOS widget timeline also holds the coming days.
          if (edit.dateKey === effectiveToday) await updateAllWidgets();
          else if (iosWidgetShowsDate(edit.dateKey, effectiveToday)) await updateIosWidget();
        });
        return true;
      },
      () => {
        if (edit.dateKey !== shownDate.current) {
          showToast('筆記儲存失敗', 'long');
        } else if (isLatestShown()) {
          // Keep the text as unsaved so the 儲存 button (or the next auto-save) retries it.
          pending.current = edit;
          setStatus({ kind: 'error' });
        }
        return false;
      }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    shownDate.current = dateKey;
    void loadNote(dateKey).then((text) => {
      if (!cancelled) setDayNote({ dateKey, text });
    });
    return () => {
      cancelled = true;
      // This day is leaving the screen; its save result (if any) can no longer show here.
      shownDate.current = null;
      setStatus({ kind: 'idle' });
      flush();
    };
  }, [dateKey, flush]);

  // JS timers pause in the background, so save right away when leaving the app.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') flush();
    });
    return () => sub.remove();
  }, [flush]);

  const onChangeNote = (text: string) => {
    setDayNote({ dateKey, text });
    setStatus({ kind: 'editing' });
    pending.current = { dateKey, text };
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

  const photo = photoFor(dateKey);
  const photoSize = photo != null ? Image.resolveAssetSource(photo) : null;
  const isToday = dateKey === today;
  const insets = useInsets();

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TextButton label="‹" onPress={() => onChangeDate(addDays(dateKey, -1))} />
        <View style={styles.titleBox}>
          <Text style={styles.title}>{formatLong(dateKey)}</Text>
          {isToday && (
            <Text style={styles.todayBadge}>{simulatedToday ? '今天（模擬）' : '今天'}</Text>
          )}
        </View>
        <TextButton label="›" onPress={() => onChangeDate(addDays(dateKey, 1))} />
      </View>
      <View style={styles.toolbar}>
        <TextButton small label="月曆" onPress={onOpenMonth} />
        <TextButton small label="回到今天" onPress={() => onChangeDate(today)} disabled={isToday} />
      </View>

      {/* Edge-to-edge: the keyboard is measured from the screen top, this view starts below the status bar (or notch). */}
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={insets.top}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {photo != null ? (
            <Image
              source={photo}
              resizeMode="contain"
              style={[
                styles.photo,
                { aspectRatio: (photoSize?.width ?? 1) / (photoSize?.height ?? 1) },
              ]}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>這天沒有圖片</Text>
            </View>
          )}

          <View style={styles.noteHeader}>
            <Text style={styles.noteLabel}>筆記（自動儲存）</Text>
            <SaveStatusText status={status} />
            <TextButton small label="儲存" onPress={saveNow} disabled={!hasUnsaved} />
          </View>
          <TextInput
            style={styles.noteInput}
            multiline
            value={note}
            editable={loaded}
            onChangeText={onChangeNote}
            onBlur={flush}
            placeholder="寫下這一天的心情…"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />

          <View style={styles.testBox}>
            <Text style={styles.testTitle}>測試功能：模擬「今天」</Text>
            <Text style={styles.testText}>
              {simulatedToday
                ? `目前模擬的今天：${formatLong(simulatedToday)}`
                : '未設定，使用手機的實際日期。'}
            </Text>
            <Text style={styles.testText}>App 與桌面小工具都會使用這個日期當作今天。</Text>
            <View style={styles.testButtons}>
              <TextButton
                small
                label="設為目前檢視的日期"
                onPress={() => onSetSimulatedToday(dateKey)}
                disabled={simulatedToday === dateKey}
              />
              <TextButton
                small
                label="清除模擬"
                onPress={() => onSetSimulatedToday(null)}
                disabled={simulatedToday == null}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  todayBadge: {
    marginTop: 2,
    fontSize: 13,
    color: colors.accent,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  photo: {
    width: '100%',
    // RN's Image puts the asset's own size (852x951) in front of the given style;
    // 'auto' overrides that height, so the width and aspectRatio decide the size.
    height: 'auto',
    borderRadius: 12,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.placeholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: colors.muted,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 6,
  },
  noteLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  status: {
    flex: 1,
    fontSize: 13,
    color: colors.muted,
  },
  statusSaved: {
    color: colors.success,
  },
  statusError: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  noteInput: {
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.text,
  },
  testBox: {
    marginTop: 32,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  testTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.muted,
  },
  testText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
});
