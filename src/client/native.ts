'use client';
import { api } from './api';

export interface AlertStatus { push: boolean; permission: boolean; battery: boolean; background: boolean }

declare global {
  interface Window {
    MobiNurseNative?: {
      getFcmToken(): string;
      getAppVersion(): string;
      openExternal(url: string): void;
      // v1.1+
      setOnlineMode?(online: boolean, token: string): void;
      getAlertStatus?(): string;
      testAlert?(title: string, body: string): void;
      enableNotifications?(): void;
      openNotificationSettings?(): void;
      openBatterySettings?(): void;
    };
  }
}

export function isAndroidApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.MobiNurseNative);
}

export function nativeBridge() {
  return typeof window !== 'undefined' ? window.MobiNurseNative : undefined;
}

/** Inside the Android app: registers the FCM push token for the signed-in user. */
export async function registerDevice() {
  if (!isAndroidApp()) return;
  try {
    const token = window.MobiNurseNative!.getFcmToken();
    if (token && token.length > 10) await api('/api/v1/me/device', { body: { fcmToken: token }, silent401: true });
  } catch {
    /* push is optional */
  }
}

/** Starts/stops the Android background location service that keeps an online nurse matchable. */
export async function syncBackgroundOnline(online: boolean) {
  const b = nativeBridge();
  if (!b?.setOnlineMode) return;
  try {
    if (online) {
      const { token } = await api<{ token: string }>('/api/v1/nurse/heartbeat-token', { body: {} });
      b.setOnlineMode(true, token);
    } else {
      b.setOnlineMode(false, '');
    }
  } catch {
    /* best effort */
  }
}

export function alertStatus(): AlertStatus | null {
  const b = nativeBridge();
  if (!b?.getAlertStatus) return null;
  try { return JSON.parse(b.getAlertStatus()) as AlertStatus; } catch { return null; }
}

let audio: HTMLAudioElement | null = null;

/** Plays the distinctive request alert sound in the page (web + inside the app). */
export function playRequestSound() {
  try {
    if (!audio) audio = new Audio('/sounds/request-alert.wav');
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
    if ('vibrate' in navigator) navigator.vibrate([400, 200, 400, 200, 700]);
  } catch { /* sound optional */ }
}
