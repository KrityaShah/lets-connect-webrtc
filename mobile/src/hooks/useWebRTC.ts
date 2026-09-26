import { useCallback, useEffect, useRef, useState } from "react";
import InCallManager from "react-native-incall-manager";
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";
import { io, Socket } from "socket.io-client";
import { SIGNALING_URL } from "../config";

export type CallStatus =
  | "idle"
  | "waiting"
  | "connecting"
  | "connected"
  | "room-full";

// STUN only for now. Add a TURN server before testing across different networks.
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [remoteCameraOff, setRemoteCameraOff] = useState(false);
  const remoteIdRef = useRef<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidates = useRef<any[]>([]);

  // Camera + mic on mount, so the preview shows before joining.
  useEffect(() => {
    let cancelled = false;
    mediaDevices
      .getUserMedia({ audio: true, video: { facingMode: "user" } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
      })
      .catch((e) => setError(String(e)));

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const closePeer = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidates.current = [];
    setRemoteStream(null);
  }, []);

  const createPeer = useCallback(
    (remoteId: string) => {
      closePeer();
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const local = localStreamRef.current;
      local?.getTracks().forEach((track) => pc.addTrack(track, local));

      const p = pc as any; // event typings in react-native-webrtc are loose
      p.addEventListener("icecandidate", (e: any) => {
        if (!e.candidate) return;
        socketRef.current?.emit("ice-candidate", {
          to: remoteId,
          candidate: e.candidate.toJSON(),
        });
      });
      p.addEventListener("track", (e: any) => {
        if (e.streams?.[0]) setRemoteStream(e.streams[0]);
      });
      p.addEventListener("connectionstatechange", () => {
        if (pc.connectionState === "connected") setStatus("connected");
      });

      pcRef.current = pc;
      return pc;
    },
    [closePeer],
  );

  const flushCandidates = async (pc: RTCPeerConnection) => {
    const queued = pendingCandidates.current;
    pendingCandidates.current = [];
    for (const c of queued) await pc.addIceCandidate(new RTCIceCandidate(c));
  };

  const join = useCallback(
    (roomId: string) => {
      if (socketRef.current || !localStreamRef.current) return;
      setError(null);

      const socket = io(SIGNALING_URL, { transports: ["websocket"] });
      socketRef.current = socket;
      InCallManager.start({ media: "video" });
      InCallManager.setForceSpeakerphoneOn(true);

      socket.on("connect", () => socket.emit("join-room", { roomId }));
      socket.on("connect_error", (e) => setError(`Signaling: ${e.message}`));

      socket.on("room-joined", async ({ peers }: { peers: string[] }) => {
        if (peers.length === 0) {
          setStatus("waiting");
          return;
        }
        // We're the joiner, so we create the offer.
        remoteIdRef.current = peers[0];
        setStatus("connecting");
        const pc = createPeer(peers[0]);
        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        socket.emit("offer", {
          to: peers[0],
          sdp: { type: offer.type, sdp: offer.sdp },
        });
      });

      socket.on("offer", async ({ from, sdp }) => {
        remoteIdRef.current = from;
        setStatus("connecting");
        const pc = createPeer(from);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", {
          to: from,
          sdp: { type: answer.type, sdp: answer.sdp },
        });
      });

      socket.on("answer", async ({ sdp }) => {
        const pc = pcRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushCandidates(pc);
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          pendingCandidates.current.push(candidate); // arrived before the offer/answer
        }
      });

      socket.on("camera-toggle", ({ cameraOff }: { cameraOff: boolean }) => {
        setRemoteCameraOff(cameraOff);
      });

      socket.on("peer-left", () => {
        closePeer();
        remoteIdRef.current = null;
        setRemoteCameraOff(false);
        setStatus("waiting");
      });

      socket.on("room-full", () => {
        socket.disconnect();
        socketRef.current = null;
        setStatus("room-full");
      });
    },
    [createPeer, closePeer],
  );

  const leave = useCallback(() => {
    socketRef.current?.emit("leave-room");
    socketRef.current?.disconnect();
    socketRef.current = null;
    remoteIdRef.current = null;
    closePeer();
    InCallManager.stop();
    setRemoteCameraOff(false);
    setStatus("idle");
  }, [closePeer]);

  const toggleSpeaker = useCallback(() => {
    const next = !isSpeakerOn;
    InCallManager.setForceSpeakerphoneOn(next);
    setIsSpeakerOn(next);
  }, [isSpeakerOn]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !next));
    setIsMuted(next);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    const next = !isCameraOff;
    localStreamRef.current
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = !next));
    setIsCameraOff(next);
    if (remoteIdRef.current) {
      socketRef.current?.emit("camera-toggle", {
        to: remoteIdRef.current,
        cameraOff: next,
      });
    }
  }, [isCameraOff]);

  const switchCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0] as any;
    track?._switchCamera?.();
  }, []);

  return {
    localStream,
    remoteStream,
    status,
    error,
    isMuted,
    isCameraOff,
    join,
    leave,
    toggleMute,
    toggleCamera,
    switchCamera,
    isSpeakerOn,
    toggleSpeaker,
    remoteCameraOff,
  };
}
