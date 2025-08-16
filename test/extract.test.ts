import test from 'node:test';
import assert from 'node:assert/strict';
import { extractInvoiceData } from '../src/services/extract';

test('extractInvoiceData parses fields from OCR text', () => {
  const ocr = {
    text: `Invoice No: INV-1\nDate: 2025-08-13\nSeller: Co\nCustomer: Jane\nCustomer Email: jane@example.com\nTotal: 10 EUR\nVAT ID: DE1`,
    confidence: 0.9,
    language: 'en',
  };
  const data = extractInvoiceData(ocr);
  assert.equal(data.invoiceNo, 'INV-1');
  assert.equal(data.customerEmail, 'jane@example.com');
});
