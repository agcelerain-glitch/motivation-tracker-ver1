'use client';
import { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Band } from '@/types/entry';
import { BAND_COLORS } from '@/config/design';

interface Props {
  poleA: string;
  poleB: string;
  question: string;
  value: Band | null;
  onChange: (v: Band | null) => void;
  onConfirm: () => void;
}

const ARC_START_DEG = 225;
const ARC_END_DEG   = 315;
const GAP_HALF      = 45;
const TOTAL_ARC     = 270;
const BANDS         = 6;

function angleToIndex(deg: number): number {
  const normalized = ((deg - ARC_START_DEG) % 360 + 360) % 360;
  if (normalized > TOTAL_ARC) return -1;
  return Math.min(BANDS - 1, Math.floor(normalized / (TOTAL_ARC / BANDS)));
}

function indexToAngle(idx: number): number {
  return ARC_START_DEG + (idx + 0.5) * (TOTAL_ARC / BANDS);
}

function degToXY(deg: number, r: number, cx: number, cy: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = degToXY(startDeg, r, cx, cy);
  const e = degToXY(endDeg,   r, cx, cy);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export default function RadialBandPicker({ poleA, poleB, question, value, onChange, onConfirm }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingArc = useRef(false);
  const pointerDownRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);

  const SIZE = 320;
  const CX   = SIZE / 2;
  const CY   = SIZE / 2 + 20;
  const R    = 120;
  const STROKE = 36;

  const getAngleFromEvent = useCallback((e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const x = (e.clientX - rect.left) * scale - CX;
    const y = (e.clientY - rect.top)  * scale - CY;
    return (Math.atan2(y, x) * 180 / Math.PI + 90 + 360) % 360;
  }, [CX, CY, SIZE]);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const angle = getAngleFromEvent(e);
    if (angle === null) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = SIZE / rect.width;
    const dx = (e.clientX - rect.left) * scale - CX;
    const dy = (e.clientY - rect.top)  * scale - CY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    isDraggingArc.current = dist > R - STROKE / 2 - 8 && dist < R + STROKE / 2 + 8;
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    pointerDownRef.current = { time: Date.now(), x: e.clientX, y: e.clientY };

    if (isDraggingArc.current) {
      const idx = angleToIndex(angle);
      if (idx >= 0) { setHoveredBand(idx); }
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  }, [getAngleFromEvent, CX, CY, R, STROKE, SIZE]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingArc.current) return;
    const angle = getAngleFromEvent(e);
    if (angle === null) return;
    const idx = angleToIndex(angle);
    if (idx >= 0 && idx !== hoveredBand) {
      setHoveredBand(idx);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    }
  }, [getAngleFromEvent, hoveredBand]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const pd = pointerDownRef.current;
    if (pd) {
      const dt = Date.now() - pd.time;
      const dx = e.clientX - pd.x;
      const dy = e.clientY - pd.y;
      const moved = Math.sqrt(dx * dx + dy * dy);
      if (!isDraggingArc.current && moved < 10 && dt < 300) {
        // 中央ボタン判定は別途 div で処理
      }
    }

    if (isDraggingArc.current && hoveredBand !== null) {
      onChange((hoveredBand + 1) as Band);
    }
    isDraggingArc.current = false;
    dragOriginRef.current = null;
    pointerDownRef.current = null;
  }, [hoveredBand, onChange]);

  const selectedIdx = value !== null && value !== undefined ? value - 1 : null;
  const displayIdx  = isDraggingArc.current ? hoveredBand : selectedIdx;

  const bandSegments = Array.from({ length: BANDS }, (_, i) => {
    const startDeg = ARC_START_DEG + i * (TOTAL_ARC / BANDS);
    const endDeg   = startDeg + (TOTAL_ARC / BANDS);
    const isActive = displayIdx === i;
    const color    = BAND_COLORS[i].hex;

    const outerR = isActive ? R + 6 : R;
    return { startDeg, endDeg, color, isActive, outerR };
  });

  const markerPos = displayIdx !== null
    ? degToXY(indexToAngle(displayIdx), R + STROKE / 2 + 10, CX, CY)
    : null;

  const poleAPos = degToXY(ARC_START_DEG, R, CX, CY);
  const poleBPos = degToXY(ARC_END_DEG,   R, CX, CY);

  return (
    <div className="flex flex-col items-center select-none" style={{ touchAction: 'none' }}>
      <p className="text-xl font-bold mb-4 text-center" style={{ fontFamily: 'Shippori Mincho, serif', color: '#E9E6DD' }}>
        {question}
      </p>

      <div className="relative" style={{ width: SIZE, maxWidth: '80vw' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SIZE} ${SIZE + 40}`}
          style={{ width: '100%', touchAction: 'none', cursor: 'pointer' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {bandSegments.map((seg, i) => {
            const segStart = seg.startDeg + 1;
            const segEnd   = seg.endDeg   - 1;
            return (
              <path
                key={i}
                d={arcPath(CX, CY, seg.outerR, segStart, segEnd)}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                opacity={seg.isActive ? 1 : 0.25}
                style={{ transition: 'opacity 0.12s, stroke-width 0.12s' }}
              />
            );
          })}

          {markerPos && (
            <polygon
              points={`${markerPos.x},${markerPos.y - 8} ${markerPos.x - 5},${markerPos.y + 4} ${markerPos.x + 5},${markerPos.y + 4}`}
              fill="#E9E6DD"
              style={{ transition: 'all 0.12s' }}
            />
          )}

          <text x={poleAPos.x - 12} y={CY + R * 0.7} textAnchor="end" fontSize="13" fill="#7A7F9A" fontFamily="Zen Kaku Gothic New, sans-serif">
            {poleA}
          </text>
          <text x={poleBPos.x + 12} y={CY + R * 0.7} textAnchor="start" fontSize="13" fill="#7A7F9A" fontFamily="Zen Kaku Gothic New, sans-serif">
            {poleB}
          </text>

          <foreignObject x={CX - 70} y={CY - 60} width="140" height="120">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              {displayIdx !== null ? (
                <>
                  <span style={{ color: BAND_COLORS[displayIdx].hex, fontSize: 15, fontFamily: 'Zen Kaku Gothic New' }}>
                    {BAND_COLORS[displayIdx].name}
                  </span>
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={onConfirm}
                    style={{
                      background: '#5FB49C', color: '#16182B', border: 'none',
                      borderRadius: 20, padding: '8px 18px', fontSize: 14,
                      fontFamily: 'Zen Kaku Gothic New', cursor: 'pointer', fontWeight: 700,
                    }}
                  >
                    決定
                  </button>
                </>
              ) : (
                <span style={{ color: '#7A7F9A', fontSize: 13, textAlign: 'center', fontFamily: 'Zen Kaku Gothic New' }}>
                  ドラッグして選ぶ
                </span>
              )}
            </div>
          </foreignObject>
        </svg>
      </div>

      <button
        onClick={() => onChange(null)}
        style={{
          marginTop: 8, background: 'transparent', color: '#7A7F9A',
          border: '1px solid #7A7F9A', borderRadius: 20, padding: '6px 20px',
          fontSize: 13, fontFamily: 'Zen Kaku Gothic New', cursor: 'pointer',
        }}
      >
        わからない
      </button>
    </div>
  );
}
