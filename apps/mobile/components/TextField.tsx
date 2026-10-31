import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

// Labelled text input with an inline error message. Errors are read out by screen readers.
export function TextField({ label, error, ...inputProps }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...inputProps}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.inkMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  inputError: { borderColor: colors.pink },
  error: { fontSize: 13, color: colors.pink },
});
