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
    _: chrome.runtime.MessageSender,
    sendResponse: (response: PerplexityResponse) => void
  ) => {
    if (!message.type) {
      sendResponse({ result: 'Background script received message.' });
      return;
    }

    switch (message.type) {
      case 'ANALYZE_WITH_PERPLEXITY':
        handlePerplexityRequest(message.content)
          .then((content) => {
            console.log('Sending to Chat:', { result: content });
            sendResponse({ result: content });
          })
          .catch((error) => {
            console.error('Error:', error);
            sendResponse({
              result: 'Error occurred',
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

const handlePerplexityRequest = async (input: string): Promise<string> => {
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

  const response = await fetch(
    'https://api.perplexity.ai/chat/completions',
    options
  );

  const data = await response.json();
  console.log('data', data);
  return data.choices[0].message.content;
};
