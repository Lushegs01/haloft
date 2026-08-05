"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";

const BUDGETS = [
  { value: "100000", label: "Under ₦100k" },
  { value: "150000", label: "Under ₦150k" },
  { value: "200000", label: "Under ₦200k" },
  { value: "300000", label: "Under ₦300k" },
];

const TYPES = [
  { value: "self_contained", label: "Self-contained" },
  { value: "single_room", label: "Single room" },
  { value: "hostel", label: "Hostel" },
  { value: "studio", label: "Studio" },
  { value: "shared_house", label: "Shared flat" },
];

const AMENITIES = [
  { value: "24_7_power", label: "24/7 power" },
  { value: "security", label: "Security" },
  { value: "water_heater", label: "Running water" },
  { value: "kitchen", label: "Kitchen" },
  { value: "wifi", label: "Wi-Fi" },
  { value: "study_room", label: "Study room" },
  { value: "laundry", label: "Laundry" },
  { value: "parking", label: "Parking" },
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-10 items-center rounded-[9px] border px-3.5 text-[13.5px] font-medium transition-colors ${
        active
          ? "border-[var(--navy)] bg-[var(--navy)] text-white"
          : "border-[var(--line-strong)] bg-card text-ink-soft hover:border-[var(--ink-soft)] hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-[var(--line)] pt-5">
      <legend className="sr-only">{title}</legend>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className="mt-3.5 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function StudentFilters({ campusSlug }: { campusSlug: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [budget, setBudget] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [amenities, setAmenities] = useState<string[]>([]);

  const toggleAmenity = (value: string) =>
    setAmenities((current) =>
      current.includes(value)
        ? current.filter((a) => a !== value)
        : [...current, value]
    );

  const activeCount =
    (budget ? 1 : 0) + (type ? 1 : 0) + amenities.length;

  function search() {
    const params = new URLSearchParams();
    if (budget) params.set("maxPrice", budget);
    if (type) params.set("type", type);
    if (amenities.length) params.set("amenities", amenities.join(","));
    const query = params.toString();
    startTransition(() => {
      router.push(`/${campusSlug}/search${query ? `?${query}` : ""}`);
    });
  }

  return (
    <section className="chapter bg-[var(--paper)]" id="student-life">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-x-12">
          <div className="col-span-12 lg:col-span-5">
            <p className="label label-rule max-w-[16rem]">Built around student life</p>
            <h2 className="mt-6 display-2 max-w-[13ch] text-ink">
              Search the way you&apos;d actually describe it.
            </h2>
            <p className="lede mt-6">
              Not &ldquo;2 bed, 1 bath&rdquo;. Whether the power holds, whether
              there&apos;s water, how far it is at 7am, and what it does to your
              allowance.
            </p>
            <p className="mt-6 max-w-[40ch] text-[13.5px] leading-[1.65] text-muted-foreground">
              Pick a few of these and we&apos;ll take you straight into the
              results with the filters already applied.
            </p>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-[16px] border border-[var(--line)] bg-card p-5 shadow-ambient sm:p-7">
              <div className="space-y-6">
                <Group title="Budget">
                  {BUDGETS.map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      active={budget === item.value}
                      onClick={() =>
                        setBudget((b) => (b === item.value ? null : item.value))
                      }
                    />
                  ))}
                </Group>

                <Group title="Room type">
                  {TYPES.map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      active={type === item.value}
                      onClick={() =>
                        setType((t) => (t === item.value ? null : item.value))
                      }
                    />
                  ))}
                </Group>

                <Group title="What matters">
                  {AMENITIES.map((item) => (
                    <Chip
                      key={item.value}
                      label={item.label}
                      active={amenities.includes(item.value)}
                      onClick={() => toggleAmenity(item.value)}
                    />
                  ))}
                </Group>
              </div>

              <div className="mt-7 flex flex-col gap-4 border-t border-[var(--line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-muted-foreground" aria-live="polite">
                  {activeCount === 0
                    ? "No filters yet — search shows everything near campus."
                    : `${activeCount} filter${activeCount === 1 ? "" : "s"} selected`}
                </p>
                <button
                  type="button"
                  onClick={search}
                  disabled={isPending}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  {isPending ? "Opening results…" : "Search with these filters"}
                  <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
