import React, { useState } from 'react';
import './App.css';
import myLogo from './ai_logo.png';

function App() {
  // 'messages' stores the history, 'input' stores what you are currently typing
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (input.trim() === "") return;

    // 1. Create a message object for the user
    const userMessage = { text: input, sender: "user" };

    // 2. Add it to the list (Right side)
    setMessages([...messages, userMessage]);
    const currentInput = input;
    setInput(""); // Clear the text box

    try {
      // 3. Call your API (Replace with your actual URL)
      // const response = await fetch('https://bhabagrahi-ai.hf.space/generate', {
      const response = await fetch('https://genai-python-klwp.onrender.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: currentInput })
      });

      const data = await response.json();
      console.log(data);


      // 4. Add the API response to the list (Left side)
      const botMessage = { text: data.result, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;