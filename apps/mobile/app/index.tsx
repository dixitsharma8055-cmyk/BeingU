import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BrandLogo } from '@/components/BrandLogo';
import { colors } from '@/constants/theme';

const SPLASH_MS = 1600;

// Splash screen: shows the official logo briefly, then moves to the welcome screen.
export default function Splash() {
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/welcome'), SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <BrandLogo size={240} />
      <Text style={styles.tagline}>Your Vibe. Your Tribe.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 24 },
  tagline: { marginTop: 8, fontSize: 16, letterSpacing: 2, color: colors.ink },
});
