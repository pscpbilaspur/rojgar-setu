import Link from "next/link";
import { browseSeekers } from "@/lib/queries/people";
import { getAllDistricts } from "@/lib/queries/lookups";
import { getCurrentUser } from "@/lib/dal";
import { VERIFICATION_STATUS_LABEL, jobTypeLabel } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";
import { InitialAvatar, FilterChipRow } from "@/components/ui";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;
  const jobType = params.type || undefined;

  const { lang } = await getTranslations();
  const current = await getCurrentUser();
  const viewer = current?.giverProfile ? { giverId: current.giverProfile.id, giverUserId: current.user.id } : undefined;
  const [people, districts] = await Promise.all([
    browseSeekers({ districtId, jobType }, viewer),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find People</h1>

      <div className="space-y-2 mb-6">
        <FilterChipRow
          basePath="/people"
          paramName="district"
          allLabel="All districts"
          activeValue={params.district}
          otherParams={{ type: params.type }}
          options={districts.filter((d) => !d.isRemote).map((d) => ({ value: String(d.id), label: d.district }))}
        />
        <FilterChipRow
          basePath="/people"
          paramName="type"
          allLabel="Any job type"
          activeValue={params.type}
          otherParams={{ district: params.district }}
          options={[
            { value: "full_time", label: jobTypeLabel("full_time", lang) },
            { value: "part_time", label: jobTypeLabel("part_time", lang) },
            { value: "wfh", label: jobTypeLabel("wfh", lang) },
          ]}
        />
      </div>

      {people.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No one matches these filters yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex items-start gap-3">
                <InitialAvatar name={p.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[var(--ink)]">{p.name}</h3>
                    {(p.alreadyApplied || p.alreadyContacted) && (
                      <span className="shrink-0 text-[11px] font-medium text-[var(--ok)] bg-[var(--ok-soft)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        {p.alreadyApplied ? "✓ Applied" : "✓ Messaged you"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--ink-muted)] mt-0.5">{p.qualification ?? "—"}</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-2">
                    {p.district} · {jobTypeLabel(p.jobType, lang)}
                  </p>
                  {p.preferredDistricts.length > 0 && (
                    <p className="text-xs text-[var(--ink-faint)] mt-1">
                      Available in: {p.preferredDistricts.join(", ")}
                    </p>
                  )}
                  {p.verificationPending && (
                    <p className="text-xs text-[var(--warn)] mt-1">{VERIFICATION_STATUS_LABEL.not_yet_done}</p>
                  )}
                  {/* Explicit "View Profile" pill (mockup style) — the whole
                      card is already clickable, this is a visible affordance
                      on top of that, not a second/different destination. */}
                  <span className="inline-block mt-3 text-[12px] font-semibold text-[var(--accent-ink)] bg-[var(--accent-soft)] px-3 py-1 rounded-full">
                    View Profile →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
