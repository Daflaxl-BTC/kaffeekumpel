import React from "react";

export function PlantLeft({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 340 780"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Topf */}
      <path d="M60 690 L260 690 L240 780 L80 780 Z" fill="#6b4a35" />
      <path d="M55 680 L265 680 L262 700 L58 700 Z" fill="#5c3a24" />
      {/* Stiele */}
      <g stroke="#3d2f1f" strokeWidth={4} fill="none">
        <path d="M160 700 C150 600 140 500 130 380" />
        <path d="M170 700 C180 580 200 450 220 320" />
        <path d="M155 700 C120 610 90 510 70 400" />
        <path d="M175 700 C200 650 240 580 270 500" />
      </g>
      {/* Monstera-Blätter */}
      <g fill="#3D6B3A" stroke="#2D4A2B" strokeWidth={2}>
        <path d="M130 380 C70 340 30 280 50 200 C80 160 140 170 160 230 C170 270 160 330 130 380 Z M60 280 L95 280 M70 240 L105 245 M85 210 L115 220 M95 330 L130 330 M75 310 L110 310" />
        <path d="M220 320 C280 280 310 210 290 140 C250 110 190 130 180 200 C175 240 195 290 220 320 Z M285 210 L250 215 M275 170 L240 180 M255 145 L225 160 M235 280 L200 285 M265 250 L230 260" />
        <path d="M70 400 C20 390 0 330 30 290 C70 280 105 320 95 370 C90 390 80 400 70 400 Z M30 340 L55 345 M40 310 L65 320" />
        <path d="M270 500 C330 490 340 430 300 400 C260 400 235 440 255 480 C260 495 265 500 270 500 Z M310 450 L285 455 M300 420 L275 430" />
        <path d="M180 550 C240 560 270 510 250 470 C200 460 170 500 180 550 Z M230 510 L205 515" />
        <path d="M120 600 C80 610 60 570 85 545 C115 545 130 575 120 600 Z" />
      </g>
      <g fill="#5A8A54" opacity={0.85}>
        <path d="M100 470 C70 475 60 445 80 425 C105 425 115 450 100 470 Z" />
        <path d="M200 420 C230 425 240 395 220 375 C195 375 185 400 200 420 Z" />
      </g>
    </svg>
  );
}

export function PlantRight({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 340 780"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Topf */}
      <path d="M60 690 L260 690 L240 780 L80 780 Z" fill="#7A4E32" />
      <path d="M55 680 L265 680 L262 700 L58 700 Z" fill="#6B4028" />
      {/* Stiele fächerförmig */}
      <g stroke="#3d2f1f" strokeWidth={4} fill="none">
        <path d="M160 700 C160 580 155 450 150 320" />
        <path d="M165 700 C190 600 225 480 255 360" />
        <path d="M155 700 C130 600 100 490 75 380" />
        <path d="M170 700 C210 640 260 560 295 460" />
        <path d="M150 700 C110 640 65 560 35 470" />
        <path d="M160 700 C175 580 190 440 200 280" />
      </g>
      {/* Palmblätter */}
      <g fill="#2D4A2B">
        <ellipse cx={150} cy={290} rx={18} ry={55} transform="rotate(-5 150 290)" />
        <ellipse cx={200} cy={250} rx={17} ry={60} transform="rotate(12 200 250)" />
        <ellipse cx={255} cy={340} rx={16} ry={58} transform="rotate(35 255 340)" />
        <ellipse cx={295} cy={450} rx={15} ry={55} transform="rotate(55 295 450)" />
        <ellipse cx={75} cy={360} rx={17} ry={58} transform="rotate(-28 75 360)" />
        <ellipse cx={35} cy={460} rx={15} ry={55} transform="rotate(-55 35 460)" />
        <ellipse cx={110} cy={320} rx={14} ry={50} transform="rotate(-15 110 320)" />
      </g>
      <g fill="#3D6B3A">
        <ellipse cx={175} cy={400} rx={13} ry={45} transform="rotate(20 175 400)" />
        <ellipse cx={130} cy={440} rx={13} ry={45} transform="rotate(-18 130 440)" />
        <ellipse cx={230} cy={420} rx={13} ry={45} transform="rotate(40 230 420)" />
        <ellipse cx={90} cy={500} rx={12} ry={42} transform="rotate(-40 90 500)" />
      </g>
      <g fill="#5A8A54" opacity={0.8}>
        <ellipse cx={160} cy={500} rx={11} ry={38} transform="rotate(5 160 500)" />
        <ellipse cx={205} cy={540} rx={10} ry={35} transform="rotate(30 205 540)" />
      </g>
    </svg>
  );
}
