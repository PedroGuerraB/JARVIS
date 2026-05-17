-- Intelligence tables

create table if not exists ad_library (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('meta', 'instagram', 'tiktok', 'youtube', 'organic')),
  url text,
  copy text,
  visual_description text,
  hook text,
  score numeric(4,2),
  viral_metrics jsonb not null default '{}',
  mined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists ad_library_platform on ad_library(platform, mined_at desc);
create index if not exists ad_library_score on ad_library(score desc nulls last);

create table if not exists competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  platform text not null,
  niche text,
  followers integer,
  posting_freq numeric(5,2),
  top_hooks jsonb not null default '[]',
  content_patterns jsonb not null default '{}',
  last_analyzed timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists hooks_library (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  category text,
  score numeric(4,2) not null default 5.0,
  usage_count integer not null default 0,
  conversion_rate numeric(5,4),
  tier text not null default 'testing' check (tier in ('high-performance', 'testing', 'graveyard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hooks_library_tier_score on hooks_library(tier, score desc);

create table if not exists offers_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_point numeric(10,2),
  positioning text,
  niche text,
  status text not null default 'testing' check (status in ('active', 'testing', 'winner', 'retired')),
  conversion_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists seasonal_calendar (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  type text not null,
  relevance_score numeric(4,2) not null default 5.0,
  historical_performance jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists seasonal_calendar_date on seasonal_calendar(date asc);

-- Seed seasonal events relevant to literacy niche (Brazil)
insert into seasonal_calendar (name, date, type, relevance_score) values
  ('Dia das Mães',           '2026-05-11', 'holiday', 9.5),
  ('Dia dos Pais',           '2026-08-09', 'holiday', 8.0),
  ('Volta às Aulas',         '2026-02-01', 'seasonal', 9.0),
  ('Volta às Aulas Jul',     '2026-07-26', 'seasonal', 7.5),
  ('Black Friday',           '2026-11-27', 'commercial', 7.0),
  ('Natal',                  '2026-12-25', 'holiday', 6.0),
  ('Dia do Livro',           '2026-10-29', 'awareness', 8.5),
  ('Dia da Alfabetização',   '2026-09-08', 'awareness', 9.0)
on conflict do nothing;
