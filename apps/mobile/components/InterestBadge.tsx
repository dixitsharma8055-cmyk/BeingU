import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import type { PickedInterest } from '@/lib/interestRules';

// An interest badge on a profile. When onPress is given it opens that interest's page.
export function InterestBadge({ interest, onPress }: { interest: PickedInterest; onPress?: () => void }) {
  const label = `${interest.name}, ${interest.skill}${interest.favorite ? ', favourite' : ''}`;
  const content = (
    <>
      {interest.favorite ? <Text style={styles.star}>★</Text> : null}
      <Text style={[styles.name, interest.favorite && styles.favoriteText]}>{interest.name}</Text>
      <Text style={styles.skill}>{interest.skill}</Text>
    </>
  );
  if (!onPress) {
    return (
      <View accessible accessibilityLabel={label} style={[styles.badge, interest.favorite && styles.favorite]}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Open ${interest.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.badge, interest.favorite && styles.favorite, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.white,
  },
  favorite: { backgroundColor: colors.purple, borderColor: colors.purple },
  star: { color: colors.white, fontSize: 12 },
  name: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  favoriteText: { color: colors.white },
  skill: { fontSize: 11, color: colors.inkMuted, textTransform: 'capitalize' },
  pressed: { opacity: 0.8 },
});
