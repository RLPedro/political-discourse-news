import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// GET /insights/sentiment?term=&bucket=day
router.get('/sentiment', async (req, res) => {
  const schema = z.object({
    term: z.string().default(''),
    bucket: z.enum(['day']).default('day')
  });
  const { term } = schema.parse({
    term: (req.query.term as string) ?? '',
    bucket: (req.query.bucket as string) ?? 'day'
  });

  // naive filter by term in title for demo
  const articles = await prisma.article.findMany({
    where: term ? { title: { contains: term, mode: 'insensitive' } } : {},
    include: { analyses: true }
  });

  const byDay = new Map<string, number[]>();
  for (const a of articles) {
    const day = a.publishedAt.toISOString().slice(0, 10);
    const sentiments = a.analyses.map(x => x.sentiment);
    if (!sentiments.length) continue;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(...sentiments);
  }

  const points = Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({
      date,
      avgSentiment: vals.reduce((s, x) => s + x, 0) / vals.length
    }));

  res.json({ term, points });
});

export default router;
