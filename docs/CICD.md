# CI/CD - Automated Builds

This project uses GitHub Actions to automatically build for Windows, macOS, and Linux.

## Overview

The workflow (`.github/workflows/build.yml`) automatically:
- ✅ Runs linting and formatting checks first
- ✅ Builds for 3 platforms in parallel (only if linting passes)
- ✅ Runs on push to `main`, pull requests, and tags
- ✅ Creates draft releases for tagged versions
- ✅ Caches dependencies for faster builds
- ✅ Uploads build artifacts

## Workflow Stages

### 1. Lint Job (Required)

Runs first on every PR and push. Must pass before builds start.

**Checks:**
- ESLint - JavaScript/TypeScript code style
- Prettier - Code formatting
- Rustfmt - Rust code formatting
- Clippy - Rust linting with warnings as errors

**Runtime:** ~2-3 minutes

If this job fails, builds are skipped and PR cannot be merged.

### 2. Build Jobs (Parallel)

Only run if lint job passes. Three parallel builds for each platform.

## Build Matrix

| Platform | Runner | Outputs |
|----------|--------|---------|
| **Windows** | `windows-latest` | `.exe`, `.msi`, `.exe` (NSIS) |
| **macOS** | `macos-latest` | `.app`, `.dmg` |
| **Linux** | `ubuntu-22.04` | `.AppImage`, `.deb` |

## Triggering Builds

### Automatic Triggers

1. **Push to main branch**
   ```bash
   git push origin main
   ```
   - Builds all platforms
   - No release created
   - Artifacts available for 90 days

2. **Pull Request**
   ```bash
   gh pr create --title "Your PR"
   ```
   - Builds all platforms to verify PR
   - No release created
   - Helps catch platform-specific issues early

3. **Version Tag** (creates release)
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
   - Builds all platforms
   - Creates **draft release** on GitHub
   - Uploads installers as release assets
   - You manually publish the release when ready

### Manual Trigger

1. Go to repository on GitHub
2. Click **Actions** tab
3. Select **Build and Release** workflow
4. Click **Run workflow** button
5. Choose branch and click **Run workflow**

## Build Times

Typical build durations (GitHub-hosted runners):

- **Windows**: ~12-15 minutes
- **macOS**: ~15-18 minutes
- **Linux**: ~10-12 minutes

**Total wall time**: ~15-18 minutes (runs in parallel)

First build takes longer due to dependency downloads. Subsequent builds use cache.

## Caching Strategy

The workflow caches:
- **npm dependencies**: `node_modules` (per OS)
- **Rust dependencies**: `~/.cargo` and `target/` (per OS)

This reduces build times by 40-60% after the first build.

## Downloading Artifacts

### From Workflow Runs

1. Go to **Actions** tab
2. Click on completed workflow run
3. Scroll to **Artifacts** section
4. Download platform-specific builds

Artifacts include:
- Source code archives
- Platform installers
- Build logs

### From Releases

For tagged builds:

1. Go to **Releases** page
2. Find your version (e.g., `v0.1.0`)
3. Download installer for your platform

## Release Process

### Creating a New Release

```bash
# 1. Update version in Cargo.toml
# Edit: src-tauri/Cargo.toml
version = "0.2.0"

# 2. Update version in package.json
# Edit: package.json
"version": "0.2.0"

# 3. Commit version bump
git add src-tauri/Cargo.toml package.json
git commit -m "chore: bump version to 0.2.0"

# 4. Create and push tag
git tag v0.2.0
git push origin main
git push origin v0.2.0
```

### After Build Completes

1. Go to **Releases** page
2. Find your draft release
3. Edit release notes (GitHub auto-generates from commits)
4. Test installers if needed
5. Click **Publish release**

## Environment Variables

### Required Secrets

- `GITHUB_TOKEN` - Auto-provided by GitHub (no setup needed)

### Optional Secrets (for code signing)

Add these in **Settings → Secrets → Actions**:

**macOS Signing:**
- `APPLE_CERTIFICATE` - Base64 encoded .p12 certificate
- `APPLE_CERTIFICATE_PASSWORD` - Certificate password
- `APPLE_ID` - Your Apple ID email
- `APPLE_PASSWORD` - App-specific password
- `APPLE_TEAM_ID` - Your Apple Team ID

**Windows Signing:**
- `WINDOWS_CERTIFICATE` - Base64 encoded .pfx certificate
- `WINDOWS_CERTIFICATE_PASSWORD` - Certificate password

## Customizing the Workflow

### Changing Trigger Conditions

Edit `.github/workflows/build.yml`:

```yaml
on:
  push:
    branches:
      - main
      - develop  # Add more branches
  pull_request:
    branches:
      - main
```

### Adding Build Steps

Add custom steps in the workflow:

```yaml
- name: Run tests
  run: npm test

- name: Lint code
  run: npm run lint
```

### Modifying Release Settings

Change release behavior:

```yaml
releaseDraft: false  # Auto-publish releases
prerelease: true     # Mark as pre-release
```

## Troubleshooting CI/CD

### Build Failing Only in CI

**Check Node.js version:**
- CI uses `22.12.0` (configured in workflow)
- Your local might use different version
- Solution: Use `nvm` locally to match CI

**Check environment differences:**
- CI runs clean environment
- Missing secrets/env vars will fail
- Check workflow logs for specific errors

### Slow Builds

**First build is always slower** (~20-25 min)
- Downloads all dependencies
- Compiles everything from scratch

**Subsequent builds are faster** (~10-15 min)
- Uses cached dependencies
- Only rebuilds changed code

### Cache Issues

If cache causes problems, clear it:
1. Go to **Actions** tab
2. Click **Caches** (in left sidebar)
3. Delete problematic caches
4. Re-run workflow

## Cost & Limits

### GitHub Free Tier
- **2,000 minutes/month** for private repos
- **Unlimited** for public repos
- 500 MB artifact storage

### Usage Per Build
- ~45-50 minutes total (3 platforms × ~15 min)
- ~12 MB artifacts (all installers)

**Estimate**: ~40 builds/month on free tier (private repos)

## Best Practices

1. **Use draft releases** - Test before publishing
2. **Semantic versioning** - Use `v1.2.3` format
3. **Test PRs** - Let CI catch issues before merge
4. **Cache dependencies** - Already configured
5. **Manual trigger** - Use for hotfixes or testing

## Next Steps

- Configure code signing for distribution
- Add automated tests to workflow
- Set up automatic update system
- Add build status badges to README

## Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Tauri Action](https://github.com/tauri-apps/tauri-action)
- [Tauri Distribution Guide](https://tauri.app/v1/guides/distribution/)
