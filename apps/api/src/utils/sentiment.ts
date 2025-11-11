// Basic sentiment using wink-sentiment and mapping to 0..1
import winkSentiment from 'wink-sentiment';

export function sentiment01(text: string): number {
  if (!text?.trim()) return 0.5;
  const { score } = winkSentiment(text);
  // Map raw integer score (~ -ve to +ve) to 0..1 via sigmoid-like squash.
  // Neutral ~0.5, positive > 0.5.
  const x = Math.max(-10, Math.min(10, score)); // clamp
  const val = 1 / (1 + Math.exp(-x / 2)); // gentle slope
  return Number(val.toFixed(3));
}
