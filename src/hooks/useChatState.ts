import { useState, useEffect } from 'react';
import { Message, CurrentTab } from '../types';
import { loadChatHistory, saveChatHistory } from '../utils/chatOperations';

export function useChatState() {
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
        if (!url) return;

        setCurrentTab({
          title: tab.title || 'Untitled',
          url: url,
        });

        loadChatHistory(url);
      });
    }
  }, []);

  useEffect(() => {
    if (currentTab?.url) {
      saveChatHistory(currentTab.url, messages, showChoiceButtons);
    }
  }, [messages, showChoiceButtons, currentTab]);

  return {
    messages,
    setMessages,
    previousMessages,
    setPreviousMessages,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    showChoiceButtons,
    setShowChoiceButtons,
    currentTab,
  };
}
