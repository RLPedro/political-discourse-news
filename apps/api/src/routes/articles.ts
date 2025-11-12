import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
export const articlesRouter = Router();

articlesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const country = (req.query.country as string | undefined)?.toUpperCase();

    let where: Prisma.ArticleWhereInput | undefined;

    if (q || country) {
      where = {};

      if (q) {
        where.title = {
          contains: q,
          mode: 'insensitive' as Prisma.QueryMode,
        };
      }

      if (country) {
        where.country = country;
      }
    }

    const articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });

    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
