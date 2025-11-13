import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

type Point = { date: string; avgSentiment: number };
type Series = { term: string; points: Point[] };

const parseRange = (range?: string): { label: string; days: number } => {
  const raw = (range ?? "7d").trim();
  const m = /^(\d+)([dwm])$/.exec(raw);

  if (!m) {
    return { label: "7d", days: 7 };
  }

  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) {
    return { label: "7d", days: 7 };
  }

  const unit = m[2];
  if (unit === "d") return { label: raw, days: n };
  if (unit === "w") return { label: raw, days: n * 7 };
  if (unit === "m") return { label: raw, days: n * 30 };

  return { label: "7d", days: 7 };
}


router.get("/sentiment-multi", async (req, res, next) => {

  try {
    const termsParam = (req.query.terms as string | undefined) ?? "";
    const terms = (termsParam || "climate,economy,policy,safety")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const country = (req.query.country as "SE" | "PT" | undefined) ?? "SE";
    const { label, days } = parseRange(req.query.range as string | undefined);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const series: Series[] = [];

    for (const term of terms) {
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

      const byDate = new Map<string, { sum: number; count: number }>();

      for (const a of analyses) {
        const d = a.Article?.publishedAt.toISOString().slice(0, 10);
        if (!d) continue;
        const e = byDate.get(d) ?? { sum: 0, count: 0 };
        e.sum += a.sentiment;
        e.count += 1;
        byDate.set(d, e);
      }

      const points: Point[] = Array.from(byDate.entries())
        .map(([date, { sum, count }]) => ({
          date,
          avgSentiment: count ? sum / count : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      series.push({ term, points });
    }

    res.json({ range: label, series });
  } catch (err) {
    next(err);
  }
});

export default router;
