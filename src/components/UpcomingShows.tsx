export interface QuickLinkItem {
  id: string;
  title: string;
  url: string;
  date: string | null;
}

export default function UpcomingShows({
  items,
  title,
  emptyText
}: {
  items: QuickLinkItem[];
  title: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl border border-fg/10 bg-page/85 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-center text-xs text-fg-subtle">{emptyText}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {items.map((item) => {
            const content = (
              <>
                <span className="text-sm text-fg-muted">{item.title}</span>
                {item.date && (
                  <span className="shrink-0 text-xs text-fg-subtle">
                    {item.date}
                  </span>
                )}
              </>
            );
            return (
              <li key={item.id}>
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition hover:bg-fg/5"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
