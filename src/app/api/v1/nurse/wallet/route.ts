import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { loadSettings, num } from '@/lib/settings';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const [wallet, txs, withdrawals, dues, settings] = await Promise.all([
    db().from('wallets').select('*').eq('nurse_id', user.id).maybeSingle(),
    db().from('wallet_transactions').select('id, type, direction, amount, balance_after, description, created_at')
      .eq('nurse_id', user.id).order('created_at', { ascending: false }).limit(100),
    db().from('withdrawals').select('id, amount, method, receiving_account, status, admin_note, reference, created_at, paid_at')
      .eq('nurse_id', user.id).order('created_at', { ascending: false }).limit(50),
    db().from('customer_dues').select('id, booking_id, amount, status, created_at, bookings(code)').eq('nurse_id', user.id)
      .order('created_at', { ascending: false }).limit(50),
    loadSettings(),
  ]);
  const w = must(wallet) as Record<string, string> | null;
  return ok({
    balance: Number(w?.balance ?? 0),
    totalEarned: Number(w?.total_earned ?? 0),
    totalCommission: Number(w?.total_commission ?? 0),
    totalWithdrawn: Number(w?.total_withdrawn ?? 0),
    minWithdrawal: num(settings, 'MIN_WITHDRAWAL_AMOUNT'),
    transactions: (must(txs) as Array<Record<string, unknown>>).map((t) => ({
      id: t.id, type: t.type, direction: t.direction, amount: Number(t.amount), balanceAfter: Number(t.balance_after),
      description: t.description, createdAt: t.created_at,
    })),
    withdrawals: (must(withdrawals) as Array<Record<string, unknown>>).map((x) => ({
      id: x.id, amount: Number(x.amount), method: x.method, receivingAccount: x.receiving_account, status: x.status,
      adminNote: x.admin_note, reference: x.reference, createdAt: x.created_at, paidAt: x.paid_at,
    })),
    dues: (must(dues) as Array<Record<string, unknown>>).map((d) => {
      const bk = d.bookings as { code: string } | { code: string }[] | null;
      return { id: d.id, bookingId: d.booking_id, code: Array.isArray(bk) ? bk[0]?.code : bk?.code, amount: Number(d.amount), status: d.status, createdAt: d.created_at };
    }),
  });
});
