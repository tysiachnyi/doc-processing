# Document processing app

Tech stack: Node.js, Express, TypeScript, Redis, BullMQ, Zod, Docker.

## What this does

- Upload a document (PDF, JPEG, PNG) via HTTP.
- Enqueue async processing with BullMQ (OCR -> Extract -> Validate -> Persist).
- Maintain per-document status in Redis: processing, processed, validated, validation_failed, done, failed.
- Persist raw file on disk and metadata in Redis.

## Quick start

Docker (recommended):

1. Build and start services

```sh
docker compose build
docker compose up
```

2. API available at http://localhost:3000

3. Upload a file

```sh
curl -F "document=@assets/untitled.pdf" http://localhost:3000/upload
```

4. List docs (IDs)

```sh
curl http://localhost:3000/documents
```

5. List summaries

```sh
curl "http://localhost:3000/documents?summary=1"
```

6. Get a document by id

```sh
curl http://localhost:3000/documents/<id>
```

Env vars:

- PORT: API port (default 3000)
- REDIS_URL: e.g. redis://localhost:6379 (docker-compose sets to redis://redis:6379)
- STORAGE_DIR: local file storage dir (default ./storage)

## API

- GET /health
  - returns: { success, redis }

- POST /upload
  - form-data field: document (file)
  - returns: { documentId, status, createdAt }

- GET /documents
  - returns: { ids: string[] }

- GET /documents?summary=1
  - returns: { documents: { id, status, originalFilename, size }[] }

- GET /documents/:id
  - returns: all metadata for a document (status, filenames, metadata when available)

## Processing pipeline

1. Upload: saves file to STORAGE_DIR and creates Redis hash doc:<id> with status "uploaded".
2. Queue: adds a job with attempts=3 and exponential backoff.
3. Worker steps:
   - processing -> simulateOCR -> processed
   - extractInvoiceData -> validate (Zod)
   - if invalid: validation_failed + save metadata + job fails (will retry)
   - if valid: validated -> save metadata -> done
   - on ultimate failure: status set to failed and job moved to dead-letter queue
