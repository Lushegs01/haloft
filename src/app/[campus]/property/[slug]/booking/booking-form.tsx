"use client";

import { tenancyTotal } from "@/lib/payments-logic";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "./actions";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/components/haloft/format";
import type { RoomListing } from "@/types/database";

interface BookingFormProps {
  room: RoomListing;
  propertySlug: string;
  campusSlug: string;
  propertyTitle: string;
  /** False when the room is already reserved, occupied, or under maintenance */
  isBookable?: boolean;
}

const inputClass =
  "h-12 w-full rounded-[10px] border border-[var(--line-strong)] bg-card px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--teal-deep)]";

function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell py-16 lg:py-24">
      <div className="mx-auto max-w-[32rem] text-center">
        <h1 className="display-3 text-ink">{title}</h1>
        <p className="mx-auto mt-3 max-w-[46ch] text-[14.5px] leading-[1.65] text-muted-foreground">
          {body}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export function BookingForm({
  room,
  propertySlug,
  campusSlug,
  propertyTitle,
  isBookable = true,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // A tenancy is one year, priced once. The move-out date is derived from
  // the move-in date by the database, so it is shown here but never sent.
  const annualRent = Number(room.annual_rent ?? 0);
  const agencyFee = Number(room.agency_fee ?? 0);
  const cautionFee = Number(room.caution_fee ?? 0);
  const totalPayable = tenancyTotal(annualRent, agencyFee, cautionFee);
  const today = new Date().toISOString().split("T")[0];

  const [checkIn, setCheckIn] = useState(today);
  const moveOut = (() => {
    const d = new Date(`${checkIn}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setFullYear(d.getFullYear() + 1);
    return d;
  })();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createBooking(formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    // Show the confirmation, then move the student to their dashboard.
    // Staying here is not an option: the booking reserved this room, so a
    // re-render of this route would no longer find it as bookable.
    setSuccess(true);
    toast.success("Request sent.");
    router.push(`/${campusSlug}/dashboard`);
  }

  if (!isBookable && !success) {
    return (
      <Notice
        title="This room is taken"
        body={`${room.name} at ${propertyTitle} is no longer available. Other rooms in the same building may still be open.`}
      >
        <Link
          href={`/${campusSlug}/property/${propertySlug}`}
          className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--navy)] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          See other rooms here
        </Link>
        <Link
          href={`/${campusSlug}/search`}
          className="inline-flex h-12 items-center justify-center rounded-[10px] border border-[var(--line-strong)] px-6 text-[14px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
        >
          Browse all homes
        </Link>
      </Notice>
    );
  }

  if (success) {
    return (
      <Notice
        title="Request sent"
        body="The team will confirm availability with whoever manages the building and email you. You have not been charged."
      >
        <Link
          href={`/${campusSlug}/dashboard`}
          className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--navy)] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          View my requests
        </Link>
      </Notice>
    );
  }

  return (
    <div className="shell py-8 lg:py-12">
      <Link
        href={`/${campusSlug}/property/${propertySlug}`}
        className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to {propertyTitle}
      </Link>

      <div className="mt-8 grid grid-cols-12 gap-y-10 lg:gap-x-14">
        <div className="col-span-12 lg:col-span-7">
          <p className="label label-rule max-w-[14rem]">Request a room</p>
          <h1 className="mt-5 display-3 max-w-[18ch] text-ink">
            {room.name} at {propertyTitle}
          </h1>
          <p className="mt-3 max-w-[48ch] text-[14.5px] leading-[1.65] text-muted-foreground">
            Tell us when you want to move in. Nothing is charged now — the team
            confirms the room is still free, and payment comes after that.
          </p>

          <form onSubmit={handleSubmit} className="mt-9 space-y-6">
            <input type="hidden" name="roomId" value={room.id ?? ""} />
            <input type="hidden" name="propertyId" value={room.property_id ?? ""} />
            <input type="hidden" name="campusSlug" value={campusSlug} />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="checkInDate" className="text-[13px] font-medium text-ink">
                  Move-in date
                </label>
                <input
                  id="checkInDate"
                  name="checkInDate"
                  type="date"
                  required
                  min={today}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <span className="text-[13px] font-medium text-ink">
                  Tenancy ends
                </span>
                <p className="mt-2 flex h-13 items-center rounded-[10px] border border-[var(--line)] bg-[var(--paper-warm)] px-4 text-[14.5px] text-ink-soft">
                  {moveOut
                    ? moveOut.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  Every tenancy runs for one year.
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor="specialRequests" className="text-[13px] font-medium text-ink">
                  Anything the team should know
                </label>
                <span className="text-[12px] text-muted-foreground">Optional</span>
              </div>
              <input
                id="specialRequests"
                name="specialRequests"
                placeholder="Moving in with a friend, arriving late, questions about the meter…"
                className={`${inputClass} mt-2`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50 sm:w-auto sm:px-7"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  Send request
                  <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Summary */}
        <div className="col-span-12 lg:col-span-4 lg:col-start-9">
          <div className="rounded-[16px] border border-[var(--line)] bg-card p-6 shadow-ambient">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              What you&apos;d pay
            </p>

            <dl className="mt-4 space-y-3 text-[13.5px]">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Rent (1 year)</dt>
                <dd className="font-medium text-ink tabular">
                  {formatNaira(annualRent)}
                </dd>
              </div>
              {agencyFee > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Agency fee</dt>
                  <dd className="font-medium text-ink tabular">
                    {formatNaira(agencyFee)}
                  </dd>
                </div>
              )}
              {cautionFee > 0 && (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Caution fee <span className="text-[12px]">(refundable)</span>
                  </dt>
                  <dd className="font-medium text-ink tabular">
                    {formatNaira(cautionFee)}
                  </dd>
                </div>
              )}
              <div className="flex items-baseline justify-between gap-4 border-t border-[var(--line)] pt-3">
                <dt className="font-medium text-ink">Total, paid once</dt>
                <dd className="font-semibold text-ink tabular">
                  {formatNaira(totalPayable)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5">
              {[
                "Sending this request doesn't charge you.",
                "You pay from your dashboard once it's confirmed.",
                "Cancel free of charge before you pay.",
              ].map((line) => (
                <p
                  key={line}
                  className="flex items-start gap-2.5 text-[12.5px] leading-[1.55] text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 size-3.5 shrink-0 text-[var(--teal-deep)]"
                    aria-hidden="true"
                  />
                  {line}
                </p>
              ))}
            </div>
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-[var(--line)] pt-5 text-[13px]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Room type</dt>
              <dd className="capitalize text-ink">
                {room.room_type?.replace(/_/g, " ")}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">Sleeps</dt>
              <dd className="text-ink tabular">
                {room.max_occupancy ?? 1}{" "}
                {(room.max_occupancy ?? 1) > 1 ? "people" : "person"}
              </dd>
            </div>
            {room.floor != null && (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Floor</dt>
                <dd className="text-ink tabular">{room.floor}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
