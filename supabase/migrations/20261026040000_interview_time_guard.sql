-- Interviews can only be scheduled (or rescheduled) for now or later, by the
-- database clock. Five minutes of grace covers slightly-off device clocks and
-- the time it takes to press "Send invite".
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
    if (new.interview->>'scheduledAt') is null
       or (new.interview->>'scheduledAt')::timestamptz < now() - interval '5 minutes' then
      raise exception 'Interviews can only be scheduled for now or a future time';
    end if;
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
