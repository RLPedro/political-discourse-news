import { PrismaClient } from '@prisma/client'
import { sentiment01 } from '../utils/sentiment.js'
import { extractEntities } from '../utils/entities.js'
import { bus } from '../events/bus.js'

const prisma = new PrismaClient()

type IngestOptions = {
  term: string;
  days?: number;
  pageSize?: number;
  domainsCsv?: string;
  country?: 'SE' | 'PT';
};

function countryQueryPart(country?: 'SE'|'PT') {
  if (country === 'PT') {
    return '(Portugal OR Portuguese OR Lisbon OR Lisboa OR Porto)'
  }
  return '(Sweden OR Swedish OR Stockholm OR Gothenburg OR Göteborg OR Malmö OR Malmo)'
}

type NewsArticle = {
  source?: { id?: string | null; name?: string | null }
  author?: string | null
  title?: string | null
  description?: string | null
  url?: string | null
  urlToImage?: string | null
  publishedAt?: string | null
  content?: string | null
}

export async function ingestFromNewsAPIWithEntities(opts: IngestOptions) {
  const { term, days = 3, pageSize = 20, domainsCsv, country = 'SE' } = opts;
  if (!process.env.NEWSAPI_KEY) {
    throw new Error('Missing NEWSAPI_KEY in environment')
  }
  const fromISO = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const params = new URLSearchParams({
    q: `(${term}) AND ${countryQueryPart(country)}`,
    sortBy: 'publishedAt',
    language: 'en',
    pageSize: String(pageSize),
    from: new Date(Date.now() - days*24*60*60*1000).toISOString(),
    apiKey: process.env.NEWSAPI_KEY!,
  });
  if (domainsCsv) params.set('domains', domainsCsv);

  const res = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`);
  if (!res.ok) throw new Error(`NewsAPI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const items: NewsArticle[] = data.articles ?? [];

  let analyzed = 0;
  for (const a of items) {
    if (!a.url || !a.title) continue;
    const source = a.source?.name || 'Unknown';
    const publishedAt = a.publishedAt ? new Date(a.publishedAt) : new Date();
    const content = a.content || a.description || '';

    const article = await prisma.article.upsert({
      where: { url: a.url },
      create: { source, title: a.title, url: a.url, publishedAt, author: a.author || undefined, rawText: content || undefined, country },
      update: { source, title: a.title, publishedAt, author: a.author || undefined, rawText: content || undefined, country },
    });

    const s = sentiment01([a.title, a.description].filter(Boolean).join(' — '));
    const analysis = await prisma.analysis.create({
      data: { articleId: article.id, sentiment: s, topics: [term.toLowerCase()], entities: {} },
    });

    const ents = extractEntities([a.title, content].filter(Boolean).join(' '), 25)
    for (const ent of ents) {
      const entity = await prisma.entity.upsert({
        where: { name: ent.name },
        create: { name: ent.name, type: ent.type },
        update: { type: ent.type },
      })
      await prisma.entityOccurrence.create({
        data: { entityId: entity.id, analysisId: analysis.id, count: 1 },
      })
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
    })

    analyzed += 1
  }

  return { term, country, fetched: items.length, analyzed }
}
