import type { MessageType } from './types';
const API_URL = import.meta.env.VITE_API_URL || 'http://3.12.74.88:3000';

type PerplexityResponse = {
  result: string;
  error?: string;
};

const getPromptForType = (
  type: 'summarize' | 'findSimilar' | 'factCheck',
  url: string
) => {
  switch (type) {
    case 'summarize':
      return `Summarize the following webpage: ${url}. Format your response with these sections:
      ## Main Points
      -- List the main points of the article
      `;
    case 'findSimilar':
      return `Find and analyze similar articles to this one: ${url}. Format your response with these sections:
      ## Similar Sources Found
      - List each source with a brief description with the article name itself being clickable and opening the source on a new tab.
      `;
    case 'factCheck':
      return `Analyze the following webpage: ${url}. Summarize this webpage and then search the internet for similar articles to see how truthful the original news source is. For each false claim made in the article, please enumerate the false claim and provide the correct information. Format your response to be JSON with these sections:

      {
        summary: [insert summary here],
        factCheck: [enumerate each false claim with the false claim itself and the reality check correction]
      }
      `;
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
    const response = await fetch(`${API_URL}/api/analyze`, {
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
