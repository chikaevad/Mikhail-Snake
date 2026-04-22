'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CELL = 38;
const COLS = 20;
const ROWS = 20;
const W = COLS * CELL;
const H = ROWS * CELL;
const HEAD_R = Math.round(CELL * 0.82); // visual radius — bigger than one cell
const BASE_SPEED = 160;
const MIN_SPEED = 70;
const BONUS_EVERY = 3;   // giant olive appears every N olives eaten
const BONUS_TICKS = 55;  // disappears after this many game ticks (~9 s)
const FACE_SRC = 'https://avatars.githubusercontent.com/u/103834747?v=4';
// Source crop: square region covering just the face (top-center 78% of avatar)
const FACE_SX = 0.11;
const FACE_SY = 0.0;
const FACE_SW = 0.78;
const FACE_SH = 0.78;

type Dir = 'U' | 'D' | 'L' | 'R';
type Pt = { x: number; y: number };
type Phase = 'idle' | 'playing' | 'over';

const OPPOSITES: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };
const DELTAS: Record<Dir, Pt> = {
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
};

function randFood(snake: Pt[]): Pt {
  const occ = new Set(snake.map((s) => `${s.x},${s.y}`));
  let p: Pt;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (occ.has(`${p.x},${p.y}`));
  return p;
}

const mkSnake = (): Pt[] => [
  { x: 12, y: 10 },
  { x: 11, y: 10 },
  { x: 10, y: 10 },
];

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const phaseRef = useRef<Phase>('idle');
  const snakeRef = useRef<Pt[]>(mkSnake());
  const dirRef = useRef<Dir>('R');
  const nextDirRef = useRef<Dir>('R');
  const foodRef = useRef<Pt>({ x: 16, y: 10 });
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const faceRef = useRef<HTMLImageElement | null>(null);
  const tearTickRef = useRef(0);
  const olivesEatenRef = useRef(0);
  const bonusOliveRef = useRef<Pt | null>(null);
  const bonusTicksRef = useRef(0);

  const [phase, setPhase] = useState<Phase>('idle');
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = FACE_SRC;
    img.onload = () => {
      faceRef.current = img;
    };
  }, []);

  const respawn = useCallback(() => {
    snakeRef.current = mkSnake();
    dirRef.current = 'R';
    nextDirRef.current = 'R';
    foodRef.current = randFood(snakeRef.current);
    tearTickRef.current = 0;
    bonusOliveRef.current = null;
    bonusTicksRef.current = 0;
  }, []);

  const startGame = useCallback(() => {
    setHighScore((h) => Math.max(h, scoreRef.current));
    respawn();
    scoreRef.current = 0;
    livesRef.current = 3;
    olivesEatenRef.current = 0;
    phaseRef.current = 'playing';
    setPhase('playing');
  }, [respawn]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'playing') return;
      const map: Record<string, Dir> = {
        ArrowUp: 'U',
        ArrowDown: 'D',
        ArrowLeft: 'L',
        ArrowRight: 'R',
        w: 'U',
        s: 'D',
        a: 'L',
        d: 'R',
      };
      const nd = map[e.key];
      if (!nd) return;
      if (nd !== OPPOSITES[dirRef.current]) nextDirRef.current = nd;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let lastMove = 0;

    // ── Background: animated rainbow stripes ──────────────────────────────
    function drawBg(t: number) {
      const palette = [
        '#FF0000',
        '#FF6600',
        '#FFDD00',
        '#00BB44',
        '#0055FF',
        '#8800CC',
        '#FF00DD',
      ];
      const sw = W / palette.length;
      const shift = (t * 0.016) % sw;
      for (let i = -1; i <= palette.length + 1; i++) {
        const idx = ((i % palette.length) + palette.length) % palette.length;
        ctx.fillStyle = palette[idx]!;
        ctx.fillRect(i * sw - shift, 0, sw, H);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.26)';
      ctx.fillRect(0, 0, W, H);
      // subtle grid
      ctx.strokeStyle = 'rgba(0,0,0,0.07)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, H);
        ctx.stroke();
      }
      for (let j = 0; j <= ROWS; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * CELL);
        ctx.lineTo(W, j * CELL);
        ctx.stroke();
      }
    }

    // ── Snake body segment ────────────────────────────────────────────────
    function drawSegment(seg: Pt, idx: number, total: number) {
      const x = seg.x * CELL + 2;
      const y = seg.y * CELL + 2;
      const s = CELL - 4;
      const lightness = 18 + (1 - idx / total) * 14;
      ctx.shadowColor = '#00ee44';
      ctx.shadowBlur = idx < 4 ? 8 : 2;
      ctx.fillStyle = `hsl(130,72%,${lightness}%)`;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      // scale dot
      ctx.fillStyle = 'rgba(0,200,70,0.32)';
      ctx.beginPath();
      ctx.arc(seg.x * CELL + CELL / 2, seg.y * CELL + CELL / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Snake head: Mikhail's face ────────────────────────────────────────
    function drawHead(pt: Pt, crying: boolean, t: number) {
      const cx = pt.x * CELL + CELL / 2;
      const cy = pt.y * CELL + CELL / 2;

      // Clip to circle and draw face — source-cropped to just the face area
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, HEAD_R, 0, Math.PI * 2);
      ctx.clip();
      if (faceRef.current) {
        const iw = faceRef.current.naturalWidth || faceRef.current.width;
        const ih = faceRef.current.naturalHeight || faceRef.current.height;
        ctx.drawImage(
          faceRef.current,
          iw * FACE_SX, ih * FACE_SY, iw * FACE_SW, ih * FACE_SH,
          cx - HEAD_R, cy - HEAD_R, HEAD_R * 2, HEAD_R * 2,
        );
      } else {
        ctx.fillStyle = '#c8956c';
        ctx.fill();
      }
      ctx.restore();

      // Glowing border
      ctx.shadowColor = '#00ff55';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#2a7a2a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, HEAD_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tears when crying
      if (crying) {
        tearTickRef.current++;
        const tf = tearTickRef.current;
        const tw = HEAD_R * 0.27; // horizontal offset of tears from centre

        // Standing tear pools on cheeks
        ctx.fillStyle = 'rgba(160,220,255,0.88)';
        ctx.beginPath();
        ctx.ellipse(cx - tw, cy + HEAD_R * 0.18, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + tw, cy + HEAD_R * 0.18, 3, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Animated falling drops
        const drop = (ox: number, phase: number) => {
          const p = ((tf + phase) % 55) / 55;
          ctx.globalAlpha = (1 - p) * 0.9;
          ctx.fillStyle = '#99ddff';
          ctx.beginPath();
          ctx.ellipse(cx + ox, cy + HEAD_R * 0.25 + p * 40, 3, 5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        };
        drop(-tw, 0);
        drop(tw, 18);
        drop(-tw - 4, 33);
        drop(tw + 4, 46);
      }
    }

    // ── Olive food ────────────────────────────────────────────────────────
    function drawOlive(pos: Pt, t: number) {
      const cx = pos.x * CELL + CELL / 2;
      const cy = pos.y * CELL + CELL / 2;
      const bob = Math.sin(t * 0.003) * 2.5;
      const pulse = 1 + Math.sin(t * 0.005) * 0.08;

      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.scale(pulse, pulse);

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.ellipse(3, 4, CELL * 0.48, CELL * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();

      // Olive body with radial gradient
      const g = ctx.createRadialGradient(-5, -7, 2, 0, 0, CELL * 0.52);
      g.addColorStop(0, '#6aaa3a');
      g.addColorStop(0.6, '#3d6a1a');
      g.addColorStop(1, '#1e3a0a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, CELL * 0.46, CELL * 0.54, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red pimento center
      ctx.fillStyle = '#dd2222';
      ctx.beginPath();
      ctx.ellipse(0, 0, CELL * 0.17, CELL * 0.17, 0, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.ellipse(-5, -7, 5, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // ── Giant bonus olive ─────────────────────────────────────────────────
    function drawGiantOlive(pos: Pt, ticksLeft: number, t: number) {
      const cx = pos.x * CELL + CELL / 2;
      const cy = pos.y * CELL + CELL / 2;

      // Pulse speed increases as timer runs out
      const urgency = 1 - ticksLeft / BONUS_TICKS;
      const pulseFreq = 0.004 + urgency * 0.014;
      const pulse = 1 + Math.sin(t * pulseFreq) * (0.1 + urgency * 0.08);
      const bob = Math.sin(t * 0.003) * 3;

      // Sparkle stars that spin around
      const starCount = 6;
      for (let s = 0; s < starCount; s++) {
        const angle = (t * 0.0018) + (s / starCount) * Math.PI * 2;
        const dist = CELL * 0.9 + Math.sin(t * 0.005 + s) * 4;
        const sx = cx + Math.cos(angle) * dist;
        const sy = cy + bob + Math.sin(angle) * dist * 0.6;
        const starSize = 5 + Math.sin(t * 0.006 + s * 1.3) * 2;
        const alpha = 0.6 + Math.sin(t * 0.007 + s) * 0.4;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s % 2 === 0 ? '#ffee44' : '#ffffff';
        // 4-pointed star
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(t * 0.003 + s);
        ctx.beginPath();
        for (let p = 0; p < 4; p++) {
          const a = (p / 4) * Math.PI * 2;
          const oa = a + Math.PI / 4;
          ctx.lineTo(Math.cos(a) * starSize, Math.sin(a) * starSize);
          ctx.lineTo(Math.cos(oa) * starSize * 0.4, Math.sin(oa) * starSize * 0.4);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.translate(cx, cy + bob);
      ctx.scale(pulse * 1.85, pulse * 1.85); // 1.85× regular olive size

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.ellipse(3, 5, CELL * 0.48, CELL * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden-green body gradient
      const g = ctx.createRadialGradient(-6, -8, 3, 0, 0, CELL * 0.54);
      g.addColorStop(0, '#aadd44');
      g.addColorStop(0.5, '#5a9a22');
      g.addColorStop(1, '#2a5a0a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, CELL * 0.46, CELL * 0.54, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden ring
      ctx.strokeStyle = '#ffdd00';
      ctx.lineWidth = 2.5 / pulse;
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, CELL * 0.46, CELL * 0.54, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Golden pimento
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.ellipse(0, 0, CELL * 0.18, CELL * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(-6, -8, 6, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Timer bar above the olive — shrinks as time runs out
      const barW = CELL * 1.6;
      const barH = 5;
      const bx = cx - barW / 2;
      const by = cy + bob - CELL * 1.05;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, barH, 2);
      ctx.fill();
      const frac = ticksLeft / BONUS_TICKS;
      const barColor = frac > 0.5 ? '#44ff44' : frac > 0.25 ? '#ffcc00' : '#ff4444';
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW * frac, barH, 2);
      ctx.fill();

      // "BONUS" label
      ctx.font = `bold 9px "Press Start 2P", monospace`;
      ctx.fillStyle = '#ffee44';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff8800';
      ctx.shadowBlur = 6;
      ctx.fillText('BONUS', cx, by - 3);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // ── HUD: lives + score ────────────────────────────────────────────────
    // 8-bit pixel heart grid (12 cols × 10 rows)
    const HEART_GRID = [
      [0,0,1,1,0,0,0,0,1,1,0,0],
      [0,1,1,1,1,0,0,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0,0],
      [0,0,0,0,0,1,1,0,0,0,0,0],
    ];
    // White highlight pixels (upper-right bump) [row, col]
    const HEART_HL = [[1,8],[1,9],[2,8]];
    const PS = 4; // canvas px per "game pixel"
    const HW = 12 * PS; // 48px
    const HH = 10 * PS; // 40px

    function drawPixelHeart(lx: number, ty: number, active: boolean) {
      const HROWS = HEART_GRID.length;
      const HCOLS = (HEART_GRID[0] as number[]).length;

      // Black outline: expand each filled pixel by 1 canvas px on all sides
      ctx.fillStyle = '#000000';
      for (let r = 0; r < HROWS; r++) {
        for (let c = 0; c < HCOLS; c++) {
          if ((HEART_GRID[r] as number[])[c] === 1) {
            ctx.fillRect(lx + c * PS - 1, ty + r * PS - 1, PS + 2, PS + 2);
          }
        }
      }

      // Colored fill: shading by row
      for (let r = 0; r < HROWS; r++) {
        for (let c = 0; c < HCOLS; c++) {
          if ((HEART_GRID[r] as number[])[c] === 1) {
            if (!active) {
              ctx.fillStyle = '#2a1020';
            } else if (r <= 2) {
              ctx.fillStyle = '#ee3344';
            } else if (r <= 5) {
              ctx.fillStyle = '#cc1122';
            } else {
              ctx.fillStyle = '#991133';
            }
            ctx.fillRect(lx + c * PS, ty + r * PS, PS, PS);
          }
        }
      }

      // White highlight on active hearts
      if (active) {
        ctx.fillStyle = '#ffffff';
        for (const pos of HEART_HL) {
          const r = pos[0]!;
          const c = pos[1]!;
          if ((HEART_GRID[r] as number[])?.[c] === 1) {
            ctx.fillRect(lx + c * PS, ty + r * PS, PS, PS);
          }
        }
      }
    }

    function drawHUD() {
      // Pixel heart lives
      const GAP = 10;
      for (let i = 0; i < 3; i++) {
        drawPixelHeart(10 + i * (HW + GAP), 8, i < livesRef.current);
      }

      // Score panel
      ctx.fillStyle = 'rgba(0,0,0,0.58)';
      ctx.beginPath();
      ctx.roundRect(W - 155, 6, 149, 40, 8);
      ctx.fill();
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'right';
      ctx.fillText('SCORE', W - 14, 22);
      ctx.font = 'bold 15px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffff66';
      ctx.fillText(`${scoreRef.current}`, W - 14, 38);
      ctx.textAlign = 'left';
    }

    // ── Game Over overlay ─────────────────────────────────────────────────
    function drawGameOver(t: number) {
      ctx.fillStyle = 'rgba(0,0,0,0.74)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      const p = Math.abs(Math.sin(t * 0.0015));

      ctx.font = '28px "Press Start 2P", monospace';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 18 + p * 12;
      ctx.fillStyle = `rgb(255,${Math.floor(50 + p * 30)},${Math.floor(50 + p * 30)})`;
      ctx.fillText('GAME OVER', W / 2, H / 2 - 55);
      ctx.shadowBlur = 0;

      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`SCORE: ${scoreRef.current}`, W / 2, H / 2 - 12);

      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = `rgba(180,180,255,${0.45 + p * 0.55})`;
      ctx.fillText('PRESS RESTART TO PLAY AGAIN', W / 2, H / 2 + 28);
      ctx.textAlign = 'left';
    }

    // ── Idle / start screen ───────────────────────────────────────────────
    function drawIdle(t: number) {
      ctx.fillStyle = 'rgba(0,0,0,0.67)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      const p = Math.abs(Math.sin(t * 0.0018));

      // Rainbow letter-by-letter title
      const rainbowText = (text: string, y: number, size: number) => {
        ctx.font = `${size}px "Press Start 2P", monospace`;
        const totalW = ctx.measureText(text).width;
        const sx = W / 2 - totalW / 2;
        for (let ci = 0; ci < text.length; ci++) {
          const hue = ((ci / text.length) * 360 + t * 0.055) % 360;
          ctx.fillStyle = `hsl(${hue},100%,66%)`;
          const charW = ctx.measureText(text[ci]!).width;
          const prevW = ctx.measureText(text.slice(0, ci)).width;
          ctx.fillText(text[ci]!, sx + prevW + charW / 2, y);
        }
      };

      rainbowText('MIKHAIL', H / 2 - 65, 26);
      rainbowText('SNAKE', H / 2 - 25, 26);

      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = '#cccccc';
      ctx.fillText('EAT OLIVES  ·  AVOID WALLS', W / 2, H / 2 + 20);
      ctx.fillText('3 LIVES  ·  ARROW KEYS / WASD', W / 2, H / 2 + 40);

      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillStyle = `rgba(150,255,150,${0.35 + p * 0.65})`;
      ctx.fillText('▶  PRESS START  ◀', W / 2, H / 2 + 76);
      ctx.textAlign = 'left';
    }

    // ── Main loop ─────────────────────────────────────────────────────────
    function loop(t: number) {
      animId = requestAnimationFrame(loop);
      drawBg(t);

      const p = phaseRef.current;
      const speed = Math.max(MIN_SPEED, BASE_SPEED - Math.floor(scoreRef.current / 50) * 15);

      if (p === 'playing') {
        if (t - lastMove > speed) {
          lastMove = t;
          dirRef.current = nextDirRef.current;
          const d = DELTAS[dirRef.current];
          const hd = snakeRef.current[0]!;
          const nh: Pt = { x: hd.x + d.x, y: hd.y + d.y };

          const dead =
            nh.x < 0 ||
            nh.x >= COLS ||
            nh.y < 0 ||
            nh.y >= ROWS ||
            snakeRef.current.slice(1).some((s) => s.x === nh.x && s.y === nh.y);

          if (dead) {
            livesRef.current--;
            if (livesRef.current <= 0) {
              livesRef.current = 0;
              phaseRef.current = 'over';
              setPhase('over');
            } else {
              respawn();
            }
          } else {
            const ateRegular = nh.x === foodRef.current.x && nh.y === foodRef.current.y;
            const ateBonus =
              bonusOliveRef.current !== null &&
              nh.x === bonusOliveRef.current.x &&
              nh.y === bonusOliveRef.current.y;

            snakeRef.current = [nh, ...snakeRef.current];
            if (!ateRegular && !ateBonus) {
              snakeRef.current.pop();
            }
            if (ateRegular) {
              scoreRef.current += 10;
              olivesEatenRef.current++;
              foodRef.current = randFood(snakeRef.current);
              if (olivesEatenRef.current % BONUS_EVERY === 0 && bonusOliveRef.current === null) {
                bonusOliveRef.current = randFood([...snakeRef.current, foodRef.current]);
                bonusTicksRef.current = BONUS_TICKS;
              }
            }
            if (ateBonus) {
              scoreRef.current += 50;
              bonusOliveRef.current = null;
              bonusTicksRef.current = 0;
            }

            // Bonus timer countdown
            if (bonusOliveRef.current !== null) {
              bonusTicksRef.current--;
              if (bonusTicksRef.current <= 0) {
                bonusOliveRef.current = null;
              }
            }
          }
        }

        for (let i = snakeRef.current.length - 1; i >= 1; i--)
          drawSegment(snakeRef.current[i]!, i, snakeRef.current.length);
        if (bonusOliveRef.current !== null)
          drawGiantOlive(bonusOliveRef.current, bonusTicksRef.current, t);
        drawHead(snakeRef.current[0]!, false, t);
        drawOlive(foodRef.current, t);
        drawHUD();
      }

      if (p === 'over') {
        for (let i = snakeRef.current.length - 1; i >= 1; i--)
          drawSegment(snakeRef.current[i]!, i, snakeRef.current.length);
        drawHead(snakeRef.current[0]!, true, t);
        drawHUD();
        drawGameOver(t);
      }

      if (p === 'idle') {
        drawIdle(t);
      }
    }

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [respawn]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-5 p-4 select-none"
      style={{ background: '#07071a', fontFamily: "'Press Start 2P', monospace" }}
    >
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>

      <h1
        className="text-base sm:text-xl tracking-widest text-center"
        style={{ color: '#ffdd00', textShadow: '0 0 18px #ff8800, 0 0 40px #ff440077' }}
      >
        🐍 MIKHAIL SNAKE
      </h1>

      <div
        className="relative"
        style={{
          border: '3px solid #ffdd00',
          borderRadius: 6,
          boxShadow: '0 0 28px #ffcc0055, 0 0 60px #ff880022, inset 0 0 12px rgba(0,0,0,0.4)',
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="block" />
      </div>

      <div className="flex items-center gap-8">
        {highScore > 0 && (
          <span className="text-xs" style={{ color: '#aa66ff' }}>
            BEST: {highScore}
          </span>
        )}
        <button
          onClick={startGame}
          className="px-7 py-3 text-sm rounded transition-all duration-100 active:scale-95 cursor-pointer"
          style={{
            fontFamily: "'Press Start 2P', monospace",
            background: '#ffdd00',
            color: '#07071a',
            border: '2px solid #ffff88',
            boxShadow: '0 0 18px #ffcc0099',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#ffff44')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ffdd00')}
        >
          {phase === 'idle' ? '▶ START' : '↺ RESTART'}
        </button>
      </div>

      <p className="text-xs" style={{ color: '#33334d' }}>
        ARROW KEYS · WASD TO MOVE
      </p>
    </div>
  );
}
