import React, { useState } from 'react';
import Uploader from './components/Uploader';
import TranslationView from './components/TranslationView';
import ChatBox from './components/ChatBox';
import './index.css';

function App() {
  const [sessionData, setSessionData] = useState(null);
  const [targetLang, setTargetLang] = useState('English');

  return (
    <div className="app-container">
      <header>
        <h1>Universal AI Translator</h1>
        <p className="subtitle">Secure local AI processing for Documents and Media</p>
      </header>
      
      <main className="main-content">
        <section className="left-panel">
          <Uploader 
            onUploadSuccess={setSessionData} 
            targetLang={targetLang} 
            setTargetLang={setTargetLang} 
          />
          {sessionData && (
            <TranslationView sessionData={sessionData} />
          )}
        </section>
        
        <section className="right-panel">
          <ChatBox sessionData={sessionData} targetLang={targetLang} />
        </section>
      </main>
    </div>
  );
}

export default App;
