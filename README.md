# Scoop — Hire faster. Interview live.

A job application and interview platform. Companies post jobs, review CVs, shortlist, interview candidates in a built-in video room, and send offers. Candidates apply with a CV and follow every step on a live tracker.

**Stack:** Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · Firebase (Auth, Firestore, Storage) · Stream Video · EmailJS · Motion

Built by: [David Asaolu](https://www.linkedin.com/in/david-asaolu234/)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev
```

Open http://localhost:3000. Public pages work straight away. Pages with data show a "Connect Firebase" notice until the Firebase keys are set.

## Wiring up services

### Firebase
1. Create a project at https://console.firebase.google.com and add a **Web app**. Copy its config into the `NEXT_PUBLIC_FIREBASE_*` variables.
2. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
3. Create a **Firestore** database and a **Storage** bucket.
4. Deploy the rules and indexes (you'll need the Firebase CLI):
   ```bash
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
5. **Project settings → Service accounts → Generate new private key.** Put the values in the `FIREBASE_ADMIN_*` variables. These are used only on the server, to verify users before issuing video tokens.

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

## Application lifecycle

`applied → reviewed → shortlisted → interview → offer → hired`, with `rejected`, `archived` and `declined` as exits. Each change is added to the application's `history`, which drives the candidate's tracker.

## Project structure

```
app/                     Routes (pages only compose components)
  api/stream-token/      Issues Stream tokens after verifying Firebase auth + membership
  auth/login, register   Sign in / sign up
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
  auth/                  AuthProvider, RequireAuth, login/register forms
  jobs/                  Job board, detail, apply form, CV drop zone
  dashboard/hr|candidate HR workspace and candidate dashboard
  interview/             Video room, chat, HR scorecard
  applications/          Progress timeline shared by homepage + tracker
lib/
  firebase.ts            Firebase client setup
  firebase-actions.ts    Every Firestore/Auth/Storage operation
  firebase-admin.ts      Server-side Admin SDK
  email.ts               EmailJS helpers
  types.ts, constants.ts, format.ts, pipeline.ts, use-async.ts
images/                  Photos (Unsplash license), imported via images/index.ts
styles/                  globals.css (design tokens), stream-theme.css
firestore.rules, storage.rules, firestore.indexes.json
```

## Notes
- Photos in `images/` are from [Unsplash](https://unsplash.com/license) and are only for marketing and demo visuals.
- Interview chat is stored in `applications/{id}/messages`, so it stays with the interview record.
