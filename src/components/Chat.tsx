import { useState, useEffect } from 'react';
import { Message, StoredChat, CurrentTab } from '../types';
import { handleAnalysisRequest } from '../utils/chatOperations';
import MessageDisplay from './MessageDisplay';
import ChatInput from './ChatInput';

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [previousMessages, setPreviousMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChoiceButtons, setShowChoiceButtons] = useState(true);
  const [currentTab, setCurrentTab] = useState<CurrentTab | null>(null);

  useEffect(() => {
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        const url = tab.url;
        const title = tab.title as string;
        if (!url) return;

        const currentTabInfo = {
          title,
          url,
        };

        setCurrentTab(currentTabInfo);

        chrome.storage.local.get(
          [url],
          (result: { [key: string]: StoredChat }) => {
            if (result[url]?.messages?.length > 0) {
              setPreviousMessages(
                result[url].messages.map((msg) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                }))
              );
              setMessages([
                {
                  id: Date.now(),
                  role: 'assistant',
                  content:
                    'I found a previous chat history for this page. Would you like to continue that conversation or start fresh?',
                  timestamp: new Date(),
                },
              ]);
              setShowChoiceButtons(true);
            } else {
              initializeNewChat(url, currentTabInfo.title);
            }
          }
        );
      });
    }
  }, []);

  useEffect(() => {
    if (currentTab?.url && messages.length > 0) {
      const storedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      }));

      chrome.storage.local.set({
        [currentTab!.url]: {
          messages: storedMessages,
          showChoiceButtons,
        },
      });
    }
  }, [messages, showChoiceButtons, currentTab]);

  const initializeNewChat = (url: string, title: string) => {
    if (!url || url.startsWith('chrome://')) {
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
          content: `I notice you're on: <strong>${title}</strong>
          \n
          Would you like me to analyze this page?
          `,
          timestamp: new Date(),
        },
      ]);
      setShowChoiceButtons(true);
    }
  };

  const handleHistoryChoice = (continuePrevious: boolean) => {
    if (!currentTab?.url) return;

    if (continuePrevious) {
      setMessages(previousMessages);
      setShowChoiceButtons(false);
    } else {
      chrome.storage.local.remove(currentTab.url, () => {
        initializeNewChat(currentTab.url, currentTab.title);
      });
    }
  };

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
        analysisType: 'summarize',
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

  const handleAnalysisChoice = (
    type: 'summarize' | 'findSimilar' | 'factCheck'
  ) => {
    if (!currentTab?.url) return;
    handleAnalysisRequest(
      type,
      currentTab.url,
      setMessages,
      setIsLoading,
      setShowChoiceButtons
    );
  };

  return (
    <div className="flex flex-col h-[600px] w-[400px] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <MessageDisplay
            key={message.id}
            message={message}
            isFirst={index === 0}
            showChoiceButtons={showChoiceButtons}
            onHistoryChoice={handleHistoryChoice}
            onAnalysisChoice={handleAnalysisChoice}
          />
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
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
