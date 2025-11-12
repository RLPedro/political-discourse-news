import 'dotenv/config';
import type { Request, Response } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import articlesRouter from './routes/articles.js';
import insightsRouter from './routes/insights.js';
import insightsMultiRouter from './routes/insights_multi.js';
import { ingestRouter } from './routes/ingest.js';
import entitiesRouter from './routes/entities.js'
import streamRouter from './routes/stream.js'
import { startScheduler } from './scheduler.js'

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.use(helmet());

// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
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
app.use('/insights/entities', entitiesRouter);
app.use('/stream', streamRouter);

startScheduler();

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
