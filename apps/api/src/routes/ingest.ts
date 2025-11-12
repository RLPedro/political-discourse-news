import { Router } from 'express';
import { ingestNews } from '../services/ingestion.js';

export const ingestRouter = Router();

ingestRouter.post('/', async (req, res) => {
  const { term, days = 3, pageSize = 50, country = 'SE', domainsCsv } = req.body || {};
  try {
    const result = await ingestNews({
      term: String(term ?? 'climate'),
      days: Number(days),
      pageSize: Number(pageSize),
      country: (country as 'SE'|'PT') ?? 'SE',
      domainsCsv: domainsCsv ? String(domainsCsv) : undefined,
    });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'ingestion failed' });
  }
});
