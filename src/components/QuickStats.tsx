export interface QuickStatsData {
  photoCount: number;
  albumCount: number;
  cosplayerCount: number;
}

/** Small always-fresh "by the numbers" card for the homepage sidebar. */
export default function QuickStats({
  stats,
  title,
  photosLabel,
  albumsLabel,
  cosplayersLabel
}: {
  stats: QuickStatsData;
  title: string;
  photosLabel: string;
  albumsLabel: string;
  cosplayersLabel: string;
}) {
  const items = [
    { value: stats.photoCount, label: photosLabel },
    { value: stats.albumCount, label: albumsLabel },
    { value: stats.cosplayerCount, label: cosplayersLabel }
  ];

  return (
    <div className="rounded-2xl border border-fg/10 bg-page/85 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-xs text-fg-subtle">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
