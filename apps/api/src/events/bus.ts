import { EventEmitter } from 'node:events'
export const bus = new EventEmitter()
export type IngestEvent = {
  type: 'ANALYSIS_CREATED',
  payload: { articleId: number; analysisId: number; sentiment: number; title: string; publishedAt: string }
}
