import { useEffect, useMemo, useState } from "react";

export default function SettingsScreenSecure({
  hasUnsavedFileChanges,
  hasUnsavedEditorDraft,
  onBack,
  onClearDraft,
  onClearFilledValues,
  onClearSession,
  tagCount,
  templateCount,
  filledTemplateCount,
}) {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const summaryItems = useMemo(
    () => [
      { label: "Templates", value: templateCount },
      { label: "Saved Tags", value: tagCount },
      { label: "Filled Entries", value: filledTemplateCount },
    ],
    [filledTemplateCount, tagCount, templateCount]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="workspace-shell h-full max-h-full overflow-hidden">
      <div className="workspace-inner flex h-full min-h-0 flex-col gap-5 p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="ui-page-title">Settings</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage appearance and local browser data for this workstation.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
          >
            Back
          </button>
        </div>

        {/* Stats row */}
        <div className="grid gap-3 lg:grid-cols-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="settings-highlight rounded-xl border border-border/50 p-4"
            >
              <div className="ui-meta-label">{item.label}</div>
              <div className="mt-2 text-3xl font-bold tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,0.58fr)_minmax(20rem,0.42fr)]">
          {/* Appearance panel */}
          <div className="settings-highlight custom-scrollbar min-h-0 overflow-auto rounded-2xl border border-border/50 p-5">
            <div className="ui-section-title">Appearance</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Switch the app theme for this browser only.
            </p>

            <div className="nested-surface mt-5 flex items-center justify-between px-5 py-4">
              <div>
                <div className="text-sm font-semibold">{darkMode ? "Dark Mode" : "Light Mode"}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {darkMode ? "Optimized for low-light work." : "Brighter neutral workspace."}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={() => setDarkMode((prev) => !prev)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    setDarkMode((prev) => !prev);
                  }
                }}
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

            <div className="nested-surface mt-4 p-4">
              <div className="text-sm font-semibold">Save Status</div>
              <div className="mt-2 text-xs leading-5 text-muted-foreground">
                {hasUnsavedFileChanges
                  ? "Your current library differs from the last JSON file save."
                  : "Your current library matches the last JSON file save in this session."}
              </div>
              <div className="mt-2 text-xs leading-5 text-muted-foreground">
                {hasUnsavedEditorDraft
                  ? "An in-progress editor draft is currently stored in this browser."
                  : "There is no unsaved editor draft stored right now."}
              </div>
            </div>
          </div>

          {/* Local Data panel */}
          <div className="settings-highlight custom-scrollbar min-h-0 overflow-auto rounded-2xl border border-border/50 p-5">
            <div className="ui-section-title">Local Data</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Clear only the part of browser data you actually want to reset.
            </p>

            <div className="mt-5 space-y-3">
              <div className="nested-surface p-4">
                <div className="text-sm font-semibold">Clear Filled Values</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  Remove saved placeholder values while keeping templates and tags.
                </div>
                <button
                  type="button"
                  onClick={onClearFilledValues}
                  className="mt-4 rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                >
                  Clear Filled Values
                </button>
              </div>

              <div className="nested-surface p-4">
                <div className="text-sm font-semibold">Clear Unsaved Draft</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  Remove the current in-progress editor draft stored in this browser.
                </div>
                <button
                  type="button"
                  onClick={onClearDraft}
                  className="mt-4 rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                >
                  Clear Draft
                </button>
              </div>

              <div className="rounded-xl border border-red-300/40 bg-red-50/40 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                <div className="text-sm font-semibold">Clear All Local Data</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  Remove templates, tags, filled values, and draft data from this browser.
                </div>
                {showClearConfirm ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearSession();
                          setShowClearConfirm(false);
                        }}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        Yes, Clear Everything
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    Clear Session
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
