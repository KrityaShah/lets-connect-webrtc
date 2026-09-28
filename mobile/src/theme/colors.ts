import { useColorScheme } from 'react-native';

const palettes = {
  light: { background: '#FFFFFF', surface: '#FFFFFF', surfaceElevated: '#F5F3FF', primary: '#7C3AED', primaryMuted: '#EDE9FE', accent: '#7C3AED', text: '#000000', textOnPrimary: '#FFFFFF', textMuted: '#5B5566', danger: '#DC2626', border: '#D8B4FE' },
  dark: { background: '#000000', surface: '#000000', surfaceElevated: '#1D1B20', primary: '#7C3AED', primaryMuted: '#4C1D95', accent: '#A78BFA', text: '#FFFFFF', textOnPrimary: '#FFFFFF', textMuted: '#C4B5D4', danger: '#F87171', border: '#7C3AED' },
} as const;

export type AppColors = (typeof palettes)[keyof typeof palettes];

export function useAppColors(): AppColors {
  return palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

// Compatibility for screens still using the legacy static palette.
export const colors = palettes.dark;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };

export const legacyTypography = {
  title: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted },
  body: { fontSize: 15, color: colors.text },
  button: { fontSize: 16, fontWeight: "600" as const, color: colors.textOnPrimary },
  label: { fontSize: 13, fontWeight: "500" as const, color: colors.textMuted },
};

export function typography(colors: AppColors) {
  return {
    title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
    subtitle: { fontSize: 15, color: colors.textMuted },
    body: { fontSize: 15, color: colors.text },
    button: { fontSize: 16, fontWeight: '600' as const, color: colors.textOnPrimary },
    label: { fontSize: 13, fontWeight: '500' as const, color: colors.textMuted },
  };
}
