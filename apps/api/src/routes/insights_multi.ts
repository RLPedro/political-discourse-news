import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

router.get('/sentiment-multi', async (req, res) => {
  const schema = z.object({
    terms: z.string().default(''),
    range: z.string().default('7d'),
    country: z.enum(['SE','PT']).optional(),
  });

  const { terms, range, country } = schema.parse({
    terms: req.query.terms ?? '',
    range: req.query.range ?? '7d',
    country: req.query.country,
  });

  const termList = terms
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const m = range.match(/^(\d+)\s*d$/i);
  const days = m ? Math.max(1, parseInt(m[1], 10)) : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  async function seriesFor(term: string) {
    const articles = await prisma.article.findMany({
      where: {
        publishedAt: { gte: since },
        ...(term ? { title: { contains: term, mode: 'insensitive' } } : {}),
        ...(country ? { country } : {}),
      },
      include: { analyses: true },
    });
    const byDay: Record<string, number[]> = {};
    for (const a of articles) {
      if (!a.analyses.length) continue;
      const day = a.publishedAt.toISOString().slice(0, 10);
      byDay[day] ||= [];
      for (const an of a.analyses) byDay[day].push(an.sentiment);
    }
    const points = Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, vals]) => ({
        date,
        avgSentiment: vals.reduce((s, x) => s + x, 0) / vals.length,
      }));
    return { term, points };
  }

  const data = await Promise.all(termList.map(seriesFor));
  res.json({ range: `${days}d`, series: data });
});

export default router;
