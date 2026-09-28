import { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, ChatroomDto } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { AppColors, radius, spacing, typography, useAppColors } from "@/theme/colors";

export default function ChatList() {
  const { accessToken, logout } = useAuth();
  const colors = useAppColors();
  const styles = createStyles(colors);
  const [rooms, setRooms] = useState<ChatroomDto[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!accessToken) return;
      setLoading(true);
      api
        .listChatrooms(accessToken)
        .then((res) => setRooms(res.chatrooms))
        .catch(async (e) => {
          if (e instanceof ApiError && e.status === 401) {
            await logout();
            return;
          }
          // no visible error UI here yet — swallow other errors or add a Text/error state as needed
        })
        .finally(() => setLoading(false));
    }, [accessToken]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={typography(colors).title}>Chats</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.newBtn}
            onPress={() => {
              console.log("NEW CHAT PRESSED");
              router.push("/new-chat");
            }}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </Pressable>
          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              console.log("LOGOUT PRESSED");
              logout();
            }}
          >
            <Text style={styles.logoutBtnText}>Log out</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.md }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No chats yet. Tap "+ New" to start one.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name ?? "D")[0].toUpperCase()}
                </Text>
              </View>
              <Text style={styles.roomName}>
                {item.name ?? "Direct message"}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  newBtnText: { color: colors.textOnPrimary, fontWeight: "600" },
  logoutBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  logoutBtnText: { color: colors.danger, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  roomName: { color: colors.text, fontSize: 16 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
});
