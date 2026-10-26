-- Application deadlines must be today or later when they are set or changed.
-- One day of leeway because the database clock is UTC while HR users may be
-- in time zones still on "yesterday". Unchanged deadlines on older jobs that
-- have already passed don't block other edits.
create function public.guard_job_deadline() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.deadline is not null
     and (tg_op = 'INSERT' or new.deadline is distinct from old.deadline)
     and new.deadline < current_date - 1 then
    raise exception 'The application deadline must be today or later';
  end if;
  return new;
end $$;

revoke execute on function public.guard_job_deadline() from public, anon, authenticated;

create trigger jobs_deadline_guard before insert or update on public.jobs
  for each row execute function public.guard_job_deadline();
