import React, { useState } from 'react';
import './App.css';
import myLogo from './ai_logo.png';

function App() {
  // 'messages' stores the history, 'input' stores what you are currently typing
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

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

  try {
    const response = await fetch('https://genai-python-klwp.onrender.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: currentInput })
    });
    
    const data = await response.json();

    // --- ERROR CACHE LOGIC START ---
    if (data.status === "success") {
      // If success, show the actual result
      const botMessage = { text: data.result, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } else {
      // If status is anything else, show a friendly error bubble
      const errorMessage = { 
        text: "Server Error: Unable to get a valid response. Please try again later.", 
        sender: "bot" 
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
    // --- ERROR CACHE LOGIC END ---

  } catch (error) {
    // This catches network crashes (e.g., if the server is totally down)
    const crashMessage = { 
      text: "Network Error: Could not connect to the server.", 
      sender: "bot" 
    };
    setMessages((prev) => [...prev, crashMessage]);
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