declare module 'wink-sentiment' {
  interface SentimentScore {
    score: number;
    normalizedScore: number;
    tokenizedPhrase: string[];
  }
  export default function winkSentiment(text: string): SentimentScore;
}
