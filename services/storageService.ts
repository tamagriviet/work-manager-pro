
import { AppState, User } from '../types';

const STORAGE_KEY = 'zentask_enterprise_db';
const ADMIN_EMAIL = 'tam.agriviet@gmail.com';
const ADMIN_PASS = '123456789';

const createDefaultState = (): AppState => {
  const admin: User = {
    id: 'root-admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    fullName: 'Tam Agriviet',
    jobTitle: 'Hệ thống Quản trị',
    role: 'ADMIN',
    mustChangePassword: false,
    companies: ["Agriviet"] // Công ty riêng của admin
  };

  return {
    currentUser: admin,
    users: [admin],
    tasks: [],
    settings: { language: 'vi', theme: 'light' }
  };
};

export const saveStateSecure = async (state: AppState) => {
  // We use WebSockets for real-time saving/broadcasting désormais
  return;
};

import { getServerUrl } from './configService';

export const loadStateSecure = async (email: string, password?: string): Promise<AppState> => {
  const baseUrl = getServerUrl();
  const response = await fetch(`${baseUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Không thể kết nối đến Máy chủ (Vui lòng kiểm tra lại địa chỉ kết nối hoặc Mạng Internet).");
  }

  const { state } = await response.json();
  return state;
};

export const authenticateUser = async (credentials: { email: string; password: string }) => {
  try {
    await loadStateSecure(credentials.email, credentials.password);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
};
