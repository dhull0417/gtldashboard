import { useRef, useState } from "react";
import { niceMax } from "../lib/dashboard.js";

const WIDTH = 960;
const HEIGHT = 180;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;

export default function ChartCard({ metricKey, label, color, days, prevDays = [] }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  let running = 0;
  const cumulative = days.map((d) => (running += d[metricKey]));
  const total = cumulative[cumulative.length - 1] ?? 0;
  const max = niceMax(Math.max(...cumulative, 0));

  const showDelta = prevDays.length > 0;
  const prevTotal = showDelta ? prevDays.reduce((sum, d) => sum + d[metricKey], 0) : 0;
  const delta = total - prevTotal;
  const deltaClass = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";

  const xFor = (i) =>
    days.length <= 1
      ? (PAD_LEFT + WIDTH - PAD_RIGHT) / 2
      : PAD_LEFT + (i / (days.length - 1)) * (WIDTH - PAD_LEFT - PAD_RIGHT);
  const yFor = (v) => PAD_TOP + (1 - v / max) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const linePoints = days.map((d, i) => `${xFor(i)},${yFor(cumulative[i])}`).join(" ");
  const gridStops = [0, 0.5, 1];
  const gridY = gridStops.map((t) => PAD_TOP + t * (HEIGHT - PAD_TOP - PAD_BOTTOM));
  const gridValues = gridStops.map((t) => max * (1 - t));

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
  const hoverY = hover ? yFor(cumulative[hoverIndex]) : 0;
  const hoverChange = hover ? hover[metricKey] : 0;

  return (
    <section className="chart-card">
      <div className="chart-head">
        <div className="chart-head-main">
          <span className="chart-title">{label}</span>
          <span className="chart-total">{total.toLocaleString()}</span>
        </div>
        {showDelta && (
          <span
            className={`chart-delta ${deltaClass}`}
            title={`vs. prior ${prevDays.length} day${prevDays.length === 1 ? "" : "s"}`}
          >
            {delta.toLocaleString(undefined, { signDisplay: "exceptZero" })}
          </span>
        )}
      </div>
      <div className="chart-wrap" onPointerMove={onMove} onPointerLeave={() => setHoverIndex(null)}>
        <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
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
          <text className="axis-label" x={PAD_LEFT} y={HEIGHT - 6} textAnchor="start">
            {days[0]?.date ?? ""}
          </text>
          <text className="axis-label" x={WIDTH - PAD_RIGHT} y={HEIGHT - 6} textAnchor="end">
            {days[days.length - 1]?.date ?? ""}
          </text>
        </svg>
        {hover && (
          <div
            className="tooltip"
            style={{ opacity: 1, left: `${(hoverX / WIDTH) * 100}%`, top: `${(hoverY / HEIGHT) * 100}%` }}
          >
            <strong>{cumulative[hoverIndex].toLocaleString()}</strong>
            <br />
            <span>{hover.date}</span>
            <br />
            <span className="tooltip-change">
              {hoverChange.toLocaleString(undefined, { signDisplay: "exceptZero" })} that day
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
