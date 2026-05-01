import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Link as LinkIcon, Mic, Video, Square } from 'lucide-react';
import languagesData from '../assets/languages.json';

const API_BASE = 'http://localhost:8000';

export default function Uploader({ onUploadSuccess, targetLang, setTargetLang }) {
  const [loading, setLoading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [action, setAction] = useState('translate');
  
  const [country, setCountry] = useState('Global');
  const [stateRegion, setStateRegion] = useState('Universal');

  const [recording, setRecording] = useState(false);
  const [mediaType, setMediaType] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const countries = Object.keys(languagesData);
  const states = country ? Object.keys(languagesData[country] || {}) : [];
  const availableLangs = (country && stateRegion && languagesData[country][stateRegion]) 
    ? languagesData[country][stateRegion] 
    : [];

  useEffect(() => {
    const newStates = Object.keys(languagesData[country] || {});
    if (newStates.length > 0 && !newStates.includes(stateRegion)) {
      setStateRegion(newStates[0]);
    }
  }, [country]);

  useEffect(() => {
    if (country && stateRegion) {
      const newLangs = languagesData[country][stateRegion];
      if (newLangs && newLangs.length > 0 && !newLangs.includes(targetLang)) {
        setTargetLang(newLangs[0]);
      }
    }
  }, [stateRegion, country]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);
    formData.append('target_lang', targetLang);

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      onUploadSuccess(res.data);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const handleYoutube = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/youtube`, { url: youtubeUrl });
      onUploadSuccess(res.data);
    } catch (err) {
      console.error(err);
      alert('YouTube parse failed');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async (type) => {
    try {
      setMediaType(type);
      const stream = await navigator.mediaDevices.getUserMedia(
        type === 'video' ? { video: true, audio: true } : { audio: true }
      );
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        handleFileUpload(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Recording failed", err);
      alert("Microphone/Camera access required.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">Context & Target</div>
      
      <div className="settings-row" style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
        <select style={{flex: '1 1 100%'}} value={action} onChange={e => setAction(e.target.value)}>
          <option value="translate">Translate</option>
          <option value="summarize">Summarize</option>
          <option value="chat">Just Chat</option>
        </select>
        
        {action === 'translate' && (
          <div style={{display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap'}}>
            <select style={{flex: '1 1 30%'}} value={country} onChange={e => setCountry(e.target.value)}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select style={{flex: '1 1 30%'}} value={stateRegion} onChange={e => setStateRegion(e.target.value)} disabled={states.length === 0}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={{flex: '1 1 30%'}} value={targetLang} onChange={e => setTargetLang(e.target.value)} disabled={availableLangs.length === 0}>
              {availableLangs.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        )}
      </div>

      <label className="upload-zone">
        <input type="file" hidden onChange={onFileChange} disabled={loading || recording} accept="*/*" />
        <UploadCloud size={48} className={`upload-icon ${loading ? 'pulsing' : ''}`} />
        <h3>{loading ? 'Processing...' : 'Drag & Drop or Click to Upload'}</h3>
        <p className="subtitle" style={{marginTop: '0.5rem', fontSize: '0.9rem'}}>PDF, PPTX, TXT, MP3, MP4, WEBM</p>
      </label>

      <div style={{display: 'flex', gap: '0.5rem'}}>
        <input 
          type="text" 
          placeholder="Or paste YouTube Link" 
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          disabled={loading || recording}
        />
        <button onClick={handleYoutube} disabled={loading || !youtubeUrl} style={{marginBottom: '1rem'}}>
          <LinkIcon size={18} />
        </button>
      </div>

      <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem'}}>
        {recording ? (
          <button onClick={stopRecording} style={{backgroundColor: '#ef4444'}}>
             <Square size={18} /> Stop {mediaType === 'video' ? 'Video' : 'Audio'}
          </button>
        ) : (
          <>
            <button disabled={loading} onClick={() => startRecording('audio')} style={{backgroundColor: 'var(--bg-panel-hover)'}}>
              <Mic size={18} /> Record Audio
            </button>
            <button disabled={loading} onClick={() => startRecording('video')} style={{backgroundColor: 'var(--bg-panel-hover)'}}>
              <Video size={18} /> Record Video
            </button>
          </>
        )}
      </div>
    </div>
  );
}
