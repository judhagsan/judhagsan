import React from "react";

export default function PerspectiveGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#050505]">
      <div className="perspective-container">
        <div className="grid-plane ceiling"></div>
        <div className="grid-plane floor"></div>
        <div className="grid-plane left-wall"></div>
        <div className="grid-plane right-wall"></div>
      </div>

      {/* Vignette - ajustada para suavizar as bordas onde o flicker é pior */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050505_90%)] z-10 pointer-events-none"></div>

      <style jsx>{`
        .perspective-container {
          perspective: 600px;
          width: 100%;
          height: 100%;
          position: absolute;
          transform-style: preserve-3d;
          /* Otimização de renderização */
          contain: strict;
        }

        .grid-plane {
          position: absolute;
          backface-visibility: hidden; /* Importante para performance */
          /* TRUQUE DO ANTI-ALIASING:
             Em vez de cortar seco no 6px, fazemos uma transição suave entre 5px e 7px.
             Isso mata o serrilhado que causa o flicker.
          */
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.4) 5px,
              transparent 7px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.4) 5px,
              transparent 7px
            );
          background-size: 140px 140px;

          /* Força a GPU a gerenciar essa camada */
          will-change: background-position, transform;
        }

        .ceiling {
          top: 0;
          left: 0;
          right: 0;
          height: 300vmax;
          transform-origin: top;
          /* translateZ(0) ajuda a evitar sub-pixel jitter */
          transform: rotateX(-90deg) translateZ(0);
          animation: ceiling-scroll 20s linear infinite;
          -webkit-mask-image: linear-gradient(
            to bottom,
            black 10%,
            transparent 70%
          );
          mask-image: linear-gradient(to bottom, black 10%, transparent 70%);
        }

        .floor {
          bottom: 0;
          left: 0;
          right: 0;
          height: 300vmax;
          transform-origin: bottom;
          transform: rotateX(90deg) translateZ(0);
          animation: floor-scroll 20s linear infinite;
          -webkit-mask-image: linear-gradient(
            to top,
            black 10%,
            transparent 70%
          );
          mask-image: linear-gradient(to top, black 10%, transparent 70%);
        }

        .left-wall {
          top: 0;
          bottom: 0;
          left: 0;
          width: 300vmax;
          transform-origin: left;
          transform: rotateY(90deg) translateZ(0);
          animation: left-scroll 20s linear infinite;
          -webkit-mask-image: linear-gradient(
            to right,
            black 10%,
            transparent 70%
          );
          mask-image: linear-gradient(to right, black 10%, transparent 70%);
        }

        .right-wall {
          top: 0;
          bottom: 0;
          right: 0;
          width: 300vmax;
          transform-origin: right;
          transform: rotateY(-90deg) translateZ(0);
          animation: right-scroll 20s linear infinite;
          -webkit-mask-image: linear-gradient(
            to left,
            black 10%,
            transparent 70%
          );
          mask-image: linear-gradient(to left, black 10%, transparent 70%);
        }

        @keyframes floor-scroll {
          0% {
            background-position: 0 100%;
          }
          100% {
            background-position: 0 calc(100% + 140px);
          }
        }

        @keyframes ceiling-scroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 -140px;
          }
        }

        @keyframes left-scroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: -140px 0;
          }
        }

        @keyframes right-scroll {
          0% {
            background-position: 100% 0;
          }
          100% {
            background-position: calc(100% + 140px) 0;
          }
        }
      `}</style>
    </div>
  );
}
