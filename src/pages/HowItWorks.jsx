import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import EcoRouteAtmosphere from '../components/EcoRouteAtmosphere';
import './HowItWorks.css';

export default function HowItWorks() {
  const [copied, setCopied] = useState(false);
  const [selectedAi, setSelectedAi] = useState(0);
  const [typedText, setTypedText] = useState('');
  
  const optimizedPromptText = "Explain inheritance in Java using a simple real world example. Include a short Java code example and explain each part.";

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Typing animation for Stage 06 optimized prompt
  useEffect(() => {
    let index = 0;
    setTypedText('');
    const timer = setInterval(() => {
      if (index < optimizedPromptText.length) {
        setTypedText(optimizedPromptText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 24);

    return () => clearInterval(timer);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          entry.target.classList.add('in-view');
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    revealElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(optimizedPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const aiOptions = [
    { name: "ChatGPT", provider: "OpenAI" },
    { name: "Gemini", provider: "Google" },
    { name: "Claude", provider: "Anthropic" },
    { name: "Other", provider: "Custom" }
  ];

  return (
    <div className="hiw-page">
      <EcoRouteAtmosphere variant="section" />
      <div className="hiw-container">
        
        {/* 1. HERO */}
        <section className="hiw-hero reveal-on-scroll">
          <div className="hiw-tag">
            <span className="tag-dot"></span>
            HOW ECOROUTE WORKS
          </div>
          <h1>AI smarter. Without the guesswork.</h1>
          <p>
            EcoRoute understands what you’re trying to do, helps you write a better prompt, and recommends the right level of AI for the task.
          </p>

          <div className="hiw-hero-flow">
            <div className="hiw-flow-node">YOUR TASK</div>
            <div className="hiw-flow-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <div className="hiw-flow-node highlight">ECOROUTE</div>
            <div className="hiw-flow-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </div>
            <div className="hiw-flow-node">BETTER AI INTERACTION</div>
          </div>
        </section>

        {/* 2. MAIN FLOW — 8 STAGES TIMELINE */}
        <section className="hiw-flow-section">
          <div className="hiw-flow-header reveal-on-scroll">
            <div className="section-tag">STEP BY STEP FLOW</div>
            <h2>From task to optimized interaction</h2>
          </div>

          <div className="hiw-timeline-wrapper">
            {/* Connecting central spine line */}
            <div className="hiw-timeline-spine"></div>

            {/* STAGE 01 */}
            <div className="hiw-stage-row reveal-on-scroll">
              <div className="hiw-stage-node">01</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 01</span>
                <h3 className="hiw-stage-title">Write your task</h3>
                <p className="hiw-stage-desc">
                  Start with what you normally want to ask an AI. It can be coding, writing, research, studying, brainstorming, or any other task.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-task-prompt-box">
                    <span className="hiw-task-prompt-label">USER TASK</span>
                    <div className="hiw-task-prompt-content">
                      “I need to write an email to my professor about missing an assignment.”
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 02 */}
            <div className="hiw-stage-row reverse reveal-on-scroll">
              <div className="hiw-stage-node">02</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 02</span>
                <h3 className="hiw-stage-title">EcoRoute understands your task</h3>
                <p className="hiw-stage-desc">
                  EcoRoute identifies what you are trying to accomplish and asks only the relevant questions instead of making you fill out a long form.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-spec-list">
                    <div className="hiw-spec-row">
                      <span className="hiw-spec-label">Task type</span>
                      <span className="hiw-spec-value">Writing</span>
                    </div>
                    <div className="hiw-spec-row">
                      <span className="hiw-spec-label">Goal</span>
                      <span className="hiw-spec-value">Write an email</span>
                    </div>
                    <div className="hiw-spec-row">
                      <span className="hiw-spec-label">Tone</span>
                      <span className="hiw-spec-value">Professional</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 03 */}
            <div className="hiw-stage-row reveal-on-scroll">
              <div className="hiw-stage-node">03</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 03</span>
                <h3 className="hiw-stage-title">Choose your AI</h3>
                <p className="hiw-stage-desc">
                  Tell EcoRoute which AI tool you are using. If you are unsure, EcoRoute can help determine the appropriate option.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-ai-grid">
                    {aiOptions.map((ai, idx) => (
                      <div 
                        key={idx} 
                        className={`hiw-ai-chip ${selectedAi === idx ? 'selected' : ''}`}
                        onClick={() => setSelectedAi(idx)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{ai.name}</span>
                        <span className="hiw-ai-dot"></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 04 */}
            <div className="hiw-stage-row reverse reveal-on-scroll">
              <div className="hiw-stage-node">04</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 04</span>
                <h3 className="hiw-stage-title">EcoRoute improves your prompt</h3>
                <p className="hiw-stage-desc">
                  EcoRoute analyzes your original prompt and makes it clearer, more specific, and easier for the AI to understand without changing what you actually want.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-dual-prompt-box">
                    <div className="hiw-sub-prompt-card">
                      <span className="hiw-prompt-badge-danger">BEFORE</span>
                      <div className="hiw-prompt-snippet">“explain inheritance in java”</div>
                    </div>

                    <div className="hiw-prompt-transition-arrow">
                      ↓ EcoRoute improves
                    </div>

                    <div className="hiw-sub-prompt-card after">
                      <span className="hiw-prompt-badge-success">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        AFTER
                      </span>
                      <div className="hiw-prompt-snippet">
                        “Explain inheritance in Java in simple terms with a real world example and a short code example.”
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 05 */}
            <div className="hiw-stage-row reveal-on-scroll">
              <div className="hiw-stage-node">05</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 05</span>
                <h3 className="hiw-stage-title">Use fewer tokens</h3>
                <p className="hiw-stage-desc">
                  EcoRoute removes unnecessary words and repetition while keeping the important information. This helps make prompts more efficient.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-token-transform">
                    <div className="hiw-token-box">
                      <span className="hiw-token-lbl">BEFORE</span>
                      <span className="hiw-token-val">42 tokens</span>
                    </div>

                    <div className="hiw-token-arrow-container">
                      <span className="hiw-token-arrow-text">↓ Reduction</span>
                    </div>

                    <div className="hiw-token-box" style={{ textAlign: 'right' }}>
                      <span className="hiw-token-lbl">AFTER</span>
                      <span className="hiw-token-val highlight">29 tokens</span>
                      <span className="hiw-token-reduction">31% reduction</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 06 */}
            <div className="hiw-stage-row reverse reveal-on-scroll">
              <div className="hiw-stage-node">06</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 06</span>
                <h3 className="hiw-stage-title">Get the optimized prompt</h3>
                <p className="hiw-stage-desc">
                  EcoRoute shows you the improved prompt before you send it, so you can review it and make changes if needed.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-optimized-card">
                    <div className="hiw-prompt-badge-success">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      OPTIMIZED PROMPT
                    </div>

                    <div className="hiw-optimized-box">
                      “{typedText}”
                      <span className="hiw-typing-cursor"></span>
                    </div>

                    <div className="hiw-action-row">
                      <button 
                        className={`hiw-copy-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopyPrompt}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {copied ? (
                            <path d="M20 6L9 17l-5-5"/>
                          ) : (
                            <path d="M8 4v12a2 2 0 002 2h8a2 2 0 002-2V7.242a2 2 0 00-.602-1.43L16.083 2.5A2 2 0 0014.653 2H10a2 2 0 00-2 2zM4 8v12a2 2 0 002 2h8" />
                          )}
                        </svg>
                        {copied ? 'Copied to Clipboard' : 'Copy Prompt'}
                      </button>
                      <span className="hiw-copy-hint">Ready to review or edit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 07 */}
            <div className="hiw-stage-row reveal-on-scroll">
              <div className="hiw-stage-node">07</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 07</span>
                <h3 className="hiw-stage-title">Send it to your AI</h3>
                <p className="hiw-stage-desc">
                  Once the prompt looks good, use the EcoRoute extension to insert the optimized prompt directly into the AI website you are using. Then press Send normally.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-pipe-flow">
                    <div className="hiw-pipe-node">
                      <span>EcoRoute</span>
                      <span style={{ fontSize: '10px', color: 'var(--lime)' }}>ACTIVE</span>
                    </div>
                    <div className="hiw-pipe-arrow">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2"/></svg>
                    </div>
                    <div className="hiw-pipe-node">
                      <span>Insert optimized prompt</span>
                      <span style={{ fontSize: '10px', color: 'var(--dim)' }}>1-CLICK</span>
                    </div>
                    <div className="hiw-pipe-arrow">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2"/></svg>
                    </div>
                    <div className="hiw-pipe-node">
                      <span>ChatGPT / Gemini / Claude</span>
                      <span style={{ fontSize: '10px', color: 'var(--dim)' }}>TARGET</span>
                    </div>
                    <div className="hiw-pipe-arrow">
                      <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M19 12l-7 7-7-7" strokeWidth="2"/></svg>
                    </div>
                    <div className="hiw-pipe-node highlight">
                      <span>Send</span>
                      <span style={{ fontSize: '10px', color: 'var(--lime)' }}>NORMAL EXECUTION</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 08 */}
            <div className="hiw-stage-row reverse reveal-on-scroll">
              <div className="hiw-stage-node">08</div>
              
              <div className="hiw-stage-info">
                <span className="hiw-stage-number">STAGE 08</span>
                <h3 className="hiw-stage-title">Understand the efficiency</h3>
                <p className="hiw-stage-desc">
                  EcoRoute shows useful information about your prompt such as token reduction, efficiency, and estimated resource impact.
                </p>
              </div>

              <div className="hiw-stage-visual">
                <div className="hiw-card">
                  <div className="hiw-efficiency-trio">
                    <div className="hiw-efficiency-card">
                      <span className="hiw-efficiency-tag">TOKEN REDUCTION</span>
                      <span className="hiw-efficiency-val">31%</span>
                    </div>
                    <div className="hiw-efficiency-card">
                      <span className="hiw-efficiency-tag">EFFICIENCY</span>
                      <span className="hiw-efficiency-val">High</span>
                    </div>
                    <div className="hiw-efficiency-card">
                      <span className="hiw-efficiency-tag">RESOURCE IMPACT</span>
                      <span className="hiw-efficiency-val">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* IMPORTANT PRODUCT MESSAGE */}
          <div className="hiw-note-box reveal-on-scroll">
            <div className="hiw-note-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </div>
            <div className="hiw-note-content">
              EcoRoute does not generate the final AI response. It improves the way you interact with the AI tool you already use.
            </div>
          </div>
        </section>

        {/* 3. FINAL CTA */}
        <section className="hiw-cta-section reveal-on-scroll">
          <div className="hiw-cta-box">
            <h2>Ready to use AI a little smarter?</h2>
            <p>Give EcoRoute a task. We’ll help you figure out the rest.</p>
            <div className="hiw-cta-actions">
              <NavLink to="/" className="btn-solid">
                Try EcoRoute
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#050602" strokeWidth="2.2" strokeLinecap="square" />
                </svg>
              </NavLink>
              <NavLink to="/extension" className="btn">
                Get the Extension
              </NavLink>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
