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
        handleServerRequest(message.content)
          .then((result) => {
            sendResponse({ result });
          })
          .catch((error) => {
            console.error('Error:', error);
            sendResponse({
              result: 'An error occurred',
              error: error.message,
            });
          });
        return true;

      default:
        sendResponse({ result: 'Unknown message type.' });
        return;
    }
  }
);

const handleServerRequest = async (content: string) => {
  const response = await fetch('http://localhost:3000/api/analyze', {
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
  return data.result;
};
