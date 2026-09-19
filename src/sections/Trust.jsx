export default function Trust() {
  return (
    <section className="trust">
      <div className="trust-inner">
        <div className="trust-label">Trusted by a more mindful generation</div>
        <div className="trust-row">
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            ChatGPT
          </div>
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3v18M3 12h18" />
            </svg>
            Claude
          </div>
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" />
            </svg>
            Gemini
          </div>
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4" y="4" width="7" height="7" />
              <rect x="13" y="4" width="7" height="7" />
              <rect x="4" y="13" width="7" height="7" />
              <rect x="13" y="13" width="7" height="7" />
            </svg>
            Copilot
          </div>
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
            </svg>
            Perplexity
          </div>
          <div className="item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            DeepSeek
          </div>
        </div>
      </div>
    </section>
  );
}
