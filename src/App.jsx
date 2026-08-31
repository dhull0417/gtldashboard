import { useEffect, useState } from "react";
import PasswordGate from "./components/PasswordGate.jsx";
import Dashboard from "./components/Dashboard.jsx";

const SESSION_KEY = "gtl-dashboard-unlocked";

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [allDays, setAllDays] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    if (!unlocked) return;
    fetch(`${import.meta.env.BASE_URL}data/stats.json`, { cache: "no-store" })
      .then((res) => res.json())
      .then(setAllDays);
    fetch(`${import.meta.env.BASE_URL}data/insights.json`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setInsights)
      .catch(() => setInsights(null));
  }, [unlocked]);

  function handleUnlock() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setUnlocked(true);
  }

  if (!unlocked) return <PasswordGate onUnlock={handleUnlock} />;
  if (!allDays) return null;
  return <Dashboard allDays={allDays} insights={insights} />;
}
