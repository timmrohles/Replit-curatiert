interface TopicTagProps {
  label: string;
  count?: number;
  onClick?: () => void;
}

export function TopicTag({ label, count, onClick }: TopicTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="topic-tag"
    >
      {label}
      {count && <span className="ml-2 opacity-70">({count})</span>}
    </button>
  );
}
