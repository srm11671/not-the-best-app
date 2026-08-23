-- Run this in the Supabase SQL Editor.

alter table visits
  add column if not exists baldy_rating numeric(3,1),
  add column if not exists baldy_review_url text;
