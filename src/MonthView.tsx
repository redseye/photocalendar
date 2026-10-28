import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { toKey, WEEKDAYS } from './dates';
import { MENU_BUTTON_SIZE, MenuButton } from './Menu';
import { photoFor } from './photo';
import { useInsets } from './safeArea';
import { datesWithNotes } from './storage';
import { TextButton } from './TextButton';
import { fontSize, palette, radius, serif, shadow, space } from './theme';

export interface Month {
  year: number;
  month: number; // 0-11
}

interface Props {
  month: Month;
  today: string;
  onChangeMonth: (month: Month) => void;
  onSelectDate: (dateKey: string) => void;
  onOpenMenu: () => void;
}

function shiftMonth({ year, month }: Month, delta: number): Month {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function MonthView({ month, today, onChangeMonth, onSelectDate, onOpenMenu }: Props) {
  const { year, month: m } = month;
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const leadingBlanks = new Date(year, m, 1).getDay(); // weeks start on Sunday
  const dateKeys = Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(year, m, i + 1)));

  const [noted, setNoted] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    void datesWithNotes(dateKeys).then((set) => {
      if (!cancelled) setNoted(set);
    });
    return () => {
      cancelled = true;
    };
    // dateKeys is derived from year/month only.
  }, [year, m]);

  const cells: (string | null)[] = [...Array(leadingBlanks).fill(null), ...dateKeys];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const insets = useInsets();

  return (
    // Keeps the last row clear of the gesture bar (or home indicator).
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <MenuButton onPress={onOpenMenu} />
        <TextButton label="‹" onPress={() => onChangeMonth(shiftMonth(month, -1))} />
        <Text style={styles.title}>{`${year}年${m + 1}月`}</Text>
        <TextButton label="›" onPress={() => onChangeMonth(shiftMonth(month, 1))} />
        {/* Balances the menu button, so the title stays centred. */}
        <View style={styles.menuSpace} />
      </View>

      {/* Google Calendar style: the 5-6 week rows share the remaining height, thin lines between cells. */}
      <View style={styles.card}>
        <View style={styles.cardClip}>
          <View style={styles.row}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {weeks.map((week, w) => (
              <View key={w} style={styles.week}>
                {week.map((key, d) =>
                  key == null ? (
                    <View key={`blank-${d}`} style={[styles.cell, d > 0 && styles.cellDivider]} />
                  ) : (
                    <DayCell
                      key={key}
                      dateKey={key}
                      isToday={key === today}
                      hasNote={noted.has(key)}
                      divider={d > 0}
                      onPress={() => onSelectDate(key)}
                    />
                  )
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

interface DayCellProps {
  dateKey: string;
  isToday: boolean;
  hasNote: boolean;
  divider: boolean;
  onPress: () => void;
}

function DayCell({ dateKey, isToday, hasNote, divider, onPress }: DayCellProps) {
  const photo = photoFor(dateKey);
  return (
    <Pressable style={[styles.cell, styles.dayCell, divider && styles.cellDivider]} onPress={onPress}>
      {photo != null && (
        <Image source={photo} style={styles.cellPhoto} resizeMode="cover" resizeMethod="resize" />
      )}
      <View style={[styles.dayBadge, photo != null && styles.dayBadgeOnPhoto, isToday && styles.todayBadge]}>
        <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{Number(dateKey.slice(6, 8))}</Text>
      </View>
      {hasNote && <View style={styles.noteMarker} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  menuSpace: {
    width: MENU_BUTTON_SIZE,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: serif,
    fontSize: fontSize.title,
    color: palette.heading,
  },
  // The shadow sits on the outer view; the inner one clips the cells to the rounded corners.
  card: {
    ...shadow,
    flex: 1,
    marginHorizontal: space.md,
    marginBottom: space.md,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  cardClip: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Shows through the blank cells before the 1st and after the last day.
    backgroundColor: palette.background,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: palette.surface,
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: space.sm,
    fontSize: fontSize.caption,
    color: palette.muted,
  },
  grid: {
    flex: 1,
  },
  week: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  cell: {
    flex: 1,
    overflow: 'hidden',
  },
  cellDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  dayCell: {
    backgroundColor: palette.surface,
  },
  cellPhoto: {
    ...StyleSheet.absoluteFill,
    // RN's Image puts the asset's own size (852x951) in front of the given style;
    // an explicit size keeps it to the cell.
    width: '100%',
    height: '100%',
  },
  dayBadge: {
    alignSelf: 'center',
    marginTop: space.xs,
    minWidth: 24,
    height: 24,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeOnPhoto: {
    backgroundColor: 'rgba(251,248,242,0.88)',
  },
  todayBadge: {
    backgroundColor: palette.accent,
  },
  dayNumber: {
    fontSize: fontSize.small,
    color: palette.text,
  },
  todayNumber: {
    fontWeight: 'bold',
    color: palette.surface,
  },
  noteMarker: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.warm,
    borderWidth: 1.5,
    borderColor: palette.surface,
  },
});
