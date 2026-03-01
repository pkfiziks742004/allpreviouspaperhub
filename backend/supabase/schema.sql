-- Run this in Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password text not null,
  role text not null default 'super_admin',
  gender text not null default '',
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid null,
  current_session_id text not null default '',
  current_session_expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  type text not null default 'University',
  logo_url text not null default '',
  coming_soon boolean not null default false,
  coming_soon_text text not null default 'Coming soon',
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'University',
  university_id uuid null references universities(id) on delete set null,
  button_label text not null default '',
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_courses_name_university_unique
  on courses (lower(name), coalesce(university_id::text, ''));

create table if not exists semesters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  sem_id uuid not null references semesters(id) on delete cascade,
  title text not null,
  year integer null,
  file text not null,
  downloads integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ads_settings (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default false,
  head_script text not null default '',
  body_script text not null default '',
  ads_txt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content_html text not null default '',
  banner_url text not null default '',
  bg_color text not null default '#ffffff',
  seo_title text not null default '',
  seo_description text not null default '',
  seo_keywords text not null default '',
  canonical_url text not null default '',
  extra jsonb not null default '{}'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
