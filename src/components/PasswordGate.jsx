import { useRef, useState } from "react";
import { sha256Hex } from "../lib/sha256.js";

// This is a casual deterrent, not real access control: the hash and the
// underlying data file are both visible to anyone who inspects the page.
// To change the password, compute a new SHA-256 hex digest and replace
// PASSWORD_HASH below, e.g. in a browser console:
//   crypto.subtle.digest("SHA-256", new TextEncoder().encode("your-password"))
//     .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("")))
const PASSWORD_HASH = "c9f96fd234c16cc2df9eb97b40598dabd3368c81eed1929f6d80562ffc895ee1";

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function attempt() {
    const hash = await sha256Hex(password);
    if (hash === PASSWORD_HASH) {
      onUnlock();
    } else {
      setError("Incorrect password.");
      setPassword("");
      inputRef.current?.focus();
    }
  }

  return (
    <div id="gate">
      <div className="gate-card">
        <img src={`${import.meta.env.BASE_URL}assets/favicon.png`} alt="GroupThat" />
        <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Enter password to view the dashboard
        </div>
        <input
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") attempt();
          }}
        />
        <button type="button" onClick={attempt}>
          Enter
        </button>
        <div className="gate-error">{error}</div>
      </div>
    </div>
  );
}
