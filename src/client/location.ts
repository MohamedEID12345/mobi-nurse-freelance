'use client';

export interface Coords { latitude: number; longitude: number; accuracy: number }

/** Reads the device GPS (works in browsers and inside the Android app WebView). */
export function getLocation(highAccuracy = true): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('جهازك لا يدعم تحديد الموقع'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: Number(p.coords.latitude.toFixed(6)), longitude: Number(p.coords.longitude.toFixed(6)), accuracy: p.coords.accuracy }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error('برجاء السماح بالوصول للموقع من إعدادات الجهاز'));
        else if (err.code === err.TIMEOUT) reject(new Error('انتهت مهلة تحديد الموقع، تأكد من تشغيل GPS وحاول مرة أخرى'));
        else reject(new Error('تعذر تحديد الموقع، تأكد من تشغيل GPS'));
      },
      { enableHighAccuracy: highAccuracy, timeout: 20000, maximumAge: highAccuracy ? 15000 : 120000 },
    );
  });
}
