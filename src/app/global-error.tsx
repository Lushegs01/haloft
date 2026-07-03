"use client";

// Catches errors thrown in the root layout itself. Must render its own
// <html>/<body> because it replaces the whole document.
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
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fbff",
          color: "#1e3a6e",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7fa8", maxWidth: "28rem", marginBottom: "2rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#e86530",
            color: "#fff",
            border: "none",
            borderRadius: "9999px",
            padding: "0.75rem 1.75rem",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#94a3b8" }}>
            Error reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
