import { useState, useEffect } from "react";
import PlaceholderInserter from "./PlaceholderInserter";

export default function TemplateEditor({ selectedTemplate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setContent(selectedTemplate.content);
    } else {
      const last = localStorage.getItem("draft-template");
      if (last) {
        const parsed = JSON.parse(last);
        setTitle(parsed.title);
        setContent(parsed.content);
      }
    }
  }, [selectedTemplate]);

  const handleSave = () => {
    if (!title.trim()) {
      setStatus("Template name is required.");
      return;
    }

    const template = {
      title,
      content,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`template:${title}`, JSON.stringify(template));
    localStorage.setItem("draft-template", JSON.stringify(template));
    setStatus("Template saved ✔");
    setTimeout(() => setStatus(""), 2000);
  };

  const handleInsertPlaceholder = (tag) => {
    setContent((prev) => prev + " " + tag);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-md space-y-4">
      <div>
        <label className="block font-semibold mb-1">Template Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Follow-up Email"
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Email Content</label>
        <PlaceholderInserter onInsert={handleInsertPlaceholder} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your email here..."
          rows={10}
          className="w-full px-3 py-2 border rounded-md bg-background text-foreground resize-none"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
        >
          Save Template
        </button>
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>
    </div>
  );
}
