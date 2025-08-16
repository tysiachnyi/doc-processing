import { Status } from '../lib/status';
import { InvoiceData } from './extract';
import { OCRResult } from './ocr';

export interface DocumentInfo {
  status: Status;
  filename: string;
  originalFilename: string;
  size: string;
}

export interface DocumentMetadata {
  processedAt: string;
  ocr: OCRResult;
  invoice: InvoiceData;
}

export function isDocumentInfo(obj: DocumentInfo): obj is DocumentInfo {
  return (
    typeof obj === 'object' &&
    typeof obj.status === 'string' &&
    typeof obj.filename === 'string' &&
    typeof obj.originalFilename === 'string' &&
    typeof obj.size === 'string'
  );
}
