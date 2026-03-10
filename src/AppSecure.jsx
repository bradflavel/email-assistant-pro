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

let statusTimeoutId = null;

export default function AppSecure() {
  const [mode, setMode] = useState("home");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [filledValues, setFilledValues] = useState({});
  const [userTags, setUserTags] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastDiskSnapshot, setLastDiskSnapshot] = useState("");
  const [editorDraft, setEditorDraft] = useState(null);
  const fileInputRef = useRef(null);

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
    localStorage.setItem(STORAGE_KEYS.templates, serializeTemplates(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.filledValues,
      JSON.stringify(filledValues)
    );
  }, [filledValues]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.userTags, JSON.stringify(userTags));
  }, [userTags]);

  useEffect(() => {
    if (editorDraft && hasMeaningfulContent(editorDraft)) {
      localStorage.setItem(STORAGE_KEYS.editorDraft, JSON.stringify(editorDraft));
      return;
    }

    localStorage.removeItem(STORAGE_KEYS.editorDraft);
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
    window.clearTimeout(statusTimeoutId);
    statusTimeoutId = window.setTimeout(() => setStatusMessage(""), 3000);
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
      applyImportedLibrary(importedLibrary);
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
      {renderSidebar ? (
      <aside className="sidebar-shell border-b border-border/70 p-4 pb-14 text-foreground lg:flex lg:h-screen lg:w-80 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="field-surface rounded-[22px] bg-background/50 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
            <button
              type="button"
              onClick={() => setMode("home")}
              className="text-left"
            >
              <h1 className="text-[1.8rem] font-black tracking-tight text-foreground transition hover:text-primary">
                Email Assistant Pro
              </h1>
            </button>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Draft and reuse response templates locally.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleCreateTemplate}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-200 px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_rgba(250,204,21,0.28)] transition hover:translate-y-[-1px]"
            >
              New Template
            </button>
          </div>

          <div className="field-surface mt-8 flex min-h-0 flex-1 justify-center rounded-[26px] bg-background/35 p-3">
            <TemplateListSecure
              onSelect={handleTemplateSelect}
              selectedTemplateId={selectedTemplateId}
              templates={templates}
            />
          </div>
        </div>

        <div className="mt-6 space-y-3 lg:mt-auto">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-2xl border border-border/80 bg-background/55 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent/40"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!hasTemplates}
              className={`save-as-button rounded-2xl border border-border/80 bg-background/55 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-accent/40 disabled:cursor-not-allowed disabled:text-foreground ${
                hasUnsavedFileChanges ? "save-as-button-alert" : ""
              }`}
            >
              Save As
            </button>
          </div>
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => setMode("settings")}
            className="w-full rounded-2xl border border-border/80 bg-background/55 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent/40"
          >
            Settings
          </button>
        </div>
      </aside>
      ) : null}

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-4 pb-14 lg:p-8 lg:pb-16">
        {statusMessage ? (
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-4 z-20 inline-flex -translate-x-1/2 rounded-full border border-border/70 bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur"
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden">
        {mode === "home" ? (
          <div className="workspace-shell h-full overflow-auto">
            <div className="workspace-inner flex min-h-full flex-col justify-between p-8 lg:p-12">
              <div className="max-w-3xl">
                <h2 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-foreground lg:text-6xl">
                  Shape polished email responses without leaving your browser.
                </h2>
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="section-kicker">Create</div>
                  <button
                    type="button"
                    onClick={handleCreateTemplate}
                    className="field-surface w-full p-6 text-left hover:bg-accent/40"
                  >
                    <div className="text-2xl font-bold">New Template</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Build a fresh response from scratch.
                    </div>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="section-kicker">Library</div>
                  <div className="grid gap-4">
                    <button
                      type="button"
                      onClick={handleImportClick}
                      className="field-surface p-5 text-left hover:bg-accent/40"
                    >
                      <div className="text-xl font-bold">Load JSON File</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Bring previously saved templates back in.
                      </div>
                    </button>
                    {hasTemplates ? (
                      <button
                        type="button"
                        onClick={selectedTemplate ? () => setMode("preview") : handleExport}
                        className="field-surface p-5 text-left hover:bg-accent/40"
                      >
                        <div className="text-xl font-bold">
                          {selectedTemplate ? "Resume Current Template" : "Export Current Library"}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {selectedTemplate
                            ? "Jump back into the selected draft."
                            : "Save your local template set to disk."}
                        </div>
                      </button>
                    ) : (
                      <div className="field-surface p-5 text-left opacity-60">
                        <div className="text-xl font-bold">Export Current Library</div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Create or import at least one template before exporting.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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

      <footer className="footer-shell pointer-events-none fixed bottom-0 left-0 right-0 z-20 px-4 py-2 text-center">
        <span className="ui-meta-label normal-case tracking-[0.08em] text-muted-foreground">
          Brad Flavel 2026
        </span>
      </footer>
    </div>
  );
}
