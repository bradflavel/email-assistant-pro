import { useEffect, useMemo, useRef, useState } from "react";
import PlaceholderInserter from "./PlaceholderInserter";
import TagManagerModal from "./TagManagerModal";

function extractPlaceholders(content) {
  const matches = content.match(/\{[\w-]+\}/g) || [];
  return [...new Set(matches.map((match) => match.replace(/[{}]/g, "")))];
}

export default function TemplateEditorSecure({
  draftKey,
  onAddUserTag,
  onDraftChange,
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
  const initializedDraftKeyRef = useRef(null);
  const handleSaveRef = useRef(null);

  useEffect(() => {
    if (initializedDraftKeyRef.current === draftKey) {
      return;
    }

    initializedDraftKeyRef.current = draftKey;

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
  }, [draftKey, selectedTemplate]);

  useEffect(() => {
    onDraftChange?.({
      id: selectedTemplate?.id || null,
      title,
      content,
      placeholders: templatePlaceholders,
    });
  }, [content, onDraftChange, selectedTemplate?.id, templatePlaceholders, title]);

  const availablePlaceholders = useMemo(
    () =>
      [...new Set([...userTags, ...templatePlaceholders, ...extractPlaceholders(content)])],
    [content, templatePlaceholders, userTags]
  );

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

  handleSaveRef.current = handleSave;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        handleSaveRef.current?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    <div className="workspace-shell h-full max-h-full overflow-hidden">
      <div className="workspace-inner flex h-full min-h-0 flex-col gap-5 p-5 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="ui-page-title">Edit Template</h2>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border/70 bg-background/60 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
            >
              Back
            </button>
          ) : null}
        </div>

        {/* Title input */}
        <div className="field-surface max-w-lg px-4 py-3">
          <label className="ui-field-label mb-1.5 block">Template Title</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Follow-up Email"
            className="w-full bg-transparent py-1 text-base text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Editor + tags panel */}
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(14rem,0.28fr)]">
          <div className="field-surface flex min-h-0 flex-col p-4">
            <label className="ui-field-label mb-3 block">Email Content</label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Write your email here..."
              rows={10}
              className="custom-scrollbar min-h-0 flex-1 resize-none rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm leading-6 text-foreground outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="nested-surface flex min-h-0 flex-col p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="ui-meta-label">Tags</span>
              <button
                type="button"
                onClick={() => setShowTagManager(true)}
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
              >
                Add Tag
              </button>
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
              <div className="flex flex-wrap items-start gap-1.5">
                <PlaceholderInserter
                  placeholders={availablePlaceholders}
                  onInsert={handleInsertPlaceholder}
                />
                {availablePlaceholders.length === 0 ? (
                  <span className="text-xs text-muted-foreground/70">No tags added yet.</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Save row */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Save Template
          </button>
          <span className="text-xs text-muted-foreground">
            {status || "Ctrl+S to save"}
          </span>
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
