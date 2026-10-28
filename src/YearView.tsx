// Year overview (WBS 7): the 12 months as tiles of coloured circles and
// half-circles; tapping one opens that month's calendar.
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { fromKey } from './dates';
import { MENU_BUTTON_SIZE, MenuButton } from './Menu';
import { MONTH_STYLES, type MonthPattern, type MonthStyle } from './monthStyles';
import type { Month } from './MonthView';
import { useInsets } from './safeArea';
import { TextButton } from './TextButton';
import { fontSize, palette, radius, serif, space } from './theme';

const COLUMNS = 3;
const PADDING = space.lg;
const GAP = space.md;

interface Props {
  year: number;
  today: string;
  onChangeYear: (year: number) => void;
  onSelectMonth: (month: Month) => void;
  onOpenMenu: () => void;
}

export function YearView({ year, today, onChangeYear, onSelectMonth, onOpenMenu }: Props) {
  const insets = useInsets();
  const { width } = useWindowDimensions();
  // 3 columns x 4 rows of square tiles.
  const tile = Math.floor((width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS);
  const now = fromKey(today);
  const currentMonth = now.getFullYear() === year ? now.getMonth() : -1;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <MenuButton onPress={onOpenMenu} />
        <TextButton label="‹" onPress={() => onChangeYear(year - 1)} />
        <View style={styles.titleBox}>
          <Text style={styles.title}>{year}</Text>
          <Text style={styles.subtitle}>年度總覽</Text>
        </View>
        <TextButton label="›" onPress={() => onChangeYear(year + 1)} />
        {/* Balances the menu button, so the title stays centred. */}
        <View style={styles.menuSpace} />
      </View>

      <ScrollView contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 16 }]}>
        {MONTH_STYLES.map((style, m) => (
          <MonthTile
            key={m}
            month={m}
            look={style}
            size={tile}
            isCurrent={m === currentMonth}
            onPress={() => onSelectMonth({ year, month: m })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface TileProps {
  month: number; // 0-11
  look: MonthStyle;
  size: number;
  isCurrent: boolean;
  onPress: () => void;
}

function MonthTile({ month, look, size, isCurrent, onPress }: TileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${month + 1}月${isCurrent ? '（本月）' : ''}`}
      style={({ pressed }) => [{ width: size }, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.art,
          { width: size, height: size, backgroundColor: look.background },
          isCurrent && styles.currentArt,
        ]}
      >
        <Pattern pattern={look.pattern} colors={look.colors} size={size} />
      </View>
      <View style={styles.label}>
        <Text style={[styles.number, isCurrent && styles.currentNumber]}>
          {String(month + 1).padStart(2, '0')}
        </Text>
        {isCurrent && (
          <View style={styles.currentBadge}>
            <Text style={styles.currentText}>本月</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// Shapes are placed in fractions of the tile's side, so they scale with the screen.
const SHAPE_OPACITY = 0.9;

// A disc of diameter d with its top-left corner at (x, y).
function disc(size: number, x: number, y: number, d: number, color: string): ViewStyle {
  const px = d * size;
  return {
    position: 'absolute',
    left: x * size,
    top: y * size,
    width: px,
    height: px,
    borderRadius: px / 2,
    backgroundColor: color,
    opacity: SHAPE_OPACITY,
  };
}

// One half of the disc that disc() draws with the same x, y and d.
function half(
  size: number,
  x: number,
  y: number,
  d: number,
  side: 'left' | 'right' | 'top' | 'bottom',
  color: string
): ViewStyle {
  const px = d * size;
  const r = px / 2;
  const left = x * size;
  const top = y * size;
  const base: ViewStyle = { position: 'absolute', backgroundColor: color, opacity: SHAPE_OPACITY };
  switch (side) {
    case 'left':
      return { ...base, left, top, width: r, height: px, borderTopLeftRadius: r, borderBottomLeftRadius: r };
    case 'right':
      return { ...base, left: left + r, top, width: r, height: px, borderTopRightRadius: r, borderBottomRightRadius: r };
    case 'top':
      return { ...base, left, top, width: px, height: r, borderTopLeftRadius: r, borderTopRightRadius: r };
    case 'bottom':
      return { ...base, left, top: top + r, width: px, height: r, borderBottomLeftRadius: r, borderBottomRightRadius: r };
  }
}

// A thin line from the top edge to the bottom edge at x.
function line(size: number, x: number, color: string): ViewStyle {
  return { position: 'absolute', left: x * size, top: 0, bottom: 0, width: 1, backgroundColor: color, opacity: 0.7 };
}

interface PatternProps {
  pattern: MonthPattern;
  colors: [string, string, string];
  size: number;
}

function Pattern({ pattern, colors: [main, second, third], size }: PatternProps) {
  switch (pattern) {
    case 'moon': // a half-disc in front of a large disc, crossed by a line
      return (
        <>
          <View style={disc(size, 0.3, 0.1, 0.8, second)} />
          <View style={half(size, 0.08, 0.3, 0.6, 'left', main)} />
          <View style={line(size, 0.52, third)} />
          <View style={disc(size, 0.485, 0.62, 0.07, third)} />
        </>
      );
    case 'split': // one disc in two colours, a small one in front
      return (
        <>
          <View style={half(size, 0.1, 0.1, 0.8, 'left', second)} />
          <View style={half(size, 0.1, 0.1, 0.8, 'right', main)} />
          <View style={disc(size, 0.62, 0.64, 0.3, third)} />
        </>
      );
    case 'rise': // a dome rising from the bottom edge, a small sun above
      return (
        <>
          <View style={line(size, 0.24, third)} />
          <View style={half(size, 0.05, 0.55, 0.9, 'top', main)} />
          <View style={disc(size, 0.58, 0.1, 0.3, second)} />
          <View style={disc(size, 0.205, 0.3, 0.07, third)} />
        </>
      );
    case 'orbit': // two overlapping discs under a bowl hanging from the top edge
      return (
        <>
          <View style={disc(size, 0.04, 0.18, 0.58, second)} />
          <View style={disc(size, 0.38, 0.3, 0.58, main)} />
          <View style={half(size, 0.52, -0.25, 0.5, 'bottom', third)} />
        </>
      );
  }
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
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontFamily: serif,
    fontSize: fontSize.display,
    color: palette.heading,
  },
  subtitle: {
    fontSize: fontSize.caption,
    color: palette.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GAP,
    rowGap: space.lg,
    paddingHorizontal: PADDING,
    paddingTop: space.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  art: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  currentArt: {
    borderWidth: 3,
    borderColor: palette.accent,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  number: {
    fontFamily: serif,
    fontSize: fontSize.body,
    color: palette.heading,
  },
  currentNumber: {
    color: palette.accent,
  },
  currentBadge: {
    paddingHorizontal: space.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: palette.accent,
  },
  currentText: {
    fontSize: fontSize.small,
    color: palette.surface,
  },
});
