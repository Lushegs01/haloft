import { Hexagon, Sparkles } from "lucide-react";

const ECOSYSTEM = [
  { name: "ScanMark", role: "Campus utility" },
  { name: "UniReg", role: "Campus utility" },
  { name: "Clearr", role: "Campus utility" },
  { name: "NADA", role: "Campus utility" },
];

export function CampusEcosystem() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-navy text-white">
              <Hexagon className="size-5 text-teal" aria-hidden="true" />
            </span>
            <p className="font-display text-xl font-extrabold tracking-tight text-foreground">
              Haloft is part of CampOS
            </p>
          </div>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            CampOS is a family of tools we&apos;re building around Nigerian
            campus life — each one solving a real, daily problem for students.
            Haloft is the housing arm.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {ECOSYSTEM.map((e) => (
              <span
                key={e.name}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-colors hover:border-teal-ink/40"
              >
                <Sparkles className="size-4 text-coral" aria-hidden="true" />
                {e.name}
                <span className="text-xs font-medium text-muted-foreground">
                  {e.role}
                </span>
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            More CampOS tools are in the works — follow Haloft for announcements.
          </p>
        </div>
      </div>
    </section>
  );
}
