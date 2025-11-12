import fetch from 'node-fetch';

const MODEL_ID =
  'distilbert/distilbert-base-uncased-finetuned-sst-2-english';

const HF_API_URL =
  `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

interface HFSentimentResponse {
  label: 'POSITIVE' | 'NEGATIVE' | string;
  score: number;
}

export const analyzeSentiment = async (text: string): Promise<number> => {
  if (!text?.trim()) return 0.5;
  if (!process.env.HF_API_KEY) throw new Error('Missing HF_API_KEY in environment');

  const res = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`HuggingFace API error: ${msg}`);
  }

  const data = (await res.json()) as HFSentimentResponse[];
  const { label, score = 0 } = data[0] ?? {};

  if (label === 'POSITIVE') return 0.5 + score / 2;
  if (label === 'NEGATIVE') return 0.5 - score / 2;
  return 0.5;
}
