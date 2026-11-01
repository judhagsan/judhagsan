import { useEffect, useState } from "react";

export default function PerspectiveGrid() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Loop suave de afastamento em perspectiva (túnel infinito para frente)
    let animationFrame;
    const animate = () => {
      setOffset((prev) => {
        let next = prev + 0.0018;
        if (next >= 1) next -= 1;
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

  // Linhas diagonais principais dos cantos ao ponto de fuga central
  const cornerLines = [
    { x1: cx, y1: cy, x2: 0, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: height },
    { x1: cx, y1: cy, x2: 0, y2: height },
  ];

  // Linhas radiais adicionais no teto, chão e paredes laterais
  const extraLines = [];
  const linesPerWall = 7;

  for (let i = 1; i <= linesPerWall; i++) {
    const x = (width * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: x, y2: 0 });
    extraLines.push({ x1: cx, y1: cy, x2: x, y2: height });
  }

  for (let i = 1; i <= linesPerWall; i++) {
    const y = (height * i) / (linesPerWall + 1);
    extraLines.push({ x1: cx, y1: cy, x2: 0, y2: y });
    extraLines.push({ x1: cx, y1: cy, x2: width, y2: y });
  }

  const allRadialLines = [...cornerLines, ...extraLines];

  // 29 retângulos concêntricos com escala exponencial de profundidade
  const gridRects = [];
  const numRects = 29;
  const maxScale = 1.0;

  for (let i = 0; i < numRects; i++) {
    let t = (i + offset) / numRects;

    if (t > 1) t -= 1;
    if (t < 0) t += 1;

    // Escala não-linear de profundidade idêntica à vinheta
    const scale = Math.pow(t, 2.3);
    const currentScale = scale * maxScale;

    // Descarte estrito: nunca renderizar retângulos fora dos limites do viewport
    if (currentScale > 1.0) continue;

    const rectW = width * currentScale;
    const rectH = height * currentScale;

    if (rectW > 2) {
      gridRects.push({
        x: cx - rectW / 2,
        y: cy - rectH / 2,
        width: rectW,
        height: rectH,
      });
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 bg-black">
      {/* Grade do túnel vetorial com traço luminoso 100% sólido */}
      <svg
        className="w-full h-full block overflow-hidden"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <clipPath id="perspective-viewport-clip">
            <rect x="0" y="0" width={width} height={height} />
          </clipPath>
        </defs>

        <g clipPath="url(#perspective-viewport-clip)">
          {/* Raios e diagonais radiais sólidas */}
          {allRadialLines.map((line, i) => (
            <line
              key={`r-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={i < 4 ? "#52525b" : "#3f3f46"}
              strokeWidth={i < 4 ? 2 : 1.5}
            />
          ))}

          {/* Retângulos de perspectiva em profundidade sólidos */}
          {gridRects.map((rect, i) => (
            <rect
              key={`g-${i}`}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="none"
              stroke="#3f3f46"
              strokeWidth="1.5"
            />
          ))}
        </g>
      </svg>

      {/* Camada de grão analógico estático com gradiente elíptico concentrado no centro */}
      <div
        className="absolute inset-0 bg-noise pointer-events-none"
        style={{
          maskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 95%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 95%)",
        }}
      />
    </div>
  );
}
