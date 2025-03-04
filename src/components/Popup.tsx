import { useState, useEffect } from "react";

const Popup = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setCurrentUrl(tabs[0].url || "");
    });
  }, []);

  return (
    <div className="popup">
      <h1>My Chrome Extension</h1>
      <p>Current URL: {currentUrl}</p>
    </div>
  );
};

export default Popup;
