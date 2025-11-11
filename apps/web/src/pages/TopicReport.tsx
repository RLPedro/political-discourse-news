import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { SentimentSeries } from '@pdd/types/src';

const API_BASE = 'http://localhost:4000';

export default function TopicReport() {
  const [sp] = useSearchParams();
  const [data, setData] = useState<SentimentSeries | null>(null);
  const term = sp.get('term') ?? 'climate';

  useEffect(() => {
    axios.get(`${API_BASE}/insights/sentiment`, { params: { term } })
      .then(r => setData(r.data))
      .catch(e => console.error(e));
  }, [term]);

  const chartData = useMemo(() => (data?.points ?? []).map(p => ({ date: p.date, avgSentiment: p.avgSentiment })), [data]);

  return (
    <div className="container py-10 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Topic Report</h1>
          <p className="text-gray-600 dark:text-gray-300">Term: <span className="font-mono">{term}</span></p>
        </div>
        <a className="btn" href="/">Back</a>
      </div>

      <div className="card space-y-4">
        <h2 className="text-lg font-semibold">Sentiment Over Time</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="avgSentiment" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-gray-500">This demo uses seeded data. Add real ingestion to make it shine.</p>
      </div>
    </div>
  );
}
