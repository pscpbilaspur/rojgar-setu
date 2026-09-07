# Deploying Rojgar Setu (Vercel + Neon)

This app is a standard Next.js + PostgreSQL (Drizzle ORM) project, so it
deploys cleanly to Vercel with a hosted Postgres database. These are the
steps, in order.

## 1. Create the database (Neon)

1. Sign up at https://neon.tech (free tier is enough to start).
2. Create a new project. Neon gives you a connection string that looks like:
   `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`
3. Keep that string handy — it's your production `DATABASE_URL`.

## 2. Push the schema

From this project, with `DATABASE_URL` in `.env` temporarily pointed at the
Neon string above:

```
npm run db:push
```

This creates every table (via Drizzle Kit — there are no migration files in
this project, `db:push` is the source of truth). Optionally seed it:

```
npm run db:seed         # creates the Central Admin account
npm run db:seed-demo    # adds demo seekers/givers/jobs for testing (optional)
```

## 3. Push the code to GitHub

Vercel deploys from a Git repository.

```
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

(If you don't have a GitHub repo yet, create an empty one first at
github.com/new — don't initialize it with a README, so the push above
doesn't conflict.)

## 4. Import into Vercel

1. Sign up / log in at https://vercel.com (sign in with GitHub is easiest).
2. "Add New… → Project" → import the GitHub repo from step 3.
3. Vercel auto-detects Next.js — no build settings need changing.
4. Before clicking Deploy, add Environment Variables (Project Settings →
   Environment Variables, or the form shown during import):
   - `DATABASE_URL` — the Neon connection string from step 1
   - `SESSION_SECRET` — a fresh random value (**do not reuse** the dev value
     in `.env.example`); generate one with:
     `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
   - `SMS_PROVIDER` / `SMS_API_KEY` — leave blank for now if no SMS provider
     is set up yet (OTPs will log to Vercel's function logs instead of
     sending — fine for an initial soft launch to testers, not for the
     public)
5. Click Deploy. First deploy takes 1-3 minutes.

## 5. After the first deploy

- Log into `/admin/login` with the seeded `admin` account and **change the
  password immediately** (the seeded password is public in this repo's
  history — do not leave it as-is).
- If a custom domain exists (e.g. a `.in` domain for the Panchayat),
  add it under Project Settings → Domains.
- Once a real SMS provider is chosen, set `SMS_PROVIDER`/`SMS_API_KEY` in
  Vercel's environment variables and redeploy — no code change needed beyond
  implementing that provider's call in `src/lib/sms.ts`.

## Notes

- Every push to the connected GitHub branch auto-deploys — there's no manual
  deploy step after the first one.
- Vercel's free (Hobby) tier and Neon's free tier are both enough for a
  community platform at this scale; revisit if usage grows significantly.
