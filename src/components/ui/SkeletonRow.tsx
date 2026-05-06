interface SkeletonRowProps {
  cols?: number;
}

export function SkeletonRow({ cols = 6 }: SkeletonRowProps) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-zinc-100" />
        </td>
      ))}
    </tr>
  );
}
