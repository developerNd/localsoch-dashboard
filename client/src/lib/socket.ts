import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from './config';

let socket: Socket | null = null;
let lastAuthPayload: { userId?: number; userType?: 'user' | 'vendor'; token?: string } | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_CONFIG.API_URL, {
      transports: ['websocket'],
      withCredentials: true,
      autoConnect: true,
    });

    socket.on('connect', () => {
      // Re-authenticate on reconnect
      if (lastAuthPayload) {
        socket?.emit('authenticate', lastAuthPayload);
      }
    });

    socket.on('error', (error) => {
      console.error('🔌 SOCKET: Error:', error);
    });
  }
  return socket;
}

export function authenticateSocket(payload: { userId: number; userType: 'user' | 'vendor'; token?: string }) {
  lastAuthPayload = payload;
  getSocket().emit('authenticate', payload);
}

export function onNewNotification(handler: (notification: any) => void) {
  getSocket().on('new_notification', handler);
}

export function offNewNotification(handler: (notification: any) => void) {
  getSocket().off('new_notification', handler);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    lastAuthPayload = null;
  }
}