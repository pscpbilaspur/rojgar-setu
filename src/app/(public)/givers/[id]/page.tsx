import { notFound } from "next/navigation";
import Link from "next/link";
import { getGiverPublicProfile } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/dal";
import { MessageButton } from "@/components/MessageButton";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  wfh: "Work From Home",
};

export default async function GiverProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  const profile = await getGiverPublicProfile(Number(id), Boolean(current));
  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{profile.businessName}</h1>
        <p className="text-[var(--ink-muted)] mt-1">{profile.category} · {profile.district}</p>
        {profile.verificationPending && (
          <p className="text-sm text-[var(--warn)] mt-2">Basic verification not yet done</p>
        )}
        {profile.about && <p className="mt-4 whitespace-pre-line text-[var(--ink)]">{profile.about}</p>}
        {profile.website && (
          <p className="text-sm mt-2">
            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline text-[var(--accent-ink)]">
              {profile.website}
            </a>
          </p>
        )}

        {current && current.user.id !== profile.userId && (
          <div className="mt-4">
            <MessageButton otherUserId={profile.userId} />
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {profile.contactPersonName ? (
            <p className="text-sm text-[var(--ink)]">
              Contact person: <span className="font-medium">{profile.contactPersonName}</span>
            </p>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">
              <a href="/login" className="underline">Log in</a> to see the contact person&apos;s name.
            </p>
          )}
        </div>

        <div className="section-title text-sm font-semibold text-[var(--ink)] mt-6 mb-2">Open roles</div>
        {profile.openJobs.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">No active jobs right now.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.openJobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="border border-[var(--border)] rounded-[var(--radius)] p-3"
              >
                <h4 className="font-medium text-[var(--ink)] text-sm">{j.title}</h4>
                <p className="text-xs text-[var(--ink-faint)] mt-1">{JOB_TYPE_LABEL[j.jobType]}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
