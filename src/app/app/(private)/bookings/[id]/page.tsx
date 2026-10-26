'use client';
import { use } from 'react';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { BookingTracker, CustomerBooking } from '@/components/BookingTracker';
import { ErrorBox, Spinner } from '@/components/ui';

const LIVE = ['SEARCHING', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED', 'SERVICE_STARTED', 'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT'];

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, reload, setData } = useApi<CustomerBooking>(`/api/v1/bookings/${id}`, { poll: 8000 });
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  if (!data) return <Spinner />;
  return (
    <>
      {LIVE.includes(data.status) && <p className="small muted center">يتم تحديث الحالة تلقائياً</p>}
      <BookingTracker b={data} complaintHref={`/app/complaints?bookingId=${id}`} onAction={async (action, body) => {
        const r = await api(`/api/v1/bookings/${id}/${action}`, { body: body ?? {} });
        if (action !== 'pay') setData(r as CustomerBooking);
        return r;
      }} />
    </>
  );
}
