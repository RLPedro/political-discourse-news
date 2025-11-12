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

type EntityMeta = {
  id: number;
  name: string;
  type: string;
};

entitiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const countryQ = (req.query.country as string | undefined)?.toUpperCase();
    const takeParam = Number(req.query.take ?? 100);
    const take = Math.min(Math.max(takeParam, 1), 500);

    const grouped = await prisma.entityOccurrence.groupBy({
      by: ['entityId'],
      where: countryQ
        ? {
            Analysis: {
              is: {
                Article: {
                  is: { country: countryQ },
                },
              },
            },
          }
        : undefined,
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take,
    });

    const ids: number[] = grouped.map((g: { entityId: number }) => g.entityId);
    const rows = await prisma.entity.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, type: true },
    });

    const metas: EntityMeta[] = rows.map((e): EntityMeta => ({
      id: e.id,
      name: e.name,
      type: e.type,
    }));
    const emap: Map<number, EntityMeta> = new Map(
      metas.map((m: EntityMeta) => [m.id, m] as const)
    );

    const payload: EntityAgg[] = grouped.map(
      (g: { entityId: number; _sum: { count: number | null } }): EntityAgg => {
        const meta: EntityMeta | undefined = emap.get(g.entityId);
        return {
          id: g.entityId,
          name: meta?.name ?? '(unknown)',
          type: meta?.type ?? '',
          mentions: g._sum.count ?? 0,
        };
      }
    );

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
