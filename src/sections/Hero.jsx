import { Link } from 'react-router-dom';
import LLMCarousel from './LLMCarousel';

export default function Hero() {
  return (
    <section className="hero">
      <LLMCarousel />

      <div className="hero-copy">
        <div className="hero-tag">Prompt intelligence</div>
        <h1>Smarter prompts<span>for a brighter tomorrow.</span></h1>
        <p>Choose your AI. Get sharper answers. Use less to get more.</p>
        <div className="hero-cta">
          <Link to="/workspace" className="btn-solid">
            Start now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#050602" strokeWidth="2.2" strokeLinecap="square" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="scroll-cue">
        <span className="line"></span>SCROLL
      </div>
    </section>
  );
}
