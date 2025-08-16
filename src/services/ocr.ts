import { OCRResult } from '../types/ocr';

/**
 * Simulates OCR processing by returning a mock OCR result.
 * @param _buffer - The file buffer to process (not used in this simulation).
 * @returns A mock OCR result.
 */
export async function simulateOCR(_buffer: Buffer): Promise<OCRResult> {
  return {
    text: `Invoice No: INV-20250813-001\nDate: 2025-08-13\nSeller: Test Company\nCustomer: John Doe\nCustomer Email: john.doe@example.com\nTotal: 199.99 EUR\nVAT ID: DE123456789`,
    confidence: 0.98,
    language: 'en',
  };
}
