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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="ui-page-title">Settings</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Manage appearance and local browser data for this workstation.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm text-muted-foreground hover:bg-accent/40"
          >
            Back
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="settings-highlight rounded-[22px] border border-border/60 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <div className="ui-meta-label">{item.label}</div>
              <div className="mt-2 text-3xl font-black tracking-tight">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,0.58fr)_minmax(20rem,0.42fr)]">
          <div className="settings-highlight custom-scrollbar min-h-0 overflow-auto rounded-[24px] border border-border/70 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <div className="ui-section-title">Appearance</div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              Switch the app theme for this browser only.
            </div>

            <div className="nested-surface mt-5 flex items-center justify-between px-5 py-4">
              <div>
                <div className="font-semibold">{darkMode ? "Dark Mode" : "Light Mode"}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {darkMode ? "Optimized for low-light work." : "Brighter neutral workspace."}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={() => setDarkMode((prev) => !prev)}
                className={`w-14 rounded-full px-1 py-1 transition-colors ${
                  darkMode ? "bg-primary" : "bg-muted"
                }`}
              >
                <div
                  className={`h-5 w-5 rounded-full bg-white transition-transform ${
                    darkMode ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="nested-surface mt-5 p-4">
              <div className="font-semibold">Save Status</div>
              <div className="mt-2 text-sm text-muted-foreground">
                {hasUnsavedFileChanges
                  ? "Your current library differs from the last JSON file save."
                  : "Your current library matches the last JSON file save in this session."}
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {hasUnsavedEditorDraft
                  ? "An in-progress editor draft is currently stored in this browser."
                  : "There is no unsaved editor draft stored right now."}
              </div>
            </div>
          </div>

          <div className="settings-highlight custom-scrollbar min-h-0 overflow-auto rounded-[24px] border border-border/70 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.05)]">
            <div className="ui-section-title">Local Data</div>
            <div className="mt-1.5 text-sm text-muted-foreground">
              Clear only the part of browser data you actually want to reset.
            </div>

            <div className="mt-5 space-y-3">
              <div className="nested-surface p-4">
                <div className="font-semibold">Clear Filled Values</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Remove saved placeholder values while keeping templates and tags.
                </div>
                <button
                  type="button"
                  onClick={onClearFilledValues}
                  className="mt-4 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
                >
                  Clear Filled Values
                </button>
              </div>

              <div className="nested-surface p-4">
                <div className="font-semibold">Clear Unsaved Draft</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Remove the current in-progress editor draft stored in this browser.
                </div>
                <button
                  type="button"
                  onClick={onClearDraft}
                  className="mt-4 rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
                >
                  Clear Draft
                </button>
              </div>

              <div className="rounded-2xl border border-red-300/40 bg-red-50/40 p-4 dark:border-red-900/60 dark:bg-red-950/20">
                <div className="font-semibold">Clear All Local Data</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Remove templates, tags, filled values, and draft data from this browser.
                </div>
                <button
                  type="button"
                  onClick={onClearSession}
                  className="mt-4 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Clear Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
