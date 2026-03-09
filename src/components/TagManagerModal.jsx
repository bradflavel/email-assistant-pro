import { useState } from "react";

function normalizeTag(value) {
  return value.replace(/[{}]/g, "").trim();
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
    >
      <div className="w-full max-w-2xl rounded-[28px] border border-border bg-background p-8 shadow-[0_24px_80px_rgba(15,23,42,0.26)]">
        <div className="flex items-center justify-between">
          <h2 id="tag-manager-title" className="text-lg font-semibold">
            {mode === "add" ? "Add Tag" : "Manage Tags"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode((current) => (current === "add" ? "manage" : "add"))}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              {mode === "add" ? "Manage Tags" : "Add Tag"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              Close
            </button>
          </div>
        </div>

        {mode === "add" ? (
          <>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)] lg:items-end">
              <div className="max-w-xs">
                <label className="mb-1 block text-sm font-medium">Tag Name</label>
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
                  placeholder="depotName"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Tags are always inserted as <code>{"{tagName}"}</code>.
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canAdd}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add Tag
              </button>
            </div>

            <div className="mt-8">
              <div className="mb-3 text-sm font-medium text-muted-foreground">
                Existing Tags
              </div>
              <div className="flex min-h-20 flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/60 p-4">
                {existingTags.map((tag) => (
                  <div
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 text-sm"
                  >
                    {`{${tag}}`}
                  </div>
                ))}
                {existingTags.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No saved tags.</div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <div className="mt-6">
            <div className="mb-3 text-sm font-medium text-muted-foreground">
              Select a tag to delete
            </div>
            <div className="flex min-h-20 flex-wrap gap-2 rounded-2xl border border-border/80 bg-card/60 p-4">
              {existingTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPendingDeleteTag(tag)}
                  className="rounded-full border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                >
                  {`{${tag}}`}
                </button>
              ))}
              {existingTags.length === 0 ? (
                <div className="text-sm text-muted-foreground">No saved tags.</div>
              ) : null}
            </div>
          </div>
        )}

        {pendingDeleteTag ? (
          <div className="mt-6 rounded-2xl border border-red-300/50 bg-red-50/70 p-4 dark:border-red-900 dark:bg-red-950/40">
            <div className="text-sm font-medium">Delete {`{${pendingDeleteTag}}`}?</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTag(null)}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTag(pendingDeleteTag);
                  setPendingDeleteTag(null);
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
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
