import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/services/validate';
import { InvoiceData } from '../src/types/extract';

test('validate success with required fields', () => {
  const result = validate({
    invoiceNo: 'INV-1',
    date: '2025-08-13',
    seller: 'Co',
    customer: 'Jane',
    total: '10 EUR',
  });
  assert.equal(result.success, true);
});

test('validate fails when required missing', () => {
  const result = validate({
    invoiceNo: '',
  } as InvoiceData);
  assert.equal(result.success, false);
});
