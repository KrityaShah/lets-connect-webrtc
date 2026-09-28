import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { api } from '../../lib/api';
import { AppButton } from '../../components/ui/AppButton';
import { AppInput } from '../../components/ui/AppInput';
import { colors, spacing, typography, useAppColors } from '@/theme/colors';

export default function Verify() {
  const theme = useAppColors();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.verifyEmail(email, code.trim());
      router.replace('/auth/login');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={typography(theme).title}>Verify your email</Text>
      <Text style={[typography(theme).subtitle, { marginBottom: spacing.lg }]}>We sent a code to {email}</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <AppInput
        placeholder="6-digit code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        style={{ marginBottom: spacing.md, fontSize: 20, letterSpacing: 6, textAlign: 'center' }}
      />
      <AppButton label="Verify" onPress={submit} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, justifyContent: 'center' },
  error: { color: colors.danger, marginBottom: spacing.md },
});
