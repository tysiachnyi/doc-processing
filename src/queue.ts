import { Queue } from 'bullmq';
import { redisClient } from './lib/redisClient';

export const queue = new Queue('documents', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 5000,
  },
});

export const deadLetterQueue = new Queue('documents-dead-letter', {
  connection: redisClient,
});
