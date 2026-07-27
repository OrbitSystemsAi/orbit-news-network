# 011 — Vercel Deployment

## Intended configuration

The intended Vercel project is `orbit-news-network`, owned by the explicitly verified Vercel account or team and connected to the private GitHub repository. The root is the repository root. Vercel should detect Next.js and use `npm install` plus `npm run build`. The build generates Prisma Client and compiles Next.js; it never migrates or seeds the database.

Before linking, authenticate the CLI, list teams/projects, confirm the intended free owner, confirm no project with this name exists, and confirm Vercel can read the private GitHub repository. Do not make the repository public to solve an integration permission problem.

## Controlled migration and deployment

ONN uses manual production migration before application deployment:

1. Configure the pooled `DATABASE_URL` and direct `DIRECT_URL` securely.
2. Run `npm run db:validate` and `npm run db:migrate:status` against the intended Neon project.
3. Review committed SQL in `prisma/migrations`.
4. Run `npm run db:migrate:deploy` manually through the direct connection.
5. Run `npm run db:seed:production` once. The seed is idempotent and contains platform configuration only.
6. Deploy a preview, inspect it, complete the smoke-test subset, and promote or deploy the verified commit to production.

Never use `prisma migrate dev` or `prisma db push` against production, run migrations automatically in preview builds, seed on every deployment, or expose a migration HTTP endpoint.

## Preview and production

Preview branches use Preview environment variables and must not mutate schema or seed data. The private MVP may share the same Neon Free database across Preview and Production, so test data must be labeled, minimal, and removed. Production deploys originate from the configured default branch and initially use only the assigned `*.vercel.app` URL.

After the first production URL is known, set `NEXT_PUBLIC_APP_URL` for Production and redeploy. Inspect the deployment association, framework, build output, environment assignment, and health response. Custom-domain work is a future task.

## Rollback and troubleshooting

Use `vercel inspect <url>` and free Vercel logs without printing secrets. A rollback repoints production to the last verified artifact; it does not roll back the database. Database migrations therefore require backward-compatible review. Typical failures include missing environment values, an incorrect owner/root, Prisma Client not generated, or unapplied migrations. Fix the cause and rebuild—never weaken validation or reset the shared database.
