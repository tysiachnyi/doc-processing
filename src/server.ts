interface HttpError extends Error {
  status?: number;
}
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { documentsRouter } from './routes/documents';

dotenv.config();

const app = express();
app.use(morgan('dev'));

app.use(express.json({ limit: '1mb' }));
app.use('/', documentsRouter);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`API running on: http://localhost:${port}`));

app.use(
  (err: HttpError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
  }
);

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT', () => server.close(() => process.exit(0)));
