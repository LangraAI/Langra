# Linting Migration Plan

This document outlines the phased approach for introducing code style enforcement to the existing codebase.

## Current Status

Code style rules have been configured but are **non-blocking** for local commits.

## Phase 1: Configuration & Discovery (Current)

**Status:** In Progress

**What's Done:**
- ✅ ESLint, Prettier, Rustfmt, Commitlint configured
- ✅ CI/CD checks added (will fail on existing code)
- ✅ Git hooks set to warning mode (non-blocking)
- ✅ Documentation created

**What Happens:**
- Local commits show warnings but don't block
- CI/CD runs and reports all issues
- Creates visibility into what needs fixing

**Action Items:**
1. Push configuration to main
2. Run CI/CD to see all failures
3. Create GitHub issues for each category of problems:
   - ESLint violations
   - Prettier formatting issues
   - Rust formatting issues
   - Clippy warnings

## Phase 2: Incremental Fixes

**What to Do:**
- Create issues for each type of linting failure
- Label issues as "good first issue" for contributors
- Fix issues incrementally, file by file
- Track progress via issue closure

**Example Issues:**

```markdown
Title: Fix ESLint violations in src/components/
Labels: code-quality, good-first-issue

Description:
Files with ESLint issues:
- src/components/Header.tsx (12 issues)
- src/components/Footer.tsx (5 issues)

Run `npm run lint:fix` to auto-fix most issues.
Manual fixes needed for comment removal.
```

```markdown
Title: Format all Rust files with rustfmt
Labels: code-quality, rust

Description:
Run `npm run format:rust` to format all Rust files.
Review changes and commit.
```

## Phase 3: Enable Strict Mode

**When:** After all linting issues are resolved

**How:**
1. Verify CI is green (all checks pass)
2. Edit `.husky/pre-commit` and remove `|| true` from each line:

```bash
# Before (non-blocking)
npm run lint || true

# After (blocking)
npm run lint
```

3. Commit and push
4. Update this document to mark Phase 3 complete

**Result:**
- Commits blocked locally if style violations exist
- CI blocks PRs if checks fail
- Code quality maintained going forward

## Phase 4: Branch Protection

**When:** After Phase 3 is complete

**How:**
1. Go to GitHub repository settings
2. Set up branch protection for `main`
3. Require these status checks:
   - `lint` job
   - `build` jobs for all platforms
4. Require at least 1 approval

See [docs/BRANCH_PROTECTION.md](./docs/BRANCH_PROTECTION.md) for details.

## Quick Commands

**Check current status:**
```bash
npm run lint
npm run format:check
npm run format:rust:check
```

**Auto-fix what can be fixed:**
```bash
npm run lint:fix
npm run format
npm run format:rust
```

**Run CI checks locally:**
```bash
npm run lint && npm run format:check && npm run format:rust:check
cd src-tauri && cargo clippy -- -D warnings
```

## Progress Tracking

Create a tracking issue with checklist:

```markdown
Title: Code Quality Migration Tracking
Labels: meta, code-quality

- [ ] Phase 1: Configuration pushed
- [ ] CI/CD runs and reports issues
- [ ] Issues created for all violation types
- [ ] ESLint violations fixed
- [ ] Prettier formatting fixed
- [ ] Rust formatting fixed
- [ ] Clippy warnings fixed
- [ ] Phase 3: Enable strict mode
- [ ] Phase 4: Branch protection enabled
```

## Benefits of This Approach

**No Work Blocked:**
- Development continues normally
- Existing code doesn't break builds
- New code gets warnings but can still be committed

**Visibility:**
- CI shows exactly what needs fixing
- Issues create clear tasks
- Progress is trackable

**Incremental:**
- Fix at your own pace
- Can tackle file-by-file or category-by-category
- Good for distributed teams and contributors

**Community Friendly:**
- Creates "good first issue" opportunities
- Clear tasks for new contributors
- Demonstrates commitment to code quality

## Timeline Suggestion

- **Week 1:** Push config, create issues
- **Week 2-3:** Fix high-priority violations
- **Week 4:** Enable strict mode
- **Week 5:** Enable branch protection

Adjust timeline based on:
- Codebase size
- Number of violations
- Team availability
- Contributor activity

## Notes

This approach is used by major open-source projects like:
- **React** - Introduced ESLint gradually with warning periods
- **TypeScript** - Added strict checks over multiple releases
- **VS Code** - Incremental linting adoption across codebase

It balances code quality improvement with practical development needs.
