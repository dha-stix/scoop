-- Company websites are shown as links on job pages: only allow http(s) URLs
-- (or empty), so a javascript: or data: link can never be stored.
alter table public.companies
  add constraint companies_website_http check (website = '' or website ~* '^https?://[^\s]+$');
