import { useState, useEffect } from 'react';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [showChoiceButtons, setShowChoiceButtons] = useState(true);

  useEffect(() => {
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const url = tabs[0].url;
        setCurrentUrl(url || '');

        setMessages([
          {
            id: Date.now(),
            role: 'assistant',
            content: `Would you like me to summarize the link for you?`,
          },
        ]);
      });
    }
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      console.log('Active Tab:', {
        url: activeTab.url,
        title: activeTab.title,
        id: activeTab.id,
      });
    });
  }, []);

  const handleSummaryChoice = (choice: boolean) => {
    setShowChoiceButtons(false);

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: choice ? 'Yes' : 'No',
    };
    setMessages((prev) => [...prev, userMessage]);

    if (choice) {
      setIsLoading(true);
      chrome.runtime.sendMessage(
        {
          type: 'ANALYZE_WITH_PERPLEXITY',
          content: `Summarize the following link article: ${currentUrl}`,
        },
        (response) => {
          setIsLoading(false);
          if (response?.error) {
            console.error(response.error);
            return;
          }

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              role: 'assistant',
              content: response.result,
            },
          ]);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
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
        if (response?.error) {
          console.error(response.error);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: response.result,
          },
        ]);
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
              }`}
            >
              <div
                className={`
                max-w-[80%] rounded-lg p-3
                ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white shadow-sm border'
                }
              `}
              >
                {message.content}
              </div>
            </div>
            {message.role === 'assistant' &&
              message.id === messages[0].id &&
              showChoiceButtons && (
                <div className="flex gap-2 justify-center mt-4">
                  <button
                    onClick={() => handleSummaryChoice(true)}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg
                           hover:bg-blue-600 transition-colors text-sm"
                  >
                    Yes, please
                  </button>
                  <button
                    onClick={() => handleSummaryChoice(false)}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg
                           hover:bg-gray-600 transition-colors text-sm"
                  >
                    No, thanks
                  </button>
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
