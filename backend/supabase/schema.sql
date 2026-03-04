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

-- Performance/security hardening for production usage.
create unique index if not exists idx_users_email_lower_unique on users (lower(email));
create unique index if not exists idx_pages_slug_lower_unique on pages (lower(slug));
create index if not exists idx_users_role_active on users (role, is_active);
create index if not exists idx_courses_university_status on courses (university_id, status);
create index if not exists idx_semesters_course_status on semesters (course_id, status);
create index if not exists idx_papers_sem_course_year on papers (sem_id, course_id, year);
create index if not exists idx_universities_status_type on universities (status, type);
create index if not exists idx_pages_published on pages (published);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_set_updated_at on users;
create trigger trg_users_set_updated_at
before update on users
for each row
execute function set_updated_at();

drop trigger if exists trg_universities_set_updated_at on universities;
create trigger trg_universities_set_updated_at
before update on universities
for each row
execute function set_updated_at();

drop trigger if exists trg_courses_set_updated_at on courses;
create trigger trg_courses_set_updated_at
before update on courses
for each row
execute function set_updated_at();

drop trigger if exists trg_semesters_set_updated_at on semesters;
create trigger trg_semesters_set_updated_at
before update on semesters
for each row
execute function set_updated_at();

drop trigger if exists trg_papers_set_updated_at on papers;
create trigger trg_papers_set_updated_at
before update on papers
for each row
execute function set_updated_at();

drop trigger if exists trg_settings_set_updated_at on settings;
create trigger trg_settings_set_updated_at
before update on settings
for each row
execute function set_updated_at();

drop trigger if exists trg_ads_settings_set_updated_at on ads_settings;
create trigger trg_ads_settings_set_updated_at
before update on ads_settings
for each row
execute function set_updated_at();

drop trigger if exists trg_pages_set_updated_at on pages;
create trigger trg_pages_set_updated_at
before update on pages
for each row
execute function set_updated_at();

drop trigger if exists trg_ratings_set_updated_at on ratings;
create trigger trg_ratings_set_updated_at
before update on ratings
for each row
execute function set_updated_at();

do $$
declare
  tbl text;
  policy_name text;
  table_names text[] := array[
    'users',
    'universities',
    'courses',
    'semesters',
    'papers',
    'settings',
    'ads_settings',
    'pages',
    'ratings'
  ];
begin
  foreach tbl in array table_names loop
    execute format('alter table %I enable row level security', tbl);
    execute format('revoke all on table %I from anon, authenticated', tbl);

    policy_name := format('%s_service_role_only', tbl);
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = tbl
        and policyname = policy_name
    ) then
      execute format(
        'create policy %I on %I for all using (current_setting(''request.jwt.claim.role'', true) = ''service_role'') with check (current_setting(''request.jwt.claim.role'', true) = ''service_role'')',
        policy_name,
        tbl
      );
    end if;
  end loop;
end $$;
