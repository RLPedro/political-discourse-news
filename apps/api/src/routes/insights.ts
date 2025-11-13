import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

type Point = {
  date: string;
  avgSentiment: number;
  sources: { source: string; count: number }[];
};

const parseRange = (range?: string): { label: string; days: number } => {
  const r = range ?? "7d";

  if (r.endsWith("d")) {
    const n = Number(r.slice(0, -1));
    return { label: r, days: Number.isFinite(n) && n > 0 ? n : 7 };
  }

  if (r.endsWith("w")) {
    const n = Number(r.slice(0, -1));
    return { label: r, days: (Number.isFinite(n) && n > 0 ? n : 1) * 7 };
  }

  if (r.endsWith("m")) {
    const n = Number(r.slice(0, -1));
    return { label: r, days: (Number.isFinite(n) && n > 0 ? n : 1) * 30 };
  }

  return { label: "7d", days: 7 };
}

router.get("/sentiment", async (req, res, next) => {
  try {
    const term = ((req.query.term as string | undefined) ?? "climate")
      .trim()
      .toLowerCase();

    const country = (req.query.country as "SE" | "PT" | undefined) ?? "SE";
    const { label, days } = parseRange(req.query.range as string | undefined);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const analyses = await prisma.analysis.findMany({
      where: {
        topics: { has: term },
        Article: {
          country,
          publishedAt: { gte: since },
        },
      },
      include: { Article: true },
      orderBy: { Article: { publishedAt: "asc" } },
    });

    const byDate = new Map<
      string,
      { sum: number; count: number; sources: Map<string, number> }
    >();

    for (const a of analyses) {
      const art = a.Article;
      if (!art) continue;
      const day = art.publishedAt.toISOString().slice(0, 10);

      let bucket = byDate.get(day);
      if (!bucket) {
        bucket = { sum: 0, count: 0, sources: new Map() };
        byDate.set(day, bucket);
      }

      bucket.sum += a.sentiment;
      bucket.count += 1;
      const sName = art.source;
      bucket.sources.set(sName, (bucket.sources.get(sName) ?? 0) + 1);
    }

    const points: Point[] = Array.from(byDate.entries())
      .map(([date, b]) => ({
        date,
        avgSentiment: b.count ? b.sum / b.count : 0,
        sources: Array.from(b.sources.entries()).map(([source, count]) => ({
          source,
          count,
        })),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ term, range: label, points });
  } catch (err) {
    next(err);
  }
});

export default router;
