import { useState } from "react";
import TemplateList from "./components/TemplateList";
import TemplateEditor from "./components/TemplateEditor";

export default function App() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (title) => {
    const item = localStorage.getItem(`template:${title}`);
    if (item) {
      const { title, content } = JSON.parse(item);
      setSelectedTemplate({ title, content });
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 bg-muted p-4 border-r border-border">
        <h2 className="text-xl font-semibold mb-4">Templates</h2>
        <TemplateList onSelect={handleTemplateSelect} />
      </aside>

      <main className="flex-1 p-6 space-y-6">
        <h1 className="text-2xl font-bold">Email Assistant Pro</h1>
        <TemplateEditor selectedTemplate={selectedTemplate} />
      </main>
    </div>
  );
}
