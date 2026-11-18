export interface DescriptionItem {
  term: string;
  description: string;
}
export interface DescriptionListProps {
  items: readonly DescriptionItem[];
  columns?: 1 | 2;
}
/** Displays labelled values as a responsive description list. @param props Ordered term-description pairs and column count. */
export function DescriptionList({ items, columns = 1 }: DescriptionListProps) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-sm text-foreground-muted">{item.term}</dt>
          <dd className="mt-1 text-foreground">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}
