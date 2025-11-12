import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

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
    const takeParam = Number(req.query.take ?? 100);
    const take = Math.min(Math.max(Number.isFinite(takeParam) ? takeParam : 100, 1), 500);

    const rows = await prisma.$queryRaw<EntityAgg[]>`
      SELECT
        e.id::int           AS id,
        e.name              AS name,
        e.type              AS type,
        COALESCE(SUM(eo.count), 0)::int AS mentions
      FROM "EntityOccurrence" AS eo
      JOIN "Entity"   AS e  ON e.id  = eo."entityId"
      JOIN "Analysis" AS an ON an.id = eo."analysisId"
      JOIN "Article"  AS ar ON ar.id = an."articleId"
      ${countryQ ? Prisma.sql`WHERE ar.country = ${countryQ}` : Prisma.empty}
      GROUP BY e.id, e.name, e.type
      ORDER BY mentions DESC
      LIMIT ${take}
    `;

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

