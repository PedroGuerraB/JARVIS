-- pgvector for semantic memory

create extension if not exists vector;

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists embeddings_entity on embeddings(entity_type, entity_id);

-- HNSW index for fast ANN search
create index if not exists embeddings_vector_idx on embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
