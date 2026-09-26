import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AuthPayload } from '../middleware/auth.js';

export interface RoomPeer {
  socketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  muted: boolean;
  deafened: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

export interface RoomState {
  channelId: string;
  serverId: string;
  peers: Map<string, RoomPeer>; // socketId -> RoomPeer
}

class SFUSignalingServer {
  private io: SocketIOServer | null = null;
  private rooms: Map<string, RoomState> = new Map(); // channelId -> RoomState

  public init(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => callback(null, origin || true),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
      pingTimeout: 10000,
      pingInterval: 5000,
    });

    // Authenticate socket connections using JWT
    this.io.use((socket: Socket, next) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Autenticação WebSocket necessária.'));
      }

      try {
        const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
        (socket as any).user = payload;
        next();
      } catch (err) {
        return next(new Error('Token inválido ou expirado.'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user = (socket as any).user as AuthPayload;
      console.log(`[SFU] Usuário conectado: ${user.username} (${socket.id})`);

      // Send active presence sync to newly connected client immediately
      socket.emit('initial-presence-sync', this.getPresenceMap());

      socket.on('request-channel-presence', () => {
        socket.emit('initial-presence-sync', this.getPresenceMap());
      });

      // Join Server Room for real-time text chat
      socket.on('join-server-room', ({ serverId }) => {
        socket.join(`server:${serverId}`);
        socket.emit('initial-presence-sync', this.getPresenceMap());
      });

      // Join Channel Room
      socket.on('join-channel', ({ channelId, serverId, avatarUrl }) => {
        // Purge user from any previous channel room first to prevent ghost peers
        this.handlePeerLeave(socket);

        let room = this.rooms.get(channelId);
        if (!room) {
          room = {
            channelId,
            serverId,
            peers: new Map(),
          };
          this.rooms.set(channelId, room);
        }

        const peer: RoomPeer = {
          socketId: socket.id,
          userId: user.userId,
          username: user.username,
          avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`,
          muted: false,
          deafened: false,
          cameraOn: false,
          screenSharing: false,
          isSpeaking: false,
          joinedAt: new Date(),
        };

        room.peers.set(socket.id, peer);
        socket.join(`channel:${channelId}`);
        (socket as any).currentChannelId = channelId;

        console.log(`[SFU] ${user.username} entrou no canal ${channelId}`);

        // Notify existing members about the new peer
        socket.to(`channel:${channelId}`).emit('peer-joined', peer);

        // Send full list of connected peers to the joining user
        const existingPeers = Array.from(room.peers.values());
        socket.emit('room-peers', existingPeers);

        // Broadcast global channel presence update to server room
        this.io?.emit('channel-presence-update', {
          channelId,
          serverId,
          peers: existingPeers,
        });
      });

      // Handle WebRTC Signaling Offer/Answer & ICE Candidates (Relayed securely via SFU topology)
      socket.on('sfu-offer', ({ targetSocketId, offer, type }) => {
        socket.to(targetSocketId).emit('sfu-offer', {
          senderSocketId: socket.id,
          senderUserId: user.userId,
          offer,
          type, // 'audio' | 'video' | 'screen'
        });
      });

      socket.on('sfu-answer', ({ targetSocketId, answer, type }) => {
        socket.to(targetSocketId).emit('sfu-answer', {
          senderSocketId: socket.id,
          answer,
          type,
        });
      });

      socket.on('ice-candidate', ({ targetSocketId, candidate, type }) => {
        socket.to(targetSocketId).emit('ice-candidate', {
          senderSocketId: socket.id,
          candidate,
          type,
        });
      });

      // Update Media Controls State (Mute, Deafen, Camera, Screen Share)
      socket.on('update-media-state', (mediaState: Partial<Pick<RoomPeer, 'muted' | 'deafened' | 'cameraOn' | 'screenSharing'>>) => {
        const channelId = (socket as any).currentChannelId;
        if (!channelId) return;

        const room = this.rooms.get(channelId);
        if (!room) return;

        const peer = room.peers.get(socket.id);
        if (peer) {
          Object.assign(peer, mediaState);
          this.io?.to(`channel:${channelId}`).emit('peer-media-updated', {
            socketId: socket.id,
            userId: user.userId,
            ...mediaState,
          });

          // Broadcast updated presence
          this.io?.emit('channel-presence-update', {
            channelId,
            serverId: room.serverId,
            peers: Array.from(room.peers.values()),
          });
        }
      });

      // Voice Activity Detection (VAD) active speaker event
      socket.on('vad-speaking', ({ isSpeaking }) => {
        const channelId = (socket as any).currentChannelId;
        if (!channelId) return;

        const room = this.rooms.get(channelId);
        if (!room) return;

        const peer = room.peers.get(socket.id);
        if (peer) {
          peer.isSpeaking = isSpeaking;
          socket.to(`channel:${channelId}`).emit('peer-speaking', {
            socketId: socket.id,
            userId: user.userId,
            isSpeaking,
          });
        }
      });

      // Leave Channel Explicitly
      socket.on('leave-channel', () => {
        this.handlePeerLeave(socket);
      });

      // Socket Disconnect
      socket.on('disconnect', () => {
        this.handlePeerLeave(socket);
      });
    });
  }

  public broadcastMessage(channelId: string, message: any) {
    this.io?.emit('new-message', { channelId, message });
  }

  private handlePeerLeave(socket: Socket) {
    const user = (socket as any).user as AuthPayload | undefined;
    const userId = user?.userId;

    for (const [channelId, room] of Array.from(this.rooms.entries())) {
      let removedPeer: RoomPeer | undefined;

      for (const [peerSocketId, peer] of Array.from(room.peers.entries())) {
        if (peerSocketId === socket.id || (userId && peer.userId === userId)) {
          removedPeer = peer;
          room.peers.delete(peerSocketId);
        }
      }

      if (removedPeer) {
        socket.leave(`channel:${channelId}`);
        if ((socket as any).currentChannelId === channelId) {
          delete (socket as any).currentChannelId;
        }

        console.log(`[SFU] Peer saiu: ${removedPeer.username} (${socket.id}) do canal ${channelId}`);

        socket.to(`channel:${channelId}`).emit('peer-left', {
          socketId: socket.id,
          userId: removedPeer.userId,
        });

        const remainingPeers = Array.from(room.peers.values());
        if (remainingPeers.length === 0) {
          this.rooms.delete(channelId);
        }

        this.io?.emit('channel-presence-update', {
          channelId,
          serverId: room.serverId,
          peers: remainingPeers,
        });
      }
    }
  }

  public getActivePeers(channelId: string): RoomPeer[] {
    const room = this.rooms.get(channelId);
    return room ? Array.from(room.peers.values()) : [];
  }

  public getPresenceMap(): Record<string, RoomPeer[]> {
    const map: Record<string, RoomPeer[]> = {};
    for (const [channelId, room] of this.rooms.entries()) {
      const peers = Array.from(room.peers.values());
      if (peers.length > 0) {
        map[channelId] = peers;
      }
    }
    return map;
  }
}

export const sfuServer = new SFUSignalingServer();
