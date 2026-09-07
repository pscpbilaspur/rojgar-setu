import { requireAdmin } from "@/lib/dal";
import { db } from "@/db";
import { suggestions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function SuggestionsPage() {
  await requireAdmin();

  const allSuggestions = await db
    .select({
      id: suggestions.id,
      body: suggestions.body,
      createdAt: suggestions.createdAt,
      mobile: users.mobile,
    })
    .from(suggestions)
    .leftJoin(users, eq(suggestions.userId, users.id))
    .orderBy(desc(suggestions.createdAt));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-6">Suggestions ({allSuggestions.length})</h1>
      {allSuggestions.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No suggestions submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {allSuggestions.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <p className="text-[var(--ink)] whitespace-pre-line">{s.body}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">
                {s.mobile ?? "Anonymous"} · {new Date(s.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
