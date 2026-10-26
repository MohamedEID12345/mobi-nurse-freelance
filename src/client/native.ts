'use client';
import { api } from './api';

declare global {
  interface Window {
    MobiNurseNative?: {
      getFcmToken(): string;
      getAppVersion(): string;
      openExternal(url: string): void;
    };
  }
}

export function isAndroidApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.MobiNurseNative);
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
