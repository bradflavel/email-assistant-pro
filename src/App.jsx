import { useState, useRef } from "react";
import TemplateList from "./components/TemplateList";
import TemplateEditor from "./components/TemplateEditor";
import PlaceholderPreviewer from "./components/PlaceholderPreviewer";

export default function App() {
  const [mode, setMode] = useState("home");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef();

  const handleTemplateSelect = (title) => {
    if (!title) {
      setSelectedTemplate(null);
      setMode("edit");
      return;
    }
    const item = localStorage.getItem(`template:${title}`);
    if (item) {
      const { title, content } = JSON.parse(item);
      setSelectedTemplate({ title, content });
      setMode("preview");
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setMode("home");
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleExport = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("template:"));
    const templates = keys.map(k => JSON.parse(localStorage.getItem(k)));
    const data = JSON.stringify(templates, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "templates.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-background text-foreground">
      <aside className="w-64 bg-muted p-4 border-r border-border flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-4">Templates</h2>
          <TemplateList
            onSelect={handleTemplateSelect}
            refreshKey={refreshKey}
            setRefreshKey={setRefreshKey}
          />
        </div>
        <div className="space-y-2 mt-6">
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const templates = JSON.parse(event.target.result);
                  if (Array.isArray(templates)) {
                    templates.forEach(({ title, content }) => {
                      if (title && content) {
                        localStorage.setItem(`template:${title}`, JSON.stringify({
                          title,
                          content,
                          updatedAt: new Date().toISOString()
                        }));
                      }
                    });
                    setRefreshKey(prev => prev + 1);
                    alert("Templates imported.");
                  } else {
                    alert("Invalid JSON format.");
                  }
                } catch {
                  alert("Failed to parse JSON.");
                }
              };
              reader.readAsText(file);
            }}
          />
          <button
            onClick={handleImportClick}
            className="w-full text-sm px-2 py-1 bg-muted text-foreground border rounded-md hover:bg-accent"
          >
            📥 Import Templates
          </button>
          <button
            onClick={handleExport}
            className="w-full text-sm px-2 py-1 bg-muted text-foreground border rounded-md hover:bg-accent"
          >
            📤 Export All Templates
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 space-y-6 overflow-hidden">
        <h1 className="text-2xl font-bold">Email Assistant Pro</h1>

        {mode === "home" && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setMode("edit");
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              ➕ Add New Template
            </button>
            <button
              onClick={() => setMode("preview")}
              className="px-4 py-2 bg-muted text-foreground rounded-md border"
            >
              📂 Select Existing Template
            </button>
          </div>
        )}

        {mode === "edit" && (
          <TemplateEditor
            selectedTemplate={selectedTemplate}
            onBack={() => {
              handleBack();
              setRefreshKey(prev => prev + 1);
            }}
          />
        )}

        {mode === "preview" && selectedTemplate && (
          <PlaceholderPreviewer
            content={selectedTemplate.content}
            templateKey={selectedTemplate.title}
            onEdit={() => setMode("edit")}
          />
        )}

        {mode === "preview" && !selectedTemplate && (
          <div className="text-muted-foreground italic">
            Select a template from the sidebar to view it.
          </div>
        )}
      </main>
    </div>
  );
}
