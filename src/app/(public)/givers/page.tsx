import Link from "next/link";
import { browseGivers } from "@/lib/queries/people";
import { getAllDistricts } from "@/lib/queries/lookups";
import { InitialAvatar, FilterChipRow } from "@/components/ui";

export default async function GiversPage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;

  const [givers, districts] = await Promise.all([
    browseGivers({ districtId }),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find Job Givers</h1>

      <div className="mb-6">
        <FilterChipRow
          basePath="/givers"
          paramName="district"
          allLabel="All districts"
          activeValue={params.district}
          options={districts.filter((d) => !d.isRemote).map((d) => ({ value: String(d.id), label: d.district }))}
        />
      </div>

      {givers.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No job givers match these filters yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {givers.map((g) => (
            <Link
              key={g.id}
              href={`/givers/${g.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <div className="flex items-start gap-3">
                <InitialAvatar name={g.businessName} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--ink)]">{g.businessName}</h3>
                  <p className="text-sm text-[var(--ink-muted)] mt-0.5">{g.category}</p>
                  <p className="text-xs text-[var(--ink-faint)] mt-2">{g.district}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
