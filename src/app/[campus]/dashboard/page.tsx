import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  RefreshCw,
  Star,
  XCircle,
} from "lucide-react";
import { formatNaira } from "@/components/haloft/format";
import { CancelBookingButton } from "./cancel-booking-button";
import { isBookingPaid } from "@/types/database";
import { PayNowButton } from "./pay-now-button";
import { ReviewDialog } from "./review-dialog";
import { AppToaster } from "@/components/ui/app-toaster";

// One student's own bookings, saved homes and reviews — never prerendered
// and never served from a shared cache.
export const dynamic = "force-dynamic";

const STATUS: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: {
    label: "Awaiting confirmation",
    className: "border-[var(--line-strong)] text-muted-foreground",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    className: "border-[var(--teal-deep)]/35 bg-[var(--teal-tint)] text-[var(--teal-deep)]",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-[var(--line-strong)] text-muted-foreground",
    icon: XCircle,
  },
  completed: {
    label: "Stay completed",
    className: "border-[var(--line-strong)] text-ink",
    icon: Check,
  },
  refunded: {
    label: "Refunded",
    className: "border-[var(--line-strong)] text-muted-foreground",
    icon: RefreshCw,
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StudentDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ campus: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { campus } = await params;
  const { payment: paymentOutcome } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/signin");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, rooms(name, annual_rent), properties(title, slug, campus_id), payments(id, status, settles_booking)"
    )
    .eq("student_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*, properties(title, slug, campus_id, min_price, max_price, address)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, properties(title, slug, campus_id)")
    .eq("student_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const reviewedBookingIds = new Set((reviews ?? []).map((r) => r.booking_id));
  const firstName = profile.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="pb-28 md:pb-0">
      <AppToaster />
      {/* ── Header ────────────────────────────────────────── */}
      <div className="hairline-b bg-[var(--paper)]">
        <div className="shell py-10 lg:py-14">
          <p className="label label-rule max-w-[14rem]">Your account</p>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="display-2 text-ink">Hello, {firstName}.</h1>
              <p className="mt-2.5 text-[14px] text-muted-foreground">{user.email}</p>
            </div>
            <Link
              href={`/${campus}/search`}
              className="group inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-[10px] bg-[var(--navy)] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] sm:self-auto"
            >
              Find another home
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="shell py-10 lg:py-14">
        {paymentOutcome === "success" && (
          <div className="mb-10 rounded-[12px] border border-[var(--teal-deep)]/35 bg-[var(--teal-tint)] px-5 py-4">
            <p className="text-[14px] font-medium text-ink">
              Payment received — the room is yours.
            </p>
            <p className="mt-1 text-[13px] text-ink-soft">
              Paystack has emailed you a receipt.
            </p>
          </div>
        )}
        {paymentOutcome === "failed" && (
          <div className="mb-10 rounded-[12px] border border-destructive/30 bg-destructive/5 px-5 py-4">
            <p className="text-[14px] font-medium text-ink">
              That payment didn&apos;t complete
            </p>
            <p className="mt-1 max-w-[62ch] text-[13px] text-ink-soft">
              You were not charged, or the charge could not be confirmed. Try
              again below — and tell us if money left your account.
            </p>
          </div>
        )}

        <div className="grid grid-cols-12 gap-y-14 lg:gap-x-14">
          {/* ── Requests ──────────────────────────────────── */}
          <section className="col-span-12 lg:col-span-8">
            <h2 className="display-3 text-ink">Room requests</h2>

            {bookings && bookings.length > 0 ? (
              <ul className="mt-7 border-t border-[var(--line)]">
                {bookings.map((booking) => {
                  const status = STATUS[booking.status] ?? STATUS.pending;
                  const StatusIcon = status.icon;
                  // `settles_booking`, not `status === "success"`: an
                  // overpaid booking is a paid booking, and only one
                  // payment row per booking can ever carry the flag.
                  const isPaid = isBookingPaid(booking.payments);
                  const canReview =
                    booking.status === "completed" &&
                    !reviewedBookingIds.has(booking.id);

                  return (
                    <li
                      key={booking.id}
                      className="border-b border-[var(--line)] py-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                              {booking.properties?.title ?? "Home"}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${status.className}`}
                            >
                              <StatusIcon className="size-3" aria-hidden="true" />
                              {status.label}
                            </span>
                            {isPaid && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--teal-deep)]/35 bg-[var(--teal-tint)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-deep)]">
                                <Check className="size-3" aria-hidden="true" />
                                Paid
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-[13.5px] text-muted-foreground">
                            {booking.rooms?.name ?? "Room"} ·{" "}
                            {formatDate(booking.check_in_date)} —{" "}
                            {formatDate(booking.check_out_date)}
                          </p>
                          <p className="mt-1.5 text-[13.5px] text-ink tabular">
                            {formatNaira(Number(booking.total_amount ?? 0))} total
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 sm:justify-end">
                          {booking.status === "confirmed" && !isPaid && (
                            <PayNowButton
                              bookingId={booking.id}
                              amount={Number(booking.total_amount)}
                            />
                          )}
                          {(booking.status === "pending" ||
                            (booking.status === "confirmed" && !isPaid)) && (
                            <CancelBookingButton
                              bookingId={booking.id}
                              campusSlug={campus}
                            />
                          )}
                          {canReview && (
                            <ReviewDialog
                              bookingId={booking.id}
                              campusSlug={campus}
                              propertyTitle={booking.properties?.title ?? "this home"}
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-7 rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-14 text-center">
                <p className="text-[15px] font-medium text-ink">
                  You haven&apos;t requested a room yet
                </p>
                <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-muted-foreground">
                  When you find a place you like, ask for it here. Nothing is
                  charged until a booking is confirmed.
                </p>
                <Link
                  href={`/${campus}/search`}
                  className="mt-6 inline-flex h-11 items-center rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
                >
                  Browse homes near campus
                </Link>
              </div>
            )}

            {/* ── Reviews ─────────────────────────────────── */}
            <div className="mt-14">
              <h2 className="display-3 text-ink">Reviews you&apos;ve written</h2>

              {reviews && reviews.length > 0 ? (
                <ul className="mt-7 border-t border-[var(--line)]">
                  {reviews.map((review) => (
                    <li key={review.id} className="border-b border-[var(--line)] py-6">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <p className="text-[15px] font-semibold text-ink">
                          {review.properties?.title ?? "Home"}
                        </p>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < review.overall_rating
                                  ? "fill-current text-[var(--sand-deep)]"
                                  : "text-[var(--line-strong)]"
                              }`}
                              aria-hidden="true"
                            />
                          ))}
                          <span className="sr-only">
                            {review.overall_rating} out of 5
                          </span>
                        </span>
                        {!review.is_approved && (
                          <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            Awaiting approval
                          </span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="mt-2.5 max-w-[62ch] text-[13.5px] leading-[1.65] text-muted-foreground">
                          {review.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 max-w-[52ch] text-[13.5px] leading-[1.65] text-muted-foreground">
                  Once a stay is complete you can review the place. We only
                  publish reviews from students who actually stayed there.
                </p>
              )}
            </div>
          </section>

          {/* ── Saved ─────────────────────────────────────── */}
          <aside className="col-span-12 lg:col-span-4">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Saved homes
            </h2>

            {favorites && favorites.length > 0 ? (
              <ul className="mt-4 border-t border-[var(--line)]">
                {favorites.map((fav) => (
                  <li key={fav.id} className="border-b border-[var(--line)]">
                    <Link
                      href={`/${campus}/property/${fav.properties?.slug}`}
                      className="group flex items-start justify-between gap-4 py-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-ink">
                          {fav.properties?.title}
                        </p>
                        <p className="mt-1 truncate text-[12.5px] text-muted-foreground">
                          {fav.properties?.address}
                        </p>
                      </div>
                      <p className="shrink-0 text-[13px] font-medium text-ink tabular">
                        {formatNaira(Number(fav.properties?.min_price ?? 0))}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 max-w-[36ch] border-t border-[var(--line)] pt-4 text-[13px] leading-[1.6] text-muted-foreground">
                Nothing saved yet. Homes you save while browsing show up here.
              </p>
            )}

            <div className="mt-10 border-t border-[var(--line)] pt-6">
              <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Your details
              </h2>
              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="text-ink">{profile.full_name ?? "—"}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="truncate text-ink">{user.email}</dd>
                </div>
                {profile.phone && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="text-ink tabular">{profile.phone}</dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
