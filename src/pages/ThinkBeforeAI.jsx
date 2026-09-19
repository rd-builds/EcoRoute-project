import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './ThinkBeforeAI.css';

export default function ThinkBeforeAI() {
  const [heroChoice, setHeroChoice] = useState(null);
  const [machineStep, setMachineStep] = useState(0);
  const [machineResult, setMachineResult] = useState(null);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const [activeTrendIdx, setActiveTrendIdx] = useState(null);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cycle pipeline active stage automatically for visual polish
  useEffect(() => {
    const timer = setInterval(() => {
      setActivePipelineStep((prev) => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const machinePrompts = [
    {
      prompt: "What is 25 × 48?",
      aiOption: "ASK AI",
      toolOption: "USE CALCULATOR",
      correctChoice: "tool",
      statusText: "AI NOT REQUIRED",
      reasonText: "Some tasks are better handled by simple tools.",
      avoidedText: "Potential unnecessary AI inference avoided"
    },
    {
      prompt: "Convert 5 km to meters.",
      aiOption: "ASK AI",
      toolOption: "USE CONVERSION TOOL",
      correctChoice: "tool",
      statusText: "AI NOT REQUIRED",
      reasonText: "A simple conversion formula (× 1000) executes locally with zero LLM compute.",
      avoidedText: "Potential unnecessary AI inference avoided"
    },
    {
      prompt: "Analyze 10,000 customer reviews and identify recurring themes.",
      aiOption: "ASK AI",
      toolOption: "MANUAL READ",
      correctChoice: "ai",
      statusText: "AI JUSTIFIED",
      reasonText: "Semantic synthesis and pattern extraction across unstructured text genuinely benefit from LLM reasoning.",
      avoidedText: "EcoRoute optimizes prompt for maximum compute efficiency"
    }
  ];

  const trendCards = [
    { icon: "🖼️", title: "AI Trend Images", desc: "Generating viral avatar filters or stylized portraits." },
    { icon: "📱", title: "AI Wallpapers", desc: "Creating personalized high-res lockscreen backgrounds." },
    { icon: "📲", title: "Social Content", desc: "Drafting caption options and post variations." },
    { icon: "📚", title: "AI Research", desc: "Synthesizing complex topics and literature." },
    { icon: "💻", title: "AI Coding", desc: "Debugging stack traces and scaffolding API endpoints." },
    { icon: "🎓", title: "AI Learning", desc: "Explaining advanced concepts step-by-step." }
  ];

  const handleMachineChoice = (choiceType) => {
    const current = machinePrompts[machineStep];
    setMachineResult({
      choiceType,
      isTool: choiceType === 'tool',
      statusText: current.statusText,
      reasonText: current.reasonText,
      avoidedText: current.avoidedText
    });
  };

  const handleNextMachinePrompt = () => {
    setMachineResult(null);
    setMachineStep((prev) => (prev + 1) % machinePrompts.length);
  };

  return (
    <div className="tb-glass-page">
      {/* Ambient Lighting Background */}
      <div className="tb-ambient-bg">
        <div className="tb-blob tb-blob-1"></div>
        <div className="tb-blob tb-blob-2"></div>
        <div className="tb-blob tb-blob-3"></div>
      </div>

      <div className="tb-glass-container">

        {/* 1. HERO SECTION */}
        <section className="tb-glass-section tb-hero-glass">
          {/* Floating Glass Pills */}
          <div className="tb-floating-pills">
            <span className="glass-pill-float pill-compute">COMPUTE</span>
            <span className="glass-pill-float pill-energy">ENERGY</span>
            <span className="glass-pill-float pill-water">WATER</span>
            <span className="glass-pill-float pill-ai">AI</span>
          </div>

          <span className="tb-tag-glass">Intentional AI Awareness</span>

          <h1 className="tb-hero-heading">
            Before you ask AI,<br />
            ask yourself:<br />
            <span>Do I need it?</span>
          </h1>

          {/* Floating Glass Prompt Card */}
          <div className="glass-panel tb-hero-card">
            <p className="tb-hero-prompt-quote">
              “Make me an AI image of myself in an 80s movie.”
            </p>
            <div className="tb-hero-prompt-question">Do I need AI?</div>

            <div className="tb-hero-btn-group">
              <button 
                className={`btn-glass-choice ${heroChoice === 'yes' ? 'selected-yes' : ''}`}
                onClick={() => setHeroChoice('yes')}
              >
                YES
              </button>
              <button 
                className={`btn-glass-choice ${heroChoice === 'no' ? 'selected-no' : ''}`}
                onClick={() => setHeroChoice('no')}
              >
                NO
              </button>
            </div>

            {heroChoice === 'no' && (
              <p style={{ marginTop: '20px', fontSize: '14px', color: '#ffbe4d', lineHeight: '1.5', animation: 'fadeIn 0.3s ease' }}>
                💡 <strong>Great call!</strong> A quick photo filter or local editing app gets it done without cloud GPU compute.
              </p>
            )}

            {heroChoice === 'yes' && (
              <p style={{ marginTop: '20px', fontSize: '14px', color: 'var(--lime)', lineHeight: '1.5', animation: 'fadeIn 0.3s ease' }}>
                ✨ <strong>Intentional choice!</strong> If you choose to generate it, EcoRoute helps you optimize prompt tokens & compute tier.
              </p>
            )}
          </div>
        </section>

        {/* 2. ENVIRONMENT SECTION */}
        <section className="tb-glass-section">
          <div className="tb-section-header">
            <span className="tb-tag-glass">Physical Reality of Cloud Compute</span>
            <h2 className="tb-section-title">The cloud is still made of computers.</h2>
            <p className="tb-section-subtitle">
              AI software runs on physical computing hardware operating 24/7.
            </p>
          </div>

          <div className="tb-env-grid">
            <div className="glass-panel env-glass-panel">
              <div>
                <span className="env-panel-num">01 — COMPUTE</span>
                <svg className="env-panel-icon-svg" viewBox="0 0 48 48" fill="none">
                  <rect x="6" y="8" width="36" height="10" rx="3" fill="rgba(200,255,77,0.12)" stroke="#c8ff4d" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="2" fill="#c8ff4d"/>
                  <rect x="6" y="22" width="36" height="10" rx="3" fill="rgba(200,255,77,0.12)" stroke="#c8ff4d" strokeWidth="1.5"/>
                  <circle cx="12" cy="27" r="2" fill="#c8ff4d"/>
                  <rect x="6" y="36" width="36" height="10" rx="3" fill="rgba(200,255,77,0.12)" stroke="#c8ff4d" strokeWidth="1.5"/>
                  <circle cx="12" cy="41" r="2" fill="#c8ff4d"/>
                </svg>
                <h3>COMPUTE</h3>
              </div>
              <p>AI requests require computational resources and high-performance hardware processors to perform vector math.</p>
            </div>

            <div className="glass-panel env-glass-panel">
              <div>
                <span className="env-panel-num">02 — ENERGY</span>
                <svg className="env-panel-icon-svg" viewBox="0 0 48 48" fill="none">
                  <path d="M26 4L12 26h12l-4 18 20-24H26L30 4z" fill="rgba(200,255,77,0.15)" stroke="#c8ff4d" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                <h3>ENERGY</h3>
              </div>
              <p>Computing infrastructure requires electricity to power thousands of high-density GPUs simultaneously.</p>
            </div>

            <div className="glass-panel env-glass-panel">
              <div>
                <span className="env-panel-num">03 — COOLING</span>
                <svg className="env-panel-icon-svg" viewBox="0 0 48 48" fill="none">
                  <path d="M24 6c0 0-14 16.8-14 23.8 0 7.7 6.3 14.2 14 14.2s14-6.5 14-14.2C38 22.8 24 6 24 6z" fill="rgba(100,200,255,0.15)" stroke="#64c8ff" strokeWidth="1.5"/>
                </svg>
                <h3>COOLING</h3>
              </div>
              <p>Data centers use cooling systems, which can involve water and other resources to maintain safe hardware temperatures.</p>
            </div>
          </div>

          <div className="tb-disclaimer-glass">
            Environmental impact varies by model, workload, infrastructure and location.
          </div>
        </section>

        {/* 3. INTERACTIVE DECISION MACHINE */}
        <section className="tb-glass-section">
          <div className="tb-section-header">
            <span className="tb-tag-glass">Interactive Evaluation</span>
            <h2 className="tb-section-title">Does this actually need AI?</h2>
            <p className="tb-section-subtitle">
              Test your prompt necessity intuition below.
            </p>
          </div>

          <div className="glass-panel decision-machine-glass">
            <div className="decision-prompt-box">
              "{machinePrompts[machineStep].prompt}"
            </div>

            {!machineResult ? (
              <div className="decision-btn-group">
                <button 
                  className="btn-machine"
                  onClick={() => handleMachineChoice('ai')}
                >
                  {machinePrompts[machineStep].aiOption}
                </button>
                <button 
                  className="btn-machine"
                  onClick={() => handleMachineChoice('tool')}
                >
                  {machinePrompts[machineStep].toolOption}
                </button>
              </div>
            ) : (
              <div className="decision-result-anim">
                <div className="decision-status-tag">
                  {machineResult.statusText}
                </div>
                <p style={{ fontSize: '16px', color: '#ffffff', lineHeight: '1.5' }}>
                  "{machineResult.reasonText}"
                </p>
                <div className="decision-avoided-text">
                  ✓ {machineResult.avoidedText}
                </div>

                <button 
                  className="btn-next-prompt"
                  onClick={handleNextMachinePrompt}
                >
                  NEXT PROMPT →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 4. AI TREND SECTION ("WORTH THE GENERATION?") */}
        <section className="tb-glass-section">
          <div className="tb-section-header">
            <span className="tb-tag-glass">Intention over Impulse</span>
            <h2 className="tb-section-title">Worth the generation?</h2>
            <p className="tb-section-subtitle">
              Click on any category below to reflect on intentional AI use.
            </p>
          </div>

          <div className="tb-trend-grid">
            {trendCards.map((card, idx) => (
              <div 
                key={idx} 
                className="glass-panel trend-glass-card"
                onClick={() => setActiveTrendIdx(activeTrendIdx === idx ? null : idx)}
              >
                <div>
                  <div className="trend-card-top">
                    <span className="trend-icon">{card.icon}</span>
                    <span className="btn-worth-it">Worth it?</span>
                  </div>
                  <h4>{card.title}</h4>
                  <p style={{ fontSize: '13.5px', color: 'var(--dim)', lineHeight: '1.5' }}>{card.desc}</p>
                </div>

                {activeTrendIdx === idx && (
                  <div className="trend-reveal-text" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed var(--line)', color: '#ffffff' }}>
                    “AI can be useful here. The question is whether it adds enough value to justify the computation.”
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. ECO-ROUTE TRANSITION & PIPELINE */}
        <section className="tb-glass-section tb-pipeline-section">
          <h2 className="pipeline-transition-text">
            AI is worth using.
            <span>Now let's use it efficiently.</span>
          </h2>

          <div className="pipeline-glass-nodes">
            <div className={`pipeline-node ${activePipelineStep === 0 ? 'active-node' : ''}`}>
              PROMPT
            </div>
            <span className="pipeline-arrow">→</span>

            <div className={`pipeline-node ${activePipelineStep === 1 ? 'active-node' : ''}`}>
              OPTIMIZE
            </div>
            <span className="pipeline-arrow">→</span>

            <div className={`pipeline-node ${activePipelineStep === 2 ? 'active-node' : ''}`}>
              RIGHT-SIZE MODEL
            </div>
            <span className="pipeline-arrow">→</span>

            <div className={`pipeline-node ${activePipelineStep === 3 ? 'active-node' : ''}`}>
              RIGHT-SIZE OUTPUT
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="tb-glass-section tb-cta-glass-section">
          <div className="dark-glass-panel cta-glass-card">
            <h2 className="cta-title">Use AI intentionally.</h2>
            <p className="cta-subtitle">
              Less when unnecessary.<br />
              Efficient when needed.
            </p>

            <NavLink to="/workspace" className="btn-cta-glass-lg">
              TRY ECOROUTE →
            </NavLink>
          </div>
        </section>

      </div>
    </div>
  );
}
