import { useEffect, useState } from "react";

export default function TemplateList({ onSelect }) {
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
  }, []);

  return (
    <div className="space-y-2">
      {templates.map((tpl) => (
        <button
          key={tpl.title}
          onClick={() => onSelect(tpl.title)}
          className="w-full text-left px-2 py-1 bg-muted hover:bg-accent rounded-md"
        >
          <div className="font-semibold">{tpl.title}</div>
          <div className="text-xs text-muted-foreground">
            Last edited: {new Date(tpl.updatedAt).toLocaleString()}
          </div>
        </button>
      ))}
    </div>
  );
}