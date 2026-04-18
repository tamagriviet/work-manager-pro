
import { io, Socket } from 'socket.io-client';
import { getServerUrl } from './configService';

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    const baseUrl = getServerUrl();
    socket = io(baseUrl);
    console.log('Socket initialized with url:', baseUrl);
  }
  return socket;
};

export const getSocket = () => socket;

export const broadcastState = (state: any) => {
  if (socket) {
    socket.emit('sync-state', state);
  }
};
