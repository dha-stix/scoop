-- Scoop database: tables, row-level security, triggers, realtime and CV storage.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

-- ─────────────────────────────────────────────────────────────────────────────
-- Types
-- ─────────────────────────────────────────────────────────────────────────────
create type public.user_role as enum ('hr', 'candidate');
create type public.job_status as enum ('open', 'closed', 'draft');
create type public.application_status as enum (
  'applied', 'reviewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'declined', 'archived'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  website     text not null default '',
  size        text not null default '',
  description text not null default '',
  logo_url    text not null default '',
  owner_id    uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null,
  name         text not null default '',
  email        text not null,
  photo_url    text not null default '',
  company_id   uuid references public.companies (id) on delete set null,
  job_title    text not null default '',
  desired_role text not null default '',
  location     text not null default '',
  phone        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.jobs (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies (id) on delete cascade,
  hr_id                uuid not null references public.profiles (id) on delete cascade,
  company_name         text not null,
  title                text not null,
  department           text not null default '',
  location             text not null default '',
  work_mode            text not null default '',
  employment_type      text not null default '',
  experience_level     text not null default '',
  currency             text not null default 'USD',
  salary_min           integer,
  salary_max           integer,
  about                text not null default '',
  responsibilities     text[] not null default '{}',
  requirements         text[] not null default '{}',
  skills               text[] not null default '{}',
  benefits             text[] not null default '{}',
  require_cover_letter boolean not null default false,
  ask_portfolio        boolean not null default false,
  questions            jsonb not null default '[]',
  deadline             date,
  openings             integer not null default 1 check (openings > 0),
  status               public.job_status not null default 'open',
  applicant_count      integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (salary_min is null or salary_max is null or salary_min <= salary_max)
);
create index jobs_status_created_idx on public.jobs (status, created_at desc);
create index jobs_company_created_idx on public.jobs (company_id, created_at desc);

-- Job/company fields are copied from the job by a trigger, never trusted from the client.
create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs (id) on delete cascade,
  candidate_id uuid not null references public.profiles (id) on delete cascade,
  hr_id        uuid not null references public.profiles (id),
  company_id   uuid not null references public.companies (id) on delete cascade,
  company_name text not null default '',
  job_title    text not null default '',
  job_location text not null default '',
  work_mode    text not null default '',
  candidate    jsonb not null,
  cv_path      text not null,
  cv_name      text not null,
  cover_letter text not null default '',
  answers      jsonb not null default '[]',
  status       public.application_status not null default 'applied',
  history      jsonb not null default '[]',
  interview    jsonb,
  offer        jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create index applications_job_idx on public.applications (job_id, created_at desc);
create index applications_candidate_idx on public.applications (candidate_id, created_at desc);
create index applications_company_idx on public.applications (company_id, created_at desc);

-- HR-only notes, ratings and scorecards, kept apart so candidates can never read them.
create table public.application_reviews (
  application_id uuid primary key references public.applications (id) on delete cascade,
  company_id     uuid not null references public.companies (id) on delete cascade,
  rating         integer not null default 0 check (rating between 0 and 5),
  notes          text not null default '',
  scorecard      jsonb,
  updated_at     timestamptz not null default now()
);

create table public.interview_messages (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  sender_id      uuid not null references public.profiles (id) on delete cascade,
  sender_name    text not null default '',
  body           text not null check (char_length(body) between 1 and 2000),
  created_at     timestamptz not null default now()
);
create index interview_messages_app_idx on public.interview_messages (application_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers (security definer so RLS policies can look up the caller cheaply)
-- ─────────────────────────────────────────────────────────────────────────────
create function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.my_company_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles where id = auth.uid() and role = 'hr'
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger companies_touch before update on public.companies for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger jobs_touch before update on public.jobs for each row execute function public.touch_updated_at();
create trigger applications_touch before update on public.applications for each row execute function public.touch_updated_at();
create trigger reviews_touch before update on public.application_reviews for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- New users: create the profile (and company for HR) from sign-up metadata.
-- Google sign-ups carry no role, so they always become candidates.
-- ─────────────────────────────────────────────────────────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  new_role public.user_role := case when meta->>'role' = 'hr' then 'hr'::public.user_role else 'candidate'::public.user_role end;
  new_company uuid;
begin
  if new_role = 'hr' then
    insert into public.companies (name, website, size, owner_id)
    values (coalesce(nullif(meta->>'company_name', ''), 'My company'), coalesce(meta->>'website', ''), coalesce(meta->>'company_size', ''), new.id)
    returning id into new_company;
  end if;

  insert into public.profiles (id, role, name, email, photo_url, company_id, job_title, desired_role, location)
  values (
    new.id,
    new_role,
    coalesce(nullif(meta->>'name', ''), meta->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(meta->>'avatar_url', meta->>'picture', ''),
    new_company,
    coalesce(meta->>'job_title', ''),
    coalesce(meta->>'desired_role', ''),
    coalesce(meta->>'location', '')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Role and company can never be changed by the user.
create function public.guard_profile_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.role is distinct from old.role or new.company_id is distinct from old.company_id or new.id is distinct from old.id then
    raise exception 'role and company cannot be changed';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- ─────────────────────────────────────────────────────────────────────────────
-- Applications: server-side integrity
-- ─────────────────────────────────────────────────────────────────────────────
create function public.prepare_application() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  job public.jobs%rowtype;
begin
  select * into job from public.jobs where id = new.job_id;
  if job.id is null or job.status <> 'open' then
    raise exception 'This job is not accepting applications';
  end if;
  new.hr_id        := job.hr_id;
  new.company_id   := job.company_id;
  new.company_name := job.company_name;
  new.job_title    := job.title;
  new.job_location := job.location;
  new.work_mode    := job.work_mode;
  new.status       := 'applied';
  new.history      := jsonb_build_array(jsonb_build_object('status', 'applied', 'at', now()));
  new.interview    := null;
  new.offer        := null;
  return new;
end $$;

create trigger applications_prepare before insert on public.applications for each row execute function public.prepare_application();

-- Candidates may only answer an offer; everyone keeps job/company links fixed;
-- every status change is appended to history automatically.
create function public.guard_application_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ignored text[] := array['status', 'history', 'updated_at'];
begin
  if new.job_id <> old.job_id or new.candidate_id <> old.candidate_id or new.company_id <> old.company_id or new.hr_id <> old.hr_id then
    raise exception 'application links cannot be changed';
  end if;

  if auth.uid() = old.candidate_id and public.my_company_id() is distinct from old.company_id then
    if old.status <> 'offer' or new.status not in ('hired', 'declined') or (to_jsonb(new) - ignored) <> (to_jsonb(old) - ignored) then
      raise exception 'Candidates can only accept or decline an offer';
    end if;
  end if;

  if new.status is distinct from old.status then
    new.history := old.history || jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
  else
    new.history := old.history;
  end if;
  return new;
end $$;

create trigger applications_guard before update on public.applications for each row execute function public.guard_application_update();

-- Keep jobs.applicant_count in step with applications.
create function public.count_applicants() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.jobs set applicant_count = applicant_count + 1 where id = new.job_id;
  elsif tg_op = 'DELETE' then
    update public.jobs set applicant_count = greatest(applicant_count - 1, 0) where id = old.job_id;
  end if;
  return null;
end $$;

create trigger applications_count after insert or delete on public.applications for each row execute function public.count_applicants();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_reviews enable row level security;
alter table public.interview_messages enable row level security;

-- Companies are shown on job posts; only the owner edits. (Created by the sign-up trigger.)
create policy "companies are public" on public.companies for select using (true);
create policy "owner updates company" on public.companies for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Profiles: yourself, your colleagues, and the people on your applications.
create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "hr reads colleagues" on public.profiles for select using (company_id is not null and company_id = public.my_company_id());
create policy "hr reads applicants" on public.profiles for select using (
  exists (select 1 from public.applications a where a.candidate_id = profiles.id and a.company_id = public.my_company_id())
);
create policy "candidate reads their hiring contact" on public.profiles for select using (
  exists (select 1 from public.applications a where a.hr_id = profiles.id and a.candidate_id = auth.uid())
);
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- Jobs: open ones are public; HR manages their company's.
create policy "open jobs are public" on public.jobs for select using (status = 'open' or company_id = public.my_company_id());
create policy "hr creates jobs" on public.jobs for insert with check (company_id = public.my_company_id() and hr_id = auth.uid());
create policy "hr updates jobs" on public.jobs for update using (company_id = public.my_company_id()) with check (company_id = public.my_company_id());
create policy "hr deletes jobs" on public.jobs for delete using (company_id = public.my_company_id());

-- Applications: the candidate and the hiring company.
create policy "read own or company applications" on public.applications for select
  using (candidate_id = auth.uid() or company_id = public.my_company_id());
create policy "candidates apply" on public.applications for insert
  with check (candidate_id = auth.uid() and public.my_role() = 'candidate');
create policy "candidate or company updates" on public.applications for update
  using (candidate_id = auth.uid() or company_id = public.my_company_id());
create policy "company deletes applications" on public.applications for delete using (company_id = public.my_company_id());

-- Reviews: hiring company only.
create policy "company manages reviews" on public.application_reviews for all
  using (company_id = public.my_company_id())
  with check (
    company_id = public.my_company_id()
    and exists (select 1 from public.applications a where a.id = application_id and a.company_id = public.my_company_id())
  );

-- Interview chat: both sides of the application.
create policy "participants read messages" on public.interview_messages for select using (
  exists (select 1 from public.applications a where a.id = application_id and (a.candidate_id = auth.uid() or a.company_id = public.my_company_id()))
);
create policy "participants send messages" on public.interview_messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.applications a where a.id = application_id and (a.candidate_id = auth.uid() or a.company_id = public.my_company_id()))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime (respects the RLS policies above)
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.applications, public.interview_messages;

-- ─────────────────────────────────────────────────────────────────────────────
-- CV storage: private bucket, files at cvs/{candidate_uid}/{job_id}/{file}
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cvs', 'cvs', false, 5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do nothing;

create policy "candidates upload own cvs" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "candidate or hiring company reads cv" on storage.objects for select to authenticated using (
  bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.applications a where a.cv_path = storage.objects.name and a.company_id = public.my_company_id())
  )
);

create policy "candidate or hiring company deletes cv" on storage.objects for delete to authenticated using (
  bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.applications a where a.cv_path = storage.objects.name and a.company_id = public.my_company_id())
  )
);
