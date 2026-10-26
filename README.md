# Scoop — Hire faster. Interview live.

A job application and interview platform. Companies post jobs, review CVs, shortlist, interview candidates in a built-in video room, and send offers. Candidates apply with a CV and follow every step on a live tracker.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage, Realtime) · Stream Video · EmailJS · Motion

Built by: [David Asaolu](https://www.linkedin.com/in/david-asaolu234/)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev
```

Open http://localhost:3000. Public pages work straight away. Pages with data show a "Connect Supabase" notice until the Supabase keys are set.

## Wiring up services

### Supabase
1. Create a project at https://supabase.com/dashboard. From **Project Settings → API**, copy the **Project URL** into `NEXT_PUBLIC_SUPABASE_URL` and the **anon public** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`. No service-role key is needed: every request runs as the signed-in user, so row-level security applies everywhere.
2. Create the database: open **SQL Editor**, paste `supabase/migrations/20261026000000_init.sql` and run it. With the Supabase CLI you can run `supabase link` and then `supabase db push` instead. This creates the tables, security policies, triggers, Realtime publication and the private `cvs` storage bucket.
3. **Authentication → URL Configuration:** set **Site URL** to your app's URL, and add `http://localhost:3000/**` (plus your production URL with `/**`) to **Redirect URLs**.
4. **Authentication → Providers:**
   - **Email** is on by default. Keep **Confirm email** on for production. Sign-up then shows a "check your inbox" message, and the link brings users back through `/auth/callback`.
   - **Google:** create an OAuth client in Google Cloud Console, then paste its client ID and secret here. In Google, add `https://<your-project>.supabase.co/auth/v1/callback` as an authorised redirect URI.

### Stream Video
Create an app at https://dashboard.getstream.io. Put the API key in `NEXT_PUBLIC_STREAM_API_KEY` and the secret in `STREAM_API_SECRET`. Calls use the `default` call type, and the HR user creates each call.

### EmailJS
Create an email service and four templates at https://dashboard.emailjs.com (application received, interview invite, rejection, offer). Every template receives these variables:

| Variable | Meaning |
| --- | --- |
| `{{to_name}}`, `{{to_email}}` | Candidate |
| `{{company_name}}`, `{{job_title}}` | The role |
| `{{message}}` | The email body, written by Scoop |
| `{{action_url}}` | Link back into Scoop |
| `{{from_name}}` | The HR person sending it |

Set the template's **To email** to `{{to_email}}`. If EmailJS isn't configured, actions still work and the app says no email was sent.

## Roles

| | Company HR | Candidate |
| --- | --- | --- |
| Sign in | Email + password only | Google or email + password |
| Can | Post/edit/close jobs, review CVs, rate, shortlist, schedule interviews, send offers, reject (with email), archive, delete | Apply with CV + optional cover letter, track progress live, join interviews, accept/decline offers |

Google sign-ups always become candidates (the sign-up trigger only creates HR accounts from the company sign-up form), and an HR account that signs in with Google is signed straight back out.

## Security model

- **Row-level security** on every table. Candidates see only their own applications. HR sees only their own company's jobs and applicants.
- **Triggers** keep the data honest:
  - Job and company fields on an application are copied from the job, never taken from the browser.
  - Every status change is added to `history` automatically.
  - Candidates can only accept or decline an offer.
  - Nobody can change their own role or company.
- **HR notes, ratings and scorecards** live in `application_reviews`, which candidates can't read.
- **CVs** are in a private bucket and opened through short-lived signed URLs.
- **Video tokens:** `/api/stream-token` checks the caller's Supabase session and asks the database as that user, so only people on the application can join its call.

## Application lifecycle

`applied → reviewed → shortlisted → interview → offer → hired`, with `rejected`, `archived` and `declined` as exits.

## Project structure

```
app/                     Routes (pages only compose components)
  api/stream-token/      Issues Stream tokens after checking the Supabase session + membership
  auth/login, register   Sign in / sign up
  auth/callback          Finishes Google sign-in and email confirmation
  auth/reset             Set a new password from the reset email
  jobs/, jobs/[id], jobs/[id]/apply
  dashboard/             HR or candidate home (role-aware)
    jobs/new, jobs/[id]/edit, jobs/[id]/applicants
    applications/[id]    Candidate's live tracker
    profile/
  interview/[id]         Stream video room
components/
  ui/                    Buttons, fields, badges, modals, toast…
  layout/                Navbar, Footer, DashboardShell
  home/                  Homepage sections (incl. the animated journey SVG)
  auth/                  AuthProvider, RequireAuth, login/register/reset forms
  jobs/                  Job board, detail, apply form, CV drop zone
  dashboard/hr|candidate HR workspace and candidate dashboard
  interview/             Video room, chat, HR scorecard
  applications/          Progress timeline and signed CV links
lib/
  supabase.ts            Supabase client setup
  supabase-actions.ts    Every database, auth, storage and realtime operation
  email.ts               EmailJS helpers
  types.ts, constants.ts, format.ts, pipeline.ts, use-async.ts
supabase/migrations/     Database schema, policies, triggers and storage
images/                  Photos (Unsplash license), imported via images/index.ts
styles/                  globals.css (design tokens), stream-theme.css
```

## Notes
- Photos in `images/` are from [Unsplash](https://unsplash.com/license) and are only for marketing and demo visuals.
- Interview chat is stored in `interview_messages`, linked to its application.
