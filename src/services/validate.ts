import { z } from 'zod';
import type { InvoiceData } from '../types/extract';

export const invoiceSchema = z.object({
  invoiceNo: z.string().min(1),
  date: z.string().min(1),
  seller: z.string().min(1),
  customer: z.string().min(1),
  customerEmail: z.string().email().optional(),
  total: z.string().min(1),
  vatId: z.string().optional(),
});

export function validate(data: InvoiceData) {
  return invoiceSchema.safeParse(data);
}
