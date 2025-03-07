import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type StoredChat = {
  messages: Array<{
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  showChoiceButtons: boolean;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChoiceButtons, setShowChoiceButtons] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        if (!url) return;

        setCurrentUrl(url);

        chrome.storage.local.get(
          [url],
          (result: { [key: string]: StoredChat }) => {
            if (result[url]) {
              const savedMessages = result[url].messages.map((msg) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
              }));

              setMessages(savedMessages);
              setShowChoiceButtons(result[url].showChoiceButtons);
            } else {
              if (url.startsWith('chrome://')) {
                setMessages([
                  {
                    id: Date.now(),
                    role: 'assistant',
                    content:
                      "Please open this extension on a webpage you'd like me to analyze.",
                    timestamp: new Date(),
                  },
                ]);
                setShowChoiceButtons(false);
              } else {
                setMessages([
                  {
                    id: Date.now(),
                    role: 'assistant',
                    content: `Would you like me to summarize this page for you?`,
                    timestamp: new Date(),
                  },
                ]);
              }
            }
          }
        );
      });
    }
  }, []);

  useEffect(() => {
    if (currentUrl) {
      const storedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));

      chrome.storage.local.set({
        [currentUrl]: {
          messages: storedMessages,
          showChoiceButtons,
        },
      });
    }
  }, [messages, showChoiceButtons, currentUrl]);

  // const handleSummaryChoice = (choice: boolean) => {
  //   setShowChoiceButtons(false);

  //   const userMessage: Message = {
  //     id: Date.now(),
  //     role: 'user',
  //     content: choice ? 'Yes, please summarize it' : 'No, thanks',
  //     timestamp: new Date(),
  //   };
  //   setMessages((prev) => [...prev, userMessage]);

  //   if (choice) {
  //     setIsLoading(true);

  //     chrome.runtime.sendMessage(
  //       {
  //         type: 'ANALYZE_WITH_PERPLEXITY',
  //         content: `Summarize the following link article: ${currentUrl}`,
  //       },
  //       (response) => {
  //         setIsLoading(false);

  //         if (response && response.result) {
  //           setMessages((prev) => [
  //             ...prev,
  //             {
  //               id: Date.now(),
  //               role: 'assistant',
  //               content: response.result,
  //               timestamp: new Date(),
  //             },
  //           ]);
  //         } else {
  //           console.error('Invalid response:', response);
  //           setMessages((prev) => [
  //             ...prev,
  //             {
  //               id: Date.now(),
  //               role: 'assistant',
  //               content: 'Sorry, I encountered an error.',
  //               timestamp: new Date(),
  //             },
  //           ]);
  //         }
  //       }
  //     );
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    chrome.runtime.sendMessage(
      {
        type: 'ANALYZE_WITH_PERPLEXITY',
        content: userMessage.content,
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

  const handleAnalysisChoice = (type: 'summarize' | 'findSimilar') => {
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
        content: currentUrl,
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
  return (
    <div className="flex flex-col h-[600px] w-[400px] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              } items-center gap-2`}
            >
              {message.role === 'assistant' && (
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}

              <div
                className={`
                max-w-[80%] rounded-lg p-3
                ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white shadow-sm border'
                }
                ${
                  message.role === 'assistant'
                    ? 'prose prose-sm max-w-none'
                    : ''
                }
              `}
              >
                {message.role === 'assistant' ? (
                  <Markdown
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-lg font-bold mt-4 mb-2 text-gray-800">
                          {children}
                        </h2>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 space-y-1 mt-2">
                          {children}
                        </ul>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700">{children}</li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-2 text-gray-700">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-gray-900">
                          {children}
                        </strong>
                      ),
                    }}
                  >
                    {message.content}
                  </Markdown>
                ) : (
                  message.content
                )}
              </div>

              {message.role === 'user' && (
                <span className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            {message.role === 'assistant' &&
              message.id === messages[0].id &&
              showChoiceButtons && (
                <div className="flex flex-col gap-4 mt-4">
                  <div className="text-center text-sm text-gray-600">
                    What would you like to know about this article?
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleAnalysisChoice('summarize')}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg
                       hover:bg-blue-600 transition-colors text-sm"
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => handleAnalysisChoice('findSimilar')}
                      className="bg-green-500 text-white px-6 py-2 rounded-lg
                       hover:bg-green-600 transition-colors text-sm"
                    >
                      Find Similar
                    </button>
                  </div>
                </div>
              )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border rounded-lg p-3">
              <div className="animate-pulse">Thinking...</div>
            </div>
          </div>
        )}
      </div>

      {!showChoiceButtons && (
        <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 p-2 
                       focus:outline-none focus:border-blue-500"
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg
                       hover:bg-blue-600 transition-colors
                       disabled:bg-blue-300"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
