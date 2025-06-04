import { useState } from "react";

export default function PlaceholderPreviewer({ content }) {
  const [values, setValues] = useState({});
  const [preview, setPreview] = useState("");

  const placeholderFields = [
    "{customerName}",
    "{shipmentID}",
    "{delDate}",
    "{newShipmentID}",
    "{newAddress",
    "{serviceHub}",
    "{myName}",
  ];

  const handleChange = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handlePreview = () => {
    let result = content;
    for (const key in values) {
      const pattern = new RegExp(`{${key}}`, "g");
      result = result.replace(pattern, values[key] || "");
    }
    setPreview(result);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Fill Placeholders</h3>
      <div className="grid grid-cols-2 gap-4">
        {placeholderFields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1">{field}</label>
            <input
              type="text"
              value={values[field] || ""}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full px-2 py-1 border rounded-md bg-background text-foreground"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handlePreview}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
      >
        Preview Final Email
      </button>

      {preview && (
        <div className="mt-4 p-4 bg-muted border rounded-md whitespace-pre-wrap">
          <h4 className="font-bold mb-2">Preview:</h4>
          {preview}
        </div>
      )}
    </div>
  );
}
