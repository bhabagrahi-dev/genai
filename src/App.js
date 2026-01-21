import React, { useState } from 'react';
import './App.css';
import myLogo from './ai_logo.png';

function App() {
  // 'messages' stores the history, 'input' stores what you are currently typing
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  // ADDED THIS LINE: Necessary for the loading animation to work
  const [isLoading, setIsLoading] = useState(false);

  // ✅ ADDED: helper to update last bot message during streaming
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

  // const sendMessage = async () => {
  //   if (input.trim() === "") return;

  //   // 1. Create a message object for the user
  //   const userMessage = { text: input, sender: "user" };

  //   // 2. Add it to the list (Right side)
  //   setMessages([...messages, userMessage]);
  //   const currentInput = input;
  //   setInput(""); // Clear the text box

  //   try {
  //     // 3. Call your API (Replace with your actual URL)
  //     // const response = await fetch('https://bhabagrahi-ai.hf.space/generate', {
  //     const response = await fetch('https://genai-python-klwp.onrender.com/text', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ prompt: currentInput })
  //     });

  //     const data = await response.json();
  //     console.log(data);


  //     // 4. Add the API response to the list (Left side)
  //     const botMessage = { text: data.result, sender: "bot" };
  //     setMessages((prev) => [...prev, botMessage]);
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
  // };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // ✅ ADDED: add empty bot message first (placeholder bubble)
    setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

    try {
      // ✅ CHANGED: call streaming endpoint instead of /text
      const response = await fetch('https://genai-python-klwp.onrender.com/text-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ prompt: currentInput })
      });

      // ✅ ADDED: if server fails
      if (!response.ok) {
        updateLastBotMessage("Server Error: Unable to get a valid response. Please try again later.");
        return;
      }

      // ✅ ADDED: Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE events separated by blank line
        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep leftover

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const jsonStr = part.replace("data: ", "").trim();

            // sometimes servers send empty data lines
            if (!jsonStr) continue;

            let data;
            try {
              data = JSON.parse(jsonStr);
            } catch (e) {
              continue;
            }

            if (data.token) {
              fullText += data.token;
              updateLastBotMessage(fullText);
            }

            if (data.error) {
              updateLastBotMessage("Server Error: " + data.error);
              return;
            }

            if (data.done) {
              return;
            }
          }
        }
      }

      // --- ERROR CACHE LOGIC START ---
      // (keeping your logic untouched, but streaming already handles this)
      // --- ERROR CACHE LOGIC END ---

    } catch (error) {
      // This catches network crashes (e.g., if the server is totally down)
      updateLastBotMessage("Network Error: Could not connect to the server.");
    } finally {
      // 2. Stop loading regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.sender}`}>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}
      </div> */}

      <div className="chat-window">
        {messages.length === 0 ? (
          <div className="logo-container">
            <img
              src={myLogo}
              alt="App Logo"
              className="central-logo"
            />
            <h2>How can I help you right now ?</h2>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message-row ${msg.sender}`}>
              <div className="bubble">{msg.text}</div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="message-row bot">
            <div className="bubble loading-bubble">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}

      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;