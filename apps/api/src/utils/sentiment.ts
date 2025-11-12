import winkSentiment from 'wink-sentiment';

export const sentiment01 = (text: string): number => {
  if (!text?.trim()) return 0.5;
  const { score } = winkSentiment(text);
  const x = Math.max(-10, Math.min(10, score));
  const val = 1 / (1 + Math.exp(-x / 2));
  return Number(val.toFixed(3));
}
