import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { radius, useAppColors } from '@/theme/colors';


export function AppInput(props: TextInputProps) {
  const colors = useAppColors();
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }, props.style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
  },
});
