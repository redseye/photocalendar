import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from './colors';

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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pressed: {
    backgroundColor: colors.border,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  smallLabel: {
    fontSize: 13,
  },
});
