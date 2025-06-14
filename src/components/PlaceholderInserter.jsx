const placeholders = [
  "customerName",
  "shipmentID",
  "enquiryNumber",
  "delDate",
  "depotName",
  "depotAddress",
  "depotHours",
  "newShipmentID",
  "newAddress",
  "serviceHubName",
  "serviceHubAddress",
  "serviceHubHours",
  "myName",
];

export default function PlaceholderInserter({ onInsert }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {placeholders.map((tag) => (
        <button
          key={tag}
          onClick={() => onInsert(`{${tag}}`)}
          className="px-2 py-1 text-sm bg-muted hover:bg-accent rounded transition"
        >
          {`{${tag}}`}
        </button>
      ))}
    </div>
  );
}
