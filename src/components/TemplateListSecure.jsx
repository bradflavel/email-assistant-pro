import { useState } from "react";

export default function TemplateListSecure({
  templates,
  selectedTemplateId,
  onDelete,
  onSelect,
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const pendingTemplate = templates.find((template) => template.id === pendingDeleteId);
  const isEmpty = templates.length === 0;

  return (
    <div
      className={`h-full pr-1 ${
        isEmpty ? "flex items-center justify-center overflow-hidden px-6 pr-0 pl-0" : "space-y-3 overflow-y-auto"
      }`}
    >
      {isEmpty ? (
        <div className="max-w-[12rem] text-center text-base font-semibold leading-7 text-slate-300">
          No Templates Loaded
        </div>
      ) : null}

      {templates.map((template) => {
        const isSelected = template.id === selectedTemplateId;

        return (
          <div
            key={template.id}
            className="relative"
          >
            <button
              type="button"
              onClick={() => onSelect(template.id)}
              className={`w-full rounded-2xl border p-4 pr-16 text-left transition ${
                isSelected
                  ? "border-amber-300/70 bg-white/10 shadow-[0_10px_24px_rgba(15,23,42,0.24)]"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-[0.95rem] font-semibold text-white">{template.title}</div>
            </button>
            <button
              type="button"
              onClick={() => setPendingDeleteId(template.id)}
              className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 text-sm font-semibold leading-none text-red-200 transition hover:bg-red-500/25 hover:text-white"
              aria-label={`Delete ${template.title}`}
            >
              x
            </button>
          </div>
        );
      })}
      {pendingTemplate ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-template-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg">
            <h2 id="delete-template-title" className="text-lg font-semibold">
              Delete template?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {pendingTemplate.title}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(pendingTemplate.id);
                  setPendingDeleteId(null);
                }}
                className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
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
