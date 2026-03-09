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
  template,
  values,
  onEdit,
  onValuesChange,
}) {
  const [copyStatus, setCopyStatus] = useState("");
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
            <h2 className="text-3xl font-black tracking-tight">{template.title}</h2>
          </div>
          {onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
            >
              Edit Template
            </button>
          ) : null}
        </div>

        {detectedPlaceholders.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {detectedPlaceholders.map((field) => (
              <div key={field} className="field-surface max-w-sm p-4">
                <label className="mb-2 block text-sm font-semibold tracking-[0.02em] text-muted-foreground">{`{${field}}`}</label>
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
          <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
            No placeholders found.
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
          className="workspace-inner flex flex-1 items-center whitespace-pre-wrap p-6 text-left text-lg leading-9 hover:bg-accent/20 lg:p-8"
        >
          <div className="w-full">{preview}</div>
        </button>
        <div className="workspace-inner border-t border-border/80 p-4 lg:px-8">
          {copyStatus ? (
            <span className="text-sm text-muted-foreground">{copyStatus}</span>
          ) : (
            <span className="text-sm text-muted-foreground">Click the text to copy.</span>
          )}
        </div>
      </div>
    </div>
  );
}
