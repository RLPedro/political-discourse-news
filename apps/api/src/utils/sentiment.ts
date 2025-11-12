import { analyzeSentiment } from '../services/sentiment_ml.js';

export const sentiment01 = async (text: string): Promise<number> => {
  const v = await analyzeSentiment(text);
  const n = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  return Number(n.toFixed(3));
}
