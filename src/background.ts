import type { MessageType } from './types';

const API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;

type PerplexityResponse = {
  result: string;
  error?: string;
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener(
  (
    message: MessageType,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: PerplexityResponse) => void
  ) => {
    if (!message.type) {
      sendResponse({ result: 'Background script received message.' });
      return;
    }

    switch (message.type) {
      case 'ANALYZE_WITH_PERPLEXITY':
        console.log('using analyze with perplexity');
        handlePerplexityRequest(message.content, sendResponse);
        return;

      default:
        sendResponse({ result: 'Unknown message type.' });
        return;
    }
  }
);

const handlePerplexityRequest = async (
  input: string,
  sendResponse: (response: PerplexityResponse) => void
) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [{ role: 'user', content: input }],
    }),
  };

  try {
    const response = await fetch(
      'https://api.perplexity.ai/chat/completions',
      options
    );

    const data = await response.json();
    sendResponse({ result: data.choices[0].message.content });
  } catch (error) {
    console.error('Perfplexity API error:', error);
    sendResponse({
      result: 'An error occurred',
      error: 'An error occurred while processing the request.',
    });
  }
};
