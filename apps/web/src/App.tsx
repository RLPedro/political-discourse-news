import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

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
  <div className="min-h-screen bg-slate-950 text-slate-50">
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold sm:text-2xl">
            Analysis on publicly available news
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400">
                Range
              </span>
              <select
                className="input !w-auto !py-1 !px-2 text-xs sm:text-sm"
                value={range}
                onChange={(e) => setRangeParam(e.target.value)}
              >
              {rangeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium bg-green-500/10 text-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Auto-updating when new articles arrive
            </span>

            {lastUpdatedText && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdatedText}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            Country
          </span>
          <div className="inline-flex rounded-full bg-slate-800/70 p-1">
            <button
              onClick={() => setCountryParam("SE")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${
                country === "SE"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-gray-300 hover:bg-slate-700/80"
              }`}
            >
              Sweden
            </button>
            <button
              onClick={() => setCountryParam("PT")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-full transition ${
                country === "PT"
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-gray-300 hover:bg-slate-700/80"
              }`}
            >
              Portugal
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:items-start">
        <div className="card lg:col-span-3 space-y-4 bg-slate-900/70 border border-slate-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="text-base sm:text-lg font-semibold">
              Sentiment over time
            </h4>
            <div className="flex w-full sm:w-auto items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent py-1 -mx-1 px-1">
              {topics.map((name, i) => (
                <div key={name} className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                    style={{
                      background: COLORS[i % COLORS.length],
                      opacity: empty.has(name) ? 0.3 : 1,
                    }}
                  />
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    {name}
                    {empty.has(name) && (
                      <span className="ml-1 text-[11px] text-gray-400">
                        (no data)
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#e5e7eb", fontSize: 10 }}
                  tickMargin={8}
                />
                <YAxis
                  domain={[0, 1]}
                  tick={{ fill: "#e5e7eb", fontSize: 10 }}
                />
                <Tooltip
                  labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                  contentStyle={{
                    background: "#ffffff",
                    borderColor: "#e5e7eb",
                    borderRadius: 8,
                  }}
                  itemStyle={{ color: "#0f172a", fontSize: 12 }}
                  formatter={(value: any, name: string) => [
                    Number(value).toFixed(3),
                    name,
                  ]}
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

          <p className="text-xs sm:text-sm text-gray-400">
            Each line shows the daily average sentiment for a topic (0 = most
            negative, 1 = most positive).
          </p>
        </div>

        <div className="card space-y-3 bg-slate-900/70 border border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-semibold">
              Sources — {country === "SE" ? "Sweden" : "Portugal"}
            </h3>
          </div>
          <ul className="mt-1 space-y-1.5 max-h-64 sm:max-h-80 overflow-auto pr-1 text-xs sm:text-sm">
            {sources.slice(0, 60).map((s) => (
              <li
                key={s.source}
                className="flex justify-between items-center gap-3 border-b border-slate-800/60 pb-1.5 last:border-b-0 last:pb-0"
              >
                <span className="truncate text-gray-100">{s.source}</span>
                <span className="tabular-nums text-gray-400 text-xs">
                  {s.count}
                </span>
              </li>
            ))}
            {sources.length === 0 && (
              <li className="text-gray-500 text-xs">
                No sources yet for this range.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  </div>
);

}

export default App;
