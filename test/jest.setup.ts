import '@testing-library/jest-dom';

global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => callback({ myKey: 'mockedValue' })),
      set: jest.fn((data, callback) => callback && callback()),
    },
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
    },
  },
} as unknown as typeof chrome;
