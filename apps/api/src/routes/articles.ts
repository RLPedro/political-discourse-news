import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /articles?term=climate
router.get('/', async (req, res) => {
  const term = (req.query.term as string | undefined)?.toLowerCase() ?? '';
  const where = term
    ? { title: { contains: term, mode: 'insensitive' } }
    : {};
  const articles = await prisma.article.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });
  res.json({ items: articles });
});

export default router;
