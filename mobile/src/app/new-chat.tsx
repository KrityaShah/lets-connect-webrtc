import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { colors, spacing, typography, useAppColors } from '@/theme/colors';

export default function NewChat() {
  const theme = useAppColors();
  const { accessToken, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startChat = async () => {
    if (!accessToken) return;
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.lookupUser(email.trim(), accessToken);
      if (!user) {
        setError('No account found with that email');
        return;
      }
      const { chatroom } = await api.createDm(user.id, accessToken);
      router.replace(`/chat/${chatroom.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await logout();
        return;
      }
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[typography(theme).title, { marginBottom: spacing.lg }]}>New chat</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <AppInput
        placeholder="Their email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: spacing.md }}
      />
      <AppButton label="Start chat" onPress={startChat} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  error: { color: colors.danger, marginBottom: spacing.md },
});
