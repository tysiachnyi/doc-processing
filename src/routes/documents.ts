import express from 'express';
import { upload } from '../lib/upload';
import { queue } from '../queue';
import { STATUS } from '../lib/status';
import { saveFile, listDocuments, getDocument } from '../services/storage';
import { redisClient } from '../lib/redisClient';

const router = express.Router();

/**
 * @route GET /health
 * @summary Health check endpoint
 */
router.get('/health', async (_req, res) => {
  try {
    await redisClient.ping();
    return res.json({ success: true, redis: 'ok' });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, redis: 'error', error: errorMsg });
  }
});

/**
 * @route POST /upload
 * @summary Upload a single document file (PDF, JPEG, PNG).
 */
router.post('/upload', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const createdAt = new Date().toISOString();
    const fileInfo = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      createdAt,
    };

    console.log('File uploaded:', fileInfo);

    await saveFile(fileInfo.id, req.file.buffer, req.file.originalname, createdAt);

    await queue.add(
      'process',
      {
        id: fileInfo.id,
        filename: fileInfo.originalName,
        status: STATUS.PROCESSING,
      },
      { jobId: fileInfo.id }
    );

    return res.status(201).json({
      documentId: fileInfo.id,
      status: STATUS.PROCESSING,
      createdAt,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /documents
 * @summary List document IDs or brief summaries
 * @query summary (optional) when true/1 returns brief summaries instead of just IDs
 */
router.get('/documents', async (req, res, next) => {
  try {
    const summary = String(req.query.summary || '').toLowerCase();
    const ids = await listDocuments();

    const wantSummary = summary === '1' || summary === 'true';
    if (!wantSummary) {
      return res.json({ ids });
    }

    const documents = await Promise.all(
      ids.map(async (id) => {
        try {
          const doc = await getDocument(id);
          return {
            id,
            status: doc?.status ?? null,
            originalFilename: doc?.originalFilename ?? null,
            size: doc?.size ?? null,
          };
        } catch {
          return { id, status: null, originalFilename: null, size: null };
        }
      })
    );

    return res.json({ documents });
  } catch (error) {
    return next(error);
  }
});

/**
 * @route GET /documents/:id
 */
router.get('/documents/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing document ID.' });
    }
    const doc = await getDocument(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }
    return res.json(doc);
  } catch (error) {
    return next(error);
  }
});

export const documentsRouter = router;
