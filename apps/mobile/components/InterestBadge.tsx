import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/constants/theme';
import type { PickedInterest } from '@/lib/interestRules';

// A read-only interest badge for profiles. It is not tappable yet: interest pages arrive with discovery.
export function InterestBadge({ interest }: { interest: PickedInterest }) {
  return (
    <View
      accessible
      accessibilityLabel={`${interest.name}, ${interest.skill}${interest.favorite ? ', favourite' : ''}`}
      style={[styles.badge, interest.favorite && styles.favorite]}
    >
      {interest.favorite ? <Text style={styles.star}>★</Text> : null}
      <Text style={[styles.name, interest.favorite && styles.favoriteText]}>{interest.name}</Text>
      <Text style={styles.skill}>{interest.skill}</Text>
    </View>
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
});
