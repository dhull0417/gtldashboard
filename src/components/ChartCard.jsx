import { useRef, useState } from "react";
import { niceMax } from "../lib/dashboard.js";

const WIDTH = 960;
const HEIGHT = 180;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_X = 8;

export default function ChartCard({ metricKey, label, color, days }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const values = days.map((d) => d[metricKey]);
  const total = values.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(...values, 0));

  const xFor = (i) =>
    days.length <= 1 ? WIDTH / 2 : PAD_X + (i / (days.length - 1)) * (WIDTH - PAD_X * 2);
  const yFor = (v) => PAD_TOP + (1 - v / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const linePoints = days.map((d, i) => `${xFor(i)},${yFor(d[metricKey])}`).join(" ");
  const gridY = [0, 0.5, 1].map((t) => PAD_TOP + t * (HEIGHT - PAD_TOP - PAD_BOTTOM));

  function onMove(evt) {
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((evt.clientX - rect.left) / rect.width) * WIDTH;
    let idx = 0;
    let best = Infinity;
    days.forEach((_, i) => {
      const dist = Math.abs(xFor(i) - relX);
      if (dist < best) {
        best = dist;
        idx = i;
      }
    });
    setHoverIndex(idx);
  }

  const hover = hoverIndex != null ? days[hoverIndex] : null;
  const hoverX = hoverIndex != null ? xFor(hoverIndex) : 0;
  const hoverY = hover ? yFor(hover[metricKey]) : 0;

  return (
    <section className="chart-card">
      <div className="chart-head">
        <span className="chart-title">{label}</span>
        <span className="chart-total">{total.toLocaleString()}</span>
      </div>
      <div className="chart-wrap" onPointerMove={onMove} onPointerLeave={() => setHoverIndex(null)}>
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          {gridY.map((y, i) => (
            <line key={i} className="gridline" x1={PAD_X} y1={y} x2={WIDTH - PAD_X} y2={y} />
          ))}
          <line
            className="baseline"
            x1={PAD_X}
            y1={HEIGHT - PAD_BOTTOM}
            x2={WIDTH - PAD_X}
            y2={HEIGHT - PAD_BOTTOM}
          />
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePoints}
          />
          <line
            className="crosshair"
            x1={hoverX}
            y1={PAD_TOP}
            x2={hoverX}
            y2={HEIGHT - PAD_BOTTOM}
            style={{ opacity: hover ? 1 : 0 }}
          />
          <circle
            className="hover-dot"
            r="5"
            cx={hoverX}
            cy={hoverY}
            fill={color}
            stroke="var(--surface)"
            strokeWidth="2"
            style={{ opacity: hover ? 1 : 0 }}
          />
          <text className="axis-label" x={PAD_X} y={HEIGHT - 6} textAnchor="start">
            {days[0]?.date ?? ""}
          </text>
          <text className="axis-label" x={WIDTH - PAD_X} y={HEIGHT - 6} textAnchor="end">
            {days[days.length - 1]?.date ?? ""}
          </text>
        </svg>
        {hover && (
          <div
            className="tooltip"
            style={{ opacity: 1, left: `${(hoverX / WIDTH) * 100}%`, top: `${(hoverY / HEIGHT) * 100}%` }}
          >
            <strong>{hover[metricKey].toLocaleString()}</strong>
            <br />
            <span>{hover.date}</span>
          </div>
        )}
      </div>
    </section>
  );
}
