import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { drainNotifications } from "@/lib/notifications";

/**
 * Delivers whatever is sitting in the notification outbox.
 *
 * Most events go out within a second of being queued, from `after()` on
 * the request that created them. This route is what makes that reliable
 * rather than merely likely: a serverless instance can be recycled before
 * its callback runs, a mail provider can be down for ten minutes, and
 * either way the rows stay claimable and get picked up here.
 *
 * Claiming is `FOR UPDATE SKIP LOCKED`, so this running at the same time
 * as an inline drain sends each event once, not twice.
 *
 * Failures back off — 1, 4, 9, 16 minutes — and a row that exhausts its
 * attempts is marked `dead` and stays in the table. A queue that quietly
 * discards what it cannot deliver is worse than no queue.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await drainNotifications(50, "cron:notifications");

    if (result.failed > 0) {
      console.error(
        `[cron/notifications] ${result.failed} of ${result.claimed} failed to send`
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[cron/notifications] failed:", e);
    return NextResponse.json({ error: "drain failed" }, { status: 500 });
  }
}
