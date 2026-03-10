import { useEffect, useState } from "react";

export default function SettingsModalSecure({ onClearSession, onClose }) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-background p-6 text-foreground shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="text-xl font-semibold">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            Close
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">
            {darkMode ? "Dark Mode" : "Light Mode"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={darkMode}
            onClick={() => setDarkMode((prev) => !prev)}
            className={`w-12 rounded-full px-1 py-1 transition-colors ${
              darkMode ? "bg-primary" : "bg-muted"
            }`}
          >
            <div
              className={`h-4 w-4 rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="rounded-md border border-border bg-card p-4 text-sm text-muted-foreground">
          Clear Session removes your locally saved templates, tags, and filled values from this browser.
        </div>

        <button
          type="button"
          onClick={onClearSession}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Clear Session
        </button>
      </div>
    </div>
  );
}
