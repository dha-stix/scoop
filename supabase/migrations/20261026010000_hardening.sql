-- Follow-up to the initial schema, from the Supabase security and performance advisors:
--  * move the RLS helper functions out of the exposed API schema
--  * stop exposing trigger functions as RPC endpoints
--  * evaluate auth.uid() / helpers once per query instead of once per row
--  * one SELECT policy on profiles instead of four
--  * index every foreign key

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers live in a private schema (usable by policies, not callable over the API)
-- ─────────────────────────────────────────────────────────────────────────────
create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.my_role() set schema private;
alter function public.my_company_id() set schema private;

-- The guard trigger referenced the helper by name, so point it at the new schema.
create or replace function public.guard_application_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  ignored text[] := array['status', 'history', 'updated_at'];
begin
  if new.job_id <> old.job_id or new.candidate_id <> old.candidate_id or new.company_id <> old.company_id or new.hr_id <> old.hr_id then
    raise exception 'application links cannot be changed';
  end if;

  if auth.uid() = old.candidate_id and private.my_company_id() is distinct from old.company_id then
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

-- Trigger functions run from their triggers only.
revoke execute on function public.handle_new_user(), public.prepare_application(), public.guard_application_update(), public.count_applicants()
  from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Policies, rewritten so auth lookups run once per query
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "owner updates company" on public.companies;
create policy "owner updates company" on public.companies for update
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

drop policy "read own profile" on public.profiles;
drop policy "hr reads colleagues" on public.profiles;
drop policy "hr reads applicants" on public.profiles;
drop policy "candidate reads their hiring contact" on public.profiles;
drop policy "update own profile" on public.profiles;
create policy "read related profiles" on public.profiles for select using (
  id = (select auth.uid())
  or (company_id is not null and company_id = (select private.my_company_id()))
  or exists (select 1 from public.applications a where a.candidate_id = profiles.id and a.company_id = (select private.my_company_id()))
  or exists (select 1 from public.applications a where a.hr_id = profiles.id and a.candidate_id = (select auth.uid()))
);
create policy "update own profile" on public.profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "open jobs are public" on public.jobs;
drop policy "hr creates jobs" on public.jobs;
drop policy "hr updates jobs" on public.jobs;
drop policy "hr deletes jobs" on public.jobs;
create policy "open jobs are public" on public.jobs for select
  using (status = 'open' or company_id = (select private.my_company_id()));
create policy "hr creates jobs" on public.jobs for insert
  with check (company_id = (select private.my_company_id()) and hr_id = (select auth.uid()));
create policy "hr updates jobs" on public.jobs for update
  using (company_id = (select private.my_company_id())) with check (company_id = (select private.my_company_id()));
create policy "hr deletes jobs" on public.jobs for delete
  using (company_id = (select private.my_company_id()));

drop policy "read own or company applications" on public.applications;
drop policy "candidates apply" on public.applications;
drop policy "candidate or company updates" on public.applications;
drop policy "company deletes applications" on public.applications;
create policy "read own or company applications" on public.applications for select
  using (candidate_id = (select auth.uid()) or company_id = (select private.my_company_id()));
create policy "candidates apply" on public.applications for insert
  with check (candidate_id = (select auth.uid()) and (select private.my_role()) = 'candidate');
create policy "candidate or company updates" on public.applications for update
  using (candidate_id = (select auth.uid()) or company_id = (select private.my_company_id()));
create policy "company deletes applications" on public.applications for delete
  using (company_id = (select private.my_company_id()));

drop policy "company manages reviews" on public.application_reviews;
create policy "company manages reviews" on public.application_reviews for all
  using (company_id = (select private.my_company_id()))
  with check (
    company_id = (select private.my_company_id())
    and exists (select 1 from public.applications a where a.id = application_id and a.company_id = (select private.my_company_id()))
  );

drop policy "participants read messages" on public.interview_messages;
drop policy "participants send messages" on public.interview_messages;
create policy "participants read messages" on public.interview_messages for select using (
  exists (
    select 1 from public.applications a
    where a.id = application_id and (a.candidate_id = (select auth.uid()) or a.company_id = (select private.my_company_id()))
  )
);
create policy "participants send messages" on public.interview_messages for insert with check (
  sender_id = (select auth.uid())
  and exists (
    select 1 from public.applications a
    where a.id = application_id and (a.candidate_id = (select auth.uid()) or a.company_id = (select private.my_company_id()))
  )
);

drop policy "candidates upload own cvs" on storage.objects;
drop policy "candidate or hiring company reads cv" on storage.objects;
drop policy "candidate or hiring company deletes cv" on storage.objects;
create policy "candidates upload own cvs" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "candidate or hiring company reads cv" on storage.objects for select to authenticated using (
  bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.applications a where a.cv_path = storage.objects.name and a.company_id = (select private.my_company_id()))
  )
);
create policy "candidate or hiring company deletes cv" on storage.objects for delete to authenticated using (
  bucket_id = 'cvs' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.applications a where a.cv_path = storage.objects.name and a.company_id = (select private.my_company_id()))
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Foreign-key indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists application_reviews_company_idx on public.application_reviews (company_id);
create index if not exists applications_hr_idx on public.applications (hr_id);
create index if not exists applications_cv_path_idx on public.applications (cv_path);
create index if not exists companies_owner_idx on public.companies (owner_id);
create index if not exists interview_messages_sender_idx on public.interview_messages (sender_id);
create index if not exists jobs_hr_idx on public.jobs (hr_id);
create index if not exists profiles_company_idx on public.profiles (company_id);
