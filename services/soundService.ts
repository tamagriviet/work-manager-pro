/**
 * Sound Service for Work Manager Pro
 * Manages audio playback for tasks, status changes, and notifications.
 */

const SOUND_ENABLED_KEY = 'work_manager_sound_enabled';

export const isSoundEnabled = (): boolean => {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  if (stored === null) return true;
  return stored === 'true';
};

export const setSoundEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? 'true' : 'false');
  }
};

export const playSound = (soundFileName: string) => {
  if (!isSoundEnabled()) return;
  try {
    const audio = new Audio(`/sounds/${encodeURIComponent(soundFileName)}`);
    audio.play().catch(err => {
      // Browser autoplay policy might block audio before first user interaction
      console.warn('Audio playback prevented or failed:', err);
    });
  } catch (err) {
    console.error('Audio play error:', err);
  }
};

// Functions mapped to specific features
export const playNotificationSound = () => playSound('thong-bao.wav');
export const playDoneSound = () => playSound('da-xong.wav');
export const playWaitingApprovalSound = () => playSound('doi-chot.wav');
export const playInProgressSound = () => playSound('dang-lam.wav');
export const playAddTaskSound = () => playSound('them-viec.wav');
