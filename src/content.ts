console.log('Content script loaded');

const getArticleText = () => {
  const paragraphs = document.querySelectorAll('p');
  return Array.from(paragraphs)
    .map((p) => p.innerText)
    .join('\n');
};

const injectHighlightedText = () => {
  const mockParagraph = document.createElement('p');
  mockParagraph.textContent =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
  mockParagraph.style.backgroundColor = 'yellow';
  mockParagraph.style.padding = '10px';
  mockParagraph.style.border = '1px solid black';
  mockParagraph.style.position = 'fixed';
  mockParagraph.style.top = '10px';
  mockParagraph.style.left = '10px';

  document.body.appendChild(mockParagraph);
};

chrome.runtime.sendMessage({
  action: 'analyze_article',
  content: getArticleText(),
});

// injectHighlightedText();
