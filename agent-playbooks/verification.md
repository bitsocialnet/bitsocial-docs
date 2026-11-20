# Verification

Select checks from the changed behavior and remaining uncertainty. Reuse successful evidence for the same final state; rerun after relevant edits or failures. Explicit CI/release/user requirements still apply.

| Change                                                | Appropriate checks                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Prose/comments/formatting only                        | Diff, references, relevant generators; no app build                                                          |
| AI workflow sources/configuration                     | `yarn ai-workflow:sync`, `yarn ai-workflow:check`, `yarn ai-workflow:test`                                   |
| Isolated helper or script                             | Focused invocation/fixtures and syntax or type/lint checks for the affected code                             |
| Shared runtime, dependency, build, integration change | Focused affected checks plus the relevant build/type/lint checks below                                       |
| CSS/theme/layout only                                 | Affected routes/viewports/themes in selected browsers; build when imports, assets, or CSS processing changed |
| React state/effects/performance                       | Affected behavior and applicable React guidance; Doctor when diagnostics resolve a concrete concern          |

## Project checks

- `yarn build:verify` builds the English site and its Pagefind index.
- `yarn build` runs the full production build that Vercel runs, including every locale and the Pagefind index. Use it for theme, i18n, or build configuration changes, or other changes that warrant that scope.
- `yarn lint`, `yarn typecheck`, and `yarn format:check` cover existing repository gates; for a narrow script edit use its focused syntax/fixture/format checks first. Script and client-state tests run with `node --test scripts/__tests__/*.node-test.mjs`.
- Manifest/lock changes require `corepack yarn install`, `yarn deps:check-pinned`, and `yarn deps:check-hardened`. `yarn knip` is advisory for dependencies/imports.
- Docs translation checks are in [translations.md](translations.md); do not run the bulk translation writer for a focused docs change.

## Browser evidence and ownership

Use Chrome for small isolated browser changes. Add Firefox and WebKit for shared CSS/layout/responsiveness, browser-sensitive APIs, broad interactions, releases, or explicit cross-browser criteria. Include affected mobile layouts/touch behavior. A viewport resize alone is not touch emulation. Choose actual routes and content from source rather than assuming examples are available.

Use `playwright-cli` through `./scripts/pw-session.sh`. One browser is active machine-wide; selected engines run sequentially and each exact owned session closes even after failure. Reuse an authorized caller-owned session without closing it. Never use global browser cleanup or stop a server of unclear ownership. No browser/server is needed for documentation-only work.

For performance work, compare the same flow with equivalent viewport, content, network/CPU settings, build mode, and measurement overhead. Distinguish observations from suspected causes. Use the profile skill when these measurements answer the actual request.

## Final evidence

One agent owns heavy verification. Inspect active workloads and serialize installs, builds/full suites, Doctor, and browser profiling. Report commands/outcomes and specific limitations; missing data or a skipped engine is not a passing result. Tooling fixtures verify formats and mechanics, not end-to-end app discovery or model decision quality.

## Automatic React checks

`yarn agent:verify` runs the selected builds followed by `yarn doctor:check` and `yarn perf:check`. `perf:check` includes the collector compatibility and deliberate-regression selftest, so neither CI nor the agent verification path needs a separate `perf:test` pass. Profiling and Chromium browser tests use sandboxed system Chrome. Keep Chrome up to date. `yarn perf:install` checks for Chrome, and `yarn perf:install --force` explicitly installs or refreshes it system-wide. Hosted CI refreshes Chrome stable before profiling. Use target/scenario filters for focused reruns after the full relevant pass. Scenario budgets are explicit in `scripts/react-perf/config.mjs`; preserve evidence and fix a regression before considering a justified baseline change. Ordinary production builds omit Bippy; the separate `build:profile` command supplies official React profiling instrumentation.
