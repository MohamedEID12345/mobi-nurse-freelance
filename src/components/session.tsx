'use client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { registerDevice } from '@/client/native';
import { ErrorBox, Spinner } from './ui';

export interface Me {
  id: string; phone: string; fullName: string; role: 'CUSTOMER' | 'NURSE'; status: string;
  governorateId: string; cityId: string; address: string; latitude: number | null; longitude: number | null;
  governorateName: string | null; governorateActive: boolean; cityName: string | null;
  nurse: null | { verificationStatus: string; isOnline: boolean; rejectionReason: string | null; feePaid: boolean;
    documentsSubmitted: boolean; rating: number; ratingCount: number; completed: number };
}

const Ctx = createContext<{ me: Me; reload: () => Promise<void> } | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try { setMe(await api<Me>('/api/v1/me')); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, []);
  useEffect(() => {
    load().then(registerDevice);
    // On first app launch the FCM token can arrive a few seconds late.
    const t = setTimeout(registerDevice, 10000);
    return () => clearTimeout(t);
  }, [load]);
  if (error && !me) return <div className="app-shell"><div className="app-content"><ErrorBox error={error} onRetry={load} /></div></div>;
  if (!me) return <div className="app-shell"><Spinner /></div>;
  return <Ctx.Provider value={{ me, reload: load }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSession outside SessionProvider');
  return c;
}
