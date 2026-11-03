import { useEffect, useRef, useState } from "react";

const NUM_RECTS = 29;
const LINES_PER_WALL = 7;
// Avanço do túnel por quadro, em fração do intervalo entre dois retângulos
const SPEED = 0.0018;

// Retângulo de profundidade `i` para um avanço `offset` (0–1) do túnel. A
// escala não-linear imita a perspectiva da vinheta; como `(i + offset)` fica
// sempre abaixo de NUM_RECTS, nenhum retângulo passa da borda da tela.
function depthRect(i, offset, width, height) {
  const scale = Math.pow((i + offset) / NUM_RECTS, 2.3);
  const rectWidth = width * scale;
  const rectHeight = height * scale;
  return {
    x: (width - rectWidth) / 2,
    y: (height - rectHeight) / 2,
    width: rectWidth,
    height: rectHeight,
  };
}

// Diagonais dos cantos (as quatro primeiras, mais grossas) e raios extras no
// teto, chão e paredes laterais, todos saindo do ponto de fuga central.
function radialLines(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const lines = [
    { x1: cx, y1: cy, x2: 0, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: 0 },
    { x1: cx, y1: cy, x2: width, y2: height },
    { x1: cx, y1: cy, x2: 0, y2: height },
  ];

  for (let i = 1; i <= LINES_PER_WALL; i++) {
    const x = (width * i) / (LINES_PER_WALL + 1);
    lines.push({ x1: cx, y1: cy, x2: x, y2: 0 });
    lines.push({ x1: cx, y1: cy, x2: x, y2: height });
  }

  for (let i = 1; i <= LINES_PER_WALL; i++) {
    const y = (height * i) / (LINES_PER_WALL + 1);
    lines.push({ x1: cx, y1: cy, x2: 0, y2: y });
    lines.push({ x1: cx, y1: cy, x2: width, y2: y });
  }

  return lines;
}

export default function PerspectiveGrid() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const rectRefs = useRef([]);
  const offsetRef = useRef(0);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // O avanço mexe direto nos atributos dos <rect>, sem passar pelo estado do
  // React: com estado, eram 60 renders por segundo do componente inteiro só
  // para deslocar retângulos. O React só volta a renderizar no resize.
  useEffect(() => {
    const { width, height } = dimensions;

    const draw = () => {
      rectRefs.current.forEach((rect, i) => {
        if (!rect) return;
        const next = depthRect(i, offsetRef.current, width, height);
        rect.setAttribute("x", next.x);
        rect.setAttribute("y", next.y);
        rect.setAttribute("width", next.width);
        rect.setAttribute("height", next.height);
        rect.setAttribute("visibility", next.width > 2 ? "visible" : "hidden");
      });
    };
    draw();

    // A regra global de movimento reduzido só alcança animação de CSS; este
    // loop é JS, então a preferência é conferida aqui e o túnel fica parado.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let animationFrame;
    const animate = () => {
      offsetRef.current = (offsetRef.current + SPEED) % 1;
      draw();
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [dimensions]);

  const { width, height } = dimensions;
  const lines = radialLines(width, height);
  // Posição de partida, igual no servidor e no cliente; o efeito acima assume
  // daí em diante.
  const rects = Array.from({ length: NUM_RECTS }, (_, i) =>
    depthRect(i, 0, width, height),
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0 bg-black">
      {/* Grade do túnel vetorial com traço sólido */}
      <svg
        className="w-full h-full block"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {lines.map((line, i) => (
          <line
            key={`r-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            className={i < 4 ? "stroke-zinc-600" : "stroke-zinc-700"}
            strokeWidth={i < 4 ? 2 : 1.5}
          />
        ))}

        {rects.map((rect, i) => (
          <rect
            key={`g-${i}`}
            ref={(element) => {
              rectRefs.current[i] = element;
            }}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            visibility={rect.width > 2 ? "visible" : "hidden"}
            fill="none"
            className="stroke-zinc-700"
            strokeWidth="1.5"
          />
        ))}
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
