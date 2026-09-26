import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { RTCView } from "react-native-webrtc";
import { useWebRTC } from "../hooks/useWebRTC";

const LABELS = {
  idle: "Enter a room to start",
  waiting: "Waiting for someone to join...",
  connecting: "Connecting...",
  connected: "Connected",
  "room-full": "Room is full",
} as const;

export default function Index() {
  const [roomId, setRoomId] = useState("room1");
  const call = useWebRTC();
  const inCall = call.status !== "idle" && call.status !== "room-full";

  return (
    <View style={styles.container}>
      {/* Remote video fills the screen; before that, show your own preview. */}
      {call.remoteStream && !call.remoteCameraOff ? (
        <RTCView
          streamURL={call.remoteStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
        />
      ) : call.remoteStream ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      ) : call.localStream && !call.isCameraOff ? (
        <RTCView
          streamURL={call.localStream.toURL()}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror
        />
      ) : call.localStream ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
      ) : null}

      {call.remoteStream &&
        call.localStream &&
        (call.isCameraOff ? (
          <View style={[styles.pip, { backgroundColor: "#000" }]} />
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

        {!inCall ? (
          <View style={styles.joinRow}>
            <TextInput
              style={styles.input}
              value={roomId}
              onChangeText={setRoomId}
              autoCapitalize="none"
              placeholder="Room ID"
              placeholderTextColor="#999"
            />
            <Pressable
              style={[styles.btn, styles.join]}
              onPress={() => roomId.trim() && call.join(roomId.trim())}
            >
              <Text style={styles.btnText}>Join</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.controls}>
            <Pressable style={styles.btn} onPress={call.toggleMute}>
              <Text style={styles.btnText}>
                {call.isMuted ? "Unmute" : "Mute"}
              </Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={call.toggleCamera}>
              <Text style={styles.btnText}>
                {call.isCameraOff ? "Cam on" : "Cam off"}
              </Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={call.switchCamera}>
              <Text style={styles.btnText}>Flip</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.leave]} onPress={call.leave}>
              <Text style={styles.btnText}>Leave</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={call.toggleSpeaker}>
              <Text style={styles.btnText}>
                {call.isSpeakerOn ? "Speaker" : "Earpiece"}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  pip: {
    position: "absolute",
    top: 56,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
    paddingBottom: 48,
  },
  status: {
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
  },
  joinRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  controls: { flexDirection: "row", justifyContent: "center", gap: 10 },
  btn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
  },
  join: { backgroundColor: "#208AEF" },
  leave: { backgroundColor: "#E5484D" },
  btnText: { color: "#fff", fontWeight: "600" },
});
