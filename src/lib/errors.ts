/**
 * What a failed server action tells the user, and what it tells us.
 *
 * Actions used to do this:
 *
 *     if (error) return { error: error.message };
 *
 * which hands the browser whatever PostgREST said. In development that is
 * exactly what you want. In production it is a description of the
 * schema — constraint names, column names, policy names, the shape of the
 * row that was rejected — handed to whoever provoked it. `duplicate key
 * value violates unique constraint "uq_payments_booking_settled"` tells a
 * stranger more about the billing model than any documentation does.
 *
 * So: one generic sentence to the user, carrying a correlation id, and
 * the real error in the server log under that same id. Support asks for
 * the id; the log has the rest.
 *
 * In development the detail is appended to the message too, because
 * having to tab to a terminal to read your own error is how people end up
 * putting `error.message` back.
 */

export interface ActionFailure {
  error: string;
  correlationId: string;
}

function isDev() {
  return process.env.NODE_ENV !== "production";
}

/** Short, readable, greppable. Not a security boundary — just a handle. */
export function correlationId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

interface FailOptions {
  /** What the user is told. Write it for them, not for us. */
  message: string;
  /** The underlying error. Logged, never returned. */
  cause?: unknown;
  /** Where this happened, e.g. "updateProperty". */
  context: string;
  /** Anything else worth having in the log line. */
  detail?: Record<string, unknown>;
}

/**
 * Logs the real failure and returns the sanitized shape for the client.
 */
export function fail(options: FailOptions): ActionFailure {
  const id = correlationId();
  const cause = options.cause;

  const description =
    cause instanceof Error
      ? `${cause.name}: ${cause.message}`
      : typeof cause === "object" && cause !== null
        ? JSON.stringify(cause)
        : cause !== undefined
          ? String(cause)
          : "(no cause)";

  console.error(
    `[${id}] ${options.context}: ${description}`,
    options.detail ? { detail: options.detail } : ""
  );

  return {
    error: isDev() ? `${options.message} [${id}] ${description}` : `${options.message} (ref ${id})`,
    correlationId: id,
  };
}

/**
 * The messages themselves. Having them in one place is what stops
 * "Could not update property." and "Failed to update the property!"
 * from both existing.
 */
export const MESSAGES = {
  unauthorized: "You do not have permission to do that.",
  notFound: "We could not find that.",
  invalidInput: "Some of those details aren't valid. Please check and try again.",
  generic: "Something went wrong. Please try again.",
  updateFailed: "Could not save your changes. Please try again.",
  createFailed: "Could not create that. Please try again.",
  deleteFailed: "Could not delete that. Please try again.",
} as const;

/**
 * Maps a database sentinel (RAISE EXCEPTION 'SOMETHING') to a sentence
 * for the user. Anything unrecognised is a bug or a leak, and gets the
 * generic message plus a logged correlation id.
 */
export function fromSentinel(
  error: { code?: string; message: string },
  sentinels: Record<string, string>,
  context: string
): ActionFailure | { error: string } {
  const known = sentinels[error.message];
  if (known) return { error: known };

  return fail({
    message: MESSAGES.generic,
    cause: error,
    context,
  });
}
