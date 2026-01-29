import { profileApi, PushSubscription } from './api';

/**
 * Registriert den Service Worker für Push-Benachrichtigungen
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Worker wird nicht unterstützt');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker registriert:', registration);
    return registration;
  } catch (error) {
    console.error('Fehler bei Service Worker Registrierung:', error);
    return null;
  }
}

/**
 * Fragt die Berechtigung für Push-Benachrichtigungen an
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Erstellt eine Push-Subscription
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push-Benachrichtigungen werden nicht unterstützt');
    return null;
  }

  try {
    // Registriere Service Worker falls noch nicht geschehen
    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    // Prüfe Berechtigung
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Berechtigung für Benachrichtigungen wurde nicht erteilt');
      return null;
    }

    // Erstelle Subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
      ),
    });

    // Konvertiere zu unserem Format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };

    // Sende an Backend
    await profileApi.subscribePush(pushSubscription);

    return pushSubscription;
  } catch (error) {
    console.error('Fehler bei Push-Subscription:', error);
    return null;
  }
}

/**
 * Entfernt eine Push-Subscription
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await profileApi.unsubscribePush(endpoint);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Fehler beim Abmelden von Push-Benachrichtigungen:', error);
    return false;
  }
}

/**
 * Prüft ob Push-Benachrichtigungen aktiviert sind
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Fehler beim Prüfen der Push-Subscription:', error);
    return false;
  }
}

/**
 * Hilfsfunktionen
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  if (!base64String) {
    throw new Error('VAPID Public Key fehlt. Bitte setzen Sie NEXT_PUBLIC_VAPID_PUBLIC_KEY in der .env');
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

