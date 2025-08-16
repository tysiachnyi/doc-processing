export const STATUS = {
  NEW: 'new',
  UPLOADED: 'uploaded',
  VALIDATED: 'validated',
  DONE: 'done',
  VALIDATION_FAILED: 'validation_failed',
  PROCESSING: 'processing',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];
