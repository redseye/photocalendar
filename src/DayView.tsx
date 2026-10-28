import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AutosaveHeader, useAutosave, type AutosaveStore } from './autosave';
import { addDays, formatLong, fromKey, WEEKDAYS } from './dates';
import { iosWidgetShowsDate, updateIosWidget } from './iosWidget';
import { MenuButton } from './Menu';
import { photoFor } from './photo';
import { questionFor } from './questions';
import { useInsets } from './safeArea';
import { loadAnswer, loadEffectiveToday, loadNote, saveAnswer, saveNote } from './storage';
import { TextButton } from './TextButton';
import { fontSize, palette, radius, serif, shadow, space } from './theme';
import { updateAllWidgets } from './widget';

const NOTE: AutosaveStore = {
  load: loadNote,
  save: saveNote,
  failMessage: '筆記儲存失敗',
  afterSave: (dateKey) => {
    void loadEffectiveToday().then(async (effectiveToday) => {
      // Widgets only show today's note, so other days don't need a redraw;
      // only the iOS widget timeline also holds the coming days.
      if (dateKey === effectiveToday) await updateAllWidgets();
      else if (iosWidgetShowsDate(dateKey, effectiveToday)) await updateIosWidget();
    });
  },
};

// The widgets don't show answers, so saving one redraws nothing.
const ANSWER: AutosaveStore = {
  load: loadAnswer,
  save: saveAnswer,
  failMessage: '回答儲存失敗',
};

interface Props {
  dateKey: string;
  today: string;
  simulatedToday: string | null;
  onChangeDate: (dateKey: string) => void;
  onOpenMonth: () => void;
  onOpenMenu: () => void;
  onSetSimulatedToday: (dateKey: string | null) => void;
}

export function DayView({
  dateKey,
  today,
  simulatedToday,
  onChangeDate,
  onOpenMonth,
  onOpenMenu,
  onSetSimulatedToday,
}: Props) {
  const note = useAutosave(dateKey, NOTE);
  const answer = useAutosave(dateKey, ANSWER);
  const question = questionFor(dateKey);

  const photo = photoFor(dateKey);
  const photoSize = photo != null ? Image.resolveAssetSource(photo) : null;
  const date = fromKey(dateKey);
  const isToday = dateKey === today;
  const insets = useInsets();

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <MenuButton onPress={onOpenMenu} />
        <View style={styles.flex} />
        <TextButton small label="月曆" onPress={onOpenMonth} />
        <TextButton small label="回到今天" onPress={() => onChangeDate(today)} disabled={isToday} />
      </View>
      <View style={styles.dateCard}>
        <TextButton label="‹" onPress={() => onChangeDate(addDays(dateKey, -1))} />
        <View style={styles.titleBox}>
          <Text style={styles.year}>{date.getFullYear()}</Text>
          <Text style={styles.title}>
            {`${date.getMonth() + 1}月${date.getDate()}日 星期${WEEKDAYS[date.getDay()]}`}
          </Text>
          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayText}>{simulatedToday ? '今天（模擬）' : '今天'}</Text>
            </View>
          )}
        </View>
        <TextButton label="›" onPress={() => onChangeDate(addDays(dateKey, 1))} />
      </View>

      {/* Edge-to-edge: the keyboard is measured from the screen top, this view starts below the status bar (or notch). */}
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={insets.top}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photoCard}>
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
          </View>

          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <View style={styles.cardMark} />
              <Text style={styles.cardTitle}>每日提問</Text>
            </View>
            {question != null ? (
              <>
                <Text style={styles.question}>{question}</Text>
                <AutosaveHeader
                  label="回答（自動儲存）"
                  status={answer.status}
                  onSave={answer.saveNow}
                  canSave={answer.hasUnsaved}
                />
                <TextInput
                  style={[styles.input, styles.answerInput]}
                  multiline
                  value={answer.text}
                  editable={answer.loaded}
                  onChangeText={answer.onChangeText}
                  onBlur={answer.flush}
                  placeholder="寫下你的回答…"
                  placeholderTextColor={palette.muted}
                  textAlignVertical="top"
                />
              </>
            ) : (
              <Text style={styles.noQuestion}>這天沒有提問</Text>
            )}
          </View>

          <View style={styles.card}>
            <AutosaveHeader
              label="筆記（自動儲存）"
              status={note.status}
              onSave={note.saveNow}
              canSave={note.hasUnsaved}
            />
            <TextInput
              style={[styles.input, styles.noteInput]}
              multiline
              value={note.text}
              editable={note.loaded}
              onChangeText={note.onChangeText}
              onBlur={note.flush}
              placeholder="寫下這一天的心情…"
              placeholderTextColor={palette.muted}
              textAlignVertical="top"
            />
          </View>

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
  },
  dateCard: {
    ...shadow,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: space.lg,
    marginTop: space.md,
    marginBottom: space.xs,
    paddingHorizontal: 10,
    paddingVertical: space.md,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  year: {
    fontFamily: serif,
    fontSize: fontSize.label,
    color: palette.muted,
  },
  title: {
    marginTop: 2,
    fontFamily: serif,
    fontSize: fontSize.title,
    color: palette.heading,
    textAlign: 'center',
  },
  todayBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: palette.accentSoft,
  },
  todayText: {
    fontSize: fontSize.small,
    color: palette.accent,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 48,
  },
  photoCard: {
    ...shadow,
    padding: space.sm,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  photo: {
    width: '100%',
    // RN's Image puts the asset's own size (852x951) in front of the given style;
    // 'auto' overrides that height, so the width and aspectRatio decide the size.
    height: 'auto',
    borderRadius: radius.md,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: palette.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: fontSize.heading,
    color: palette.muted,
  },
  card: {
    ...shadow,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  cardMark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.warm,
  },
  cardTitle: {
    fontSize: fontSize.label,
    color: palette.muted,
  },
  question: {
    marginTop: 10,
    marginBottom: space.lg,
    fontFamily: serif,
    fontSize: fontSize.heading,
    lineHeight: 28,
    color: palette.heading,
  },
  noQuestion: {
    marginTop: space.sm,
    fontSize: fontSize.label,
    color: palette.muted,
  },
  input: {
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
    fontSize: fontSize.body,
    color: palette.text,
  },
  answerInput: {
    minHeight: 88,
  },
  noteInput: {
    minHeight: 120,
  },
  testBox: {
    marginTop: 32,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.border,
  },
  testTitle: {
    fontSize: fontSize.caption,
    fontWeight: 'bold',
    color: palette.muted,
  },
  testText: {
    marginTop: space.xs,
    fontSize: fontSize.small,
    color: palette.muted,
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: 10,
  },
});
