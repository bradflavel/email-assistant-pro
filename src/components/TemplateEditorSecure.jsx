import { useEffect, useMemo, useRef, useState } from "react";
import PlaceholderInserter from "./PlaceholderInserter";
import TagManagerModal from "./TagManagerModal";

function extractPlaceholders(content) {
  const matches = content.match(/{\w+}/g) || [];
  return [...new Set(matches.map((match) => match.replace(/[{}]/g, "")))];
}

export default function TemplateEditorSecure({
  onAddUserTag,
  selectedTemplate,
  onBack,
  onDeleteUserTag,
  onSave,
  userTags,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [templatePlaceholders, setTemplatePlaceholders] = useState([]);
  const [showTagManager, setShowTagManager] = useState(false);
  const [status, setStatus] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setContent(selectedTemplate.content);
      setTemplatePlaceholders(selectedTemplate.placeholders || []);
    } else {
      setTitle("");
      setContent("");
      setTemplatePlaceholders([]);
    }
    setStatus("");
  }, [selectedTemplate]);

  const availablePlaceholders = useMemo(() => {
    return [
      ...new Set([
        ...userTags,
        ...templatePlaceholders,
        ...extractPlaceholders(content),
      ]),
    ];
  }, [content, templatePlaceholders, userTags]);

  const handleSave = () => {
    if (!title.trim()) {
      setStatus("Template name is required.");
      return;
    }

    onSave({
      id: selectedTemplate?.id,
      title: title.trim(),
      content,
      placeholders: templatePlaceholders,
      updatedAt: new Date().toISOString(),
    });
    setStatus("Template saved.");
  };

  const handleInsertPlaceholder = (tag) => {
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent((previous) => (previous ? `${previous} ${tag}` : tag));
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const nextContent = `${content.slice(0, start)}${tag}${content.slice(end)}`;
    setContent(nextContent);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + tag.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleAddTemplateTag = (tag) => {
    setTemplatePlaceholders((current) =>
      current.includes(tag) ? current : [...current, tag]
    );
    onAddUserTag(tag);
  };

  return (
    <div className="workspace-shell">
      <div className="workspace-inner space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight">Edit Template</h2>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm text-muted-foreground hover:bg-accent/40"
          >
            Back
          </button>
        ) : null}
      </div>

      <div className="field-surface p-4">
        <label className="mb-2 block text-lg font-bold">Template Title</label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Follow-up Email"
          className="w-full bg-transparent px-1 py-2 text-lg text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="field-surface p-5">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-lg font-bold">Email Content</label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-h-[44px] flex-1 flex-wrap items-center gap-2">
              <PlaceholderInserter
                placeholders={availablePlaceholders}
                onInsert={handleInsertPlaceholder}
              />
            </div>
            <button
              type="button"
              onClick={() => setShowTagManager(true)}
              className="rounded-full border border-border/80 bg-background/70 px-4 py-2 text-sm font-medium hover:bg-accent/40"
            >
              Add Tag
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your email here..."
          rows={14}
          className="mt-5 w-full resize-none rounded-[22px] border border-border/80 bg-background/80 px-5 py-4 text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(15,23,42,0.24)] hover:opacity-90"
        >
          Save Template
        </button>
        {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
      </div>
      {showTagManager ? (
        <TagManagerModal
          existingTags={userTags}
          onAddTag={handleAddTemplateTag}
          onClose={() => setShowTagManager(false)}
          onDeleteTag={onDeleteUserTag}
        />
      ) : null}
      </div>
    </div>
  );
}
