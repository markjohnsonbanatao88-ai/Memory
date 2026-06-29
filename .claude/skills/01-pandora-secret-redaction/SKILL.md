# Pandora Secret Redaction

## Purpose

Prevent token, key, credential, and secret leakage during development, debugging, rollout, and reporting.

## When to use

Use before reading environment-sensitive output, running protected jobs, writing docs, creating PR comments, or pasting command output.

## Redaction rules

Always redact or avoid printing:

- Bearer tokens and internal job/operator tokens.
- Supabase service role keys, JWT secrets, database passwords, connection strings, and project secrets.
- Vercel API tokens and team/project tokens.
- OpenAI, Anthropic, GitHub, or provider API keys.
- `.env`, `.env.*`, `.vercel/**`, `.supabase/**`, `secrets/**`, and shell history containing secrets.

## Safe presence checks

Allowed:

```bash
if [ -n "$PANDORA_INTERNAL_JOB_TOKEN" ]; then
  echo "PANDORA_INTERNAL_JOB_TOKEN=present"
else
  echo "PANDORA_INTERNAL_JOB_TOKEN=missing"
fi
```

Not allowed:

```bash
echo "$PANDORA_INTERNAL_JOB_TOKEN"
printenv
cat .env
```

## Reporting standard

Say `present`, `missing`, `redacted`, or `not available`. Never include raw values.

If a secret was exposed, stop the rollout and recommend rotation before continuing.
