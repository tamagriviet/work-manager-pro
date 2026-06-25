import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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
      // For Electron/Web: OS handles the default sound
      new Notification(title, { body });
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};
