export default function PlaceholderInserter({ placeholders, onInsert }) {
  return (
    <div className="flex flex-wrap gap-2">
      {placeholders.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onInsert(`{${tag}}`)}
          className="tag-chip"
        >
          {`{${tag}}`}
        </button>
      ))}
    </div>
  );
}
