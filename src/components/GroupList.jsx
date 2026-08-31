import { useMemo, useState } from "react";
import { formatDate, formatDateTime, routineSummary } from "../lib/format.js";

const SORTS = [
  { key: "name", label: "Name" },
  { key: "members", label: "Members" },
  { key: "schedule", label: "Schedule" },
];

const FREQUENCY_RANK = { daily: 0, weekly: 1, biweekly: 2, monthly: 3 };

function scheduleRank(group) {
  const routines = group.schedule?.routines ?? [];
  if (routines.length === 0) return 99;
  return Math.min(...routines.map((r) => FREQUENCY_RANK[r.frequency] ?? 98));
}

function compare(a, b, sortKey) {
  if (sortKey === "name") return a.name.localeCompare(b.name);
  if (sortKey === "members") return a.members.length - b.members.length;
  return scheduleRank(a) - scheduleRank(b);
}

export default function GroupList({ groups }) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [dir, setDir] = useState("asc");

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    if (!trimmed) return groups;
    const q = trimmed.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, trimmed]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => (dir === "asc" ? compare(a, b, sortKey) : compare(b, a, sortKey)));
    return copy;
  }, [filtered, sortKey, dir]);

  return (
    <div className="search-panel">
      <input
        type="search"
        className="search-input"
        placeholder="Search by group name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="sort-row" role="group" aria-label="Sort groups">
        <span className="sort-row-label">Sort by</span>
        {SORTS.map((s) => (
          <button key={s.key} type="button" aria-pressed={sortKey === s.key} onClick={() => setSortKey(s.key)}>
            {s.label}
          </button>
        ))}
        <button type="button" className="sort-dir" onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}>
          {dir === "asc" ? "Ascending" : "Descending"}
        </button>
      </div>
      <div className="search-meta">
        {sorted.length.toLocaleString()} of {groups.length.toLocaleString()} groups
      </div>
      <div className="card-grid">
        {sorted.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
        {sorted.length === 0 && <p className="empty-note">No groups match "{trimmed}".</p>}
      </div>
    </div>
  );
}

function GroupCard({ group }) {
  return (
    <div className="data-card">
      <div className="data-card-head">
        <span className="data-card-title">{group.name}</span>
        <span className="data-card-sub">Created {formatDate(group.createdAt)}</span>
      </div>
      <div className="data-card-section">
        <span className="data-card-label">Owner</span>
        <span>{group.owner?.name ?? "Unknown"}</span>
      </div>
      {group.moderators.length > 0 && (
        <div className="data-card-section">
          <span className="data-card-label">Moderators</span>
          <span>{group.moderators.map((m) => m.name).join(", ")}</span>
        </div>
      )}
      <div className="data-card-section">
        <span className="data-card-label">Members ({group.members.length})</span>
        {group.members.length > 0 ? (
          <ul>
            {group.members.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
        ) : (
          <span className="empty-note">None</span>
        )}
      </div>
      <div className="data-card-section">
        <span className="data-card-label">Schedule</span>
        {group.schedule.routines.length > 0 ? (
          <ul>
            {group.schedule.routines.map((r, i) => (
              <li key={i}>{routineSummary(r)}</li>
            ))}
          </ul>
        ) : (
          <span className="empty-note">No schedule</span>
        )}
      </div>
      <div className="data-card-section">
        <span className="data-card-label">Last chat activity</span>
        <span>{group.lastMessageAt ? formatDateTime(group.lastMessageAt) : "No messages yet"}</span>
      </div>
    </div>
  );
}
