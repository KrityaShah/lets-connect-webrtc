import { Injectable } from '@nestjs/common';

export const MAX_PEERS_PER_ROOM = 2; // 1:1 calls for now

type JoinResult = { ok: true; peers: string[] } | { ok: false };

@Injectable()
export class RoomsService {
  private readonly rooms = new Map<string, Set<string>>();
  private readonly socketRoom = new Map<string, string>();

  join(roomId: string, socketId: string): JoinResult {
    const room = this.rooms.get(roomId) ?? new Set<string>();
    if (room.size >= MAX_PEERS_PER_ROOM && !room.has(socketId)) {
      return { ok: false };
    }
    const peers = [...room].filter((id) => id !== socketId);
    room.add(socketId);
    this.rooms.set(roomId, room);
    this.socketRoom.set(socketId, roomId);
    return { ok: true, peers };
  }

  leave(socketId: string): string | null {
    const roomId = this.socketRoom.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    room?.delete(socketId);
    if (room?.size === 0) this.rooms.delete(roomId);
    this.socketRoom.delete(socketId);
    return roomId;
  }

  inSameRoom(a: string, b: string): boolean {
    const roomId = this.socketRoom.get(a);
    return !!roomId && this.socketRoom.get(b) === roomId;
  }
}
