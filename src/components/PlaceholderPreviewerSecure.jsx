import { useEffect, useMemo, useState } from "react";

function findPlaceholders(content) {
  const matches = content.match(/\{[\w-]+\}/g) || [];
  const ordered = [];

  for (const match of matches) {
    const normalized = match.replace(/[{}]/g, "");
    if (!ordered.includes(normalized)) {
      ordered.push(normalized);
    }
  }

  return ordered;
}

export default function PlaceholderPreviewerSecure({
  onDelete,
  template,
  values,
  onEdit,
  onValuesChange,
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const detectedPlaceholders = useMemo(
    () => findPlaceholders(template.content),
    [template.content]
  );
  const preview = useMemo(() => {
    let result = template.content;

    for (const key of detectedPlaceholders) {
      const escapedKey = key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const pattern = new RegExp(`\\{${escapedKey}\\}`, "g");
      result = result.replace(pattern, values[key] || "");
    }

    return result;
  }, [detectedPlaceholders, template.content, values]);
  const useSingleColumnFields = detectedPlaceholders.length > 6;

  useEffect(() => {
    setCopyStatus("");
  }, [template.id, values]);

  const handleChange = (key, value) => {
    onValuesChange(template.id, {
      ...values,
      [key]: value,
    });
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(
      detectedPlaceholders.map((key) => [key, ""])
    );
    onValuesChange(template.id, cleared);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopyStatus("Copied!");
    } catch {
      setCopyStatus("Clipboard access failed.");
    }
  };

  return (
    <div className="grid h-full items-stretch gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* ── Fill panel ─────────────────────────────────────────────── */}
      <div className="workspace-shell flex min-h-[30rem] flex-col">
        <div className="workspace-inner flex h-full flex-col gap-5 overflow-auto p-5 lg:p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="ui-page-title leading-snug">{template.title}</h2>
            <div className="flex flex-shrink-0 items-center gap-2">
              {onEdit ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-lg border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                >
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-lg border border-red-300/60 bg-red-50/60 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          {/* Placeholder fields */}
          {detectedPlaceholders.length > 0 ? (
            <div
              className={`grid grid-cols-1 gap-3 ${
                useSingleColumnFields ? "" : "md:grid-cols-2"
              }`}
            >
              {detectedPlaceholders.map((field) => (
                <div
                  key={field}
                  className={`nested-surface px-4 py-3 ${
                    useSingleColumnFields ? "max-w-xl" : ""
                  }`}
                >
                  <label className="ui-meta-label mb-1.5 block normal-case tracking-[0.02em]">
                    {`{${field}}`}
                  </label>
                  <input
                    type="text"
                    value={values[field] || ""}
                    onChange={(event) => handleChange(field, event.target.value)}
                    placeholder="Enter value…"
                    className="w-full bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-panel max-w-md">
              <div className="empty-state-title">No placeholders used</div>
              <div className="empty-state-copy">
                This template is plain text — nothing to fill before copying.
              </div>
            </div>
          )}

          {detectedPlaceholders.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="self-start rounded-lg border border-border/60 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
            >
              Clear Fields
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Preview panel ───────────────────────────────────────────── */}
      <div className="workspace-shell flex min-h-[30rem] flex-col">
        <div className="workspace-inner flex flex-1 flex-col overflow-hidden">
          {/* Preview header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
            <span className="section-kicker">Preview</span>
            <div className="flex items-center gap-2">
              {copyStatus ? (
                <span className="text-xs font-medium text-muted-foreground">{copyStatus}</span>
              ) : null}
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Copy Text
              </button>
            </div>
          </div>

          {/* Clickable preview body */}
          <button
            type="button"
            onClick={handleCopy}
            className="workspace-inner flex flex-1 cursor-pointer items-start overflow-auto p-6 text-left hover:bg-accent/15 lg:p-8"
            title="Click to copy"
          >
            <div className="w-full whitespace-pre-wrap text-sm leading-7 text-foreground">
              {preview || (
                <span className="italic text-muted-foreground/50">
                  Your filled template will appear here.
                </span>
              )}
            </div>
          </button>

          <div className="workspace-inner border-t border-border/40 px-6 py-3">
            <span className="text-xs text-muted-foreground/60">
              Click anywhere in the preview to copy to clipboard.
            </span>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────── */}
      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-template-title"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-template-title" className="ui-section-title">
              Delete template?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{template.title}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(template.id);
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
