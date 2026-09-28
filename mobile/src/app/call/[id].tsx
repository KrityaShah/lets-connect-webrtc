import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { colors, radius, spacing } from '@/theme/colors';

const LABELS = {
  idle: 'Connecting to room...',
  waiting: 'Waiting for someone to join...',
  connecting: 'Connecting...',
  connected: 'Connected',
  'room-full': 'Room is full',
} as const;

export default function Call() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accessToken } = useAuth();
  const call = useWebRTC();

  useEffect(() => {
    if (accessToken && id) {
      call.join(id, accessToken);
    }
    return () => call.leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, accessToken]);

  return (
    <View style={styles.container}>
      {call.remoteStream && !call.remoteCameraOff ? (
        <RTCView
          streamURL={call.remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : call.remoteStream ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      ) : call.localStream && !call.isCameraOff ? (
        <RTCView
          streamURL={call.localStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror
        />
      ) : call.localStream ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
      ) : null}

      {call.remoteStream &&
        call.localStream &&
        (call.isCameraOff ? (
          <View style={[styles.pip, { backgroundColor: colors.background }]} />
        ) : (
          <RTCView
            streamURL={call.localStream.toURL()}
            style={styles.pip}
            objectFit="cover"
            mirror
            zOrder={1}
          />
        ))}

      <View style={styles.overlay}>
        <Text style={styles.status}>{call.error ?? LABELS[call.status]}</Text>
        <View style={styles.controls}>
          <Pressable style={styles.btn} onPress={call.toggleMute}>
            <Text style={styles.btnText}>{call.isMuted ? 'Unmute' : 'Mute'}</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={call.toggleCamera}>
            <Text style={styles.btnText}>{call.isCameraOff ? 'Cam on' : 'Cam off'}</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={call.switchCamera}>
            <Text style={styles.btnText}>Flip</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.leave]}
            onPress={() => {
              call.leave();
              router.back();
            }}
          >
            <Text style={styles.btnText}>Leave</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={call.toggleSpeaker}>
            <Text style={styles.btnText}>{call.isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pip: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  overlay: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, paddingBottom: 48 },
  status: { color: colors.text, textAlign: 'center', marginBottom: spacing.md, fontSize: 16 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  btn: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  leave: { backgroundColor: colors.danger },
  btnText: { color: colors.text, fontWeight: '600' },
});