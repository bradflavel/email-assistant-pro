function formatDate(isoString) {
  if (!isoString) return null;
  try {
    return new Date(isoString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default function TemplateListSecure({
  templates,
  selectedTemplateId,
  onSelect,
}) {
  const isEmpty = templates.length === 0;

  if (isEmpty) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <div className="empty-state-panel w-full max-w-[12rem]">
          <div className="empty-state-title">No templates yet</div>
          <div className="empty-state-copy">Create one or load from a file.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {templates.map((template) => {
        const isSelected = template.id === selectedTemplateId;
        const dateLabel = formatDate(template.updatedAt);

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            title={template.title}
            className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
              isSelected
                ? "bg-accent/80 text-foreground"
                : "text-foreground hover:bg-accent/40"
            }`}
          >
            <div className="truncate text-sm font-medium">{template.title}</div>
            {dateLabel ? (
              <div className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
                {dateLabel}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
