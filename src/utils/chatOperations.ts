import { Message, StoredChat } from '../types';

export const loadChatHistory = (url: string) => {
  chrome.storage.local.get([url], (result: { [key: string]: StoredChat }) => {
    if (result[url]?.messages?.length > 0) {
      return result[url].messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    return null;
  });
};

export const saveChatHistory = (
  url: string,
  messages: Message[],
  showChoiceButtons: boolean
) => {
  const storedMessages = messages.map((msg) => ({
    ...msg,
    timestamp: msg.timestamp.toISOString(),
  }));

  chrome.storage.local.set({
    [url]: {
      messages: storedMessages,
      showChoiceButtons,
    },
  });
};

export const handleAnalysisRequest = (
  type: 'summarize' | 'findSimilar',
  url: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShowChoiceButtons: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setShowChoiceButtons(false);

  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content:
      type === 'summarize'
        ? 'Please summarize this article'
        : 'Please find similar articles',
    timestamp: new Date(),
  };
  setMessages((prev) => [...prev, userMessage]);

  setIsLoading(true);
  chrome.runtime.sendMessage(
    {
      type: 'ANALYZE_WITH_PERPLEXITY',
      content: url,
      analysisType: type,
    },
    (response) => {
      setIsLoading(false);
      if (response?.result) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: response.result,
            timestamp: new Date(),
          },
        ]);
      }
    }
  );
};
