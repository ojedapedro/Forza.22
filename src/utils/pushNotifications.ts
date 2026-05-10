
/**
 * Utility for cross-platform safe push notifications
 * Specifically addresses "Illegal constructor" error on some mobile devices
 */

export async function sendPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    // 1. Try to use service worker registration (Required for Chrome on Android)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return;
      }
    }
    
    // 2. Fallback to standard constructor (Works on Desktop Safari, Firefox, etc.)
    new Notification(title, options);
  } catch (err) {
    console.error('Error triggered during push notification:', err);
    
    // If both fail, we might try to use the registration again if it wasn't ready
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.showNotification) {
            await registration.showNotification(title, options);
        }
    } catch (innerErr) {
        console.error('Safe notification fallback failed:', innerErr);
    }
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'default';
  }
}
