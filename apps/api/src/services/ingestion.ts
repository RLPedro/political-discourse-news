import { PrismaClient } from '@prisma/client';
import { sentiment01 } from '../utils/sentiment.js';

const prisma = new PrismaClient();

export type IngestOptions = {
  term: string;
  days?: number;
  pageSize?: number;         
  country?: 'SE' | 'PT';
  domainsCsv?: string;
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

const newsCountryQuery = (country?: 'SE' | 'PT') => {
  if (country === 'PT') {
    return '(Portugal OR Portuguese OR Lisbon OR Lisboa OR Porto)';
  }
  return '(Sweden OR Swedish OR Stockholm OR Gothenburg OR Göteborg OR Malmö OR Malmo)';
};

export const ingestNews = async (opts: IngestOptions) => {
  const {
    term,
    days = 3,
    pageSize = 50,
    country = 'SE',
    domainsCsv,
  } = opts;

  if (!process.env.NEWSAPI_KEY) {
    throw new Error('Missing NEWSAPI_KEY in environment');
  }

  const now = Date.now();
  const TO = new Date(now - 24 * 60 * 60 * 1000);
  const FROM = new Date(TO.getTime() - days * 24 * 60 * 60 * 1000);

  const base = new URLSearchParams({
    q: `(${term}) AND ${newsCountryQuery(country)}`,
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: String(Math.min(100, Math.max(1, pageSize))),
    from: FROM.toISOString(),
    to: TO.toISOString(),
    apiKey: process.env.NEWSAPI_KEY!,
  });
  if (domainsCsv && domainsCsv.trim()) base.set('domains', domainsCsv.trim());

  const MAX_PAGES = Number(process.env.NEWSAPI_MAX_PAGES || 2);

  let fetched = 0;
  let analyzed = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams(base);
    params.set('page', String(page));

    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`NewsAPI error ${res.status}: ${err}`);
    }

    const json = await res.json();
    const items: NewsArticle[] = json.articles ?? [];
    if (!items.length) break;

    fetched += items.length;

    for (const a of items) {
      try {
        if (!a.url || !a.title) continue;

        const source = a.source?.name || 'Unknown';
        const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date();
        const rawText = a.content || a.description || undefined;

        const article = await prisma.article.upsert({
          where: { url: a.url },
          create: {
            source,
            title: a.title,
            url: a.url,
            publishedAt,
            author: a.author || undefined,
            rawText,
            country,
          },
          update: {
            source,
            title: a.title,
            publishedAt,
            author: a.author || undefined,
            rawText,
            country,
          },
        });

        const basis = [a.title, a.description].filter(Boolean).join(' — ');
        const s = await sentiment01(basis);

        await prisma.analysis.create({
          data: {
            articleId: article.id,
            sentiment: s,
            topics: [term.toLowerCase()],
            entities: {},
          },
        });

        analyzed += 1;

        const delayMs = Number(process.env.INGEST_SLEEP_MS || 0);
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
      } catch (e) {
        console.warn('[ingest] article skipped:', (e as Error).message);
      }
    }
  }

  return { term, country, fetched, analyzed };
}
