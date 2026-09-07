import Link from "next/link";
import { browseSeekers } from "@/lib/queries/people";
import { getAllDistricts } from "@/lib/queries/lookups";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  wfh: "Work From Home",
};

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ district?: string; type?: string }>;
}) {
  const params = await searchParams;
  const districtId = params.district ? Number(params.district) : undefined;
  const jobType = params.type || undefined;

  const [people, districts] = await Promise.all([
    browseSeekers({ districtId, jobType }),
    getAllDistricts(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[var(--ink)] mb-4">Find People</h1>

      <form className="flex flex-wrap gap-2 mb-6" method="get">
        <select name="district" defaultValue={params.district ?? ""} className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm">
          <option value="">All districts</option>
          {districts.filter((d) => !d.isRemote).map((d) => (
            <option key={d.id} value={d.id}>{d.district}</option>
          ))}
        </select>
        <select name="type" defaultValue={params.type ?? ""} className="border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-sm">
          <option value="">Any job type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="wfh">Work From Home</option>
        </select>
        <button type="submit" className="bg-[var(--accent)] text-white rounded-md px-4 py-2 text-sm font-medium">
          Filter
        </button>
      </form>

      {people.length === 0 ? (
        <p className="text-[var(--ink-muted)]">No one matches these filters yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/people/${p.id}`}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-4"
              style={{ boxShadow: "var(--shadow)" }}
            >
              <h3 className="font-semibold text-[var(--ink)]">{p.name}</h3>
              <p className="text-sm text-[var(--ink-muted)] mt-0.5">{p.qualification ?? "—"}</p>
              <p className="text-xs text-[var(--ink-faint)] mt-2">
                {p.district} · {JOB_TYPE_LABEL[p.jobType]}
              </p>
              {p.verificationPending && (
                <p className="text-xs text-[var(--warn)] mt-1">Basic verification not yet done</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
