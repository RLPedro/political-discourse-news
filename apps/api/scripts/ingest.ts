#!/usr/bin/env tsx
import 'dotenv/config';
// import { ingestFromNewsAPI } from '../src/services/ingestion.js';
import { ingestFromNewsAPIWithEntities} from '../src/services/ingestion_with_entities.js'

function parseArgs(argv: string[]) {
  const args: any = {};
  for (let i=0; i<argv.length; i++) {
    const a = argv[i];
    if (a === '--term') args.term = argv[++i];
    else if (a === '--days') args.days = Number(argv[++i]);
    else if (a === '--pageSize') args.pageSize = Number(argv[++i]);
    else if (a === '--country') args.country = argv[++i];         // ⬅️ new
    else if (a === '--domains') args.domainsCsv = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.term) {
    console.error('Usage: pnpm ingest --term <query> [--days 5] [--pageSize 30]');
    process.exit(1);
  }
  // const out = await ingestFromNewsAPI(args);
  const out = await ingestFromNewsAPIWithEntities(args);
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
