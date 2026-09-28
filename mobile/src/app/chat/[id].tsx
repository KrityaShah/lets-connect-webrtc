import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { colors, spacing, legacyTypography as typography } from '../../theme/colors';

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Chatroom</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.xl }]}>
        Messages coming in the next milestone.
      </Text>
      <AppButton label="Start video call" onPress={() => router.push(`/call/${id}`)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});