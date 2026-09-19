import { Link } from 'react-router-dom';
import LLMCarousel from './LLMCarousel';

export default function Hero() {
  return (
    <section className="hero">
      <LLMCarousel />

      <div className="hero-copy">
        <div className="hero-tag">Prompt Intelligence & Compute Routing</div>
        <h1>Smarter prompts<span>for a brighter tomorrow.</span></h1>
        <p>Choose your AI intentionally. Right-size your compute. Get sharper answers with zero bloat.</p>

        {/* Interactive Process Flow Band */}
        <div className="hero-process-flow">
          <div className="process-step">
            <span className="step-num">01</span>
            <span className="step-name">Prompt</span>
          </div>
          <span className="process-arrow">→</span>
          <div className="process-step">
            <span className="step-num">02</span>
            <span className="step-name">Need AI?</span>
          </div>
          <span className="process-arrow">→</span>
          <div className="process-step">
            <span className="step-num">03</span>
            <span className="step-name">Optimize</span>
          </div>
          <span className="process-arrow">→</span>
          <div className="process-step">
            <span className="step-num">04</span>
            <span className="step-name">Right Model</span>
          </div>
          <span className="process-arrow">→</span>
          <div className="process-step step-highlight">
            <span className="step-num">05</span>
            <span className="step-name">Efficient Output</span>
          </div>
        </div>

        <div className="hero-cta">
          <Link to="/workspace" className="btn-solid">
            Open AI Workspace
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#050602" strokeWidth="2.2" strokeLinecap="square" />
            </svg>
          </Link>
          <Link to="/think-before-ai" className="btn-outline">
            Why Intentional AI?
          </Link>
        </div>
      </div>

      <div className="scroll-cue">
        <span className="line"></span>SCROLL
      </div>
    </section>
  );
}

