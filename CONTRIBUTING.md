# Contributing to Langra

Thank you for your interest in contributing to Langra! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to a code of conduct adapted from the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you are expected to uphold this code.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) v22.12.0 or higher
- [Rust](https://rustup.rs/) (latest stable)
- [Git](https://git-scm.com/)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/langra.git
   cd langra
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/langra.git
   ```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run tauri:dev
```

## Development Workflow

**Important:** Direct pushes to `main` are blocked. All changes must go through pull requests.

### 1. Create a Branch

Create a branch for your feature or bugfix:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bugfix-name
```

Branch naming convention:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the [Coding Standards](#coding-standards)
- Add tests if applicable
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run frontend development
npm run dev

# Run Tauri app
npm run tauri:dev

# Build for production
npm run tauri:build
```

Test on multiple platforms if possible (Windows, macOS, Linux).

### 4. Commit Your Changes

Follow the [Commit Messages](#commit-messages) guidelines:

```bash
git add .
git commit -m "feat: add new translation feature"
```

### 5. Stay Updated

Keep your branch updated with upstream:

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review of your code completed
- [ ] Comments added for hard-to-understand areas
- [ ] Documentation updated (if needed)
- [ ] No new warnings generated
- [ ] Tests pass locally
- [ ] Build succeeds on your platform

### Submitting a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Fill out the PR template completely:
   - **Title**: Brief description of changes
   - **Description**: Detailed explanation of what and why
   - **Type**: Feature, bugfix, docs, etc.
   - **Breaking Changes**: Yes/No and explanation
   - **Testing**: How you tested the changes
   - **Screenshots**: If UI changes

4. Link any related issues (e.g., "Fixes #123")
5. Request review from maintainers
6. Be responsive to feedback

### Review Process

- Maintainers will review your PR within a few days
- Address any requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release!

## Coding Standards

All code style rules are automatically enforced through ESLint, Prettier, and Rustfmt.

See [CODE_STYLE.md](./CODE_STYLE.md) for complete style guide.

### Key Rules

**General:**
- No comments in code
- Self-documenting code through naming
- Code must pass all automated checks

**TypeScript/JavaScript:**
- Use `const` by default, `let` when needed, never `var`
- Always use strict equality (`===`)
- Always use curly braces
- 100 character line limit
- Double quotes, semicolons required

**Rust:**
- Run `cargo fmt` before committing
- Run `cargo clippy` and fix all warnings
- Follow Rust naming conventions
- 100 character line limit

**React:**
- Functional components with hooks only
- Props must be typed with TypeScript
- Keep components small and focused

### Automated Checks

Before each commit, the following checks run automatically:

```bash
npm run lint
npm run format:check
npm run format:rust:check
```

If any check fails, the commit is blocked.

### Running Checks Manually

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:rust
```

## Commit Messages

All commit messages are automatically validated by commitlint.

### Format

Single line only (max 72 characters):

```
type: brief description in lowercase
```

### Rules

- Type must be lowercase
- Description must be lowercase
- No period at the end
- No body or footer
- Use imperative mood

### Valid Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

### Examples

**Good:**
```bash
feat: add keyboard shortcut for translation
fix: resolve clipboard access on windows
docs: update building guide for linux
refactor: simplify translation api calls
chore: bump dependencies to latest versions
```

**Bad:**
```bash
Add new feature
fix: Resolve clipboard access.
feat: Add keyboard shortcut for translation feature

This adds a new keyboard shortcut.
```

### Enforcement

Commit messages are automatically validated before each commit. Invalid messages will be rejected.

## Testing

### Running Tests

```bash
# Frontend tests (if configured)
npm test

# Rust tests
cd src-tauri
cargo test
```

### Writing Tests

- Add tests for new features
- Update tests for modified features
- Ensure all tests pass before submitting PR

### Manual Testing

Test your changes on:
- [ ] Windows (if applicable)
- [ ] macOS (if applicable)
- [ ] Linux (if applicable)

## Documentation

### When to Update Docs

Update documentation when you:
- Add new features
- Change existing behavior
- Add new configuration options
- Fix bugs that users should know about

### Documentation Files

- `README.md` - Project overview, quick start
- `docs/BUILDING.md` - Build instructions
- `docs/TROUBLESHOOTING.md` - Common issues
- `docs/CICD.md` - CI/CD information
- Code comments - Inline documentation

### Documentation Style

- Clear and concise
- Use code examples
- Include screenshots for UI changes
- Keep it up-to-date with code changes

## Questions?

- Check [existing issues](../../issues)
- Read the [documentation](./docs/)
- Ask in a new issue

## Recognition

Contributors are recognized in:
- Release notes
- Contributors list (automatically via GitHub)
- Special thanks in major releases

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Langra! 🎉
