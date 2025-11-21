import cron from 'node-cron';
import { ingestFromNewsAPIWithEntities } from './services/ingestion_with_entities.js';

const TERMS = (process.env.INGEST_TERMS || 'climate,economy,policy,safety')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const COUNTRIES = ((process.env.INGEST_COUNTRIES || 'SE,PT')
  .split(',')
  .map(s => s.trim().toUpperCase()) as ('SE' | 'PT')[]);

const DAYS = Number(process.env.INGEST_DAYS || 2);
const PAGE = Number(process.env.INGEST_PAGE_SIZE || 50);
const DOMAINS = process.env.INGEST_DOMAINS || '';

export const startScheduler = () => {
  cron.schedule('5 * * * *', async () => {
    const started = new Date().toISOString();
    console.log(`[scheduler] ${started} starting hourly ingestion...`);
    for (const country of COUNTRIES) {
      for (const term of TERMS) {
        try {
          const res = await ingestFromNewsAPIWithEntities({
            term,
            days: DAYS,
            pageSize: PAGE,
            country,
            domainsCsv: DOMAINS || undefined,
          });
          console.log('[scheduler]', country, term, res);
        } catch (e) {
          console.error('[scheduler] error', country, term, (e as Error).message);
        }
      }
    }
    console.log('[scheduler] done.');
  }, { timezone: 'Europe/Stockholm' });

  console.log('[scheduler] hourly task scheduled:', `terms=[${TERMS.join(', ')}] countries=[${COUNTRIES.join(', ')}]`);
}
