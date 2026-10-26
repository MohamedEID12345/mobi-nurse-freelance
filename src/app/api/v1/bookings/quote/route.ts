import { handler, ok, parseBody } from '@/lib/http';
import { priceFor } from '@/lib/bookings';
import { quoteSchema } from '@/lib/validators';

/** Price breakdown shown before confirming. Calculated server-side only. */
export const POST = handler(async (req) => {
  const b = await parseBody(req, quoteSchema);
  const { quote, service } = await priceFor(b.serviceId, b.governorateId);
  return ok({ serviceName: service.name_ar, servicePrice: quote.servicePrice, travelFee: quote.travelFee, total: quote.total });
});
