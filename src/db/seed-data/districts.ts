// Real districts of Chhattisgarh (the platform's home state — PSCP is based
// in Bilaspur, CG). Section 4.6 of the master build prompt: District is the
// single, atomic unit of location — no sub-district areas. New districts
// (from other states) are data an Admin adds later, never a schema change —
// this seed list is intentionally just CG to start.
export const CHHATTISGARH_DISTRICTS = [
  // "Bhilai" is not an official Chhattisgarh district (it's a twin-city
  // within Durg district) — added here as its own selectable location
  // anyway, at the user's explicit request, since Bhilai has enough of its
  // own identity/community separate from Durg for this platform's purposes.
  // It still behaves exactly like any other row in `locations` (no special
  // handling anywhere) — just administratively imprecise, which is fine
  // here since this app never needs to be geographically authoritative.
  "Bhilai",
  "Balod",
  "Baloda Bazar",
  "Balrampur",
  "Bastar",
  "Bemetara",
  "Bijapur",
  "Bilaspur",
  "Dantewada",
  "Dhamtari",
  "Durg",
  "Gariaband",
  "Gaurela-Pendra-Marwahi",
  "Janjgir-Champa",
  "Jashpur",
  "Kabirdham",
  "Kanker",
  "Khairagarh-Chhuikhadan-Gandai",
  "Kondagaon",
  "Korba",
  "Koriya",
  "Mahasamund",
  "Manendragarh-Chirmiri-Bharatpur",
  "Mohla-Manpur-Ambagarh Chowki",
  "Mungeli",
  "Narayanpur",
  "Raigarh",
  "Raipur",
  "Rajnandgaon",
  "Sakti",
  "Sarangarh-Bilaigarh",
  "Sukma",
  "Surajpur",
  "Surguja",
];

// Districts currently offered to end users (registration, job posting,
// search filters — see getAllDistricts() in src/lib/queries/lookups.ts).
// All 32+ real districts above stay seeded in the database either way — an
// Admin/approver's own screens still see the full list — this allowlist
// only controls what ordinary visitors are offered while the platform is
// still only really active in these districts. To open up another district
// later, just add its name here; no schema or DB change needed.
export const ACTIVE_DISTRICTS = ["Bilaspur", "Raipur", "Durg", "Bhilai"];

export const QUALIFICATIONS = [
  "Below 10th",
  "10th Pass",
  "12th Pass",
  "ITI",
  "Diploma",
  "Graduate",
  "Post Graduate",
  "Professional Degree (Engineering/Medical/Law)",
];

export const SKILLS = [
  "Computer Basics",
  "MS Office / Typing",
  "Tally / Accounting",
  "Sales & Marketing",
  "Customer Service",
  "Driving (LMV)",
  "Driving (HMV)",
  "Cooking",
  "Tailoring",
  "Electrician",
  "Plumbing",
  "Carpentry",
  "Delivery / Logistics",
  "Retail / Shop Management",
  "Data Entry",
  "Teaching / Tutoring",
  "Graphic Design",
  "Social Media Handling",
];

export const JOB_CATEGORIES = [
  "Retail / Shop",
  "Restaurant / Food",
  "Office / Admin",
  "Manufacturing / Factory",
  "Construction",
  "Transport / Delivery",
  "Education / Coaching",
  "Healthcare",
  "IT / Computer",
  "Other",
];
