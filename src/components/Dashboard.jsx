import { useState } from "react";
import RangeRow from "./RangeRow.jsx";
import ChartCard from "./ChartCard.jsx";
import StatRow from "./StatRow.jsx";
import TableView from "./TableView.jsx";
import { METRICS, filterByRange, previousRangeDays } from "../lib/dashboard.js";

function pct(part, total) {
  if (!total) return null;
  return `${Math.round((part / total) * 100)}%`;
}

export default function Dashboard({ allDays, insights }) {
  const [range, setRange] = useState("30d");
  const [showTable, setShowTable] = useState(false);

  const days = filterByRange(allDays, range);
  const prevDays = previousRangeDays(allDays, range);

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
            <ChartCard key={key} metricKey={key} label={label} color={color} days={days} prevDays={prevDays} />
          ))}
        </div>

        <button className="table-toggle" type="button" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Hide table" : "View as table"}
        </button>
        {showTable && <TableView days={days} />}

        {insights && (
          <>
            <StatRow
              title="Permissions"
              tiles={[
                {
                  label: "Notifications",
                  value: insights.permissions.notifications.toLocaleString(),
                  sub: pct(insights.permissions.notifications, insights.permissions.totalUsers),
                },
              ]}
              note="Location and photo-library access aren't reported to the backend yet, so they can't show here until the app starts tracking them."
            />

            <StatRow
              title="Soft indicators"
              tiles={[
                {
                  label: "Has zip code",
                  value: insights.softIndicators.zipCode.toLocaleString(),
                  sub: pct(insights.softIndicators.zipCode, insights.softIndicators.totalUsers),
                },
                {
                  label: "Has profile picture",
                  value: insights.softIndicators.profilePicture.toLocaleString(),
                  sub: pct(insights.softIndicators.profilePicture, insights.softIndicators.totalUsers),
                },
              ]}
            />

            <StatRow
              title="Sign in method"
              tiles={[
                { label: "Google", value: insights.signInMethods.google.toLocaleString() },
                { label: "Email", value: insights.signInMethods.email.toLocaleString() },
                { label: "Apple", value: insights.signInMethods.apple.toLocaleString() },
                { label: "Phone", value: insights.signInMethods.phone.toLocaleString() },
                ...(insights.signInMethods.unknown > 0
                  ? [{ label: "Unknown", value: insights.signInMethods.unknown.toLocaleString() }]
                  : []),
              ]}
            />

            <StatRow
              title="User habits"
              tiles={[
                { label: "Avg. group size", value: insights.userHabits.avgGroupSize },
                { label: "Avg. groups per user", value: insights.userHabits.avgGroupsPerUser },
                {
                  label: "Avg. groups per creator",
                  value: insights.userHabits.avgGroupsPerCreator,
                  sub: `${insights.userHabits.creatorCount.toLocaleString()} creators`,
                },
                { label: "Daily groups", value: insights.userHabits.frequency.daily.toLocaleString() },
                { label: "Weekly groups", value: insights.userHabits.frequency.weekly.toLocaleString() },
                { label: "Biweekly groups", value: insights.userHabits.frequency.biweekly.toLocaleString() },
                { label: "Monthly groups", value: insights.userHabits.frequency.monthly.toLocaleString() },
              ]}
            />
          </>
        )}
      </main>
    </div>
  );
}
