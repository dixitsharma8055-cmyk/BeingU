import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants/theme';
import { fetchBlockedPeople, unblockPerson, type BlockedPerson } from '@/lib/safety';

// People you have blocked. Unblocking brings their profile back for both of you.
export default function BlockedPeopleScreen() {
  const [people, setPeople] = useState<BlockedPerson[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      setPeople(await fetchBlockedPeople());
    } catch {
      setFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function confirmUnblock(person: BlockedPerson) {
    Alert.alert(`Unblock @${person.username}?`, 'You will be able to see each other again, in Discover and on interest pages.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: async () => {
          try {
            await unblockPerson(person.user_id);
            load();
          } catch {
            Alert.alert('Could not unblock', 'Please check your connection and try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Blocked people', headerTintColor: colors.ink, headerStyle: { backgroundColor: colors.background } }} />
      {failed ? (
        <View style={styles.center}>
          <Text style={styles.body}>We could not load your list.</Text>
          <Button label="Try again" onPress={load} />
        </View>
      ) : people === null ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} />
        </View>
      ) : people.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.body}>You have not blocked anyone.</Text>
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(p) => p.user_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.names}>
                <Text style={styles.name}>{item.display_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
              </View>
              <Button label="Unblock" variant="secondary" onPress={() => confirmUnblock(item)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  body: { fontSize: 16, color: colors.inkMuted, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: colors.white },
  names: { gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  username: { fontSize: 14, color: colors.purple, fontWeight: '600' },
});
