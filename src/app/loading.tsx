import { HaloftLogo } from "@/components/ui/logo";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        {/* Logo with spinning ring */}
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring */}
          <div className="absolute h-20 w-20 rounded-full bg-[#1e3a6e]/5 animate-pulse-soft" />
          {/* Spinning gradient ring */}
          <svg
            className="absolute h-20 w-20 animate-spin"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e3a6e" stopOpacity="1" />
                <stop offset="70%" stopColor="#3db8a3" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#e86530" stopOpacity="0" />
              </linearGradient>
            </defs>
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="url(#spinGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="200 26"
            />
          </svg>
          {/* Logo icon in centre */}
          <HaloftLogo variant="icon" size={44} />
        </div>

        <div className="text-center">
          <p
            className="font-bold tracking-tight"
            style={{
              fontFamily: "var(--font-inter)",
              color: "#1e3a6e",
              letterSpacing: "-0.03em",
              fontSize: "1rem",
            }}
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
