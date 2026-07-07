export function LoadingIndicator({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label={label ?? "Loading"}>
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
    </div>
  );
}
