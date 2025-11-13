import 'dotenv/config';
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { articlesRouter } from './routes/articles.js';
import insightsRouter from './routes/insights.js';
import insightsMultiRouter from './routes/insights_multi.js';
import { ingestRouter } from './routes/ingest.js';
import { entitiesRouter } from './routes/entities.js';
import streamRouter from './routes/stream.js'
import { startScheduler } from './scheduler.js'

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());

app.use(cors({ origin: [/\.vercel\.app$/, 'http://localhost:5173'] }));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.use('/articles', articlesRouter);
app.use('/insights', insightsRouter);
app.use('/insights', insightsMultiRouter);
app.use('/ingest', ingestRouter);
app.use('/entities', entitiesRouter);
app.use('/stream', streamRouter);

if (process.env.ENABLE_INGESTION === 'true') {
  startScheduler();
}

app.listen(port, '0.0.0.0', () => console.log(`API on ${port}`));
