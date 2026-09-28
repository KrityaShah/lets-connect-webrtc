import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  router,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider, useAuth } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { accessToken, isLoading } = useAuth();
  const segments = useSegments();
  console.log(
    "ROOT NAVIGATOR RENDER — isLoading:",
    isLoading,
    "accessToken:",
    accessToken,
  );

  useEffect(() => {
    if (isLoading) return;

    const isInAuthStack = segments[0] === "auth";

    if (!accessToken && !isInAuthStack) {
      router.replace("/auth/login");
    } else if (accessToken && isInAuthStack) {
      router.replace("/");
    }
  }, [accessToken, isLoading, segments]);

  // Keep every route registered. Conditionally replacing Stack.Screen children can
  // leave the previously mounted native tab screen visible after logout.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="auth/verify" />
      <Stack.Screen name="new-chat" options={{ presentation: "modal" }} />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="call/[id]" />
    </Stack>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
