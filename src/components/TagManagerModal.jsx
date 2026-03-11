import { useEffect, useState } from "react";

const MAX_TAG_LENGTH = 50;

function normalizeTag(value) {
  return value.replace(/[{}]/g, "").trim().slice(0, MAX_TAG_LENGTH);
}

export default function TagManagerModal({
  existingTags,
  onAddTag,
  onClose,
  onDeleteTag,
}) {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState("add");
  const [pendingDeleteTag, setPendingDeleteTag] = useState(null);
  const normalizedValue = normalizeTag(value);
  const canAdd =
    normalizedValue.length > 0 && !existingTags.includes(normalizedValue);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (pendingDeleteTag) {
          setPendingDeleteTag(null);
          return;
        }

        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, pendingDeleteTag]);

  const handleSubmit = () => {
    if (!canAdd) {
      return;
    }

    onAddTag(normalizedValue);
    setValue("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-manager-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-7 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="tag-manager-title" className="text-base font-semibold">
            {mode === "add" ? "Add Tag" : "Manage Tags"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((current) => (current === "add" ? "manage" : "add"))}
              className="rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
            >
              {mode === "add" ? "Manage Tags" : "Add Tag"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>

        {mode === "add" ? (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-end">
              <div className="max-w-xs">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="e.g. customerName"
                  maxLength={MAX_TAG_LENGTH}
                  className="w-full rounded-xl border border-border/70 bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Tags are always inserted as <code className="font-mono">{"{tagName}"}</code>.
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdd}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add Tag
              </button>
            </div>

            <div className="mt-7">
              <div className="ui-meta-label mb-2.5">Existing Tags</div>
              <div className="flex min-h-16 flex-wrap gap-1.5 rounded-xl border border-border/60 bg-background/50 p-3">
                {existingTags.map((tag) => (
                  <div key={tag} className="tag-chip">
                    {`{${tag}}`}
                  </div>
                ))}
                {existingTags.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No saved tags.</div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="ui-meta-label mb-2.5">Select a tag to delete</div>
            <div className="flex min-h-16 flex-wrap gap-1.5 rounded-xl border border-border/60 bg-background/50 p-3">
              {existingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPendingDeleteTag(tag)}
                  className="rounded-md border border-red-300/60 bg-red-50/60 px-2.5 py-1 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
                >
                  {`{${tag}}`}
                </button>
              ))}
              {existingTags.length === 0 ? (
                <div className="text-xs text-muted-foreground">No saved tags.</div>
              ) : null}
            </div>
          </div>
        )}

        {pendingDeleteTag ? (
          <div className="mt-5 rounded-xl border border-red-300/40 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="text-sm font-semibold">Delete {`{${pendingDeleteTag}}`}?</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTag(null)}
                className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTag(pendingDeleteTag);
                  setPendingDeleteTag(null);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
