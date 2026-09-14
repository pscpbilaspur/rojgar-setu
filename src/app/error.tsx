"use client";

/**
 * Default error boundary for any route that doesn't define its own — Next.js
 * requires this to be a Client Component. Previously there was no error.tsx
 * anywhere in the app, so an unexpected server/DB error would fall through
 * to Next.js's generic unstyled crash page. This gives the same look as the
 * rest of the site (same tokens, same card style) and a way back without
 * losing the whole session.
 *
 * Shown in both Hindi and English together, stacked, rather than switching
 * on the site's hi/en toggle — a Client Component error boundary can't read
 * that server-side language preference, and unlike every other page, a
 * crash can happen to a Hindi-reading visitor just as easily as an
 * English-reading one, so this is the one screen where showing both at once
 * (instead of picking one) is the safer default.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto px-4 py-14 text-center">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-6"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-lg font-bold text-[var(--ink)]">
          कुछ गड़बड़ हो गई <span className="text-[var(--ink-muted)] font-normal">/ Something went wrong</span>
        </h1>
        <p className="text-sm text-[var(--ink-muted)] mt-2">
          यह आपकी गलती नहीं है — कृपया दोबारा प्रयास करें।
          <br />
          This isn&apos;t something you did — please try again.
        </p>
        <div className="flex gap-2 justify-center mt-5">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            फिर कोशिश करें / Try again
          </button>
          <a
            href="/"
            className="border border-[var(--border)] rounded-md px-4 py-2 text-sm font-medium text-[var(--ink)]"
          >
            होम / Go home
          </a>
        </div>
      </div>
    </div>
  );
}
