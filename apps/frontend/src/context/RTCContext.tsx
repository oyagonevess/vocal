import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import { Socket } from 'socket.io-client';
import { RoomPeer, Channel } from '../types/index.js';
import { useAuth } from './AuthContext.js';
import { getSocket, disconnectSocket } from '../services/socket.js';
import { useMediaDevices } from '../hooks/useMediaDevices.js';
import { api } from '../services/api.js';
import { soundManager } from '../utils/soundEffects.js';

interface RTCContextType {
  activeChannel: Channel | null;
  activeServerId: string | null;
  peers: RoomPeer[];
  connected: boolean;
  joinChannel: (channel: Channel, serverId: string) => Promise<void>;
  leaveChannel: () => void;
  mediaDevices: ReturnType<typeof useMediaDevices>;
  channelPresence: Map<string, RoomPeer[]>;
  localVideoTrack?: any;
  localScreenTrack?: any;
}

const RTCContext = createContext<RTCContextType>({} as RTCContextType);

// Desativar logs excessivos do Agora em dev
AgoraRTC.setLogLevel(2);

export const RTCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, accessToken } = useAuth();
  const mediaDevices = useMediaDevices();

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [peers, setPeers] = useState<RoomPeer[]>([]);
  const [connected, setConnected] = useState(false);
  const [channelPresence, setChannelPresence] = useState<Map<string, RoomPeer[]>>(new Map());

  const socketRef = useRef<Socket | null>(null);
  const agoraClientRef = useRef<IAgoraRTCClient | null>(null);

  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localScreenTrackRef = useRef<ILocalVideoTrack | null>(null);

  // Initialize Socket.IO Signaling Connection
  useEffect(() => {
    if (!accessToken || !user) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = getSocket(accessToken);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('channel-presence-update', ({ channelId, peers: roomPeers }: { channelId: string; peers: RoomPeer[] }) => {
      setChannelPresence((prev) => {
        const nextMap = new Map(prev);
        nextMap.set(channelId, roomPeers);
        return nextMap;
      });
    });

    socket.on('peer-joined', (newPeer: RoomPeer) => {
      if (newPeer.userId !== user.id) {
        soundManager.playJoin();
        setPeers((prev) => [...prev.filter((p) => p.socketId !== newPeer.socketId && p.userId !== newPeer.userId), newPeer]);
      }
    });

    socket.on('peer-left', ({ socketId }: { socketId: string }) => {
      soundManager.playLeave();
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    socket.on('peer-media-updated', (data: Partial<RoomPeer> & { socketId: string }) => {
      setPeers((prev) =>
        prev.map((p) => (p.socketId === data.socketId ? { ...p, ...data } : p))
      );
    });

    socket.on('peer-speaking', ({ socketId, isSpeaking }: { socketId: string; isSpeaking: boolean }) => {
      setPeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isSpeaking } : p))
      );
    });

    socket.on('room-peers', (existingPeers: RoomPeer[]) => {
      setPeers(existingPeers.filter((p) => p.userId !== user.id));
    });

    return () => {
      socket.off('connect');
      socket.off('channel-presence-update');
      socket.off('peer-joined');
      socket.off('peer-left');
      socket.off('peer-media-updated');
      socket.off('peer-speaking');
      socket.off('room-peers');
    };
  }, [accessToken, user]);

  // Handle Mute Mic State with Agora Track
  useEffect(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(!mediaDevices.muted);
    }
  }, [mediaDevices.muted]);

  // Handle Camera Toggle with Agora Track
  useEffect(() => {
    const handleCamera = async () => {
      if (!agoraClientRef.current || !activeChannel) return;

      if (mediaDevices.cameraOn && mediaDevices.localVideoStream && !localVideoTrackRef.current) {
        try {
          const videoTrack = mediaDevices.localVideoStream.getVideoTracks()[0];
          if (videoTrack) {
            const customTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
            localVideoTrackRef.current = customTrack;
            await agoraClientRef.current.publish([customTrack]);
          }
        } catch (e) {
          console.error('Erro ao publicar câmera no Agora:', e);
        }
      } else if (!mediaDevices.cameraOn && localVideoTrackRef.current) {
        try {
          await agoraClientRef.current.unpublish([localVideoTrackRef.current]);
          localVideoTrackRef.current.close();
          localVideoTrackRef.current = null;
        } catch (e) {
          console.error('Erro ao despublicar câmera no Agora:', e);
        }
      }
    };

    handleCamera();
  }, [mediaDevices.cameraOn, mediaDevices.localVideoStream, activeChannel]);

  // Handle Screen Sharing Toggle with Agora Track
  useEffect(() => {
    const handleScreenShare = async () => {
      if (!agoraClientRef.current || !activeChannel) return;

      if (mediaDevices.screenSharing && mediaDevices.localScreenStream && !localScreenTrackRef.current) {
        try {
          const videoTrack = mediaDevices.localScreenStream.getVideoTracks()[0];
          if (videoTrack) {
            const customScreenTrack = AgoraRTC.createCustomVideoTrack({ mediaStreamTrack: videoTrack });
            localScreenTrackRef.current = customScreenTrack;
            await agoraClientRef.current.publish([customScreenTrack]);

            videoTrack.onended = async () => {
              if (localScreenTrackRef.current && agoraClientRef.current) {
                try {
                  await agoraClientRef.current.unpublish([localScreenTrackRef.current]);
                } catch (e) {}
                localScreenTrackRef.current.close();
                localScreenTrackRef.current = null;
              }
              mediaDevices.setLocalScreenStream(null);
            };
          }
        } catch (e) {
          console.error('Erro ao publicar compartilhamento de tela no Agora:', e);
        }
      } else if (!mediaDevices.screenSharing && localScreenTrackRef.current) {
        try {
          await agoraClientRef.current.unpublish([localScreenTrackRef.current]);
          localScreenTrackRef.current.close();
          localScreenTrackRef.current = null;
        } catch (e) {
          console.error('Erro ao despublicar tela no Agora:', e);
        }
      }
    };

    handleScreenShare();
  }, [mediaDevices.screenSharing, mediaDevices.localScreenStream, activeChannel]);

  // Sync Local Media Controls via Socket
  useEffect(() => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('update-media-state', {
        muted: mediaDevices.muted,
        deafened: mediaDevices.deafened,
        cameraOn: mediaDevices.cameraOn,
        screenSharing: mediaDevices.screenSharing,
      });
    }
  }, [mediaDevices.muted, mediaDevices.deafened, mediaDevices.cameraOn, mediaDevices.screenSharing, activeChannel]);

  const joinChannel = async (channel: Channel, serverId: string) => {
    if (!socketRef.current || !user) return;

    if (activeChannel?.id === channel.id) return;

    if (activeChannel) {
      leaveChannel();
    }

    soundManager.playJoin();

    try {
      // 1. Fetch dynamic Agora RTC Token from backend
      const res = await api.get(`/rtc/agora/token/${channel.id}`);
      const { appId, token, channelName } = res.data;

      // 2. Initialize Agora RTC Client
      const agoraClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      agoraClientRef.current = agoraClient;

      // Enable Voice Activity Detection Volume Indicator (VAD)
      agoraClient.enableAudioVolumeIndicator();

      agoraClient.on('volume-indicator', (volumes) => {
        volumes.forEach((volume) => {
          const isSpeaking = volume.level > 10;
          if (String(volume.uid) === user.id) {
            socketRef.current?.emit('vad-speaking', { isSpeaking });
          }
        });
      });

      // Handle Remote Users Joining Channel
      agoraClient.on('user-joined', (remoteUser) => {
        console.log('👤 [Agora RTC] Remote user-joined event:', remoteUser.uid);
        setPeers((prev) => {
          const uidStr = String(remoteUser.uid);
          const exists = prev.some((p) => p.userId === uidStr || p.socketId === uidStr);
          if (!exists) {
            const newPeer: RoomPeer = {
              socketId: uidStr,
              userId: uidStr,
              username: `Usuário ${uidStr.substring(0, 6)}`,
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${uidStr}`,
              muted: false,
              deafened: false,
              cameraOn: false,
              screenSharing: false,
              isSpeaking: false,
            };
            return [...prev, newPeer];
          }
          return prev;
        });
      });

      // Handle Remote Users Leaving Channel
      agoraClient.on('user-left', (remoteUser) => {
        console.log('🚪 [Agora RTC] Remote user-left event:', remoteUser.uid);
        const uidStr = String(remoteUser.uid);
        setPeers((prev) => prev.filter((p) => p.userId !== uidStr && p.socketId !== uidStr));
      });

      // Handle Remote Users Publishing Tracks (Audio / Video / Screen)
      agoraClient.on('user-published', async (remoteUser, mediaType) => {
        console.log('📡 [Agora RTC] Remote user-published event:', remoteUser.uid, mediaType);
        await agoraClient.subscribe(remoteUser, mediaType);

        const uidStr = String(remoteUser.uid);

        if (mediaType === 'audio') {
          const remoteAudioTrack = remoteUser.audioTrack as IRemoteAudioTrack;
          remoteAudioTrack?.play();
        }

        let mediaStream: MediaStream | undefined;
        let remoteVideoTrack: IRemoteVideoTrack | undefined;

        if (mediaType === 'video') {
          remoteVideoTrack = remoteUser.videoTrack as IRemoteVideoTrack;
          if (remoteVideoTrack) {
            mediaStream = new MediaStream([remoteVideoTrack.getMediaStreamTrack()]);
          }
        }

        setPeers((prev) => {
          const exists = prev.some((p) => p.userId === uidStr || p.socketId === uidStr);
          if (!exists) {
            const newPeer: RoomPeer = {
              socketId: uidStr,
              userId: uidStr,
              username: `Usuário ${uidStr.substring(0, 6)}`,
              avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${uidStr}`,
              muted: false,
              deafened: false,
              cameraOn: mediaType === 'video',
              screenSharing: false,
              isSpeaking: false,
              ...(mediaStream && { stream: mediaStream, screenStream: mediaStream }),
              ...(remoteVideoTrack && { videoTrack: remoteVideoTrack, screenTrack: remoteVideoTrack }),
            };
            return [...prev, newPeer];
          }

          return prev.map((p) => {
            if (p.userId === uidStr || p.socketId === uidStr) {
              return {
                ...p,
                ...(mediaType === 'video' && mediaStream && {
                  stream: mediaStream,
                  screenStream: mediaStream,
                  videoTrack: remoteVideoTrack,
                  screenTrack: remoteVideoTrack,
                  cameraOn: true,
                  screenSharing: true,
                }),
              };
            }
            return p;
          });
        });
      });

      agoraClient.on('user-unpublished', (remoteUser, mediaType) => {
        console.log('🔇 [Agora RTC] Remote user-unpublished event:', remoteUser.uid, mediaType);
        if (mediaType === 'video') {
          const uidStr = String(remoteUser.uid);
          setPeers((prev) =>
            prev.map((p) => {
              if (p.userId === uidStr || p.socketId === uidStr) {
                return {
                  ...p,
                  stream: undefined,
                  screenStream: undefined,
                  videoTrack: undefined,
                  screenTrack: undefined,
                  cameraOn: false,
                  screenSharing: false,
                };
              }
              return p;
            })
          );
        }
      });

      // 3. Join Agora RTC Room Channel
      await agoraClient.join(appId, channelName, token, user.id);

      // 4. Create and Publish Local Microphone Audio Track
      try {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true });
        localAudioTrackRef.current = audioTrack;
        await agoraClient.publish([audioTrack]);
      } catch (audioErr) {
        console.warn('Microfone não acessível ou publicado sem áudio:', audioErr);
      }

      setActiveChannel(channel);
      setActiveServerId(serverId);

      // Notify Socket.IO server for presence
      socketRef.current.emit('join-channel', {
        channelId: channel.id,
        serverId,
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      console.error('Erro ao conectar ao canal do Agora.io:', err);
    }
  };

  const leaveChannel = () => {
    if (socketRef.current && activeChannel) {
      socketRef.current.emit('leave-channel');
    }

    soundManager.playLeave();

    // Close and unpublish local Agora tracks
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.close();
      localAudioTrackRef.current = null;
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.close();
      localVideoTrackRef.current = null;
    }
    if (localScreenTrackRef.current) {
      localScreenTrackRef.current.close();
      localScreenTrackRef.current = null;
    }

    // Leave Agora RTC Client Room
    if (agoraClientRef.current) {
      agoraClientRef.current.leave();
      agoraClientRef.current = null;
    }

    mediaDevices.stopAllMedia();
    setActiveChannel(null);
    setActiveServerId(null);
    setPeers([]);
  };

  return (
    <RTCContext.Provider
      value={{
        activeChannel,
        activeServerId,
        peers,
        connected,
        joinChannel,
        leaveChannel,
        mediaDevices,
        channelPresence,
        localVideoTrack: localVideoTrackRef.current,
        localScreenTrack: localScreenTrackRef.current,
      }}
    >
      {children}
    </RTCContext.Provider>
  );
};

export const useRTC = () => useContext(RTCContext);
