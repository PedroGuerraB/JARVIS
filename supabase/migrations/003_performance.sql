-- Performance and CRM tables

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'meta',
  external_id text,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'archived')),
  budget_daily numeric(10,2),
  budget_total numeric(10,2),
  spent numeric(10,2) not null default 0,
  metrics jsonb not null default '{}',
  creative_ids uuid[] not null default '{}',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists campaigns_status on campaigns(status, created_at desc);

create table if not exists creatives (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('copy', 'image', 'video', 'carousel', 'reel')),
  copy text,
  headline text,
  hook_id uuid references hooks_library(id) on delete set null,
  score numeric(4,2),
  status text not null default 'draft' check (status in ('draft', 'testing', 'active', 'winner', 'paused', 'archived')),
  ab_group text,
  performance jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists creatives_status_score on creatives(status, score desc nulls last);

create table if not exists content_calendar (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  content_type text not null,
  content text not null,
  media_url text,
  scheduled_at timestamptz not null,
  published_at timestamptz,
  status text not null default 'scheduled' check (status in ('draft', 'scheduled', 'published', 'failed')),
  engagement jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists content_calendar_scheduled on content_calendar(scheduled_at asc) where status = 'scheduled';

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  email text,
  source text,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'offer_sent', 'converted', 'lost')),
  score smallint not null default 0 check (score between 0 and 100),
  whatsapp_opt_in boolean not null default false,
  campaign_id uuid references campaigns(id) on delete set null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_stage on leads(stage, score desc);
create index if not exists leads_phone on leads(phone) where phone is not null;

create table if not exists conversions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  offer_id uuid references offers_library(id) on delete set null,
  campaign_id uuid references campaigns(id) on delete set null,
  value numeric(10,2) not null,
  funnel_step text,
  created_at timestamptz not null default now()
);

create index if not exists conversions_created on conversions(created_at desc);
