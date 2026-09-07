import { notFound } from "next/navigation";
import { getSeekerPublicProfile } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/dal";
import { MessageButton } from "@/components/MessageButton";

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  wfh: "Work From Home",
};

export default async function SeekerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  const profile = await getSeekerPublicProfile(Number(id), Boolean(current));
  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] p-5"
        style={{ boxShadow: "var(--shadow)" }}
      >
        <h1 className="text-xl font-bold text-[var(--ink)]">{profile.name}</h1>
        <p className="text-[var(--ink-muted)] mt-1">{profile.qualification ?? "—"}</p>
        <p className="text-sm text-[var(--ink-faint)] mt-1">
          {profile.district} · {JOB_TYPE_LABEL[profile.jobType]}
          {profile.expectedSalary ? ` · ${profile.expectedSalary}` : ""}
        </p>
        {profile.verificationPending && (
          <p className="text-sm text-[var(--warn)] mt-2">Basic verification not yet done</p>
        )}

        {profile.experience && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">Experience</div>
            <p className="text-[var(--ink)] mt-1 whitespace-pre-line">{profile.experience}</p>
          </>
        )}

        {profile.skills.length > 0 && (
          <>
            <div className="text-sm font-semibold text-[var(--ink)] mt-4">Skills</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {profile.skills.map((s) => (
                <span key={s} className="text-xs bg-[var(--accent-soft)] text-[var(--accent-ink)] px-2 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </>
        )}

        {current && current.user.id !== profile.userId && (
          <div className="mt-4">
            <MessageButton otherUserId={profile.userId} />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          {profile.mobile ? (
            <p className="text-sm text-[var(--ink)]">
              Contact: <span className="font-medium">{profile.mobile}</span>
            </p>
          ) : current ? (
            <p className="text-sm text-[var(--ink-faint)]">
              This person has chosen to share contact details only after applying to a job, or not at all.
            </p>
          ) : (
            <p className="text-sm text-[var(--ink-faint)]">
              <a href="/login" className="underline">Log in</a> to see more, and to contact this person where they allow it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
