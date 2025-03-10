// This script will run in the context of the web page

// Function to inject a paragraph with highlighted background
function injectHighlightedText() {
  const paragraph = document.createElement('p');
  paragraph.textContent = 'This is a sample paragraph with highlighted text.';
  paragraph.style.backgroundColor = 'yellow'; // Set the background color to yellow
  paragraph.style.padding = '10px'; // Add some padding for better visibility
  paragraph.style.border = '1px solid black'; // Optional: add a border for clarity
  paragraph.style.position = 'fixed'; // Optional: make it fixed position
  paragraph.style.top = '10px'; // Position it at the top
  paragraph.style.left = '10px'; // Position it on the left
  paragraph.style.zIndex = '9999'; // Ensure it appears above other content

  document.body.appendChild(paragraph); // Append the paragraph to the body
}

// Call the function to inject the text
injectHighlightedText();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_TEXT') {
    injectHighlightedText(); // Call the function when the message is received
  }
});
