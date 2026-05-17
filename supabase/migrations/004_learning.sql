-- Learning and recommendations tables

create table if not exists feedback_loops (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('creative', 'hook', 'offer', 'campaign', 'sequence', 'agent')),
  entity_id uuid,
  metric text not null,
  value numeric not null,
  context jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists feedback_loops_entity on feedback_loops(entity_type, entity_id, created_at desc);

create table if not exists scoring_models (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  weights jsonb not null default '{}',
  last_trained timestamptz,
  accuracy numeric(5,4),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into scoring_models (type, weights) values
  ('creative', '{"ctr_weight": 0.4, "conversion_weight": 0.4, "engagement_weight": 0.2}'),
  ('hook',     '{"click_through": 0.5, "retention": 0.3, "usage_count": 0.2}'),
  ('offer',    '{"conversion_rate": 0.5, "roas": 0.3, "volume": 0.2}')
on conflict (type) do nothing;

create table if not exists experiments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hypothesis text not null,
  variants jsonb not null default '[]',
  status text not null default 'planning' check (status in ('planning', 'running', 'done', 'cancelled')),
  winner text,
  confidence numeric(5,4),
  result_summary text,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete set null,
  type text not null check (type in ('action', 'alert', 'opportunity', 'warning')),
  content text not null,
  priority smallint not null default 3 check (priority between 1 and 5),
  impact_estimate text,
  acted_on boolean not null default false,
  acted_on_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists recommendations_active on recommendations(priority desc, created_at desc)
  where acted_on = false;
