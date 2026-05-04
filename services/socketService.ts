
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
  // We no longer broadcast the full state to prevent race conditions.
  // Full state broadcast is deprecated.
};

export const dispatchAction = async (action: { type: string; payload: any }) => {
  // Gửi qua WebSocket để realtime
  if (socket) {
    socket.emit('dispatch', action);
  }
  
  // LUÔN GỬI QUA HTTP (REST API) ĐỂ ĐẢM BẢO KHÔNG BAO GIỜ MẤT DỮ LIỆU
  // Nếu môi trường chặn WebSocket thì cách này vẫn hoạt động 100%
  try {
    const baseUrl = getServerUrl();
    await fetch(`${baseUrl}/api/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });
  } catch (e) {
    console.error("HTTP dispatch failed:", e);
  }
};
