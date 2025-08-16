import fs from 'fs/promises';
import fssync from 'fs';
import path from 'path';
import { redisClient } from '../lib/redisClient';
import { Status, STATUS } from '../lib/status';
import { DocumentMetadata } from '../types/storage';

const storageDir = process.env.STORAGE_DIR || './storage';

if (!fssync.existsSync(storageDir)) {
  fssync.mkdirSync(storageDir, { recursive: true });
}

/**
 * Saves a file to the storage directory and updates Redis with its metadata.
 * @param id - Unique identifier for the document.
 * @param buffer - The file buffer to save.
 * @param originalFilename - The original name of the file.
 */
export async function saveFile(
  id: string,
  buffer: Buffer,
  originalFilename: string,
  createdAt: string
) {
  const safeOriginal = path.basename(originalFilename);
  const storedFilename = `${id}_${safeOriginal}`;
  await fs.writeFile(path.join(storageDir, storedFilename), buffer);
  await redisClient.hset(`doc:${id}`, {
    status: STATUS.UPLOADED,
    filename: storedFilename,
    originalFilename: safeOriginal,
    size: buffer.length,
    createdAt: createdAt,
  });
}

/**
 * Retrieves the file buffer for a given document ID.
 * @param storedFilename - The filename stored in Redis.
 * @returns The file buffer.
 */

export async function getFileBuffer(storedFilename: string): Promise<Buffer> {
  if (!storedFilename) throw new Error('Filename is required to get file buffer');
  return fs.readFile(path.join(storageDir, storedFilename));
}

/**
 * Returns a readable stream for the stored file.
 * @param storedFilename - The filename stored in Redis.
 * @returns A readable stream for the file.
 */
export function getFileStream(storedFilename: string): NodeJS.ReadableStream {
  if (!storedFilename) throw new Error('Filename is required to get file stream');
  return fssync.createReadStream(path.join(storageDir, storedFilename));
}

/**
 * Updates the status of a document in Redis.
 * @param id - Unique identifier for the document.
 * @param status - The new status to set.
 * @param error - Optional error message if the status is failed.
 */

export async function updateStatus(id: string, status: Status, error?: string): Promise<void> {
  const update: Record<string, string> = { status };
  if (error) update.error = error;
  await redisClient.hset(`doc:${id}`, update);
}

/**
 * Saves additional metadata for a document in Redis.
 * @param id - Unique identifier for the document.
 * @param metadata - The metadata to save.
 */
export async function saveMetadata(id: string, metadata: DocumentMetadata): Promise<void> {
  await redisClient.hset(`doc:${id}`, { metadata: JSON.stringify(metadata) });
}

/**
 * Lists all document IDs stored in Redis.
 * @returns An array of document IDs.
 */
export async function listDocuments(): Promise<string[]> {
  const keys = await redisClient.keys('doc:*');
  return keys.map((key) => key.replace('doc:', ''));
}

/**
 * Retrieves a document's metadata and status from Redis.
 * @param id - Unique identifier for the document.
 * @returns The document data including metadata and status.
 */
export async function getDocument(id: string) {
  const data = await redisClient.hgetall(`doc:${id}`);
  if (data.metadata && typeof data.metadata === 'string') {
    try {
      data.metadata = JSON.parse(data.metadata);
    } catch {
      console.error(`Failed to parse metadata for document ${id}`);
      data.metadata = '';
    }
  }
  return data;
}

export async function deleteDocument(id: string) {
  const storedFilename = await redisClient.hget(`doc:${id}`, 'filename');
  await redisClient.del(`doc:${id}`);
  if (storedFilename) {
    await fs.unlink(path.join(storageDir, storedFilename));
  }
}
