# Operator-safe live environment template (redacted)

Use placeholders only. Do not paste real secrets into this document.

## Auth/session
```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key-placeholder>
# Server-only if used by private server utilities; never expose in public routes.
SUPABASE_SERVICE_ROLE_KEY=<server-only-redacted-placeholder>
```

## Supabase public read configuration
```env
PANDORA_ENABLE_PERSISTED_MEMORY_READ=true
PANDORA_ENABLE_PUBLIC_MEMORY_READ=false # dangerous: must remain false for first manual use
```

## Runtime gates
```env
PANDORA_ENABLE_PUBLIC_MEMORY_PERSISTENCE=false # dangerous: must remain false
PANDORA_ENABLE_MEMORY_INGEST_PRODUCTION_WRITES=false # dangerous: production ingest write must remain false
```

## Admin/operator gates
```env
PANDORA_ENABLE_ADMIN_PERSISTENCE_CONSOLE=false # enable only for private admin boundary review
PANDORA_ENABLE_OPERATOR_MEMORY_QA_FLOW=false # disabled by default
```

## Persistence executor gates
```env
PANDORA_ENABLE_APPROVED_REVIEW_MEMORY_PERSISTENCE=false # internal/admin only; never public client persistence
```

## Disabled dangerous features
```env
PANDORA_ENABLE_MODEL_CALLS=false # dangerous: must remain false
PANDORA_ENABLE_EMBEDDINGS=false # dangerous: must remain false
PANDORA_ENABLE_SEMANTIC_RETRIEVAL=false # dangerous: must remain false
PANDORA_ENABLE_GPT_ACTIONS=false # dangerous: must remain false
PANDORA_ENABLE_MCP=false # dangerous: must remain false
```

## Future semantic retrieval placeholders
```env
# PANDORA_VECTOR_INDEX_URL=<future-placeholder-disabled>
# PANDORA_EMBEDDING_MODEL=<future-placeholder-disabled>
# Keep semantic retrieval, embeddings, GPT Actions, and MCP disabled until reviewed in a future PR.
```
