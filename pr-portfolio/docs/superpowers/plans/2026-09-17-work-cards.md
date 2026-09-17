# Work cards implementation plan

**Goal:** Implement the approved card mockup within the existing Astro portfolio.
**Architecture:** Static case-study cards from the blog collection; progressive client-side company/focus filtering with URL history. Explicit company and customer metadata feed both cards and breadcrumbs, using a shared company registry.
**Constraints:** Preserve exact titles, existing routes, light/dark tokens, existing content and assets. No commits or deployment. Execute inline in the user-requested new branch.

## Tasks
- [x] Add failing unit tests for filtering and query handling, plus browser tests for real cards, combined filters, history, empty states and breadcrumbs.
- [x] Add company registry and explicit company/customer/card summary fields to the schema and three existing cases. Build pure query and filtering helpers.
- [x] Build CaseStudyCard. Replace Work's blog list with accessible cards, company/focus controls, results status, empty state and contact CTA. Preserve titles without clipping.
- [x] Generate breadcrumb links from explicit metadata; connect global Work and company See all navigation. Keep base-path support.
- [ ] Run unit tests, build and check; compare browser-rendered desktop/mobile and light/dark evidence with mockup. Record pre-existing About type error separately.

## Verification commands
`node --test tests/work-filters.test.mjs`
`npm run test:unit`
`npm run build`
`npm run check`
`npx playwright test tests/browser/work.spec.ts`

Expected baseline: 16 unit tests pass; check has one pre-existing missing type prop in About.

Current verification: 18 unit tests pass and build passes. Check has the same About diagnostic only. Visual/browser verification blocked by the in-app browser admin-policy check; see design-qa.md. Independent code review completed, selected-filter contrast issue corrected. Changes left uncommitted on the requested branch.
