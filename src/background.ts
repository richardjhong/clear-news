import type { MessageType } from './types';

type PerplexityResponse = {
  result: string;
  error?: string;
};

const getPromptForType = (type: 'summarize' | 'findSimilar', url: string) => {
  switch (type) {
    case 'summarize':
      return `Summarize the following webpage: ${url}`;
    case 'findSimilar':
      return `Find similar webpages to the following webpage: ${url}. Compare their main points and identify any differences in how the story is reported.`;
    default:
      throw new Error(`Invalid analysis type: ${type}`);
  }
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    _: chrome.runtime.MessageSender,
    sendResponse: (response: PerplexityResponse) => void
  ) => {
    if (message.type === 'ANALYZE_WITH_PERPLEXITY') {
      console.log('Analysis type:', message.analysisType);
      const prompt = getPromptForType(message.analysisType, message.content);
      handleServerRequest(prompt, sendResponse);
      return true;
    }
  }
);

const handleServerRequest = async (
  content: string,
  sendResponse: (response: PerplexityResponse) => void
) => {
  try {
    const response = await fetch('http://3.12.74.88:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: content }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    sendResponse({ result: data.result });
  } catch (error) {
    console.error('Server request failed:', error);
    sendResponse({
      result: 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
