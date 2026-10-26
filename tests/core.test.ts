import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import querystring from 'node:querystring';
import { quote } from '../src/lib/pricing';
import * as kashier from '../src/lib/kashier';
import { normalizeEgyptianMobile } from '../src/lib/shared/phone';
import { normalizeSetting } from '../src/lib/settings';

// env is read lazily, so setting it here (before any call) is enough
process.env.KASHIER_MERCHANT_ID = 'MID-123-456';
process.env.KASHIER_API_KEY = 'test-payment-api-key';
process.env.KASHIER_MODE = 'test';
process.env.APP_BASE_URL = 'https://mobinurse.example.com';


test('300 EGP → 30 commission, 270 nurse (spec §72)', () => {
  const q = quote(300, 0, 10);
  assert.equal(q.total, 300);
  assert.equal(q.commission, 30);
  assert.equal(q.nurseAmount, 270);
});

test('travel fee and rounding stay exact in piasters', () => {
  const q = quote('249.99', '15.50', 10);
  assert.equal(q.total, 265.49);
  assert.equal(q.commission, 26.55);
  assert.equal(Math.round((q.commission + q.nurseAmount) * 100), Math.round(q.total * 100));
  assert.throws(() => quote(0, 0, 10));
  assert.throws(() => quote(100, 0, 150));
});

test('Egyptian phone normalization', () => {
  for (const p of ['01012345678', '+201012345678', '00201012345678', '٠١٠١٢٣٤٥٦٧٨', '010 1234 5678']) {
    assert.equal(normalizeEgyptianMobile(p), '01012345678');
  }
  for (const p of ['0101234567', '01312345678', 'abc', '']) assert.equal(normalizeEgyptianMobile(p), null);
});

test('Kashier checkout hash matches documented algorithm', () => {
  const url = new URL(kashier.buildCheckoutUrl({ orderId: 'MNPABC', amount: 300 }));
  const expected = crypto.createHmac('sha256', 'test-payment-api-key').update('/?payment=MID-123-456.MNPABC.300.00.EGP').digest('hex');
  assert.equal(url.searchParams.get('hash'), expected);
  assert.equal(url.searchParams.get('amount'), '300.00');
  assert.equal(url.searchParams.get('merchantRedirect'), 'https://mobinurse.example.com/pay/result');
});

test('Kashier redirect signature: valid accepted, tampered rejected', () => {
  const params: Array<[string, string]> = [['paymentStatus', 'SUCCESS'], ['merchantOrderId', 'MNPABC'], ['amount', '300.00'], ['currency', 'EGP'], ['transactionId', 'TX1']];
  const sig = crypto.createHmac('sha256', 'test-payment-api-key').update(params.map(([k, v]) => `${k}=${v}`).join('&')).digest('hex');
  assert.equal(kashier.verifyRedirectSignature([...params, ['signature', sig], ['mode', 'test']]), true);
  const tampered = params.map(([k, v]) => [k, k === 'amount' ? '1.00' : v] as [string, string]);
  assert.equal(kashier.verifyRedirectSignature([...tampered, ['signature', sig]]), false);
});

test('Kashier webhook signature over sorted signatureKeys', () => {
  const data: Record<string, unknown> = { merchantOrderId: 'MNPABC', amount: 300, currency: 'EGP', status: 'SUCCESS', transactionId: 'TX1',
    signatureKeys: ['status', 'amount', 'merchantOrderId', 'currency', 'transactionId'] };
  const keys = [...(data.signatureKeys as string[])].sort();
  const payload = querystring.stringify(Object.fromEntries(keys.map((k) => [k, String(data[k])])));
  const sig = crypto.createHmac('sha256', 'test-payment-api-key').update(payload).digest('hex');
  assert.equal(kashier.verifyWebhookSignature(data, sig), true);
  assert.equal(kashier.verifyWebhookSignature({ ...data, amount: 1 }, sig), false);
  assert.equal(kashier.verifyWebhookSignature(data, null), false);
});

test('settings are validated server-side', () => {
  assert.deepEqual(normalizeSetting('PLATFORM_COMMISSION_PERCENT', '12.5'), { key: 'PLATFORM_COMMISSION_PERCENT', value: '12.5' });
  assert.throws(() => normalizeSetting('PLATFORM_COMMISSION_PERCENT', '60'));
  assert.throws(() => normalizeSetting('MATCHING_BATCH_SIZE', '2.5'));
  assert.equal(normalizeSetting('SUPPORT_WHATSAPP', '+20 106 256 9857').value, '201062569857');
});
