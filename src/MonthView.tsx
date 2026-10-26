import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './colors';
import { toKey, WEEKDAYS } from './dates';
import { photoFor } from './photo';
import { useInsets } from './safeArea';
import { datesWithNotes } from './storage';
import { TextButton } from './TextButton';

export interface Month {
  year: number;
  month: number; // 0-11
}

interface Props {
  month: Month;
  today: string;
  onChangeMonth: (month: Month) => void;
  onSelectDate: (dateKey: string) => void;
}

function shiftMonth({ year, month }: Month, delta: number): Month {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function MonthView({ month, today, onChangeMonth, onSelectDate }: Props) {
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
        <TextButton label="‹" onPress={() => onChangeMonth(shiftMonth(month, -1))} />
        <Text style={styles.title}>{`${year}年${m + 1}月`}</Text>
        <TextButton label="›" onPress={() => onChangeMonth(shiftMonth(month, 1))} />
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      {/* Google Calendar style: the 5-6 week rows share the remaining height, thin lines between cells. */}
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
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 6,
    fontSize: 13,
    color: colors.muted,
  },
  grid: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  week: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cell: {
    flex: 1,
    overflow: 'hidden',
  },
  cellDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dayCell: {
    backgroundColor: colors.surface,
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
    marginTop: 4,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeOnPhoto: {
    backgroundColor: 'rgba(255,253,248,0.85)',
  },
  todayBadge: {
    backgroundColor: colors.accent,
  },
  dayNumber: {
    fontSize: 12,
    color: colors.text,
  },
  todayNumber: {
    fontWeight: 'bold',
    color: colors.surface,
  },
  noteMarker: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
