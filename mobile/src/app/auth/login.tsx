import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { colors, spacing, typography, useAppColors } from '@/theme/colors';

export default function Login() {
  const theme = useAppColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.brand}>LetsConnect</Text>
      <Text style={[typography(theme).title, { marginBottom: spacing.lg }]}>Log in</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <AppInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: spacing.sm }}
      />
      <AppInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginBottom: spacing.md }}
      />
      <AppButton label="Log in" onPress={submit} loading={loading} />
      <Pressable onPress={() => router.push('/auth/register')} style={{ marginTop: spacing.lg }}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  brand: { color: colors.accent, fontSize: 15, fontWeight: '600', marginBottom: spacing.xs, letterSpacing: 0.3 },
  link: { color: colors.accent, textAlign: 'center' },
  error: { color: colors.danger, marginBottom: spacing.md },
});
