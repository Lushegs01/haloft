"use client";

// Catches errors thrown in the root layout itself. Must render its own
// <html>/<body> because it replaces the whole document — and cannot rely
// on the stylesheet having loaded, so the brand is restated inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          background: "#f7f7f2",
          color: "#101820",
          padding: "clamp(1.5rem, 6vw, 4.5rem)",
        }}
      >
        <div style={{ maxWidth: "34rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#66706b",
            }}
          >
            Something broke
          </p>
          <h1
            style={{
              margin: "1.5rem 0 0",
              fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.034em",
              fontWeight: 500,
            }}
          >
            Haloft didn&apos;t load properly.
          </h1>
          <p
            style={{
              margin: "1.25rem 0 0",
              maxWidth: "40ch",
              fontSize: "1rem",
              lineHeight: 1.62,
              color: "#66706b",
            }}
          >
            It&apos;s on our side, not yours. Try again — if it keeps happening,
            the reference below helps us find it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "2.25rem",
              background: "#1a2a44",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0 1.5rem",
              height: "3.25rem",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: "2.5rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid rgba(16,24,32,0.1)",
                fontSize: "0.75rem",
                color: "#66706b",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
