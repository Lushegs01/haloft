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
 * If pg_cron is enabled on the database, 015 already schedules this every
 * five minutes and this route is a belt-and-braces second trigger. If it
 * is not, this route is the mechanism — schedule it in vercel.json.
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

    // Expiring a booking queues its notification. Drain here rather than
    // waiting for the next mail tick — a student whose room was released
    // should hear about it now, not in fifteen minutes.
    const drained =
      result.expired > 0 ? await drainNotifications(50, "cron:expire") : null;

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
