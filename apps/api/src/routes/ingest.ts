import { Router } from 'express';
import { z } from 'zod';
// import { ingestFromNewsAPI } from '../services/ingestion.js';
import { ingestFromNewsAPIWithEntities } from '../services/ingestion_with_entities.js';

const router = Router();

router.post('/fetch', async (req, res) => {
  const schema = z.object({
    term: z.string().min(2),
    days: z.number().int().min(1).max(30).optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    country: z.enum(['SE', 'PT']).optional(),
    domainsCsv: z.string().optional(),
  });

  try {
    const args = schema.parse(req.body ?? {});
    // const result = await ingestFromNewsAPI(args);
    const result = await ingestFromNewsAPIWithEntities(args);
    res.json({ ok: true, ...result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message || 'Ingestion failed' });
  }
});

export default router;
