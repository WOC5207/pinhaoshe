/**
 * Hover-revealed photo credit (cosplayer + character), shown over a
 * gradient/blur scrim at the bottom of the photo. Desktop only — the parent
 * tile must set "group" for the hover trigger and "relative overflow-hidden"
 * to anchor and clip this. Renders nothing if there's no credit to show.
 */
export default function PhotoCreditOverlay({ credit }: { credit: string }) {
  if (!credit) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end bg-linear-to-t from-black/85 via-black/40 to-transparent px-3 pb-2 pt-10 opacity-0 backdrop-blur-sm transition-opacity duration-200 md:flex md:group-hover:opacity-100">
      <p className="truncate text-sm font-medium text-white">{credit}</p>
    </div>
  );
}
