import { RANGES } from "../lib/dashboard.js";

const LABELS = { "1d": "1D", "7d": "7D", "30d": "30D", "3m": "3M", "1y": "1Y", all: "All" };

export default function RangeRow({ range, onChange }) {
  return (
    <div className="range-row" role="group" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={r === range}
          onClick={() => onChange(r)}
        >
          {LABELS[r]}
        </button>
      ))}
    </div>
  );
}
