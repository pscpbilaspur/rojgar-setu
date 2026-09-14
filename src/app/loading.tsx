/**
 * Default loading UI for any route that doesn't define its own — Next.js
 * shows this automatically while a page's server-side data fetch is in
 * flight (route navigation, a filter submit, etc.). Previously there was no
 * loading.tsx anywhere in the app, so a slow connection had zero feedback
 * beyond the browser's own address-bar spinner. A small centered spinner
 * here, styled with the app's own tokens, is enough to say "this is
 * working" without a heavier per-route skeleton.
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-8 h-8 rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
