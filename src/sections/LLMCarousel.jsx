import { useEffect, useRef } from 'react';
import imgBq from '../assets/bq.jpg';
import imgTc from '../assets/tc.jpg';
import imgC from '../assets/c.jpg';
import imgChat from '../assets/chat.jpg';
import imgG from '../assets/g.jpg';
import imgHp from '../assets/hp.jpg';
import imgCo from '../assets/co.jpg';
import imgP from '../assets/p.jpg';
import imgDp from '../assets/dp.jpg';
import imgSt from '../assets/st.jpg';

const cardData = [
  { name: 'Better questions.', tag: 'Insight', cls: 'p-a', img: imgBq },
  { name: 'Claude', tag: 'Model', cls: 'p-claude', img: imgC },
  { name: 'ChatGPT', tag: 'Model', cls: 'p-chatgpt', img: imgChat },
  { name: 'Think clearer.', tag: 'Insight', cls: 'p-b', img: imgTc },
  { name: 'Gemini', tag: 'Model', cls: 'p-gemini', img: imgG },
  { name: 'Higher possibilities.', tag: 'Insight', cls: 'p-c', img: imgHp },
  { name: 'Copilot', tag: 'Model', cls: 'p-copilot', img: imgCo },
  { name: 'Perplexity', tag: 'Model', cls: 'p-perplexity', img: imgP },
  { name: 'DeepSeek', tag: 'Model', cls: 'p-deepseek', img: imgDp },
  { name: 'Same ideas. A brighter future.', tag: 'Insight', cls: 'p-d', img: imgSt }
];

export default function LLMCarousel() {
  const stageRef = useRef(null);
  const elsRef = useRef([]);

  useEffect(() => {
    if (!stageRef.current) return;
    const stage = stageRef.current;

    // Setup elements
    elsRef.current = cardData.map(d => {
      const el = document.createElement('div');
      el.className = `arc-card ${d.cls}`;
      el.innerHTML = `
        <img src="${d.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; pointer-events: none;" />
        <span class="tag mono" style="position: relative; z-index: 1;">${d.tag}</span>
        <span class="name">${d.name}</span>
      `;
      stage.appendChild(el);
      return el;
    });

    const N = cardData.length;
    const els = elsRef.current;
    let t = 0;
    const speed = 0.082;
    const isMobile = window.innerWidth < 860;
    const radiusX = isMobile ? 140 : 380;
    const arcHeight = isMobile ? 70 : 150;
    let animationId;

    function frame() {
      t += speed;
      const step = 360 / N;
      els.forEach((el, i) => {
        let angle = (t + i * step) % 360;
        if (angle < 0) angle += 360;
        const rad = angle * Math.PI / 180;
        const z = Math.cos(rad);
        const x = Math.sin(rad) * radiusX;
        const y = (1 - Math.cos(rad)) * (arcHeight * 0.5) - arcHeight * 0.15;
        const scale = 0.42 + 0.66 * ((z + 1) / 2);

        // 3D rotations for continuous depth feel
        const tiltY = -Math.sin(rad) * 35; // rotate toward/away from viewer
        const tiltZ = -Math.sin(rad) * 6;  // slight 2D tilt
        const zDepth = z * 80;             // actual 3D depth push

        let opacity;
        if (z < -0.15) { opacity = 0; }
        else if (z < 0.15) { opacity = (z + 0.15) / 0.3; }
        else { opacity = 1; }

        el.style.transform = `translate(-50%,-50%) translate3d(${x}px, ${y}px, ${zDepth}px) rotateY(${tiltY}deg) rotateZ(${tiltZ}deg) scale(${scale})`;
        el.style.zIndex = Math.round((z + 1) * 500);
        el.style.opacity = opacity;
        el.classList.toggle('center-active', z > 0.92);
      });
      animationId = requestAnimationFrame(frame);
    }

    frame();

    return () => {
      cancelAnimationFrame(animationId);
      els.forEach(el => stage.contains(el) && stage.removeChild(el));
      elsRef.current = [];
    };
  }, []);

  return <div className="arc-stage" ref={stageRef}></div>;
}
