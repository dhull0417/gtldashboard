import { useMemo, useState } from "react";
import { digitsOnly, formatDate } from "../lib/format.js";

function matchesUser(user, query, queryDigits) {
  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
  if (fullName.includes(query)) return true;
  if (user.email && user.email.toLowerCase().includes(query)) return true;
  if (queryDigits && user.phone && digitsOnly(user.phone).includes(queryDigits)) return true;
  return false;
}

export default function UserSearch({ users }) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const results = useMemo(() => {
    if (!trimmed) return users;
    const q = trimmed.toLowerCase();
    const qDigits = digitsOnly(trimmed);
    return users.filter((u) => matchesUser(u, q, qDigits));
  }, [users, trimmed]);

  return (
    <div className="search-panel">
      <input
        type="search"
        className="search-input"
        placeholder="Search by name, email, or phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="search-meta">
        {results.length.toLocaleString()} of {users.length.toLocaleString()} users
      </div>
      <div className="card-grid">
        {results.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
        {results.length === 0 && <p className="empty-note">No users match "{trimmed}".</p>}
      </div>
    </div>
  );
}

function GroupNameList({ groups }) {
  if (groups.length === 0) return <span className="empty-note">None</span>;
  return (
    <ul>
      {groups.map((g) => (
        <li key={g.id}>{g.name}</li>
      ))}
    </ul>
  );
}

function UserCard({ user }) {
  return (
    <div className="data-card">
      <div className="data-card-head">
        <span className="data-card-title">
          {user.firstName} {user.lastName}
        </span>
        <span className="data-card-sub">Joined {formatDate(user.joinedAt)}</span>
      </div>
      {(user.email || user.phone) && (
        <div className="data-card-contact">
          {user.email && <span>{user.email}</span>}
          {user.phone && <span>{user.phone}</span>}
        </div>
      )}
      <div className="data-card-section">
        <span className="data-card-label">Created ({user.groupsCreated.length})</span>
        <GroupNameList groups={user.groupsCreated} />
      </div>
      <div className="data-card-section">
        <span className="data-card-label">Member of ({user.groupsMember.length})</span>
        <GroupNameList groups={user.groupsMember} />
      </div>
    </div>
  );
}
