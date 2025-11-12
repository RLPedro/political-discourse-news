import { z } from 'zod';

export const SentimentPoint = z.object({
  date: z.string(),
  avgSentiment: z.number()
});
export const SentimentSeries = z.object({
  term: z.string(),
  points: z.array(SentimentPoint)
});

export type SentimentPoint = z.infer<typeof SentimentPoint>;
export type SentimentSeries = z.infer<typeof SentimentSeries>;
