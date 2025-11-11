import { PrismaClient } from '@prisma/client';
import { sentiment01 } from '../utils/sentiment.js';

const prisma = new PrismaClient();

type IngestOptions = {
  term: string;
  days?: number;
  pageSize?: number;
};

type NewsArticle = {
  source?: { id?: string | null; name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
  content?: string | null;
};

export async function ingestFromNewsAPI(opts: IngestOptions) {
  const { term, days = 3, pageSize = 20 } = opts;
  if (!process.env.NEWSAPI_KEY) {
    throw new Error('Missing NEWSAPI_KEY in environment');
  }
  const fromISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const params = new URLSearchParams({
    q: term,
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: String(pageSize),
    from: fromISO,
    apiKey: process.env.NEWSAPI_KEY!,
  });
  const url = `https://newsapi.org/v2/everything?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NewsAPI error ${res.status}: ${text}`);
  }
  const data = await res.json();
  const items: NewsArticle[] = data.articles ?? [];

  let analyzed = 0;

  for (const a of items) {
    if (!a.url || !a.title) continue;
    const source = a.source?.name || 'Unknown';
    const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date();

    const article = await prisma.article.upsert({
      where: { url: a.url },
      create: {
        source,
        title: a.title,
        url: a.url,
        publishedAt,
        author: a.author || undefined,
        rawText: a.content || a.description || undefined,
      },
      update: {
        source,
        title: a.title,
        publishedAt,
        author: a.author || undefined,
        rawText: a.content || a.description || undefined,
      },
    });

    // Compute sentiment from title + description
    const basis = [a.title, a.description].filter(Boolean).join(' — ');
    const s = sentiment01(basis);

    await prisma.analysis.create({
      data: {
        articleId: article.id,
        sentiment: s,
        topics: [term.toLowerCase()],
        entities: { terms: [term.toLowerCase()] },
      },
    });
    analyzed += 1;
  }

  return { term, fetched: items.length, analyzed };
}
