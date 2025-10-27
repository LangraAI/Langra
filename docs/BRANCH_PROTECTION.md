# Branch Protection Setup

This document explains how to set up branch protection rules on GitHub to enforce code quality and workflow standards.

## Local Protection

Local git hooks prevent direct pushes to `main`:

```bash
git push origin main
```

This will be blocked with:
```
Direct push to main is not allowed. Please create a pull request.
```

## GitHub Branch Protection

To enforce these rules on GitHub as well, configure branch protection:

### 1. Access Settings

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Branches** in left sidebar
4. Click **Add branch protection rule**

### 2. Configure Protection Rules

**Branch name pattern:**
```
main
```

**Enable these settings:**

- ✅ **Require a pull request before merging**
  - ✅ Require approvals (1 approval recommended)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Select required checks:
    - `build (windows-latest)`
    - `build (macos-latest)`
    - `build (ubuntu-22.04)`

- ✅ **Require conversation resolution before merging**

- ✅ **Require linear history** (optional, prevents merge commits)

- ✅ **Do not allow bypassing the above settings**

- ✅ **Restrict who can push to matching branches**
  - Leave empty to block all direct pushes
  - Or add specific users/teams who can push (not recommended)

### 3. Additional Settings (Optional)

**For stricter enforcement:**

- ✅ **Require signed commits**
- ✅ **Include administrators** (blocks even admins from direct pushes)
- ✅ **Allow force pushes**: Disabled
- ✅ **Allow deletions**: Disabled

### 4. Save Changes

Click **Create** or **Save changes**

## Workflow After Setup

### Creating Changes

```bash
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

### Creating Pull Request

```bash
gh pr create --title "feat: add new feature" --body "Description of changes"
```

Or via GitHub UI:
1. Go to repository
2. Click **Pull requests**
3. Click **New pull request**
4. Select your branch
5. Fill in details
6. Click **Create pull request**

### Merging

After approval and passing checks:
1. Pull request can be merged
2. GitHub automatically updates `main`
3. Delete feature branch

## Benefits

**Quality Control:**
- All code reviewed before merge
- Automated tests must pass
- Consistent code style enforced

**Collaboration:**
- Encourages discussion on changes
- Documents decision-making
- Maintains clean git history

**Safety:**
- Prevents accidental direct commits to main
- Reduces broken builds
- Easy to revert if needed

## Emergency Hotfixes

For urgent fixes, still use the PR process:

```bash
git checkout -b hotfix/critical-bug
git add .
git commit -m "fix: resolve critical security issue"
git push origin hotfix/critical-bug
gh pr create --title "fix: critical security hotfix"
```

Mark PR as urgent and request immediate review.

## Troubleshooting

### Local Hook Not Working

If you can still push to main locally:

```bash
chmod +x .husky/pre-push
npm run prepare
```

### GitHub Still Allows Direct Push

Check branch protection settings:
1. Ensure rule applies to `main` branch
2. Verify "Restrict who can push" is enabled
3. Confirm "Do not allow bypassing" is checked

### Can't Merge PR

Common issues:
- Status checks not passing - Fix code and push again
- Merge conflicts - Resolve conflicts locally
- No approvals - Request review from team member
- Branch not up to date - Merge main into your branch

## Related Documentation

- [Contributing Guide](../CONTRIBUTING.md)
- [Code Style Guide](../CODE_STYLE.md)
- [CI/CD Documentation](./CICD.md)
