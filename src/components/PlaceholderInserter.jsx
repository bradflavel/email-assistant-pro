export default function PlaceholderInserter({ placeholders, onInsert }) {
  return (
    <div className="flex flex-wrap gap-2">
      {placeholders.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onInsert(`{${tag}}`)}
          className="px-2 py-1 text-sm bg-muted hover:bg-accent rounded transition"
        >
          {`{${tag}}`}
        </button>
      ))}
    </div>
  );
}
