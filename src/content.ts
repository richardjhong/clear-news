console.log("Content script loaded");

const getArticleText = () => {
  const paragraphs = document.querySelectorAll("p");
  return Array.from(paragraphs)
    .map((p) => p.innerText)
    .join("\n");
};

chrome.runtime.sendMessage({
  action: "analyze_article",
  content: getArticleText(),
});
