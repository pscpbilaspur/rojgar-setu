import Link from "next/link";
import { browseGivers } from "@/lib/queries/people";
import { getAllDistricts } from "@/lib/queries/lookups";

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find Job Givers</h1>

      <form className="flex flex-wrap gap-2 mb-6" method="get">
        <select name="district" defaultValue={params.district ?? ""} className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm">
          <option value="">All districts</option>
          {districts.filter((d) => !d.isRemote).map((d) => (
            <option key={d.id} value={d.id}>{d.district}</option>
          ))}
        </select>
        <button type="submit" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          Filter
        </button>
      </form>

      {givers.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No job givers match these filters yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {givers.map((g) => (
            <Link
              key={g.id}
              href={`/givers/${g.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <h3 className="font-semibold text-[var(--ink)]">{g.businessName}</h3>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">{g.category}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">{g.district}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
