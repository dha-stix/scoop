-- Every stored time comes from the database clock, never the browser.
-- created_at / updated_at / history were already server-side; this stamps the
-- offer's sentAt and the interview invite's invitedAt too, overwriting any
-- value a client might send.
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

  if new.offer is not null and new.offer is distinct from old.offer then
    new.offer := new.offer || jsonb_build_object('sentAt', now());
  end if;
  if new.interview is not null and new.interview is distinct from old.interview then
    new.interview := new.interview || jsonb_build_object('invitedAt', now());
  end if;

  if new.status is distinct from old.status then
    new.history := old.history || jsonb_build_array(jsonb_build_object('status', new.status, 'at', now()));
  else
    new.history := old.history;
  end if;
  return new;
end $$;

revoke execute on function public.guard_application_update() from public, anon, authenticated;
