import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { api, ApiError, MessageDto } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/config';
import { AppColors, radius, spacing, useAppColors } from '@/theme/colors';

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken, logout, user } = useAuth();
  const colors = useAppColors();
  const styles = createStyles(colors);
  const socketRef = useRef<Socket | null>(null);
  const listRef = useRef<FlatList<MessageDto>>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const loadMessages = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.getMessages(id, accessToken);
      setMessages(result.messages);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await logout();
        return;
      }
      setError((e as Error).message || 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, id, logout]);

  useFocusEffect(useCallback(() => { void loadMessages(); }, [loadMessages]));

  useEffect(() => {
    if (!accessToken || !id) return;
    const socket = io(`${API_URL}/chat`, { auth: { token: accessToken }, transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      socket.emit('join-chatroom', { chatroomId: id });
    });
    socket.on('new-message', (message: MessageDto) => {
      if (message.chatroomId !== id) return;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    });
    socket.on('connect_error', () => {
      setIsConnected(false);
      setError('Live updates are unavailable.');
    });
    socket.on('exception', (e: { message?: string }) => {
      setError(e?.message ?? 'Message failed');
    });
    return () => {
      socket.emit('leave-chatroom', { chatroomId: id });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [accessToken, id]);

  const sendMessage = () => {
    const content = draft.trim();
    if (!content || !id || !socketRef.current?.connected) return;
    socketRef.current.emit('send-message', { chatroomId: id, content });
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', default: undefined })} keyboardVerticalOffset={Platform.select({ ios: 12, default: 0 })}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" hitSlop={12} onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Chat</Text>
        <Pressable style={styles.callButton} onPress={() => router.push(`/call/${id}`)}><Text style={styles.callButtonText}>Call</Text></Pressable>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={colors.accent} /> : (
        <FlatList ref={listRef} data={messages} keyExtractor={(message) => message.id} contentContainerStyle={messages.length ? styles.messageList : styles.emptyList} onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })} ListEmptyComponent={<Text style={styles.empty}>No messages yet. Say hello!</Text>} renderItem={({ item }) => {
          const mine = item.senderId === user?.id;
          return <View style={[styles.messageRow, mine && styles.ownMessageRow]}><View style={[styles.bubble, mine ? styles.ownBubble : styles.otherBubble]}><Text style={[styles.messageText, mine && styles.ownMessageText]}>{item.content}</Text><Text style={[styles.timestamp, mine && styles.ownTimestamp]}>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View></View>;
        }} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.composer}>
        <TextInput value={draft} onChangeText={setDraft} placeholder="Message" placeholderTextColor={colors.textMuted} multiline maxLength={4000} style={styles.input} onSubmitEditing={sendMessage} />
        <Pressable accessibilityLabel="Send message" disabled={!draft.trim() || !isConnected} onPress={sendMessage} style={[styles.sendButton, (!draft.trim() || !isConnected) && styles.disabledSend]}><Text style={styles.sendText}>Send</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { height: 100, paddingTop: 48, paddingHorizontal: spacing.md, borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: colors.text, fontSize: 38, fontWeight: '300', lineHeight: 40, width: 34 }, title: { color: colors.text, fontSize: 18, fontWeight: '700' },
  callButton: { backgroundColor: colors.primaryMuted, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 7 }, callButtonText: { color: colors.accent, fontWeight: '700' }, loader: { flex: 1 },
  messageList: { padding: spacing.md, gap: spacing.sm }, emptyList: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg }, empty: { color: colors.textMuted, textAlign: 'center' },
  messageRow: { alignItems: 'flex-start' }, ownMessageRow: { alignItems: 'flex-end' }, bubble: { maxWidth: '82%', paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6, borderRadius: radius.lg }, ownBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 }, otherBubble: { backgroundColor: colors.surfaceElevated, borderBottomLeftRadius: 4 },
  messageText: { color: colors.text, fontSize: 16, lineHeight: 21 }, ownMessageText: { color: colors.textOnPrimary }, timestamp: { color: colors.textMuted, fontSize: 11, alignSelf: 'flex-end', marginTop: 3 }, ownTimestamp: { color: colors.textOnPrimary, opacity: 0.75 },
  error: { color: colors.danger, textAlign: 'center', fontSize: 12, paddingHorizontal: spacing.md, paddingBottom: spacing.xs }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, padding: spacing.sm, paddingBottom: Platform.select({ ios: spacing.lg, default: spacing.sm }) },
  input: { flex: 1, maxHeight: 112, minHeight: 44, color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 10, fontSize: 16 }, sendButton: { backgroundColor: colors.primary, minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.md }, disabledSend: { opacity: 0.45 }, sendText: { color: colors.textOnPrimary, fontWeight: '700' },
});
