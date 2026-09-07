"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGiverProfileAction } from "@/app/actions/giver";
import { JOB_CATEGORIES } from "@/db/seed-data/districts";

type District = { id: number; district: string; isRemote: boolean };

export function EditGiverForm({
  districts,
  profile,
}: {
  districts: District[];
  profile: {
    businessName: string;
    contactPersonName: string;
    category: string;
    locationId: number;
    about: string | null;
    website: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isKnownCategory = (JOB_CATEGORIES as readonly string[]).includes(profile.category);

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [contactPersonName, setContactPersonName] = useState(profile.contactPersonName);
  const [category, setCategory] = useState(isKnownCategory ? profile.category : "__other__");
  const [categoryOther, setCategoryOther] = useState(isKnownCategory ? "" : profile.category);
  const [locationId, setLocationId] = useState(profile.locationId);
  const [about, setAbout] = useState(profile.about ?? "");
  const [website, setWebsite] = useState(profile.website ?? "");

  const realDistricts = districts.filter((d) => !d.isRemote);

  function submit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateGiverProfileAction({
        businessName,
        contactPersonName,
        category: category === "__other__" ? categoryOther : category,
        categoryOther: category === "__other__" ? categoryOther : undefined,
        locationId,
        about: about || undefined,
        website: website || undefined,
      });
      if ("error" in result) {
        setError(result.error);
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <Field label="Business name">
        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Contact person">
        <input value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Category">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
          <option value="__other__">Other</option>
        </select>
      </Field>
      {category === "__other__" && (
        <input
          placeholder="Specify category"
          value={categoryOther}
          onChange={(e) => setCategoryOther(e.target.value)}
          className={inputCls}
        />
      )}
      <Field label="District">
        <select value={locationId} onChange={(e) => setLocationId(Number(e.target.value))} className={inputCls}>
          {realDistricts.map((d) => (
            <option key={d.id} value={d.id}>{d.district}</option>
          ))}
        </select>
      </Field>
      <Field label="About">
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} className={inputCls} rows={3} />
      </Field>
      <Field label="Website / Social (optional)">
        <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} />
      </Field>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {saved && <p className="text-sm text-[var(--ok)]">Saved.</p>}
      <button
        type="button"
        onClick={submit}
        disabled={isPending || !businessName || !contactPersonName}
        className="w-full bg-[var(--accent)] text-white rounded-md py-2 font-medium disabled:opacity-60"
      >
        Save changes
      </button>
    </div>
  );
}

const inputCls = "w-full border border-[var(--border)] rounded-md px-3 py-2 bg-[var(--surface)] text-[var(--ink)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--ink)] mb-1">{label}</label>
      {children}
    </div>
  );
}
