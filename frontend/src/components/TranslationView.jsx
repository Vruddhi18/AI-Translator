import React from 'react';

export default function TranslationView({ sessionData }) {
  const { filename, result, extracted_text } = sessionData;

  return (
    <div className="panel" style={{ marginTop: '1.5rem', flex: 'none' }}>
      <div className="panel-header">Result: {filename || "Media/URL"}</div>
      
      {result?.translation && (
        <>
          <h4 style={{marginBottom: '0.5rem', color: 'var(--accent-color)'}}>Translation</h4>
          <div className="translation-result" style={{marginBottom: '1rem'}}>
            {result.translation}
          </div>
        </>
      )}

      {result?.summary && (
        <>
          <h4 style={{marginBottom: '0.5rem', color: 'var(--accent-color)'}}>Summary & Notes</h4>
          <div className="translation-result" style={{marginBottom: '1rem'}}>
            {result.summary}
          </div>
        </>
      )}

      {!result?.translation && !result?.summary && extracted_text && (
        <>
          <h4 style={{marginBottom: '0.5rem', color: 'var(--text-muted)'}}>Extracted Context (Snippet)</h4>
          <div className="translation-result" style={{fontSize: '0.9rem', color: 'var(--text-muted)', overflow: 'hidden', maxHeight: '150px'}}>
            {extracted_text}
          </div>
        </>
      )}
    </div>
  );
}
