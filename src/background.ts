import type { MessageType } from './types';

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
    _: chrome.runtime.MessageSender,
    sendResponse: (response: PerplexityResponse) => void
  ) => {
    if (!message.type) {
      sendResponse({ result: 'Background script received message.' });
      return;
    }

    switch (message.type) {
      case 'ANALYZE_WITH_PERPLEXITY':
        handleServerRequest(message.content, sendResponse);
        return;

      default:
        sendResponse({ result: 'Unknown message type.' });
        return;
    }
  }
);

const handleServerRequest = async (
  content: string,
  sendResponse: (response: PerplexityResponse) => void
) => {
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: content }),
    });

    const data = await response.json();
    sendResponse({ result: data.result });
  } catch (error) {
    console.error('Server request error:', error);
    sendResponse({
      result: 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
