export type MessageType = {
  type: 'ANALYZE_WITH_PERPLEXITY';
  content: string;
  analysisType: 'summarize' | 'findSimilar' | 'factCheck';
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export type StoredMessage = Omit<Message, 'timestamp'> & { timestamp: string };

export type StoredChat = {
  messages: StoredMessage[];
  showChoiceButtons: boolean;
};

export type CurrentTab = {
  title: string;
  url: string;
};

export type AnalysisTypes = 'summarize' | 'findSimilar' | 'factCheck';
