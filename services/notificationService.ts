import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { playNotificationSound } from './soundService';

export const requestNotificationPermission = async () => {
  if (Capacitor.isNativePlatform()) {
    const permStatus = await LocalNotifications.requestPermissions();
    return permStatus.display === 'granted';
  } else {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
};

export const showNotification = async (title: string, body: string, id: number) => {
  try {
    playNotificationSound();
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (Capacitor.isNativePlatform()) {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 1000) },
          }
        ]
      });
    } else {
      // For Electron/Web: OS handles the notification, with silent: true so custom sound is played
      new Notification(title, { body, silent: true });
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};
