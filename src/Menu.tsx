// The top-left menu (WBS 6): a button on every page and the panel it opens.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useInsets } from './safeArea';
import { fontSize, palette, radius, serif, shadow, space } from './theme';

export type Page = 'day' | 'month' | 'year' | 'resources';

const ITEMS: { page: Page; label: string }[] = [
  { page: 'day', label: '今日' },
  { page: 'month', label: '月曆' },
  { page: 'year', label: '年度總覽' },
  { page: 'resources', label: '相關資源' },
];

// Same size as the button, for pages that balance their title with it.
export const MENU_BUTTON_SIZE = 40;

export function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="選單"
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.bar} />
      <View style={styles.bar} />
      <View style={styles.bar} />
    </Pressable>
  );
}

interface PanelProps {
  current: Page;
  onSelect: (page: Page) => void;
  onClose: () => void;
}

// Drawn over the page, under the menu button; a tap outside the panel closes it.
export function MenuPanel({ current, onSelect, onClose }: PanelProps) {
  const insets = useInsets();
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        onPress={onClose}
        accessibilityLabel="關閉選單"
      />
      <View style={[styles.panel, { top: insets.top + 8 + MENU_BUTTON_SIZE + 6 }]}>
        {ITEMS.map(({ page, label }) => (
          <Pressable
            key={page}
            onPress={() => onSelect(page)}
            accessibilityRole="menuitem"
            accessibilityState={{ selected: page === current }}
            style={({ pressed }) => [
              styles.item,
              page === current && styles.currentItem,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.dot, page === current && styles.currentDot]} />
            <Text style={[styles.label, page === current && styles.currentLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MENU_BUTTON_SIZE,
    height: MENU_BUTTON_SIZE,
    borderRadius: MENU_BUTTON_SIZE / 2,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  pressed: {
    backgroundColor: palette.sunken,
  },
  bar: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: palette.heading,
  },
  backdrop: {
    backgroundColor: 'rgba(44, 52, 66, 0.18)',
  },
  panel: {
    ...shadow,
    position: 'absolute',
    left: space.md,
    minWidth: 200,
    padding: space.sm,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: 14,
    paddingVertical: space.md,
    borderRadius: radius.md,
  },
  currentItem: {
    backgroundColor: palette.accentSoft,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  currentDot: {
    backgroundColor: palette.accent,
  },
  label: {
    fontFamily: serif,
    fontSize: fontSize.body,
    color: palette.heading,
  },
  currentLabel: {
    color: palette.accent,
  },
});
