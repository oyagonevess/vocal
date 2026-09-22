export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
}

export interface Member {
  id: string;
  userId: string;
  serverId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
}

export interface Channel {
  id: string;
  serverId: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  userLimit: number;
}

// Alias for backwards compatibility
export type VoiceChannel = Channel;

export interface Message {
  id: string;
  content: string;
  channelId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  };
}

export interface Server {
  id: string;
  name: string;
  iconUrl?: string;
  ownerId: string;
  channels: Channel[];
  members: Member[];
}

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
  stream?: MediaStream;
  screenStream?: MediaStream;
  videoTrack?: any;
  screenTrack?: any;
}
