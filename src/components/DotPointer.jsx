import { useEffect, useState } from 'react';

export default function DotPointer() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    setVisible(true);

    const handleMouseMove = (e) => {
      setPos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="dot"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`
      }}
    />
  );
}
