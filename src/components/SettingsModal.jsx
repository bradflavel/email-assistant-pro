import { useState, useEffect } from "react";

export default function SettingsModal({ onClose }) {
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


  const handleReset = () => {
    const confirmed = confirm("Are you sure you want to reset everything?\n\nIt's recommended to export your templates first.");
    if (confirmed) {
      localStorage.clear();
      location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background text-foreground border border-border p-6 rounded-lg w-[90%] max-w-md space-y-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="text-lg font-bold hover:opacity-70">✖</button>
        </div>

        <div className="flex items-center justify-between">
            <span className="font-medium">
                {darkMode ? "Dark Mode" : "Light Mode"}
            </span>
            <button
                onClick={() => setDarkMode(prev => !prev)}
                className={`w-12 h-6 rounded-full px-1 transition-colors ${
                darkMode ? "bg-primary" : "bg-muted"
                }`}
            >
                <div
                className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-0"
                }`}
                />
            </button>
            </div>


        <button
          onClick={handleReset}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          🧨 Reset App (Clear Data)
        </button>
      </div>
    </div>
  );
}
