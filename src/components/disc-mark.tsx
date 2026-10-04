/** Two riso discs overlapping: the mark. Colours index into her swatches. */
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
  const w = size * 1.5;
  return (
    <svg
      width={w}
      height={size}
      viewBox="0 0 30 20"
      className={className}
      aria-hidden
      style={{ isolation: "isolate" }}
    >
      <circle cx="10" cy="10" r="9" fill={a} style={{ mixBlendMode: "multiply" }} />
      <circle cx="20" cy="10" r="9" fill={b} style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}
