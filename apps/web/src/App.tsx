import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://localhost:4000';
const COLORS = ['#2563eb','#16a34a','#dc2626','#9333ea','#ca8a04','#0891b2'];
const defaultTopics = ['climate','economy','policy','safety'];

type Pt = { date: string; avgSentiment: number };
type Series = { term: string; points: Pt[] };
type MultiResponse = { range: string; series: Series[] };
type SourceAgg = { source: string; count: number };

const clampDays = (d: number) => Math.min(Math.max(1, d), 28);
const daysFromRange = (r: string): number => {
  const m = /^(\d+)\s*d$/i.exec(r);
  return clampDays(m ? parseInt(m[1], 10) : 7);
};
const rangeOptions = [1,2,3,4].map(w => ({ value: `${w*7}d`, label: `${w} w` }));
const buildDateSpan = (days: number): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

const useQueryState = () => {
  const [ver, setVer] = useState(0);
  useEffect(() => {
    const onPop = () => setVer(v => v + 1);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const sp = useMemo(() => new URLSearchParams(window.location.search), [ver]);
  const setSp = (next: URLSearchParams) => {
    const qs = next.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState({}, '', url);
    setVer(v => v + 1);
  };
  return [sp, setSp] as const;
}

const App = () => {
  const [sp, setSp] = useQueryState();

  const topics = useMemo(() => {
    const q = sp.get('topics');
    const list = q ? q.split(',') : defaultTopics;
    return Array.from(new Set(list.map(s => s.trim().toLowerCase()).filter(Boolean)));
  }, [sp.toString()]);

  const rawRange = sp.get('range') ?? '7d';
  const rangeDays = daysFromRange(rawRange);
  const range = `${rangeDays}d`;
  const country = (sp.get('country') as 'SE'|'PT') ?? 'SE';

  const [data, setData] = useState<MultiResponse | null>(null);
  const [sources, setSources] = useState<SourceAgg[]>([]);

  const lastUpdateRef = useRef<Date | null>(null);
  const [lastUpdatedText, setLastUpdatedText] = useState('');
  const setNow = () => { lastUpdateRef.current = new Date(); setLastUpdatedText(lastUpdateRef.current.toLocaleTimeString()); };

  useEffect(() => {
    axios.get(`${API_BASE}/insights/sentiment-multi`, { params: { terms: topics.join(','), range, country } })
      .then(r => setData(r.data))
      .catch(console.error);
  }, [topics.join(','), range, country]);

  useEffect(() => { setNow(); }, [data]);

  useEffect(() => {
    const es = new EventSource('http://localhost:4000/stream/ingestion');
    const onEvt = () => {
      axios.get(`${API_BASE}/insights/sentiment-multi`, { params: { terms: topics.join(','), range, country } })
        .then(r => { setData(r.data); setNow(); })
        .catch(console.error);
    };
    es.addEventListener('ANALYSIS_CREATED', onEvt);
    return () => es.close();
  }, [topics.join(','), range, country]);

  useEffect(() => {
    Promise.all(
      topics.map(t =>
        axios.get(`${API_BASE}/insights/sentiment`, { params: { term: t, range, country } })
          .then(r => r.data.points as { date: string; sources?: { source: string; count: number }[] }[])
      )
    ).then(all => {
      const tally = new Map<string, number>();
      for (const termPoints of all) {
        for (const p of termPoints) for (const s of p.sources ?? []) {
          tally.set(s.source, (tally.get(s.source) ?? 0) + s.count);
        }
      }
      setSources(Array.from(tally, ([source, count]) => ({ source, count })).sort((a,b)=>b.count-a.count));
    }).catch(console.error);
  }, [topics.join(','), range, country]);

  const chartData = useMemo(() => {
    const dates = buildDateSpan(rangeDays);
    const byTerm = new Map<string, Map<string, number>>();
    for (const s of (data?.series ?? [])) {
      const m = new Map<string, number>();
      for (const p of s.points) m.set(p.date, p.avgSentiment);
      byTerm.set(s.term, m);
    }
    return dates.map(date => {
      const row: any = { date };
      for (const t of topics) row[t] = byTerm.get(t)?.get(date) ?? null;
      return row;
    });
  }, [data, topics, rangeDays]);

  const empty = new Set((data?.series ?? []).filter(s => s.points.length === 0).map(s => s.term));

  const setRangeParam = (next: string) => {
    const nextSp = new URLSearchParams(sp);
    const nd = daysFromRange(next);
    nextSp.set('range', `${nd}d`);
    setSp(nextSp);
  };
  const setCountryParam = (next: 'SE'|'PT') => {
    const nextSp = new URLSearchParams(sp);
    nextSp.set('country', next);
    setSp(nextSp);
  };

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analysis on publicly available news</h1>
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 dark:text-gray-300">Range</label>
            <select className="input !w-auto" value={range} onChange={(e) => setRangeParam(e.target.value)}>
              {rangeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200">
            Auto-updating hourly
          </span>
          {lastUpdatedText && <span className="text-xs text-gray-500">Updated {lastUpdatedText}</span>}
          <button onClick={() => setCountryParam('SE')} className={`btn ${ (sp.get('country') ?? 'SE') === 'SE' ? '' : 'opacity-70'}`}>Sweden</button>
          <button onClick={() => setCountryParam('PT')} className={`btn ${ (sp.get('country') ?? 'SE') === 'PT' ? '' : 'opacity-70'}`}>Portugal</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Sentiment over time</h4>
          </div>

          <div className="flex items-center gap-4">
            {topics.map((name, i) => (
              <div key={name} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length], opacity: empty.has(name) ? 0.3 : 1 }} />
                <span className="text-sm">
                  {name}{empty.has(name) && <span className="ml-1 text-xs text-gray-500">(no data)</span>}
                </span>
              </div>
            ))}
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: '#e5e7eb' }} />
                <YAxis domain={[0, 1]} tick={{ fill: '#e5e7eb' }} />
                <Tooltip
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                  contentStyle={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                  itemStyle={{ color: '#111827' }}
                  formatter={(value: any, name: string) => [Number(value).toFixed(3), name]}
                />
                {topics.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    stroke={COLORS[i % COLORS.length]}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="text-sm text-gray-500">Overlay shows daily average sentiment for each topic.</p>
        </div>

        <div className="card space-y-3">
          <h3 className="text-lg font-semibold">Sources — {(sp.get('country') ?? 'SE') === 'SE' ? 'Sweden' : 'Portugal'}</h3>
          <ul className="text-sm space-y-2 max-h-80 overflow-auto pr-2">
            {sources.slice(0, 50).map(s => (
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

export default App;
