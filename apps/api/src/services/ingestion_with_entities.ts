import { PrismaClient } from '@prisma/client';
import { sentiment01 } from '../utils/sentiment.js';
import { extractEntities } from '../utils/entities.js';
import { bus } from '../events/bus.js';

const prisma = new PrismaClient();

type IngestOptions = {
  term: string;
  days?: number;
  pageSize?: number;
  domainsCsv?: string;
  country?: 'SE' | 'PT';
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

const countryQueryPart = (country?: 'SE' | 'PT') => {
  if (country === 'PT') {
    return '(Portugal OR Portuguese OR Lisbon OR Lisboa OR Porto)';
  }
  return '(Sweden OR Swedish OR Stockholm OR Gothenburg OR Göteborg OR Malmö OR Malmo)';
}

export const ingestFromNewsAPIWithEntities = async (opts: IngestOptions) => {
  const {
    term,
    days = 7,
    pageSize = 50,
    domainsCsv,
    country = 'SE',
  } = opts;

  if (!process.env.NEWSAPI_KEY) {
    throw new Error('Missing NEWSAPI_KEY in environment');
  }

  const fromISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const baseParams = new URLSearchParams({
    q: `(${term}) AND ${countryQueryPart(country)}`,
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: String(pageSize),
    from: fromISO,
    apiKey: process.env.NEWSAPI_KEY!,
  });

  if (domainsCsv && domainsCsv.trim()) baseParams.set('domains', domainsCsv.trim());

  const MAX_PAGES = Number(process.env.NEWSAPI_MAX_PAGES || 3);

  let analyzed = 0;
  let fetched = 0;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams(baseParams);
    params.set('page', String(page));

    const url = `https://newsapi.org/v2/everything?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`NewsAPI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const items: NewsArticle[] = data.articles ?? [];
    if (!items.length) break;

    fetched += items.length;

    for (const a of items) {
      if (!a.url || !a.title) continue;

      const source = a.source?.name || 'Unknown';
      const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date();
      const content = a.content || a.description || '';

      const article = await prisma.article.upsert({
        where: { url: a.url },
        create: {
          source,
          title: a.title,
          url: a.url,
          publishedAt,
          author: a.author || undefined,
          rawText: content || undefined,
          country,
        },
        update: {
          source,
          title: a.title,
          publishedAt,
          author: a.author || undefined,
          rawText: content || undefined,
          country,
        },
      });

      const s = sentiment01([a.title, a.description].filter(Boolean).join(' — '));

      const analysis = await prisma.analysis.create({
        data: {
          articleId: article.id,
          sentiment: s,
          topics: [term.toLowerCase()],
          entities: {},
        },
      });

      const ents = extractEntities([a.title, content].filter(Boolean).join(' '), 25);
      for (const ent of ents) {
        const entity = await prisma.entity.upsert({
          where: { name: ent.name },
          create: { name: ent.name, type: ent.type },
          update: { type: ent.type },
        });
        await prisma.entityOccurrence.create({
          data: {
            entityId: entity.id,
            analysisId: analysis.id,
            count: 1,
          },
        });
      }

      bus.emit('event', {
        type: 'ANALYSIS_CREATED',
        payload: {
          articleId: article.id,
          analysisId: analysis.id,
          sentiment: s,
          title: a.title,
          publishedAt: publishedAt.toISOString(),
        },
      });

      analyzed += 1;
    }
  }

  return { term, country, fetched, analyzed };
}
