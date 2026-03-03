import React, { useEffect, useState } from "react";

export default function PerspectiveGrid() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Atualiza dimensões
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Loop de animação bem lento
    let animationFrame;
    const animate = () => {
      // Invertido: subtraindo para ir "para dentro" (afastando)
      setOffset((prev) => {
        let next = prev - 0.002;
        if (next < 0) next += 1;
        return next;
      });
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  const { width, height } = dimensions;
  const cx = width / 2;
  const cy = height / 2;

  // 1. Linhas Diagonais (Quinas principais)
  const cornerLines = [
    { x1: cx, y1: cy, x2: 0, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: height },
    { x1: cx, y1: cy, x2: 0, y2: height },
  ];

  // 2. Linhas Radiais Extras
  const extraLines = [];
  const linesPerWall = 8; // Aumentado para mais densidade

  // Top
  for (let i = 1; i <= linesPerWall; i++) {
    const x = (width * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: x, y2: 0 });
  }
  // Bottom
  for (let i = 1; i <= linesPerWall; i++) {
    const x = (width * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: x, y2: height });
  }
  // Left
  for (let i = 1; i <= linesPerWall; i++) {
    const y = (height * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: 0, y2: y });
  }
  // Right
  for (let i = 1; i <= linesPerWall; i++) {
    const y = (height * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: width, y2: y });
  }

  const allRadialLines = [...cornerLines, ...extraLines];

  // 3. Retângulos de profundidade Animados
  const gridRects = [];
  const numRects = 30; // Aumentado para mais densidade
  const maxScale = 1.5;

  for (let i = 0; i < numRects; i++) {
    let t = (i + offset) / numRects;

    if (t > 1) t -= 1;
    if (t < 0) t += 1;

    // Escala não-linear para perspectiva
    const scale = Math.pow(t, 2.5);

    const rectW = width * scale * maxScale;
    const rectH = height * scale * maxScale;

    // Opacidade suave
    const opacity = Math.min(1, t * 5);

    if (rectW > 1) {
      gridRects.push({
        x: cx - rectW / 2,
        y: cy - rectH / 2,
        width: rectW,
        height: rectH,
        opacity,
      });
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#050505]">
      <svg className="w-full h-full opacity-30" width="100%" height="100%">
        {/* Linhas Radiais (Estáticas) */}
        {allRadialLines.map((line, i) => (
          <line
            key={`r-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(150, 150, 150, 0.3)"
            strokeWidth={i < 4 ? 3 : 2}
          />
        ))}

        {/* Retângulos (Animados) */}
        {gridRects.map((rect, i) => (
          <rect
            key={`g-${i}`}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill="none"
            stroke="rgba(150, 150, 150, 0.3)"
            strokeWidth="2"
            opacity={rect.opacity}
          />
        ))}
      </svg>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#050505_100%)] z-10 pointer-events-none"></div>
    </div>
  );
}
