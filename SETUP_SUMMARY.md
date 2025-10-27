# Code Style & Workflow Setup Summary

This document summarizes the automated code style enforcement and workflow rules that have been configured for this project.

**Current Mode:** ⚠️ Warning Mode (Non-Blocking)
- Local git hooks show warnings but allow commits
- CI/CD checks will fail and show all issues
- See [LINTING_MIGRATION.md](./LINTING_MIGRATION.md) for rollout plan

## What Has Been Set Up

### 1. Code Style Enforcement

**ESLint** - JavaScript/TypeScript linting
- No comments allowed in code
- Strict equality only (`===`)
- Always use curly braces
- No unused variables
- 100 character line limit

**Prettier** - Code formatting
- Double quotes, semicolons required
- 2-space indentation
- Unix line endings (LF)
- Automatic formatting

**Rustfmt** - Rust formatting
- Standard Rust style
- 4-space indentation for Rust
- 100 character line limit

**EditorConfig** - Editor consistency
- Works across all editors
- Consistent indentation and line endings

### 2. Commit Message Enforcement

**Format Required:**
```
type: brief description in lowercase
```

**Valid Types:** feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

**Rules:**
- Single line only (max 72 characters)
- Lowercase type and description
- No period at end
- No body or footer

### 3. Git Hooks (Warning Mode - Non-Blocking)

**pre-commit** - Runs before each commit
- Checks ESLint rules
- Checks Prettier formatting
- Checks Rustfmt formatting
- Shows warnings but does NOT block commits (yet)
- Will be made strict once codebase is clean

**commit-msg** - Validates commit message
- Ensures format is correct
- Blocks commit if invalid format

**pre-push** - Blocks direct pushes to main
- All changes to main must go through pull requests
- Forces PR workflow

### 4. Branch Protection

**Local:** Git hooks prevent direct push to main
**GitHub:** Configure branch protection rules (see docs/BRANCH_PROTECTION.md)

### 5. Available Commands

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run format:rust
npm run format:rust:check
```

## How to Use

### First Time Setup

After pulling these changes:

```bash
npm install
```

This will automatically:
- Install all linting and formatting tools
- Set up git hooks via Husky
- Configure your local environment

### Normal Workflow

```bash
git checkout -b feature/my-feature

npm run lint
npm run format
npm run format:rust

git add .
git commit -m "feat: add new feature"
```

If commit message or code style is wrong, commit will be blocked.

### Creating Pull Requests

```bash
git push origin feature/my-feature

gh pr create --title "feat: add new feature" --body "Description"
```

Direct pushes to main are blocked:
```bash
git push origin main
```

This will fail with: "Direct push to main is not allowed. Please create a pull request."

## Configuration Files

```
.eslintrc.json          # ESLint rules
.prettierrc.json        # Prettier formatting
.prettierignore         # Files to ignore in formatting
rustfmt.toml            # Rust formatting
.editorconfig           # Editor configuration
commitlint.config.js    # Commit message rules
.husky/                 # Git hooks
  ├── pre-commit        # Runs linting before commit
  ├── commit-msg        # Validates commit message
  └── pre-push          # Blocks push to main
```

## Documentation

- [CODE_STYLE.md](./CODE_STYLE.md) - Complete code style guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
- [docs/BRANCH_PROTECTION.md](./docs/BRANCH_PROTECTION.md) - Git workflow

## Benefits

**Quality:** All code follows consistent style
**Safety:** Broken code can't be committed
**Clarity:** Clean commit history with consistent messages
**Collaboration:** PR workflow encourages review
**Automation:** No manual style enforcement needed

## How Open Source Projects Do It

This setup follows best practices from major open-source projects:

1. **Linux Kernel** - Strict formatting rules, no direct push to main
2. **React** - ESLint + Prettier + commitlint
3. **Rust** - Rustfmt standard, clippy for linting
4. **TypeScript** - ESLint + Prettier + strict rules
5. **VS Code** - Automated checks, PR workflow

Common patterns:
- Automated linting and formatting
- Git hooks for pre-commit checks
- Commit message standards (Conventional Commits)
- Branch protection requiring PRs
- CI/CD running same checks

**Phased Rollout:**
Most projects introduce linting gradually:
- Configure tools first (warnings only)
- CI shows all violations
- Create issues for fixes
- Enable strict mode once clean
- This prevents blocking existing work

## Next Steps

### For New Contributors

1. Run `npm install` to set up environment
2. Read [CODE_STYLE.md](./CODE_STYLE.md)
3. Read [CONTRIBUTING.md](./CONTRIBUTING.md)
4. Create feature branch and start coding

### For Maintainers

1. Set up GitHub branch protection (see docs/BRANCH_PROTECTION.md)
2. Require status checks to pass before merge
3. Require at least 1 approval for PRs
4. Enable "Include administrators" to enforce rules on everyone

## Troubleshooting

### Hooks Not Running

```bash
chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push
npm run prepare
```

### Can't Commit

If commit is blocked, fix the issues:

```bash
npm run lint:fix
npm run format
npm run format:rust
```

Then try committing again.

### Invalid Commit Message

Change your commit message to follow format:

```bash
git commit -m "feat: your message here in lowercase"
```

Not:
```bash
git commit -m "Added new feature"
```

## Support

If you have questions or find issues with this setup:

1. Check [CODE_STYLE.md](./CODE_STYLE.md)
2. Check [CONTRIBUTING.md](./CONTRIBUTING.md)
3. Open an issue on GitHub
