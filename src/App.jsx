import { useState } from "react";
import TemplateList from "./components/TemplateList";
import TemplateEditor from "./components/TemplateEditor";
import PlaceholderPreviewer from "./components/PlaceholderPreviewer";

export default function App() {
  const [mode, setMode] = useState("home");
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-muted p-4 border-r border-border">
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <TemplateList onSelect={handleTemplateSelect} />
      </aside>

      <main className="flex-1 p-6 space-y-6">
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
            onBack={handleBack}
          />
        )}

        {mode === "preview" && selectedTemplate && (
          <PlaceholderPreviewer
            content={selectedTemplate.content}
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
