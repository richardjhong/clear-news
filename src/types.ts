export type MessageType = {
  type: 'ANALYZE_WITH_PERPLEXITY';
  content: string;
  analysisType: 'summarize' | 'findSimilar';
};
