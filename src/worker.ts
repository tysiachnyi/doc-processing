import { Job, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { redisClient } from './lib/redisClient';
import { deadLetterQueue } from './queue';
import { getDocument, getFileBuffer, saveMetadata, updateStatus } from './services/storage';
import { STATUS } from './lib/status';
import { simulateOCR } from './services/ocr';
import { extractInvoiceData } from './services/extract';
import { validate } from './services/validate';

dotenv.config();

const worker = new Worker(
  'documents',
  async (job: Job) => {
    const { id } = job.data;
    console.log(`Processing document: ${id}`);

    const existing = await getDocument(id);
    if (existing?.status === 'done' || existing?.status === 'validated') {
      console.log(`Skipping already processed document ${id}`);
      return;
    }

    await updateStatus(id, STATUS.PROCESSING);

    const doc = await getDocument(id);
    console.log('Document data:', doc);
    if (!doc || !doc.filename) throw new Error('File not found');

    const buffer = await getFileBuffer(doc.filename);

    const ocrResult = await simulateOCR(buffer);

    await updateStatus(id, STATUS.PROCESSED);

    const invoiceData = extractInvoiceData(ocrResult);

    const validation = validate(invoiceData);
    if (!validation.success) {
      await updateStatus(
        id,
        STATUS.VALIDATION_FAILED,
        'Validation failed: ' + JSON.stringify(validation.error)
      );
      await saveMetadata(id, {
        processedAt: new Date().toISOString(),
        ocr: ocrResult,
        invoice: invoiceData,
      });
      throw new Error('Validation failed');
    }
    await updateStatus(id, STATUS.VALIDATED);
    await saveMetadata(id, {
      processedAt: new Date().toISOString(),
      ocr: ocrResult,
      invoice: invoiceData,
    });

    await updateStatus(id, STATUS.DONE);

    console.log(`Document ${id} done`);
  },
  {
    connection: redisClient,
    concurrency: 1,
  }
);

worker.on('failed', async (job, err) => {
  if (job) {
    console.error(`Job ${job.id} failed with error: ${err.message}`);
    try {
      const id = (job.data && job.data.id) as string | undefined;
      if (id) {
        await updateStatus(id, STATUS.FAILED, err.message);
      }
    } catch (e) {
      console.error('Failed to update status to FAILED:', e);
    }

    if ((job.attemptsMade || 0) + 1 >= (job.opts.attempts || 1)) {
      await deadLetterQueue.add('failed', job.data, {
        removeOnComplete: true,
        removeOnFail: 1000,
      });
    }
  }
});
