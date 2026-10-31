import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

// A tappable interest "badge". Used in the library and, later, on profiles.
export function InterestChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{selected ? `✓ ${label}` : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.white,
  },
  selected: { backgroundColor: colors.purple, borderColor: colors.purple },
  pressed: { opacity: 0.8 },
  text: { fontSize: 14, color: colors.ink },
  selectedText: { color: colors.white, fontWeight: '600' },
});
