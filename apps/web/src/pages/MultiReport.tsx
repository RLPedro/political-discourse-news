import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = 'http://localhost:4000';

const COLORS = ['#2563eb','#16a34a','#dc2626','#9333ea','#ca8a04','#0891b2'];

type Pt = { date: string; avgSentiment: number };
type Series = { term: string; points: Pt[] };
type MultiResponse = { range: string; series: Series[] };

type SourceAgg = { source: string; count: number };

export default function MultiReport() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<MultiResponse | null>(null);
  const [sources, setSources] = useState<SourceAgg[]>([]);

  const terms = (sp.get('terms') ?? 'climate,economy,policy,safety')
    .split(',').map(s => s.trim()).filter(Boolean);
  const range = sp.get('range') ?? '7d';
  const country = (sp.get('country') as 'SE'|'PT') ?? 'SE';

  useEffect(() => {
    axios.get(`${API_BASE}/insights/sentiment-multi`, { params: { terms: terms.join(','), range, country } })
      .then(r => setData(r.data))
      .catch(console.error);
  }, [terms.join(','), range, country]);

  useEffect(() => {
    Promise.all(terms.map(t =>
      axios.get(`${API_BASE}/insights/sentiment`, { params: { term: t, range, country } })
        .then(r => r.data.points as { date: string, sources?: {source:string,count:number}[] }[])
    )).then(all => {
      const tally = new Map<string, number>();
      for (const termPoints of all) {
        for (const p of termPoints) {
          for (const s of (p.sources ?? [])) {
            tally.set(s.source, (tally.get(s.source) ?? 0) + s.count);
          }
        }
      }
      const agg = Array.from(tally.entries()).map(([source, count]) => ({ source, count }))
        .sort((a,b) => b.count - a.count);
      setSources(agg);
    }).catch(console.error);
  }, [terms.join(','), range, country]);

  const chartData = useMemo(() => {
    const map = new Map<string, any>();
    for (const s of (data?.series ?? [])) {
      for (const p of s.points) {
        const row = map.get(p.date) ?? { date: p.date };
        row[s.term] = p.avgSentiment;
        map.set(p.date, row);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const seriesNames = (data?.series ?? []).map(s => s.term);

  function setCountry(next: 'SE'|'PT') {
    sp.set('country', next);
    setSp(sp, { replace: true });
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Multi-Term Report</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Terms: <span className="font-mono">{terms.join(', ')}</span> | Range: {range}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCountry('SE')} className={`btn ${country==='SE' ? '' : 'opacity-70'}`}>Sweden</button>
          <button onClick={() => setCountry('PT')} className={`btn ${country==='PT' ? '' : 'opacity-70'}`}>Portugal</button>
          <Link className="btn" to="/">Reload</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sentiment Over Time</h2>
            <div className="hidden md:flex items-center gap-4">
              {seriesNames.map((name, i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                {seriesNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    strokeWidth={2}
                    dot={false}
                    stroke={COLORS[i % COLORS.length]}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500">
            Country: <strong>{country}</strong>. Overlay shows daily avg sentiment for each term.
          </p>
        </div>

        <div className="card space-y-3">
          <h3 className="text-lg font-semibold">Sources</h3>
          <ul className="text-sm space-y-2 max-h-80 overflow-auto pr-2">
            {sources.slice(0, 50).map((s) => (
              <li key={s.source} className="flex justify-between gap-3">
                <span className="truncate">{s.source}</span>
                <span className="tabular-nums text-gray-500">{s.count}</span>
              </li>
            ))}
            {sources.length === 0 && <li className="text-gray-500">No sources yet for this range.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
