import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let currentToken: string | null = null;

const SOCKET_SERVER_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') || undefined;

export function getSocket(token: string): Socket {
  if (!socket || currentToken !== token) {
    if (socket) {
      socket.disconnect();
    }
    currentToken = token;
    socket = io(SOCKET_SERVER_URL || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
}
