/**
 * Two riso discs overlapping: the mark. The overlap is drawn as its own shape
 * (a clip of one circle by the other) in a darker ink, so no blend mode is
 * needed. Blend modes and filters are what leave grey compositing boxes behind
 * small elements in Chrome, so the app does not use them.
 */
let n = 0;
export function DiscMark({
  a = "var(--sage)",
  b = "var(--mauve)",
  size = 20,
  className = "",
}: {
  a?: string;
  b?: string;
  size?: number;
  className?: string;
}) {
  const id = `dm${(n = (n + 1) % 100000)}`;
  const w = size * 1.5;
  return (
    <svg width={w} height={size} viewBox="0 0 30 20" className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="10" cy="10" r="9" />
        </clipPath>
      </defs>
      <circle cx="10" cy="10" r="9" fill={a} />
      <circle cx="20" cy="10" r="9" fill={b} />
      <circle cx="20" cy="10" r="9" fill="var(--overlap, #4a4448)" clipPath={`url(#${id})`} />
    </svg>
  );
}
