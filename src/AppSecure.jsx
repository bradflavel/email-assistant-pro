import { useEffect, useMemo, useRef, useState } from "react";
import PlaceholderPreviewerSecure from "./components/PlaceholderPreviewerSecure";
import SettingsModalSecure from "./components/SettingsModalSecure";
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
};

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
  const [draftTemplate, setDraftTemplate] = useState(null);
  const [filledValues, setFilledValues] = useState({});
  const [userTags, setUserTags] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [lastDiskSnapshot, setLastDiskSnapshot] = useState("");
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

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) || null,
    [selectedTemplateId, templates]
  );
  const hasTemplates = templates.length > 0;
  const currentLibrarySnapshot = useMemo(
    () => serializeLibrary({ templates, userTags }),
    [templates, userTags]
  );
  const hasUnsavedFileChanges = hasTemplates && currentLibrarySnapshot !== lastDiskSnapshot;

  const setStatus = (message) => {
    setStatusMessage(message);
    window.clearTimeout(statusTimeoutId);
    statusTimeoutId = window.setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplateId(null);
    setDraftTemplate(null);
    setMode("edit");
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setDraftTemplate(null);
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
    setDraftTemplate(null);
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
    setDraftTemplate(null);
    setFilledValues({});
    setLastDiskSnapshot(serializeLibrary(importedLibrary));
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
      setDraftTemplate(selectedTemplate);
    }
    setMode("edit");
  };

  const handleResetSession = () => {
    setTemplates([]);
    setSelectedTemplateId(null);
    setDraftTemplate(null);
    setFilledValues({});
    localStorage.removeItem(STORAGE_KEYS.templates);
    localStorage.removeItem(STORAGE_KEYS.filledValues);
    localStorage.removeItem(STORAGE_KEYS.userTags);
    setLastDiskSnapshot("");
    setMode("home");
    setStatus("Saved data cleared.");
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

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground lg:flex-row">
      <aside className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] p-4 text-slate-50 shadow-[inset_-1px_0_0_rgba(255,255,255,0.06)] lg:flex lg:h-screen lg:min-h-screen lg:w-80 lg:flex-col lg:overflow-hidden lg:border-b-0 lg:border-r">
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(2,6,23,0.24)]">
            <button
              type="button"
              onClick={() => setMode("home")}
              className="text-left"
            >
            <h1 className="text-3xl font-black tracking-tight text-white transition hover:text-amber-200">
              Email Assistant Pro
            </h1>
            </button>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Draft, fill, and export polished response templates.
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
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportChange}
            />
          </div>

          <div className="mt-8 flex min-h-0 flex-1 rounded-[26px] border border-white/10 bg-black/10 p-3 justify-center">
            <TemplateListSecure
              onDelete={handleDeleteTemplate}
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
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!hasTemplates}
              className={`save-as-button rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white ${
                hasUnsavedFileChanges ? "save-as-button-alert" : ""
              }`}
            >
              Save As
            </button>
          </div>
          <button
            type="button"
            aria-label="Open settings"
            onClick={() => setShowSettings(true)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Settings
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col p-4 lg:p-8">
        {statusMessage ? (
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-4 z-20 inline-flex -translate-x-1/2 rounded-full border border-border/70 bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur"
          >
            {statusMessage}
          </div>
        ) : null}

        <div className="flex flex-1 flex-col justify-center">
        {mode === "home" ? (
          <div className="workspace-shell min-h-[86vh]">
            <div className="workspace-inner flex min-h-[86vh] flex-col justify-between p-8 lg:p-12">
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
            onSave={handleSaveTemplate}
            selectedTemplate={draftTemplate || selectedTemplate}
            userTags={userTags}
          />
        ) : null}

        {mode === "preview" && selectedTemplate ? (
          <PlaceholderPreviewerSecure
            onEdit={handleStartEditing}
            onValuesChange={handleFilledValuesChange}
            template={selectedTemplate}
            values={filledValues[selectedTemplate.id] || {}}
          />
        ) : null}

        {mode === "preview" && !selectedTemplate ? (
          <div className="workspace-shell">
            <div className="workspace-inner p-10 text-sm text-muted-foreground">
              Select a template from the list to preview it.
            </div>
          </div>
        ) : null}
        </div>
      </main>

      {showSettings ? (
        <SettingsModalSecure
          onClearSession={handleResetSession}
          onClose={() => setShowSettings(false)}
        />
      ) : null}
    </div>
  );
}
