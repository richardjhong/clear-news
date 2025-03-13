import { loadChatHistory, saveChatHistory } from '@/utils/chatOperations';
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
