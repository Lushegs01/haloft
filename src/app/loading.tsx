import { HaloftMark } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--paper)]">
      <div className="flex flex-col items-center gap-5">
        <HaloftMark size={40} className="animate-pulse-soft" />
        <p className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
          Loading
        </p>
      </div>
      <span className="sr-only" role="status">
        Loading Haloft
      </span>
    </div>
  );
}
