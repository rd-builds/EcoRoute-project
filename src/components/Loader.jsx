import { useState, useEffect } from 'react';

export default function Loader({ onComplete }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let currentPct = 0;
    const loadTimer = setInterval(() => {
      currentPct += Math.random() * 14 + 6;
      if (currentPct >= 100) {
        currentPct = 100;
        setPct(100);
        clearInterval(loadTimer);
        setTimeout(() => {
          setDone(true);
          onComplete && onComplete();
        }, 260);
      } else {
        setPct(Math.round(currentPct));
      }
    }, 180);

    return () => clearInterval(loadTimer);
  }, [onComplete]);

  return (
    <div id="loader" className={done ? 'done' : ''}>
      <div className="loader-mark">
        <svg viewBox="0 0 64 64">
          <path d="M32 6C18 6 8 16 8 32c0 14 9 26 24 26 2-11 3-19 11-27 5-5 13-8 13-8-3 16-9 24-19 29-6 3-13 2-18-3C12 42 9 35 11 27 14 14 22 6 32 6z"/>
        </svg>
      </div>
      <div className="loader-word">EcoRoute</div>
      <div className="loader-pct">
        <span>{pct}%</span>
        <span className="bar">
          <span 
            style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: '#c8ff4d', display: 'block' }}
          ></span>
        </span>
      </div>
    </div>
  );
}
