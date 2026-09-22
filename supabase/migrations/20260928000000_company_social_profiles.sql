-- Add optional company social profile URLs used by the employer profile and public company pages.
-- Existing company rows are preserved and the columns remain nullable.

alter table public.companies
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text,
  add column if not exists x_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text;
