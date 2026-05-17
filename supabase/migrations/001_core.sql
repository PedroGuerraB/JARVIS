-- Core infrastructure tables

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  status text not null default 'offline' check (status in ('idle', 'running', 'error', 'offline')),
  capabilities jsonb not null default '[]',
  config jsonb not null default '{}',
  last_heartbeat timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done', 'failed', 'cancelled')),
  priority smallint not null default 3 check (priority between 1 and 5),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  error text
);

create index if not exists agent_tasks_status_priority on agent_tasks(status, priority desc, created_at asc);
create index if not exists agent_tasks_agent_id on agent_tasks(agent_id);

create table if not exists agent_events (
  id uuid primary key default gen_random_uuid(),
  source_agent text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists agent_events_type on agent_events(event_type, created_at desc);
create index if not exists agent_events_unprocessed on agent_events(processed_at) where processed_at is null;

create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  from_agent text not null,
  to_agent text not null,
  content jsonb not null default '{}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete set null,
  task_id uuid references agent_tasks(id) on delete set null,
  tokens_input integer not null default 0,
  tokens_output integer not null default 0,
  duration_ms integer not null default 0,
  model text not null,
  success boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists agent_logs_agent on agent_logs(agent_id, created_at desc);

create table if not exists shared_memory (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  value jsonb not null,
  scope text not null default 'global',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(key, scope)
);

create index if not exists shared_memory_key_scope on shared_memory(key, scope);

-- Insert default agent registry
insert into agents (name, capabilities) values
  ('orchestrator', '["route_tasks", "dispatch", "coordinate"]'),
  ('scout',        '["mine_ads", "organic_mining"]'),
  ('creative',     '["generate_copies", "headline_variations", "score_creatives"]'),
  ('whatsapp',     '["dispatch_lead", "group_automation", "sequences"]'),
  ('analyst',      '["competitor_profiling", "viral_patterns"]'),
  ('traffic',      '["meta_ads", "budget_optimization"]'),
  ('bi',           '["reports", "kpis", "dashboards"]'),
  ('insight',      '["recommendations", "alerts", "opportunities"]'),
  ('learning',     '["update_scores", "obsidian_sync", "feedback_loops"]')
on conflict (name) do nothing;
