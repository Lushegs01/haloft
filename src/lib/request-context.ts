import { headers } from "next/headers";

/**
 * What we know about the request making a call, for rate limiting and
 * for the security log.
 *
 * Every field here comes from a header a client can set, so none of it is
 * evidence of anything on its own. It is useful for correlating, for
 * spotting a pattern, and for telling one caller from another when the
 * platform's proxy is the only thing writing the header — and it is
 * treated as exactly that, never as identity.
 */
export interface RequestContext {
  ip: string;
  userAgent: string | null;
  requestId: string;
}

/**
 * The client address, taken from the platform's proxy headers.
 *
 * `x-forwarded-for` is a list the proxy appends to, so the LEFT-most
 * entry is what the original client claimed and every entry after it was
 * added by a hop. On Vercel and most managed platforms the edge rewrites
 * the header, so the left-most entry is the real peer; behind an
 * unmanaged proxy it is attacker-controlled. `x-real-ip` and
 * `cf-connecting-ip` are single-valued and set by the proxy itself,
 * so they are preferred where present.
 */
function clientIp(h: Headers): string {
  const single = h.get("cf-connecting-ip") ?? h.get("x-real-ip");
  if (single) return single.trim();

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export async function getRequestContext(): Promise<RequestContext> {
  try {
    const h = await headers();
    return {
      ip: clientIp(h),
      userAgent: h.get("user-agent"),
      // Vercel sets x-vercel-id; other platforms set x-request-id. Either
      // way it is the string that ties a log line to a trace.
      requestId:
        h.get("x-request-id") ??
        h.get("x-vercel-id") ??
        crypto.randomUUID(),
    };
  } catch {
    // Outside a request scope (a cron, a script): still give callers a
    // correlation id rather than making them handle a null.
    return { ip: "unknown", userAgent: null, requestId: crypto.randomUUID() };
  }
}
