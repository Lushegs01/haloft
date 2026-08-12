import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { drainNotifications } from "@/lib/notifications";

/**
 * Releases rooms whose reservation window has closed.
 *
 * A pending booking holds a room for 30 minutes and a confirmed one for
 * 48 hours (both configurable in `platform_settings`). Without this, an
 * abandoned booking held its room forever — the dead-room problem — and
 * on a campus with a two-week intake that quietly empties the catalogue.
 *
 * The work is `expire_stale_bookings` (migration 015), which takes rooms
 * under the same lock ordering as `create_booking`, skips anything a
 * payment has settled, and is bounded per call. Running it twice in the
 * same minute is harmless.
 *
 * ── Who actually runs this, and how often ──────────────────
 *
 * pg_cron is the PRIMARY scheduler: migration 015 registers the sweep to
 * run every five minutes inside the database, which is the cadence a
 * 30-minute reservation window needs. Supabase ships pg_cron — enable it
 * under Database → Extensions and 015 does the rest.
 *
 * This route is the backstop for a database without pg_cron, and it is
 * scheduled DAILY in vercel.json because Vercel's Hobby plan permits only
 * daily crons. Daily is too coarse to be the primary mechanism for room
 * release; on Pro, change the schedule to the same five minutes.
 *
 * Running both is harmless — the sweep is idempotent and takes rooms
 * under the same lock ordering as create_booking.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin.rpc("expire_stale_bookings", {
      p_limit: 500,
    });

    if (error) {
      console.error(`[cron/expire-bookings] ${error.message}`);
      return NextResponse.json({ error: "sweep failed" }, { status: 500 });
    }

    const result = data as unknown as {
      expired: number;
      rooms_freed: number;
    };

    // Always drain, not only when something expired. Expiring a booking
    // queues its own notification, but this is also the one job that is
    // guaranteed to be scheduled — so it doubles as the outbox sweep on a
    // deployment where the mail cron cannot run more than once a day.
    const drained = await drainNotifications(50, "cron:expire");

    if (result.expired > 0) {
      console.log(
        `[cron/expire-bookings] expired ${result.expired}, freed ${result.rooms_freed} rooms`
      );
    }

    return NextResponse.json({
      expired: result.expired,
      roomsFreed: result.rooms_freed,
      notifications: drained,
    });
  } catch (e) {
    console.error("[cron/expire-bookings] failed:", e);
    return NextResponse.json({ error: "sweep failed" }, { status: 500 });
  }
}
