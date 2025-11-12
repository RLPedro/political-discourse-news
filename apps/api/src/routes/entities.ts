import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const entitiesRouter = Router();

type EntityAgg = {
  id: number;
  name: string;
  type: string;
  mentions: number;
};

entitiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const countryQ = (req.query.country as string | undefined)?.toUpperCase();
    const take = Math.min(Math.max(Number(req.query.take ?? 100), 1), 500);

    const grouped = await prisma.entityOccurrence.groupBy({
      by: ['entityId'],
      where: countryQ
        ? { Analysis: { Article: { country: countryQ } } }
        : undefined,
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take,
    });

    const ids = grouped.map((g) => g.entityId);
    const entities = await prisma.entity.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, type: true },
    });
    const emap = new Map(entities.map((e) => [e.id, e]));

    const payload: EntityAgg[] = grouped.map((g) => {
      const meta = emap.get(g.entityId);
      return {
        id: g.entityId,
        name: meta?.name ?? '(unknown)',
        type: meta?.type ?? '',
        mentions: g._sum.count ?? 0,
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
