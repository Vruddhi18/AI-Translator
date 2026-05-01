import React, { useState } from 'react';
import axios from 'axios';
import { Send } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function ChatBox({ sessionData, targetLang }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Upload a document or media to start chatting about it.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !sessionData?.session_id) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, {
        session_id: sessionData.session_id,
        message: userMsg,
        target_lang: targetLang
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, an error occurred communicating with Llama.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel" style={{height: '100%'}}>
      <div className="panel-header">Contextual Q&A (Llama 3.1)</div>
      
      <div className="chat-history">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="chat-message bot pulsing" style={{opacity: 0.7}}>
            Llama is typing...
          </div>
        )}
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={sessionData ? `Ask in any language... (Replies in ${targetLang})` : "Please attach context first"}
          disabled={!sessionData || loading}
        />
        <button type="submit" disabled={!sessionData || loading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
