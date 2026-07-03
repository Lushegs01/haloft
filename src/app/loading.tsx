export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Logo pulse */}
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 animate-pulse-soft flex items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <span
                className="text-white font-extrabold text-lg"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                H
              </span>
            </div>
          </div>
          {/* Spinner ring */}
          <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 border-t-primary animate-spin" />
        </div>

        <div className="text-center">
          <p
            className="font-bold text-foreground"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Haloft
          </p>
          <p className="text-sm text-muted-foreground mt-1 animate-pulse-soft">
            Loading…
          </p>
        </div>
      </div>
    </div>
  );
}
