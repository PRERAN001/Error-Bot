import { useState, useEffect, useCallback } from "react";
import CronDashboard from "./CronDashboard";
import Login from "./Login";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [username, setUsername] = useState(
    () => localStorage.getItem("username"),
  );
  const [cronUrls, setCronUrls] = useState([]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
    setCronUrls([]);
  }, []);

  // Fetch saved cron URLs from MongoDB after login
  useEffect(() => {
    if (!token) return;
    fetch("/api/cron-urls", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setCronUrls(data.cronUrls ?? []))
      .catch(() => {
        // Token may be expired – log out silently
        handleLogout();
      });
  }, [token, handleLogout]);

  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      {/* Top bar */}
      <div className="bg-white border-b border-zinc-200 px-8 py-3 flex justify-between items-center">
        <span className="text-sm text-zinc-500">
          Signed in as{" "}
          <span className="font-medium text-zinc-900">{username}</span>
          {cronUrls.length > 0 && (
            <span className="ml-3 text-zinc-400">
              · {cronUrls.length} saved cron URL
              {cronUrls.length !== 1 ? "s" : ""}
            </span>
          )}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition"
        >
          Logout
        </button>
      </div>

      <CronDashboard />
    </div>
  );
}
