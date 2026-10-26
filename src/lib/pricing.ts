/** All money math in integer piasters to avoid floating-point errors. Pure & server-authoritative. */
export interface Quote {
  servicePrice: number;
  travelFee: number;
  total: number;
  commissionPct: number;
  commission: number;
  nurseAmount: number;
}

const toCents = (v: number | string) => Math.round(Number(v) * 100);
const fromCents = (c: number) => c / 100;

export function quote(servicePrice: number | string, travelFee: number | string, commissionPct: number): Quote {
  const priceC = toCents(servicePrice);
  const travelC = toCents(travelFee);
  if (!(priceC > 0) || travelC < 0) throw new Error('Invalid price');
  if (!(commissionPct >= 0 && commissionPct <= 100)) throw new Error('Invalid commission');
  const totalC = priceC + travelC;
  const commissionC = Math.round((totalC * commissionPct) / 100);
  return {
    servicePrice: fromCents(priceC),
    travelFee: fromCents(travelC),
    total: fromCents(totalC),
    commissionPct,
    commission: fromCents(commissionC),
    nurseAmount: fromCents(totalC - commissionC),
  };
}
