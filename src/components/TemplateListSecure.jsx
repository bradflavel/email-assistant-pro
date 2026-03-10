export default function TemplateListSecure({
  templates,
  selectedTemplateId,
  onSelect,
}) {
  const isEmpty = templates.length === 0;

  return (
    <div
      className={`h-full pr-1 ${
        isEmpty ? "flex items-center justify-center overflow-hidden px-6 pr-0 pl-0" : "space-y-3 overflow-y-auto"
      }`}
    >
      {isEmpty ? (
        <div className="empty-state-panel max-w-[13rem]">
          <div className="empty-state-title">No templates yet</div>
          <div className="empty-state-copy">Create a new template or load one from file.</div>
        </div>
      ) : null}

      {templates.map((template) => {
        const isSelected = template.id === selectedTemplateId;

        return (
          <div
            key={template.id}
            className="group relative"
          >
            <button
              type="button"
              onClick={() => onSelect(template.id)}
              className={`w-full rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-amber-300/80 bg-amber-50/85 shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:bg-white/10 dark:shadow-[0_10px_24px_rgba(15,23,42,0.24)]"
                  : "border-border/80 bg-background/72 hover:bg-accent/35 dark:bg-background/40 dark:hover:bg-white/10"
              }`}
            >
              <div className="text-[0.95rem] font-semibold text-foreground">{template.title}</div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
