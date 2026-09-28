import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text } from 'react-native';
import { radius, typography, useAppColors } from '@/theme/colors';

interface Props extends PressableProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'ghost';
}

export function AppButton({ label, loading, variant = 'primary', style, ...rest }: Props) {
  const colors = useAppColors();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : 'rgba(167,139,250,0.12)';

  return (
    <Pressable
      style={[styles.base, { backgroundColor: bg }, style as object]}
      disabled={loading}
      {...rest}
    >
      {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={typography(colors).button}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
