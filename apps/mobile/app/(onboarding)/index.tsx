import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// Entry point for onboarding: sends the user to the profile step until it is saved,
// then shows what comes next. Interests are the next step to build.
export default function OnboardingHome() {
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setChecking(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('id').eq('id', userData.user.id).maybeSingle();
      if (active) {
        setHasProfile(!!data);
        setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (!hasProfile) return <Redirect href="/(onboarding)/profile" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile saved</Text>
      <Text style={styles.body}>Next: choose your interests. That step is still being built.</Text>
      <Button label="Back to welcome" variant="secondary" onPress={() => router.replace('/welcome')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
