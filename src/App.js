import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import myLogo from './ai_logo.png';

// ✅ ADDED: Markdown renderer
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ADDED: Predefined prompt suggestions for the UI
  const suggestions = [
    "Explain quantum computing in simple terms",
    "Write a Python script to scrape a website",
    "How do I improve my React app's performance?",
    "Summarize the latest trends in AI for 2026"
  ];

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const beautifyResponse = (text) => {
    if (!text) return "";
    let t = text;
    t = t.replace(/(\*\*[^*]+\*\*)/g, "\n\n$1\n\n");
    t = t.replace(/(\s)(\d+\.)\s/g, "\n$2 ");
    t = t.replace(/(\s)([-*])\s/g, "\n$2 ");
    t = t.replace(/\n{3,}/g, "\n\n");
    return t.trim();
  };

  const updateLastBotMessage = (newText) => {
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].sender === "bot") {
          updated[i] = { ...updated[i], text: newText };
          break;
        }
      }
      return updated;
    });
  };

  // ✅ IMPROVED: Modified to accept optional text from suggestions
  const sendMessage = async (suggestedText) => {
    const textToSend = typeof suggestedText === 'string' ? suggestedText : input;
    
    if (textToSend.trim() === "") return;

    const userMessage = { text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear input if we are using the text box
    if (!suggestedText) setInput("");
    
    setIsLoading(true);

    // Add empty bot placeholder
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

    try {
      const response = await fetch('https://genai-python-klwp.onrender.com/text-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ prompt: textToSend })
      });

      if (!response.ok) {
        updateLastBotMessage("Server Error: Unable to get a valid response.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const jsonStr = part.replace("data: ", "").trim();
            if (!jsonStr) continue;

            let data;
            try { data = JSON.parse(jsonStr); } catch (e) { continue; }

            if (data.token) {
              fullText += data.token;
              updateLastBotMessage(beautifyResponse(fullText));
            }
            if (data.error) {
              updateLastBotMessage("Server Error: " + data.error);
              return;
            }
            if (data.done) {
              updateLastBotMessage(beautifyResponse(fullText));
              return;
            }
          }
        }
      }
    } catch (error) {
      updateLastBotMessage("Network Error: Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="logo-container">
            <img src={myLogo} alt="App Logo" className="central-logo" />
            <h2>How can I help you right now?</h2>
            
            {/* ✅ NEW: Interactive Suggestion Grid */}
            <div className="suggestions-grid">
              {suggestions.map((s, i) => (
                <div key={i} className="suggestion-card" onClick={() => sendMessage(s)}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender}`}>
              <div className="bubble">
                {msg.sender === "bot" ? (
                  <div className="markdown-bubble">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ✅ IMPROVED: Floating Input Bar */}
      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
          <button className="send-btn" onClick={() => sendMessage()}>
             {/* Simple Send Icon */}
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11L12 6L17 11M12 18V7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;