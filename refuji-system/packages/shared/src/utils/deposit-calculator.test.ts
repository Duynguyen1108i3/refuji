import test from 'node:test';
import assert from 'node:assert';
import { calcDeposit } from './deposit-calculator.ts';
import { MembershipTier } from '../enums/membership-tier.enum.ts';

test('calcDeposit - Base test for X-T5 with GOLD Tier (10% discount)', () => {
  const baseDeposit = 5900000;
  const result = calcDeposit(baseDeposit, MembershipTier.GOLD);
  assert.strictEqual(result, 5310000, 'X-T5 deposit 5.900.000đ with Gold 10% discount should be exactly 5.310.000đ');
});

test('calcDeposit - BRONZE tier should have 0% discount', () => {
  const baseDeposit = 5000000;
  const result = calcDeposit(baseDeposit, MembershipTier.BRONZE);
  assert.strictEqual(result, 5000000);
});

test('calcDeposit - SILVER tier should have 5% discount', () => {
  const baseDeposit = 5000000;
  const result = calcDeposit(baseDeposit, MembershipTier.SILVER);
  assert.strictEqual(result, 4750000);
});

test('calcDeposit - PLATINUM tier should have 15% discount', () => {
  const baseDeposit = 5000000;
  const result = calcDeposit(baseDeposit, MembershipTier.PLATINUM);
  assert.strictEqual(result, 4250000);
});

test('calcDeposit - Guest (null / undefined) should have 0% discount', () => {
  const baseDeposit = 5900000;
  assert.strictEqual(calcDeposit(baseDeposit, null), 5900000);
  assert.strictEqual(calcDeposit(baseDeposit, undefined), 5900000);
});
