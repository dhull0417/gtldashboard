import { useState } from "react";
import { niceMax } from "../lib/dashboard.js";

const WIDTH = 960;
const HEIGHT = 220;
const PAD_TOP = 12;
const PAD_BOTTOM = 28;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const BAR_RADIUS = 4;
const BAR_GAP = 0.32;

export default function BarChartCard({ title, color, bars }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const max = niceMax(Math.max(...bars.map((b) => b.value), 0));
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const slot = plotWidth / bars.length;
  const barWidth = slot * (1 - BAR_GAP);

  const yFor = (v) => PAD_TOP + (1 - v / max) * plotHeight;
  const xFor = (i) => PAD_LEFT + i * slot + (slot - barWidth) / 2;

  const gridStops = [0, 0.5, 1];
  const gridY = gridStops.map((t) => PAD_TOP + t * plotHeight);
  const gridValues = gridStops.map((t) => max * (1 - t));

  const hover = hoverIndex != null ? bars[hoverIndex] : null;

  return (
    <section className="chart-card bar-chart-card">
      <div className="chart-head">
        <div className="chart-head-main">
          <span className="chart-title">{title}</span>
        </div>
      </div>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          {gridY.map((y, i) => (
            <line key={i} className="gridline" x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} />
          ))}
          {gridY.map((y, i) => (
            <text key={i} className="axis-value" x={PAD_LEFT - 8} y={y} dy="0.32em" textAnchor="end">
              {Math.round(gridValues[i]).toLocaleString()}
            </text>
          ))}
          <line
            className="baseline"
            x1={PAD_LEFT}
            y1={HEIGHT - PAD_BOTTOM}
            x2={WIDTH - PAD_RIGHT}
            y2={HEIGHT - PAD_BOTTOM}
          />
          {bars.map((bar, i) => {
            const x = xFor(i);
            const y = yFor(bar.value);
            const h = HEIGHT - PAD_BOTTOM - y;
            return (
              <rect
                key={bar.label}
                className="bar"
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, 0)}
                rx={BAR_RADIUS}
                fill={color}
                opacity={hoverIndex == null || hoverIndex === i ? 1 : 0.5}
                onPointerEnter={() => setHoverIndex(i)}
                onPointerLeave={() => setHoverIndex(null)}
              />
            );
          })}
          {bars.map((bar, i) => (
            <text
              key={bar.label}
              className="axis-label"
              x={xFor(i) + barWidth / 2}
              y={HEIGHT - 8}
              textAnchor="middle"
            >
              {bar.label}
            </text>
          ))}
        </svg>
        {hover && (
          <div
            className="tooltip"
            style={{
              opacity: 1,
              left: `${((xFor(hoverIndex) + barWidth / 2) / WIDTH) * 100}%`,
              top: `${(yFor(hover.value) / HEIGHT) * 100}%`,
            }}
          >
            <strong>{hover.value.toLocaleString()}</strong>
            <br />
            <span>{hover.label}</span>
          </div>
        )}
      </div>
    </section>
  );
}
