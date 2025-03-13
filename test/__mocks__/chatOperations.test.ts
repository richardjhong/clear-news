import { loadChatHistory } from '@/utils/chatOperations';
import { StoredChat } from '@/types';

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
                  timestamp: new Date().toISOString(),
                },
              ],
              showChoiceButtons: true,
            },
          };
          callback(mockData);
        }),
      },
    },
  } as unknown as typeof chrome;
});

test('should load chat history from chrome storage', () => {
  const url = 'http://example.com';
  const expectedMessages = [
    {
      id: 1,
      role: 'user',
      content: 'Hello',
      timestamp: new Date(),
    },
  ];

  return loadChatHistory(url).then((messages) => {
    expect(messages).toEqual(expectedMessages);
  });
});

test('should return null if no messages are found', () => {
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
