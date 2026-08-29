import { useState } from "react";
import RangeRow from "./RangeRow.jsx";
import ChartCard from "./ChartCard.jsx";
import TableView from "./TableView.jsx";
import { METRICS, filterByRange } from "../lib/dashboard.js";

export default function Dashboard({ allDays }) {
  const [range, setRange] = useState("30d");
  const [showTable, setShowTable] = useState(false);

  const days = filterByRange(allDays, range);

  return (
    <div id="app">
      <header className="site-header">
        <img className="logo" src={`${import.meta.env.BASE_URL}assets/favicon.png`} alt="GroupThat" />
        <span className="title">Leadership Dashboard</span>
      </header>

      <main>
        <RangeRow range={range} onChange={setRange} />

        <div className="chart-grid">
          {METRICS.map(({ key, label, color }) => (
            <ChartCard key={key} metricKey={key} label={label} color={color} days={days} />
          ))}
        </div>

        <button className="table-toggle" type="button" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide table" : "View as table"}
        </button>
        {showTable && <TableView days={days} />}
      </main>
    </div>
  );
}
