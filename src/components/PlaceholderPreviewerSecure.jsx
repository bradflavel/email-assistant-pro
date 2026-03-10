import { useEffect, useMemo, useState } from "react";

function findPlaceholders(content) {
  const matches = content.match(/{\w+}/g) || [];
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
      const pattern = new RegExp(`{${key}}`, "g");
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
      setCopyStatus("Copied to clipboard.");
    } catch {
      setCopyStatus("Clipboard access failed.");
    }
  };

  return (
    <div className="grid items-stretch gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="workspace-shell flex min-h-[30rem] h-full flex-col">
        <div className="workspace-inner flex h-full flex-col justify-center gap-6 overflow-auto p-6 lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="ui-page-title">{template.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-xl border border-red-300/70 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200 dark:hover:bg-red-500/25 dark:hover:text-white"
              >
                Delete Template
              </button>
            ) : null}
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
              >
                Edit Template
              </button>
            ) : null}
          </div>
        </div>

        {detectedPlaceholders.length > 0 ? (
          <div className={`grid grid-cols-1 gap-4 ${useSingleColumnFields ? "" : "md:grid-cols-2"}`}>
            {detectedPlaceholders.map((field) => (
              <div key={field} className={`nested-surface p-4 ${useSingleColumnFields ? "max-w-xl" : "max-w-sm"}`}>
                <label className="ui-meta-label mb-2 block normal-case tracking-[0.02em]">{`{${field}}`}</label>
                <input
                  type="text"
                  value={values[field] || ""}
                  onChange={(event) => handleChange(field, event.target.value)}
                  className="w-full bg-transparent text-lg text-foreground outline-none"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-panel max-w-md">
            <div className="empty-state-title">No placeholders used</div>
            <div className="empty-state-copy">
              This template is plain text, so there is nothing to fill before copying.
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleClear}
          className="self-start rounded-full border border-border/80 bg-background/70 px-5 py-2.5 text-sm font-medium hover:bg-accent/40"
        >
          Clear
        </button>
        </div>
      </div>

      <div className="workspace-shell flex min-h-[30rem] h-full flex-col">
        <button
          type="button"
          onClick={handleCopy}
          className="workspace-inner flex flex-1 items-center whitespace-pre-wrap p-6 text-left text-base leading-7 hover:bg-accent/20 lg:p-8"
        >
          <div className="w-full">{preview}</div>
        </button>
        <div className="workspace-inner flex items-center justify-between gap-4 border-t border-border/80 p-4 lg:px-8">
          {copyStatus ? (
            <span className="text-sm text-muted-foreground">{copyStatus}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Click the text or use the button to copy.</span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
          >
            Copy Text
          </button>
        </div>
      </div>

      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-template-title"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-template-title" className="ui-section-title">
              Delete template?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{template.title}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete?.(template.id);
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
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
