import { InvoiceData } from '../types/extract';
import type { OCRResult } from '../types/ocr';

/**
 * Extracts invoice data from OCR result text.
 * @param ocr - The OCR result containing the text to parse.
 * @returns An object containing extracted invoice data.
 */
export function extractInvoiceData(ocr: OCRResult): InvoiceData {
  const lines = ocr.text
    .split(/\n|\r/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result: InvoiceData = {};
  for (const line of lines) {
    if (line.startsWith('Invoice No:')) result.invoiceNo = line.replace('Invoice No:', '').trim();
    if (line.startsWith('Date:')) result.date = line.replace('Date:', '').trim();
    if (line.startsWith('Seller:')) result.seller = line.replace('Seller:', '').trim();
    if (line.startsWith('Customer:')) result.customer = line.replace('Customer:', '').trim();
    if (line.startsWith('Customer Email:'))
      result.customerEmail = line.replace('Customer Email:', '').trim();
    if (line.startsWith('Total:')) result.total = line.replace('Total:', '').trim();
    if (line.startsWith('VAT ID:')) result.vatId = line.replace('VAT ID:', '').trim();
  }
  return result;
}
