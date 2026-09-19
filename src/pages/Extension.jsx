import { useEffect } from 'react';
import './Extension.css';

// Replace this URL with the Chrome Web Store or downloadable .crx / .zip extension package
const EXTENSION_DOWNLOAD_URL = "#";

export default function Extension() {
  // Ensure view starts at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleDownloadClick = (e) => {
    if (EXTENSION_DOWNLOAD_URL === "#") {
      e.preventDefault();
      // Graceful fallback trigger if direct link is pending
      const element = document.createElement("a");
      const file = new Blob([
        JSON.stringify({
          name: "EcoRoute Extension",
          version: "1.0.0",
          description: "EcoRoute Prompt Optimizer for Chromium browsers"
        }, null, 2)
      ], { type: 'application/json' });
      element.href = URL.createObjectURL(file);
      element.download = "ecoroute-extension-manifest.json";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <div className="ext-page">
      <div className="ext-container">
        
        {/* Label */}
        <div className="ext-tag">
          <span className="tag-dot"></span>
          ECOROUTE EXTENSION
        </div>

        {/* Heading */}
        <h1 className="ext-heading">Use EcoRoute wherever you use AI.</h1>

        {/* Short Description */}
        <p className="ext-description">
          The EcoRoute browser extension helps you improve your prompts directly where you already use AI. Write your request normally, let EcoRoute optimize it, and insert the improved prompt into your AI tool.
        </p>

        {/* Action Button & Subtext */}
        <div className="ext-cta-wrap">
          <a 
            href={EXTENSION_DOWNLOAD_URL}
            className="ext-download-btn"
            onClick={handleDownloadClick}
          >
            Download Extension
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#050602" strokeWidth="2.2" strokeLinecap="square" />
            </svg>
          </a>
          <span className="ext-subtext">Available for supported Chromium browsers</span>
        </div>

        {/* Subtle Browser Window Mockup */}
        <div className="ext-mockup-wrapper">
          <div className="ext-browser-frame">
            
            <div className="ext-browser-bar">
              <div className="ext-browser-dots">
                <span className="ext-browser-dot"></span>
                <span className="ext-browser-dot"></span>
                <span className="ext-browser-dot"></span>
              </div>
              <div className="ext-browser-url">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                chatgpt.com
              </div>
            </div>

            <div className="ext-browser-body">
              <div className="ext-mock-chatbox">
                <div className="ext-mock-raw-text">
                  “Explain quantum computing in simple terms”
                </div>
                <div className="ext-mock-copilot-pill">
                  <svg viewBox="0 0 64 64">
                    <path d="M32 6C18 6 8 16 8 32c0 14 9 26 24 26 2-11 3-19 11-27 5-5 13-8 13-8-3 16-9 24-19 29-6 3-13 2-18-3C12 42 9 35 11 27 14 14 22 6 32 6z" />
                  </svg>
                  EcoRoute Copilot
                </div>
              </div>

              <div className="ext-mock-improved-preview">
                <div className="ext-mock-improved-text">
                  “Explain quantum computing principles with key milestones and practical examples in simple terms.”
                </div>
                <span className="ext-mock-replace-badge">1-Click Insert</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
