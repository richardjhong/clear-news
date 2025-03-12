import { jest } from '@jest/globals';

test('chrome.storage.local.get should return mocked data', () => {
  const callback = jest.fn();
  chrome.storage.local.get('myKey', callback);

  expect(chrome.storage.local.get).toHaveBeenCalledWith(
    'myKey',
    expect.any(Function)
  );
  expect(callback).toHaveBeenCalledWith({ myKey: 'mockedValue' });
});
