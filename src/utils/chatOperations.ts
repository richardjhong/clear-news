import { Message, StoredChat } from '../types';
// import { highlightFalseClaims } from './highlightClaims';

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
        switch (type) {
          case 'factCheck': {
            const parsedResult = parseFactCheckResponse(response.result);

            let msgToSend = `## Summary of the Article\n\n**Summary:** ${parsedResult.summary}`;

            if (parsedResult.factCheck.length !== 0) {
              msgToSend += `\n\n**False Claims**\n\n${parsedResult.factCheck
                .map((claim, index) => {
                  const claimText = `${index + 1}. **Claim:** ${
                    claim.falseClaim
                  }**Reality Check:** ${claim.realityCheck}`;
                  return index < parsedResult.factCheck.length - 1
                    ? `${claimText}\n\n`
                    : claimText;
                })
                .join('')}`;
            }

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'assistant',
                content: msgToSend,
                timestamp: new Date(),
              },
            ]);
            return;
          }
          default:
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'assistant',
                content: response.result,
                timestamp: new Date(),
              },
            ]);
            return;
        }
      }
    }
  );
};

const parseFactCheckResponse = (result: string) => {
  const regex =
    /"summary":\s*"([^"]+?)"\s*,\s*"factCheck":\s*(\[\s*\{(?:[^{}]*|\{[^{}]*\})*\}\s*(?:,\s*\{(?:[^{}]*|\{[^{}]*\})*\})*\s*\])/;

  const match = result.match(regex);

  const summary = match ? match[1] : 'No summary available';

  let factCheck: Array<{ falseClaim: string; realityCheck: string }> = [];
  if (match && match[2]) {
    try {
      factCheck = JSON.parse(match[2]);
    } catch (error) {
      console.error('Error parsing factCheck:', error);
      factCheck = [];
    }
  }

  return { summary, factCheck };
};
