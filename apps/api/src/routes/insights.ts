import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.get('/sentiment', async (req, res) => {
  const schema = z.object({
    term: z.string().default(''),
    bucket: z.enum(['day']).default('day'),
    range: z.string().default('7d'),
    country: z.enum(['SE','PT']).optional(),
  });

  const { term, range, country } = schema.parse({
    term: req.query.term ?? '',
    range: req.query.range ?? '7d',
    country: req.query.country,
  });

  const m = range.match(/^(\d+)\s*d$/i);
  const days = m ? Math.max(1, parseInt(m[1], 10)) : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      publishedAt: { gte: since },
      ...(term ? { title: { contains: term, mode: 'insensitive' } } : {}),
      ...(country ? { country } : {}),
    },
    include: { analyses: true },
  });

  const byDay: Record<string, { sentiments: number[]; sources: Record<string, number> }> = {};

  for (const a of articles) {
    if (!a.analyses.length) continue;
    const day = a.publishedAt.toISOString().slice(0, 10);
    byDay[day] ||= { sentiments: [], sources: {} };
    for (const an of a.analyses) {
      byDay[day].sentiments.push(an.sentiment);
    }
    byDay[day].sources[a.source] = (byDay[day].sources[a.source] || 0) + 1;
  }

  const points = Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date,
      avgSentiment: v.sentiments.reduce((s, x) => s + x, 0) / v.sentiments.length,
      sources: Object.entries(v.sources)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count),
    }));

  res.json({ term, range: `${days}d`, points });
});

export default router;
