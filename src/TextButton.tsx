import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { fontSize, palette, radius, space } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function TextButton({ label, onPress, disabled, small, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        small && styles.small,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, small && styles.smallLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 40,
    paddingHorizontal: 14,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    minWidth: 0,
    paddingHorizontal: space.md,
    paddingVertical: 5,
  },
  pressed: {
    backgroundColor: palette.sunken,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: fontSize.body,
    color: palette.heading,
  },
  smallLabel: {
    fontSize: fontSize.caption,
  },
});
