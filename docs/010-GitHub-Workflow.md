# 010 — GitHub Workflow

## Repository policy

The intended repository is the private `Orbit-Systems-AI/orbit-news-network` repository owned by the verified Orbit Systems AI organization. Never substitute a personal repository, change visibility to public, overwrite an existing repository, replace remotes, force-push, or rewrite history without explicit approval.

## Initial publication

1. Run `git status -sb`, `git remote -v`, `git branch --show-current`, and inspect every file in the initial scope.
2. Confirm `.env*`, `.vercel`, build output, logs, test output, temporary key files, and iCloud conflict copies are ignored. Prisma migrations and `package-lock.json` must remain included.
3. Run the secret scan and `npm run verify`.
4. Run `gh auth status`, confirm the authenticated account, and verify membership/access to the actual organization identifier.
5. Run `gh repo view Orbit-Systems-AI/orbit-news-network` to determine whether the target already exists. Stop on any conflict.
6. Create it only when absent: `gh repo create Orbit-Systems-AI/orbit-news-network --private --source=. --remote=origin`.
7. Create the intentional initial commit, push `main` with upstream tracking, and verify repository visibility, default branch, latest commit, README rendering, and remote URL.

## Ongoing work

Use short-lived `agent/<description>` branches, focused commits, and draft pull requests. Run relevant tests before pushing. Never commit generated credentials or expose production secrets in pull requests. Force pushes require explicit approval. Vercel Git integration should create previews for non-production branches and production deployments only from the configured production branch.

No GitHub Actions workflow is required for the private MVP because Vercel Git integration provides the deployment path. If CI is added later, keep it lightweight and never migrate or seed a database from pull-request workflows.
