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
  type: 'summarize' | 'findSimilar' | 'factCheck',
  url: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setShowChoiceButtons: React.Dispatch<React.SetStateAction<boolean>>
) => {
  setShowChoiceButtons(false);

  let userMessageContent: string;

  switch (type) {
    case 'summarize':
      userMessageContent = 'Please summarize this article';
      break;
    case 'findSimilar':
      userMessageContent = 'Please find similar articles';
      break;
    case 'factCheck':
      userMessageContent = 'Please fact-check this article';
      break;
    default:
      userMessageContent = 'Invalid analysis type';
  }

  const userMessage: Message = {
    id: Date.now(),
    role: 'user',
    content: userMessageContent,
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
      if (response?.error) {
        console.error('Error from background script:', response.error);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: 'There was an error processing your request.',
            timestamp: new Date(),
          },
        ]);
        return;
      }
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
