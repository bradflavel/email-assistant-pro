import { useState, useEffect } from "react";

export default function PlaceholderPreviewer({ content, onEdit }) {
  const [values, setValues] = useState({});
  const [preview, setPreview] = useState("");
  const [detectedPlaceholders, setDetectedPlaceholders] = useState([]);

  useEffect(() => {
    const matches = [...new Set(content.match(/{\w+}/g))] || [];
    const cleaned = matches.map((p) => p.replace(/[{}]/g, ""));
    setDetectedPlaceholders(cleaned);
  }, [content]);

  useEffect(() => {
    let result = content;
    for (const key of detectedPlaceholders) {
      const pattern = new RegExp(`{${key}}`, "g");
      result = result.replace(pattern, values[key] || "");
    }
    setPreview(result);
  }, [values, content, detectedPlaceholders]);

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy.");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2 space-y-4">
        <h3 className="text-lg font-semibold">Fill Placeholders</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {detectedPlaceholders.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">{`{${field}}`}</label>
              <input
                type="text"
                value={values[field] || ""}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-2 py-1 border rounded-md bg-background text-foreground"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Preview</h3>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm px-3 py-1 bg-muted border text-foreground rounded-md hover:bg-accent"
            >
              ✏️ Edit This Template
            </button>
          )}
        </div>

        <div className="bg-muted border rounded-md p-4 whitespace-pre-wrap flex-1">
          {preview}
        </div>

        <button
          onClick={handleCopy}
          className="self-start px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          📋 Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
