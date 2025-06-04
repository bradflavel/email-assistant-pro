import { useEffect, useState } from "react";

export default function TemplateList({ onSelect, refreshKey, setRefreshKey }) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith("template:")
    );
    const loaded = keys.map((key) => {
      const { title, updatedAt } = JSON.parse(localStorage.getItem(key));
      return { title, updatedAt };
    });
    setTemplates(loaded);
  }, [refreshKey]);

  const handleRename = (oldTitle) => {
    const newTitle = prompt("New template name:", oldTitle);
    if (!newTitle || newTitle === oldTitle) return;
    const data = localStorage.getItem(`template:${oldTitle}`);
    if (!data) return;
    const parsed = JSON.parse(data);
    parsed.title = newTitle;
    localStorage.removeItem(`template:${oldTitle}`);
    localStorage.setItem(`template:${newTitle}`, JSON.stringify(parsed));
    setRefreshKey(prev => prev + 1);
  };

  const handleDelete = (title) => {
    if (confirm(`Delete "${title}"?`)) {
      localStorage.removeItem(`template:${title}`);
      localStorage.removeItem(`filled:${title}`);
      setRefreshKey(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={() => onSelect(null)}
        className="w-full px-2 py-1 mb-4 bg-primary text-primary-foreground rounded-md hover:opacity-90"
      >
        ➕ Add New Template
      </button>

      {templates.map((tpl) => (
        <div key={tpl.title} className="group relative">
          <button
            onClick={() => onSelect(tpl.title)}
            className="w-full text-left px-2 py-1 bg-muted hover:bg-accent rounded-md"
          >
            <div className="font-semibold">{tpl.title}</div>
            <div className="text-xs text-muted-foreground">
              Last edited: {new Date(tpl.updatedAt).toLocaleString()}
            </div>
          </button>
          <div className="absolute top-1 right-2 hidden group-hover:flex gap-1">
            <button onClick={() => handleRename(tpl.title)} className="text-xs text-foreground hover:text-blue-500">✏️</button>
            <button onClick={() => handleDelete(tpl.title)} className="text-xs text-foreground hover:text-red-500">🗑️</button>
          </div>
        </div>
      ))}
    </div>
  );
}
