import cron from 'node-cron'
import { ingestFromNewsAPIWithEntities } from './services/ingestion_with_entities.js'

const TERMS = (process.env.INGEST_TERMS || 'climate,economy,policy').split(',').map(s => s.trim()).filter(Boolean)
const COUNTRY = (process.env.INGEST_COUNTRY as 'SE'|'PT') || 'SE';
const DOMAINS = process.env.INGEST_DOMAINS || '';
const DAYS = Number(process.env.INGEST_DAYS || 2)
const PAGE = Number(process.env.INGEST_PAGE_SIZE || 20)

export const startScheduler = () => {
  cron.schedule('5 * * * *', async () => {
    console.log('[scheduler] starting hourly ingestion run...')
    for (const term of TERMS) {
      try {
        const res = await ingestFromNewsAPIWithEntities({
          term, days: DAYS, pageSize: PAGE,
          country: COUNTRY,
          domainsCsv: DOMAINS || undefined,
        });        
        console.log('[scheduler]', term, res)
      } catch (e) {
        console.error('[scheduler]', term, e)
      }
    }
  }, { timezone: 'Europe/Stockholm' })

  console.log('[scheduler] hourly task scheduled for terms:', TERMS.join(', '))
}
