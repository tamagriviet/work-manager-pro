
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export type UserRole = 'ADMIN' | 'DEPT_HEAD' | 'MANAGER' | 'EMPLOYEE';
export type Language = 'vi' | 'en' | 'zh' | 'ru';
export type Theme = 'light' | 'dark';
export type ReportLayout = 'FLAT' | 'GROUPED_BY_COMPANY';

export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  jobTitle: string; 
  role: UserRole;
  reportsTo?: string; 
  department?: string;
  mustChangePassword?: boolean;
  companies: string[]; // Mỗi user có danh sách công ty riêng
}

export interface Task {
  id: string;
  userId: string; 
  content: string;
  company: string;
  createdAt: string; 
  updatedAt: string;
  status: TaskStatus;
  isPriority: boolean;
  deletedAt?: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  layout: ReportLayout;
  columns: {
    company: boolean;
    content: boolean;
    status: boolean;
    priority: boolean;
    date: boolean;
    pendingTasks: boolean;
  };
}

export interface AppState {
  currentUser: User;
  users: User[]; 
  tasks: Task[]; 
  templates?: ReportTemplate[]; 
  settings: {
    language: Language;
    theme: Theme;
  };
}

declare global {
  interface Window {
    electronAPI?: {
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;
      onDownloadProgress: (callback: (progressObj: any) => void) => void;
      quitAndInstall: () => void;
    };
  }
}
