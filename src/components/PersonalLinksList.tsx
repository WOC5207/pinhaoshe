export interface PersonalLinkItem {
  id: string;
  label: string;
  url: string;
}

/** Homepage sidebar card linking out to the photographer's other sites. */
export default function PersonalLinksList({
  items,
  title
}: {
  items: PersonalLinkItem[];
  title: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-fg/10 bg-page/85 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg px-2 py-1.5 text-sm text-fg-muted transition hover:bg-fg/5 hover:text-fg"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
