import { useState } from "react";
import UserSearch from "./UserSearch.jsx";
import GroupList from "./GroupList.jsx";

export default function SearchableData({ directory }) {
  const [view, setView] = useState("users");

  if (!directory) {
    return <p className="empty-note">Directory data isn't available yet — run the fetch script to generate it.</p>;
  }

  return (
    <div>
      <div className="subtab-row" role="tablist" aria-label="Searchable data view">
        <button type="button" role="tab" aria-selected={view === "users"} onClick={() => setView("users")}>
          Users
        </button>
        <button type="button" role="tab" aria-selected={view === "groups"} onClick={() => setView("groups")}>
          Groups
        </button>
      </div>
      {view === "users" ? <UserSearch users={directory.users} /> : <GroupList groups={directory.groups} />}
    </div>
  );
}
