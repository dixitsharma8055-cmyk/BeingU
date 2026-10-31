import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Stage = 'loading' | 'needs-profile' | 'needs-interests' | 'done';

// Onboarding entry point. It works out where the user is and offers the next step.
// It never forces the interests step, so "Finish later" really means later.
export default function OnboardingHome() {
  const [stage, setStage] = useState<Stage>('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (active) setStage('done');
        return;
      }
      const uid = userData.user.id;
      const [profile, interests] = await Promise.all([
        supabase.from('profiles').select('id').eq('id', uid).maybeSingle(),
        supabase.from('user_interests').select('interest_id', { count: 'exact', head: true }).eq('user_id', uid),
      ]);
      if (!active) return;
      if (!profile.data) setStage('needs-profile');
      else if ((interests.count ?? 0) === 0) setStage('needs-interests');
      else setStage('done');
    })();
    return () => {
      active = false;
    };
  }, []);

  if (stage === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.purple} />
      </View>
    );
  }
  if (stage === 'needs-profile') return <Redirect href="/(onboarding)/profile" />;

  if (stage === 'needs-interests') {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Almost there</Text>
        <Text style={styles.body}>Choose a few interests so we can find people and communities for you.</Text>
        <Button label="Choose interests" onPress={() => router.push('/(onboarding)/interests')} />
        <Button label="Later" variant="secondary" onPress={() => router.replace('/welcome')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>You're all set</Text>
      <Text style={styles.body}>Your feed and communities are the next things to build.</Text>
      <Button label="Back to welcome" variant="secondary" onPress={() => router.replace('/welcome')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center', gap: spacing.md },
  heading: { fontSize: 26, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.inkMuted, lineHeight: 22 },
});
