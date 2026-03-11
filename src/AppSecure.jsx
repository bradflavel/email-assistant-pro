import { useEffect, useMemo, useRef, useState } from "react";
import PlaceholderPreviewerSecure from "./components/PlaceholderPreviewerSecure";
import SettingsScreenSecure from "./components/SettingsScreenSecure";
import TemplateEditorSecure from "./components/TemplateEditorSecure";
import TemplateListSecure from "./components/TemplateListSecure";
import {
  createTemplate,
  sanitizeImportedLibrary,
  sanitizeImportedTemplates,
  serializeLibrary,
  serializeTemplates,
} from "./lib/templates";

const STORAGE_KEYS = {
  templates: "email-assistant-pro:templates",
  filledValues: "email-assistant-pro:filled-values",
  userTags: "email-assistant-pro:user-tags",
  editorDraft: "email-assistant-pro:editor-draft",
};

function createEmptyDraft() {
  return {
    id: null,
    title: "",
    content: "",
    placeholders: [],
  };
}

function hasMeaningfulContent(draft) {
  if (!draft) {
    return false;
  }

  return Boolean(
    draft.title?.trim() ||
      draft.content?.trim() ||
      (Array.isArray(draft.placeholders) && draft.placeholders.length > 0)
  );
}

function hasDraftChanges(draft, templates) {
  if (!draft) {
    return false;
  }

  if (!draft.id) {
    return hasMeaningfulContent(draft);
  }

  const sourceTemplate = templates.find((template) => template.id === draft.id);

  if (!sourceTemplate) {
    return hasMeaningfulContent(draft);
  }

  return (
    sourceTemplate.title !== draft.title ||
    sourceTemplate.content !== draft.content ||
    JSON.stringify(sourceTemplate.placeholders || []) !==
      JSON.stringify(draft.placeholders || [])
  );
}

async function readJsonFile(file) {
  const text = await file.text();
  return JSON.parse(text);
}

function downloadJsonFile(filename, contents) {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// ── Inline icons ────────────────────────────────────────────────────────────

function IconMail({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839z" />
    </svg>
  );
}

function IconPlus({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function IconUpload({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614zM3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" clipRule="evenodd" />
    </svg>
  );
}

function IconDownload({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75zM3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" clipRule="evenodd" />
    </svg>
  );
}

function IconSettings({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function AppSecure() {
  const [mode, setMode] = useState("home");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [filledValues, setFilledValues] = useState({});
  const [userTags, setUserTags] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastDiskSnapshot, setLastDiskSnapshot] = useState("");
  const [editorDraft, setEditorDraft] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);
  const statusTimeoutId = useRef(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(STORAGE_KEYS.templates);
      const storedFilledValues = localStorage.getItem(STORAGE_KEYS.filledValues);
      const storedUserTags = localStorage.getItem(STORAGE_KEYS.userTags);
      const storedEditorDraft = localStorage.getItem(STORAGE_KEYS.editorDraft);
      let parsedTemplates = [];
      let parsedUserTags = [];

      if (storedTemplates) {
        parsedTemplates = sanitizeImportedTemplates(JSON.parse(storedTemplates));
        setTemplates(parsedTemplates);
        setSelectedTemplateId(parsedTemplates[0]?.id || null);
      }

      if (storedFilledValues) {
        setFilledValues(JSON.parse(storedFilledValues));
      }

      if (storedUserTags) {
        parsedUserTags = JSON.parse(storedUserTags);
        setUserTags(parsedUserTags);
      }

      if (storedEditorDraft) {
        const parsedDraft = JSON.parse(storedEditorDraft);
        if (parsedDraft && typeof parsedDraft === "object") {
          setEditorDraft({
            id: parsedDraft.id || null,
            title: typeof parsedDraft.title === "string" ? parsedDraft.title : "",
            content: typeof parsedDraft.content === "string" ? parsedDraft.content : "",
            placeholders: Array.isArray(parsedDraft.placeholders)
              ? parsedDraft.placeholders.filter((value) => typeof value === "string")
              : [],
          });
        }
      }

      setLastDiskSnapshot(
        serializeLibrary({ templates: parsedTemplates, userTags: parsedUserTags })
      );
    } catch {
      localStorage.removeItem(STORAGE_KEYS.templates);
      localStorage.removeItem(STORAGE_KEYS.filledValues);
      localStorage.removeItem(STORAGE_KEYS.userTags);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.templates, serializeTemplates(templates));
    } catch {
      setStatusMessage("Storage limit reached — export your library to avoid losing data.");
    }
  }, [templates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.filledValues, JSON.stringify(filledValues));
    } catch {
      // Filled values are non-critical; fail silently
    }
  }, [filledValues]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.userTags, JSON.stringify(userTags));
    } catch {
      setStatusMessage("Storage limit reached — export your library to avoid losing data.");
    }
  }, [userTags]);

  useEffect(() => {
    try {
      if (editorDraft && hasMeaningfulContent(editorDraft)) {
        localStorage.setItem(STORAGE_KEYS.editorDraft, JSON.stringify(editorDraft));
        return;
      }
      localStorage.removeItem(STORAGE_KEYS.editorDraft);
    } catch {
      // Draft persistence is best-effort; fail silently
    }
  }, [editorDraft]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates]
  );
  const activeEditorTemplate = useMemo(() => {
    if (editorDraft) {
      return editorDraft;
    }

    if (selectedTemplate) {
      return selectedTemplate;
    }

    return createEmptyDraft();
  }, [editorDraft, selectedTemplate]);
  const hasTemplates = templates.length > 0;
  const currentLibrarySnapshot = useMemo(
    () => serializeLibrary({ templates, userTags }),
    [templates, userTags]
  );
  const hasUnsavedFileChanges = hasTemplates && currentLibrarySnapshot !== lastDiskSnapshot;
  const hasUnsavedEditorChanges = hasDraftChanges(editorDraft, templates);
  const filledTemplateCount = useMemo(
    () =>
      Object.values(filledValues).filter(
        (value) =>
          value &&
          typeof value === "object" &&
          Object.values(value).some((entry) => String(entry || "").trim())
      ).length,
    [filledValues]
  );

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedEditorChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedEditorChanges]);

  const setStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(statusTimeoutId.current);
    statusTimeoutId.current = window.setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplateId(null);
    setEditorDraft((currentDraft) =>
      currentDraft && currentDraft.id === null ? currentDraft : createEmptyDraft()
    );
    setMode("edit");
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setMode("preview");
  };

  const handleSaveTemplate = (templateInput) => {
    const nextTemplate = createTemplate(templateInput);

    setTemplates((currentTemplates) => {
      const existingIndex = currentTemplates.findIndex(
        (template) => template.id === nextTemplate.id
      );

      if (existingIndex === -1) {
        return [nextTemplate, ...currentTemplates];
      }

      const nextTemplates = [...currentTemplates];
      nextTemplates[existingIndex] = nextTemplate;
      return nextTemplates;
    });

    setSelectedTemplateId(nextTemplate.id);
    setEditorDraft(null);
    setMode("preview");
    setStatus("Template saved.");
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId)
    );
    setFilledValues((currentValues) => {
      const nextValues = { ...currentValues };
      delete nextValues[templateId];
      return nextValues;
    });

    if (selectedTemplateId === templateId) {
      setSelectedTemplateId(null);
      setMode("home");
    }

    setEditorDraft((currentDraft) =>
      currentDraft?.id === templateId ? null : currentDraft
    );

    setStatus("Template removed.");
  };

  const handleExport = async () => {
    if (templates.length === 0) {
      setStatus("Nothing to export yet.");
      return;
    }

    const contents = currentLibrarySnapshot;
    const filename = "email-assistant-templates.json";

    try {
      if ("showSaveFilePicker" in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "JSON Files",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(contents);
        await writable.close();
      } else {
        downloadJsonFile(filename, contents);
      }

      setStatus("Templates saved to disk.");
      setLastDiskSnapshot(contents);
    } catch (error) {
      if (error?.name !== "AbortError") {
        setStatus("Save failed.");
      }
    }
  };

  const applyImportedLibrary = (importedLibrary) => {
    setTemplates(importedLibrary.templates);
    setUserTags(importedLibrary.userTags);
    setSelectedTemplateId(importedLibrary.templates[0]?.id || null);
    setFilledValues({});
    setLastDiskSnapshot(serializeLibrary(importedLibrary));
    setEditorDraft(null);
    setMode(importedLibrary.templates.length > 0 ? "preview" : "home");
    setStatus(`Imported ${importedLibrary.templates.length} template(s) from disk.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const parsed = await readJsonFile(file);
      const importedLibrary = sanitizeImportedLibrary(parsed);

      if (templates.length > 0) {
        setPendingImport(importedLibrary);
      } else {
        applyImportedLibrary(importedLibrary);
      }
    } catch {
      setStatus("Import failed. The file is not valid template JSON.");
    }
  };

  const handleStartEditing = () => {
    if (selectedTemplate) {
      setEditorDraft((currentDraft) =>
        currentDraft?.id === selectedTemplate.id ? currentDraft : selectedTemplate
      );
    } else {
      setEditorDraft((currentDraft) => currentDraft || createEmptyDraft());
    }
    setMode("edit");
  };

  const handleResetSession = () => {
    setTemplates([]);
    setSelectedTemplateId(null);
    setFilledValues({});
    setUserTags([]);
    localStorage.removeItem(STORAGE_KEYS.templates);
    localStorage.removeItem(STORAGE_KEYS.filledValues);
    localStorage.removeItem(STORAGE_KEYS.userTags);
    localStorage.removeItem(STORAGE_KEYS.editorDraft);
    setLastDiskSnapshot("");
    setEditorDraft(null);
    setMode("home");
    setStatus("Saved data cleared.");
  };

  const handleClearFilledValues = () => {
    setFilledValues({});
    localStorage.removeItem(STORAGE_KEYS.filledValues);
    setStatus("Filled values cleared.");
  };

  const handleClearDraft = () => {
    setEditorDraft(null);
    localStorage.removeItem(STORAGE_KEYS.editorDraft);
    setStatus("Draft cleared.");
  };

  const handleFilledValuesChange = (templateId, values) => {
    setFilledValues((currentValues) => ({
      ...currentValues,
      [templateId]: values,
    }));
  };

  const handleAddUserTag = (tag) => {
    setUserTags((currentTags) =>
      currentTags.includes(tag) ? currentTags : [...currentTags, tag]
    );
  };

  const handleDeleteUserTag = (tag) => {
    setUserTags((currentTags) => currentTags.filter((value) => value !== tag));
  };

  const renderSidebar = mode !== "home";

  return (
    <div className="relative flex h-screen overflow-hidden bg-background text-foreground lg:flex-row">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleImportChange}
      />

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      {renderSidebar ? (
        <aside className="sidebar-shell flex flex-col border-b border-border/60 lg:h-screen lg:w-[268px] lg:border-b-0">
          {/* Brand header */}
          <div className="flex h-14 flex-shrink-0 items-center gap-2.5 border-b border-border/50 px-4">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <IconMail className="h-3.5 w-3.5" />
            </div>
            <button
              type="button"
              onClick={() => setMode("home")}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary">
                Email Assistant
              </span>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* New Template button */}
            <div className="px-3 pt-3">
              <button
                type="button"
                onClick={handleCreateTemplate}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:brightness-105 active:brightness-95"
              >
                <IconPlus className="h-4 w-4" />
                New Template
              </button>
            </div>

            {/* Templates section label */}
            {hasTemplates ? (
              <div className="px-4 pb-1 pt-4">
                <span className="section-kicker">Templates</span>
              </div>
            ) : null}

            {/* Template list */}
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <TemplateListSecure
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplateId}
                templates={templates}
              />
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="flex-shrink-0 border-t border-border/50 p-2 space-y-0.5">
            <button
              type="button"
              onClick={handleImportClick}
              className="sidebar-nav-item"
            >
              <IconUpload className="h-4 w-4 shrink-0" />
              <span>Import JSON</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!hasTemplates}
              className={`save-as-button sidebar-nav-item disabled:cursor-not-allowed disabled:opacity-40 ${
                hasUnsavedFileChanges ? "save-as-button-alert" : ""
              }`}
            >
              <IconDownload className="h-4 w-4 shrink-0" />
              <span>Save As JSON</span>
            </button>
            <button
              type="button"
              aria-label="Open settings"
              onClick={() => setMode("settings")}
              className="sidebar-nav-item"
            >
              <IconSettings className="h-4 w-4 shrink-0" />
              <span>Settings</span>
            </button>
          </div>
        </aside>
      ) : null}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-10 lg:p-6 lg:pb-12">
        {/* Toast notification */}
        {statusMessage ? (
          <div
            role="status"
            className="pointer-events-none absolute inset-x-0 top-5 z-20 flex justify-center"
          >
            <div className="inline-flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/98 px-4 py-2.5 text-sm font-medium text-foreground shadow-lg shadow-black/5 backdrop-blur-md">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {statusMessage}
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">

          {/* Home screen */}
          {mode === "home" ? (
            <div className="workspace-shell h-full overflow-auto">
              <div className="workspace-inner flex min-h-full flex-col">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-border/50 px-7 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <IconMail className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Email Assistant Pro</div>
                      <div className="text-xs text-muted-foreground">Response template manager</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                    >
                      <IconUpload className="h-3.5 w-3.5" />
                      Import
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("settings")}
                      className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
                    >
                      <IconSettings className="h-3.5 w-3.5" />
                      Settings
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 px-7 py-8">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Shape polished email responses{" "}
                    <span className="text-muted-foreground">without leaving your browser.</span>
                  </h2>
                  <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                    Build templates with dynamic placeholders, fill them instantly, and copy to clipboard — all stored locally.
                  </p>

                  {/* Action cards */}
                  <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <button
                      type="button"
                      onClick={handleCreateTemplate}
                      className="group rounded-xl border border-border/70 bg-background/60 p-5 text-left transition hover:border-primary/25 hover:bg-card hover:shadow-sm"
                    >
                      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconPlus className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">New Template</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        Build a fresh response from scratch.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="group rounded-xl border border-border/70 bg-background/60 p-5 text-left transition hover:border-primary/25 hover:bg-card hover:shadow-sm"
                    >
                      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <IconUpload className="h-4 w-4" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">Load JSON File</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        Bring previously saved templates back in.
                      </div>
                    </button>

                    {hasTemplates ? (
                      <button
                        type="button"
                        onClick={selectedTemplate ? () => setMode("preview") : handleExport}
                        className="group rounded-xl border border-border/70 bg-background/60 p-5 text-left transition hover:border-primary/25 hover:bg-card hover:shadow-sm"
                      >
                        <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <IconDownload className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-semibold text-foreground">
                          {selectedTemplate ? "Resume Current Template" : "Export Current Library"}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">
                          {selectedTemplate
                            ? "Jump back into the selected draft."
                            : "Save your local template set to disk."}
                        </div>
                      </button>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-5 opacity-50">
                        <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <IconDownload className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-semibold text-foreground">Export Current Library</div>
                        <div className="mt-1 text-xs leading-5 text-muted-foreground">
                          Create or import at least one template before exporting.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Library stats */}
                  {hasTemplates ? (
                    <div className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" />
                      {templates.length} template{templates.length !== 1 ? "s" : ""} in library
                      {userTags.length > 0
                        ? ` · ${userTags.length} tag${userTags.length !== 1 ? "s" : ""}`
                        : ""}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {mode === "edit" ? (
            <TemplateEditorSecure
              onBack={() => setMode(selectedTemplate ? "preview" : "home")}
              onAddUserTag={handleAddUserTag}
              onDeleteUserTag={handleDeleteUserTag}
              onDraftChange={setEditorDraft}
              onSave={handleSaveTemplate}
              draftKey={activeEditorTemplate?.id || "new"}
              selectedTemplate={activeEditorTemplate}
              userTags={userTags}
            />
          ) : null}

          {mode === "preview" && selectedTemplate ? (
            <PlaceholderPreviewerSecure
              onDelete={handleDeleteTemplate}
              onEdit={handleStartEditing}
              onValuesChange={handleFilledValuesChange}
              template={selectedTemplate}
              values={filledValues[selectedTemplate.id] || {}}
            />
          ) : null}

          {mode === "preview" && !selectedTemplate ? (
            <div className="workspace-shell h-full overflow-auto">
              <div className="workspace-inner flex h-full items-center justify-center p-10">
                <div className="empty-state-panel max-w-md">
                  <div className="empty-state-title">No template selected</div>
                  <div className="empty-state-copy">
                    Choose a template from the sidebar to preview and fill it.
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {mode === "settings" ? (
            <SettingsScreenSecure
              filledTemplateCount={filledTemplateCount}
              hasUnsavedEditorDraft={hasUnsavedEditorChanges}
              hasUnsavedFileChanges={hasUnsavedFileChanges}
              onBack={() => setMode(selectedTemplate ? "preview" : "home")}
              onClearDraft={handleClearDraft}
              onClearFilledValues={handleClearFilledValues}
              onClearSession={handleResetSession}
              tagCount={userTags.length}
              templateCount={templates.length}
            />
          ) : null}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="footer-shell pointer-events-none fixed bottom-0 left-0 right-0 z-20 px-4 py-2 text-center">
        <span className="text-[0.65rem] font-medium tracking-[0.06em] text-muted-foreground/60">
          Brad Flavel 2026
        </span>
      </footer>

      {/* ── Import confirmation modal ─────────────────────────────────────── */}
      {pendingImport ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-confirm-title"
          onClick={() => setPendingImport(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="import-confirm-title" className="ui-section-title">
              Replace existing library?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will replace your {templates.length} current template
              {templates.length !== 1 ? "s" : ""} and all tags with the imported file. This cannot
              be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingImport(null)}
                className="rounded-lg border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  applyImportedLibrary(pendingImport);
                  setPendingImport(null);
                }}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Replace Library
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
