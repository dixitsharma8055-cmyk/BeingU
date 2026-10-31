import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { InterestChip } from '@/components/InterestChip';
import { colors, radius, spacing } from '@/constants/theme';
import {
  MAX_INTERESTS,
  MIN_INTERESTS,
  SKILL_LEVELS,
  canContinue,
  matchesQuery,
  remainingToMinimum,
  validateCustomName,
  type PickedInterest,
  type SkillLevel,
} from '@/lib/interestRules';
import {
  addCustomInterest,
  fetchLibrary,
  fetchMyInterests,
  saveMyInterests,
  type Category,
  type LibraryInterest,
} from '@/lib/interests';
import { supabase } from '@/lib/supabase';

const ALL = 'all';

// Onboarding step 2: choose interests from the library, set skill levels, mark favourites and things to learn.
// Limits: at least 3, at most 20 during onboarding, so people are not overwhelmed. More can be added later.
export default function InterestsOnboarding() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === 'edit';
  const leave = () => (editing ? router.back() : router.replace('/(onboarding)'));
  const [userId, setUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [library, setLibrary] = useState<LibraryInterest[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [picks, setPicks] = useState<PickedInterest[]>([]);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [addingCustom, setAddingCustom] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error('not signed in');
        const [lib, mine] = await Promise.all([fetchLibrary(), fetchMyInterests(userData.user.id)]);
        if (!active) return;
        setUserId(userData.user.id);
        setCategories(lib.categories);
        setLibrary(lib.interests);
        setPicks(mine);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const pickedIds = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);
  const otherCategory = categories.find((c) => c.slug === 'other');

  const visible = useMemo(
    () =>
      library.filter(
        (i) =>
          (categoryFilter === ALL || i.category_id === categoryFilter) && matchesQuery(i.name_en, query),
      ),
    [library, categoryFilter, query],
  );

  function toggle(item: { id: string; name_en: string }) {
    if (pickedIds.has(item.id)) {
      setPicks((prev) => prev.filter((p) => p.id !== item.id));
      return;
    }
    if (picks.length >= MAX_INTERESTS) {
      Alert.alert(`You can choose up to ${MAX_INTERESTS}`, 'You can add more later from your profile.');
      return;
    }
    setPicks((prev) => [...prev, { id: item.id, name: item.name_en, skill: 'beginner', favorite: false, wantsToLearn: false }]);
  }

  function update(id: string, patch: Partial<PickedInterest>) {
    setPicks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  async function addCustom() {
    const checked = validateCustomName(customName);
    if (!checked.ok) {
      setCustomError(checked.error);
      return;
    }
    if (!userId || !otherCategory) {
      setCustomError('Custom interests are not available right now.');
      return;
    }
    if (picks.length >= MAX_INTERESTS) {
      setCustomError(`You can choose up to ${MAX_INTERESTS}`);
      return;
    }
    setCustomError(null);
    setAddingCustom(true);
    try {
      const created = await addCustomInterest(userId, otherCategory.id, checked.name);
      setLibrary((prev) => [...prev, created]);
      setPicks((prev) => [...prev, { id: created.id, name: created.name_en, skill: 'beginner', favorite: false, wantsToLearn: false }]);
      setCustomName('');
    } catch {
      setCustomError('Could not add that interest. Please try again.');
    } finally {
      setAddingCustom(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await saveMyInterests(picks);
      leave();
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      // Messages from the database are written to be shown to users (see migration 0003).
      Alert.alert('Could not save your interests', message.includes('between') || message.includes('not available') || message.includes('once') ? message : 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (loadError) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>We could not load interests</Text>
        <Text style={styles.body}>Check your connection and try again. You can also finish this later.</Text>
        <Button label="Finish later" variant="secondary" onPress={() => router.replace('/(onboarding)')} />
      </View>
    );
  }

  const remaining = remainingToMinimum(picks.length);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>{editing ? 'Edit your interests' : 'What are you into?'}</Text>
        <Text style={styles.body}>
          Choose {MIN_INTERESTS} to {MAX_INTERESTS}. These help us find your people and your communities.
        </Text>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {picks.length} of {MAX_INTERESTS} chosen
          </Text>
          {remaining > 0 ? <Text style={styles.hint}>Choose {remaining} more to continue</Text> : null}
        </View>

        {picks.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your picks</Text>
            {picks.map((p) => (
              <View key={p.id} style={styles.pickRow}>
                <View style={styles.pickHeader}>
                  <Text style={styles.pickName}>{p.name}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${p.name}`} onPress={() => toggle({ id: p.id, name_en: p.name })}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
                <View style={styles.skillRow}>
                  {SKILL_LEVELS.map((level: SkillLevel) => {
                    const selected = p.skill === level;
                    return (
                      <Pressable
                        key={level}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${p.name} skill: ${level}`}
                        onPress={() => update(p.id, { skill: level })}
                        style={[styles.smallChip, selected && styles.smallChipSelected]}
                      >
                        <Text style={[styles.smallChipText, selected && styles.smallChipTextSelected]}>{level}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.toggleRow}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: p.favorite }}
                    accessibilityLabel={`Favourite ${p.name}`}
                    onPress={() => update(p.id, { favorite: !p.favorite })}
                  >
                    <Text style={[styles.toggle, p.favorite && styles.toggleOn]}>{p.favorite ? '★ Favourite' : '☆ Favourite'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: p.wantsToLearn }}
                    accessibilityLabel={`Want to learn ${p.name}`}
                    onPress={() => update(p.id, { wantsToLearn: !p.wantsToLearn })}
                  >
                    <Text style={[styles.toggle, p.wantsToLearn && styles.toggleOn]}>
                      {p.wantsToLearn ? '✓ Want to learn' : 'Want to learn'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <TextInput
          accessibilityLabel="Search interests"
          placeholder="Search interests"
          placeholderTextColor={colors.inkMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          autoCorrect={false}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {[{ id: ALL, name_en: 'All' }, ...categories.map((c) => ({ id: c.id, name_en: c.name_en }))].map((c) => {
            const selected = categoryFilter === c.id;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Category ${c.name_en}`}
                onPress={() => setCategoryFilter(c.id)}
                style={[styles.smallChip, selected && styles.smallChipSelected]}
              >
                <Text style={[styles.smallChipText, selected && styles.smallChipTextSelected]}>{c.name_en}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {visible.length === 0 ? (
            <Text style={styles.body}>No interests match "{query.trim()}". Try another word, or add it below.</Text>
          ) : (
            visible.map((i) => (
              <InterestChip key={i.id} label={i.name_en} selected={pickedIds.has(i.id)} onPress={() => toggle(i)} />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Not in the list?</Text>
          <View style={styles.customRow}>
            <TextInput
              accessibilityLabel="Custom interest name"
              placeholder="Add your own interest"
              placeholderTextColor={colors.inkMuted}
              value={customName}
              onChangeText={(t) => {
                setCustomName(t);
                if (customError) setCustomError(null);
              }}
              maxLength={40}
              style={[styles.search, styles.customInput]}
              autoCorrect={false}
            />
            <Button label="Add" variant="secondary" onPress={addCustom} loading={addingCustom} disabled={!customName.trim()} />
          </View>
          {customError ? <Text style={styles.error}>{customError}</Text> : null}
          <Text style={styles.hint}>Your own interests are visible only to you until they are reviewed.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Save and continue" onPress={save} disabled={!canContinue(picks.length) || saving} loading={saving} />
        <Pressable accessibilityRole="button" accessibilityLabel={editing ? 'Cancel' : 'Finish later'} onPress={leave}>
          <Text style={styles.skip}>{editing ? 'Cancel' : 'Finish later'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  counter: { gap: 2 },
  counterText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 13, color: colors.inkMuted },
  error: { fontSize: 13, color: colors.pink },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  pickRow: { borderWidth: 1, borderColor: colors.inkMuted, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, backgroundColor: colors.white },
  pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickName: { fontSize: 16, fontWeight: '600', color: colors.ink },
  remove: { fontSize: 13, color: colors.pink, fontWeight: '600' },
  skillRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  toggleRow: { flexDirection: 'row', gap: spacing.lg },
  toggle: { fontSize: 14, color: colors.inkMuted },
  toggleOn: { color: colors.purple, fontWeight: '700' },
  search: { borderWidth: 1, borderColor: colors.inkMuted, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.white },
  categoryRow: { gap: spacing.sm, paddingVertical: 2 },
  smallChip: { borderWidth: 1, borderColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.white },
  smallChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  smallChipText: { fontSize: 13, color: colors.ink },
  smallChipTextSelected: { color: colors.white, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  customRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  customInput: { flex: 1 },
  footer: { padding: spacing.lg, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.white, backgroundColor: colors.background },
  skip: { textAlign: 'center', color: colors.inkMuted, fontSize: 15, paddingVertical: 6 },
});
