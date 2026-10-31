import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/constants/theme';
import { profileSchema, toProfileRow } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

type StateOption = { id: string; name: string };
type Errors = Partial<Record<'displayName' | 'username' | 'dateOfBirth' | 'bio' | 'stateId', string>>;

// Onboarding step 1: name, username, date of birth, optional bio and state.
// Interests, photo and city come in later steps.
export default function ProfileOnboarding() {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bio, setBio] = useState('');
  const [stateId, setStateId] = useState<string | null>(null);
  const [states, setStates] = useState<StateOption[] | null>(null);
  const [statesError, setStatesError] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  // States come from the database (seeded list), never from a hard-coded list in the app.
  useEffect(() => {
    let active = true;
    supabase
      .from('states_uts')
      .select('id, name')
      .order('name')
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) setStatesError(true);
        else setStates(data as StateOption[]);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    const parsed = profileSchema.safeParse({ displayName, username, dateOfBirth, bio, stateId });
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setSaving(false);
      Alert.alert('Please sign in again', 'Your session has ended.');
      router.replace('/welcome');
      return;
    }

    const row = toProfileRow(userData.user.id, { displayName, username, dateOfBirth, bio, stateId });
    const { error: saveError } = await supabase.from('profiles').upsert(row);
    setSaving(false);

    if (saveError) {
      // Postgres error 23505 = unique violation (username taken). Other errors show a safe general message.
      if (saveError.code === '23505') {
        setErrors({ username: 'That username is taken. Try another.' });
      } else {
        Alert.alert('Could not save your profile', 'Please check your connection and try again.');
      }
      return;
    }
    router.replace('/(onboarding)/interests');
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tell us about you</Text>
        <Text style={styles.body}>Your username is how others find you. You can change your bio later.</Text>

        <TextField
          label="Name"
          value={displayName}
          onChangeText={setDisplayName}
          autoComplete="name"
          textContentType="name"
          maxLength={60}
          error={errors.displayName}
        />
        <TextField
          label="Username"
          value={username}
          onChangeText={(t) => setUsername(t.toLowerCase())}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          error={errors.username}
        />
        <TextField
          label="Date of birth (DD/MM/YYYY)"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="number-pad"
          placeholder="DD/MM/YYYY"
          maxLength={10}
          error={errors.dateOfBirth}
        />
        <TextField
          label="Bio (optional)"
          value={bio}
          onChangeText={setBio}
          multiline
          maxLength={300}
          error={errors.bio}
        />

        <View style={styles.section}>
          <Text style={styles.label}>State or union territory (optional)</Text>
          {statesError ? (
            <Text style={styles.error}>We could not load states. You can add this later.</Text>
          ) : states === null ? (
            <Text style={styles.body}>Loading states…</Text>
          ) : (
            <View style={styles.chips}>
              {states.map((s) => {
                const selected = s.id === stateId;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={s.name}
                    onPress={() => setStateId(selected ? null : s.id)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{s.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {errors.stateId ? <Text style={styles.error}>{errors.stateId}</Text> : null}
        </View>

        <Button label="Save and continue" onPress={save} loading={saving} disabled={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, color: colors.inkMuted, lineHeight: 21 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  section: { gap: spacing.sm },
  error: { fontSize: 13, color: colors.pink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.ink, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { fontSize: 14, color: colors.ink },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
});
