import {
  loadChatHistory,
  saveChatHistory,
  handleAnalysisRequest,
} from '@/utils/chatOperations';
import { StoredChat, Message } from '@/types';

const staticTimeStamp = new Date();

beforeEach(() => {
  global.chrome = {
    storage: {
      local: {
        get: jest.fn((keys, callback) => {
          const mockData: { [key: string]: StoredChat } = {
            'http://example.com': {
              messages: [
                {
                  id: 1,
                  role: 'user',
                  content: 'Hello',
                  timestamp: staticTimeStamp.toISOString(),
                },
              ],
              showChoiceButtons: true,
            },
          };
          callback(mockData);
        }),
        set: jest.fn(),
      },
    },
    runtime: {
      sendMessage: jest.fn(),
    },
  } as unknown as typeof chrome;
});

describe('loadChatHistory', () => {
  it('should load chat history from chrome storage', () => {
    const url = 'http://example.com';
    const expectedMessages = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        timestamp: staticTimeStamp,
      },
    ];

    return loadChatHistory(url).then((messages) => {
      expect(messages).toEqual(expectedMessages);
    });
  });

  it('should return null if no messages are found', () => {
    const url = 'http://nonexistent.com';

    (chrome.storage.local.get as jest.Mock).mockImplementationOnce(
      (keys, callback) => {
        callback({});
      }
    );

    return loadChatHistory(url).then((messages) => {
      expect(messages).toBeNull();
    });
  });
});

describe('saveChatHistory', () => {
  it('should save chat history to chrome storage', () => {
    const url = 'http://example.com';
    const messages: Message[] = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        timestamp: new Date('2023-10-01T00:00:00.000Z'),
      },
    ];
    const showChoiceButtons = true;

    saveChatHistory(url, messages, showChoiceButtons);

    const expectedStoredMessages = [
      {
        id: 1,
        role: 'user',
        content: 'Hello',
        timestamp: '2023-10-01T00:00:00.000Z',
      },
    ];

    expect(chrome.storage.local.set as jest.Mock).toHaveBeenCalledWith({
      [url]: {
        messages: expectedStoredMessages,
        showChoiceButtons,
      },
    });
  });
});

describe('handleAnalysisRequest', () => {
  const setMessages = jest.fn();
  const setIsLoading = jest.fn();
  const setShowChoiceButtons = jest.fn();

  it('should handle summarize request successfully', () => {
    const url = 'http://example.com';
    const type = 'summarize';

    (chrome.runtime.sendMessage as jest.Mock).mockImplementationOnce(
      (message, callback) => {
        callback({ result: 'Summary of the article' });
      }
    );

    handleAnalysisRequest(
      type,
      url,
      setMessages,
      setIsLoading,
      setShowChoiceButtons
    );

    expect(setShowChoiceButtons).toHaveBeenCalledWith(false);
    expect(setMessages).toHaveBeenCalledWith(expect.any(Function));
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      {
        type: 'ANALYZE_WITH_PERPLEXITY',
        content: url,
        analysisType: type,
      },
      expect.any(Function)
    );
  });

  it('should handle factCheck request with error', () => {
    const url = 'http://example.com';
    const type = 'factCheck';

    (chrome.runtime.sendMessage as jest.Mock).mockImplementationOnce(
      (message, callback) => {
        callback({ error: 'Error message' });
      }
    );

    handleAnalysisRequest(
      type,
      url,
      setMessages,
      setIsLoading,
      setShowChoiceButtons
    );

    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(setMessages).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should handle factCheck request successfully', () => {
    const url = 'http://example.com';
    const type = 'factCheck';

    (chrome.runtime.sendMessage as jest.Mock).mockImplementationOnce(
      (message, callback) => {
        callback({
          result: '{"summary": "This is a summary", "factCheck": []}',
        });
      }
    );

    handleAnalysisRequest(
      type,
      url,
      setMessages,
      setIsLoading,
      setShowChoiceButtons
    );

    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(setMessages).toHaveBeenCalledWith(expect.any(Function));
  });
});
