# Orbit News Network Repository Rules

- This repository is only for Orbit News Network (ONN). Never rename it Orbit Daily Intelligence or Orbit Daily News.
- ONN is infrastructure, not a consumer news-reader application.
- Every design and architectural decision must support multiple Orbit applications. Career Pivot is the first consumer, not the definition of the platform.
- Prefer configuration over application-specific hardcoding. Design APIs before tightly coupling interfaces to implementation; the UI is a client of the platform.
- Inspect existing files before changing them and present a plan before substantial implementation.
- Warn before substantially restructuring, expanding, shrinking, or replacing an existing file. When providing manual file content, provide complete replacement files only, not fragments.
- Use the Next.js App Router and TypeScript. Prefer Server Components unless browser interaction requires a Client Component.
- Build reusable components; avoid giant files and giant components. Do not silently change the approved technology stack.
- Do not add paid services, a paid news API, or NewsAPI.org without explicit approval.
- Do not scrape publisher webpages or store complete copyrighted article bodies.
- Do not commit secrets, expose private environment variables in browser bundles, or store plaintext API keys.
- Do not claim a command, test, build, migration, GitHub action, or deployment succeeded unless it was executed and verified.
- Preserve working functionality unless a change is approved.
- Run linting, type checking, tests when available, and a production build before declaring a phase complete.
- Clearly distinguish demonstration data from real operational data.
- All future UI actions should map to service or API operations.
- Maintain accessibility and responsive behavior.
