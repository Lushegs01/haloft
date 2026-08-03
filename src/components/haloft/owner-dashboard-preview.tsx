import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Wallet,
  MessagesSquare,
  ArrowRight,
  BellRing,
} from "lucide-react";

export function OwnerDashboardPreview() {
  return (
    <section id="for-owners" className="relative overflow-hidden bg-night text-night-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-dots-light opacity-25 [mask-image:radial-gradient(ellipse_70%_60%_at_100%_100%,black,transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow justify-start border-none bg-white/10 text-coral">For landlords & managers</p>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Own student housing? Fill rooms without the middlemen
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-night-foreground/75 sm:text-lg">
              List your property, set your own prices, and let verified students
              come to you. Haloft handles the vetting, the bookings and the
              secure payments — you handle the rooms.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                { icon: CalendarDays, text: "See bookings and availability at a glance" },
                { icon: Wallet, text: "Track payments and deposits in one place" },
                { icon: MessagesSquare, text: "Message verified students directly — no fake numbers" },
                { icon: BellRing, text: "Get notified the moment a room is requested" },
              ].map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-teal">
                    <f.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <p className="text-sm leading-relaxed text-night-foreground/80">{f.text}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="mailto:support@haloft.homes?subject=List%20my%20property%20on%20Haloft"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-bold text-night transition-all hover:brightness-110"
              >
                <Building2 className="size-4" aria-hidden="true" />
                Apply to list your property
              </Link>
              <Link
                href="/legal/terms"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-white/40"
              >
                Owner terms
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur-sm">
            <div className="overflow-hidden rounded-2xl bg-night">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                <p className="text-sm font-bold text-white">Owner dashboard</p>
                <span className="rounded-full bg-teal/20 px-2.5 py-0.5 text-[11px] font-bold text-teal">
                  Live in app
                </span>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { label: "Rooms listed", value: "6" },
                  { label: "Bookings this term", value: "11" },
                  { label: "Expected rent", value: "₦285k" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                    <p className="mt-1 text-[11px] text-night-foreground/60">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 px-5 pb-5">
                {[
                  { name: "Room 14", who: "Adewale O.", when: "Just now", state: "Requested" },
                  { name: "Room 3", who: "Bose A.", when: "2h ago", state: "Payment confirmed" },
                  { name: "Room 7", who: "—", when: "2 days", state: "Vacant" },
                ].map((r) => (
                  <div
                    key={r.name}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{r.name}</p>
                      <p className="text-[11px] text-night-foreground/60">{r.who} · {r.when}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        r.state === "Payment confirmed"
                          ? "bg-teal/20 text-teal"
                          : r.state === "Requested"
                            ? "bg-coral/20 text-coral"
                            : "bg-white/10 text-night-foreground/60"
                      }`}
                    >
                      {r.state}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 px-5 py-3.5 text-[11px] text-night-foreground/50">
                <ArrowRight className="size-3.5" aria-hidden="true" />
                Preview — part of the app&apos;s admin experience
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
