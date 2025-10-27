# Code Style Guide

This document defines the code style rules for the Langra project. All rules are automatically enforced through ESLint, Prettier, and Rustfmt.

## General Principles

- Code should be self-documenting
- No comments allowed in code
- Use descriptive variable and function names
- Keep functions small and focused
- Prefer explicit over implicit

## TypeScript/JavaScript

### Enforced by ESLint

**No Comments:**
- No inline comments
- No block comments
- Code must be self-explanatory through naming

**Variables:**
- Use `const` by default
- Use `let` only when reassignment is needed
- Never use `var`
- No unused variables (prefix with `_` if intentional)

**Code Quality:**
- Always use strict equality (`===`, `!==`)
- Always use curly braces for control flow
- No console statements in production code

**React:**
- Use functional components with hooks
- No prop-types (TypeScript handles this)
- React import not needed in JSX files

### Enforced by Prettier

**Formatting:**
- Semicolons: Required
- Quotes: Double quotes
- Print width: 100 characters
- Tab width: 2 spaces
- No tabs (spaces only)
- Trailing commas: ES5 style
- Arrow function parentheses: Always
- End of line: LF (Unix style)

### Examples

**Good:**
```typescript
const getUserById = (userId: string) => {
  const user = database.find((u) => u.id === userId);
  return user;
};
```

**Bad:**
```typescript
// This function gets user by id
var get_user = function(id) {
  const user = database.find(u => u.id == id) // loose equality
  return user
}
```

## Rust

### Enforced by Rustfmt

**Formatting:**
- Edition: 2021
- Max width: 100 characters
- Tab spaces: 4
- No hard tabs
- Unix line endings
- Reorder imports: Enabled
- Remove nested parentheses: Enabled
- Normalize comments: Enabled
- Comment width: 100 characters

**Naming Conventions:**
- `snake_case` for functions and variables
- `PascalCase` for types and structs
- `SCREAMING_SNAKE_CASE` for constants
- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/naming.html)

### Examples

**Good:**
```rust
const MAX_CONNECTIONS: usize = 100;

struct UserData {
    user_id: String,
    display_name: String,
}

fn get_user_by_id(user_id: &str) -> Option<UserData> {
    database.find(|u| u.user_id == user_id)
}
```

## Commit Messages

### Format

All commit messages must follow this exact format:

```
type: brief description in lowercase
```

**Rules:**
- Single line only (max 72 characters)
- Type must be lowercase
- Description must be lowercase
- No period at the end
- No body or footer allowed

### Valid Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

### Examples

**Good:**
```
feat: add keyboard shortcut for translation
fix: resolve clipboard access on windows
docs: update building guide for linux
refactor: simplify translation api calls
```

**Bad:**
```
Add new feature
fix: Resolve clipboard access.
feat: Add keyboard shortcut for translation feature

This adds a new keyboard shortcut.
```

## Automation

### Pre-Commit Hook

Before each commit, automatically runs:
1. ESLint - Checks code style
2. Prettier - Checks formatting
3. Rustfmt - Checks Rust formatting

If any check fails, commit is blocked.

### Commit Message Hook

Before each commit, validates commit message format.
If format is invalid, commit is blocked.

### Pre-Push Hook

Blocks direct pushes to `main` branch.
All changes to `main` must go through pull requests.

## Running Checks Manually

```bash
npm run lint
npm run lint:fix
npm run format:check
npm run format
npm run format:rust:check
npm run format:rust
```

## Editor Setup

Install the EditorConfig plugin for your editor to automatically apply formatting rules:

- VS Code: EditorConfig for VS Code
- IntelliJ/WebStorm: Built-in support
- Vim/Neovim: editorconfig-vim

## Why No Comments?

Comments often become outdated and misleading. Instead:

1. Use descriptive names that explain intent
2. Break complex logic into well-named functions
3. Use TypeScript types to document contracts
4. Write self-documenting code

**Instead of:**
```typescript
const d = 86400000;
```

**Write:**
```typescript
const millisecondsPerDay = 86400000;
```

## Configuration Files

- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting
- `rustfmt.toml` - Rust formatting
- `.editorconfig` - Editor configuration
- `commitlint.config.js` - Commit message rules
- `.husky/` - Git hooks

## Bypassing Rules

Do not bypass these rules. If you believe a rule should be changed:

1. Open an issue explaining the problem
2. Discuss with maintainers
3. Update rules if consensus is reached
4. Never use `eslint-disable` or similar bypasses
