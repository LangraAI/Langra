# Automated Release Process

This project uses fully automated releases. When you push version changes to `main`, a release is automatically created.

## Quick Release Guide

### Option 1: Automated Version Bump (Recommended)

```bash
# Bump patch version (0.1.0 -> 0.1.1)
npm run version:bump patch

# Bump minor version (0.1.0 -> 0.2.0)
npm run version:bump minor

# Bump major version (0.1.0 -> 1.0.0)
npm run version:bump major

# Set specific version
npm run version:bump 1.2.3
```

This script automatically:
- ✅ Updates `package.json`
- ✅ Updates `src-tauri/Cargo.toml`
- ✅ Updates `src-tauri/tauri.conf.json`
- ✅ Updates `CHANGELOG.md` with new version section
- ✅ Shows you the next steps

### Option 2: Manual Version Update

1. Update version in 3 files:
   - `package.json` → `"version": "0.2.0"`
   - `src-tauri/Cargo.toml` → `version = "0.2.0"`
   - `src-tauri/tauri.conf.json` → `"version": "0.2.0"`

2. Update `CHANGELOG.md`:
   ```markdown
   ## [0.2.0] - 2025-01-15
   ### Added
   - New feature descriptions

   ### Fixed
   - Bug fix descriptions
   ```

## Push and Release

Once you've bumped the version:

```bash
# 1. Review the changes
git diff

# 2. Commit the version bump
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md
git commit -m "chore: release v0.2.0"

# 3. Push to main
git push origin main
```

**That's it!** The automation will:
1. Detect the version change
2. Create a git tag (e.g., `v0.2.0`)
3. Trigger the build workflow
4. Build for Windows, macOS, and Linux
5. Create and publish the release
6. Upload all installers as release assets
7. Generate updater manifest for auto-updates

## What Happens Automatically

### 1. Auto-Release Workflow (`.github/workflows/auto-release.yml`)

Triggers when `package.json`, `Cargo.toml`, or `tauri.conf.json` changes on `main`:

- Checks if version changed
- Creates git tag if it doesn't exist
- Triggers the build workflow

### 2. Build Workflow (`.github/workflows/build.yml`)

Triggers on new tags:

- Runs linting checks
- Builds for all platforms in parallel
- Creates GitHub release
- Uploads installers
- Generates `latest.json` for auto-updater

### 3. Release Timeline

```
Push to main
    ↓ (10 seconds)
Auto-release creates tag
    ↓ (immediate)
Build workflow starts
    ↓ (15-18 minutes)
Release published with installers
    ↓ (immediate)
Users can download or auto-update
```

## Auto-Updater

The app includes built-in auto-update functionality:

- Checks for updates on startup
- Shows dialog when update available
- Downloads and installs automatically
- Requires app restart

### How It Works

1. App checks: `https://github.com/ghaithalmasri/langra/releases/latest/download/latest.json`
2. Compares version with current
3. If newer, shows update dialog
4. Downloads update in background
5. Installs on restart

### Configuration

Located in `src-tauri/tauri.conf.json`:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://github.com/ghaithalmasri/langra/releases/latest/download/latest.json"
  ],
  "dialog": true,
  "pubkey": "..."
}
```

## Release Artifacts

Each release includes:

### Windows
- `Langra_0.2.0_x64-setup.exe` - NSIS installer
- `Langra_0.2.0_x64-setup.msi` - MSI installer
- `Langra_0.2.0_x64-setup.nsis.zip` - Portable (via artifacts)
- `Langra_0.2.0_x64-setup.nsis.zip.sig` - Signature file

### macOS
- `Langra_0.2.0_aarch64.dmg` - Apple Silicon installer
- `Langra_0.2.0_x64.dmg` - Intel installer
- `Langra_0.2.0_universal.dmg` - Universal binary
- `.sig` files for each

### Linux
- `langra_0.2.0_amd64.AppImage` - Portable
- `langra_0.2.0_amd64.deb` - Debian package
- `.sig` files for each

### Updater
- `latest.json` - Update manifest for auto-updater

## Versioning Strategy

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features (backwards compatible)
- **PATCH** (0.0.1): Bug fixes (backwards compatible)

### Examples

```bash
# Bug fixes
npm run version:bump patch  # 0.1.0 -> 0.1.1

# New features
npm run version:bump minor  # 0.1.0 -> 0.2.0

# Breaking changes
npm run version:bump major  # 0.1.0 -> 1.0.0
```

## Hotfix Process

For urgent fixes:

```bash
# 1. Fix the bug
git add .
git commit -m "fix: critical bug description"

# 2. Bump patch version
npm run version:bump patch

# 3. Commit and push
git add .
git commit -m "chore: release v0.1.1 (hotfix)"
git push origin main
```

Release will be published in ~15-18 minutes.

## Pre-releases (Optional)

To create a pre-release:

1. Use pre-release version format:
   ```bash
   npm run version:bump 0.2.0-beta.1
   ```

2. Modify workflow to mark as prerelease:
   ```yaml
   prerelease: true
   ```

## Troubleshooting

### Release Not Created

**Check:**
1. Version changed in at least one config file?
2. Tag already exists? (Run `git tag -l`)
3. GitHub Actions enabled? (Check repo settings)

**Solution:**
```bash
# Delete existing tag if needed
git tag -d v0.2.0
git push origin :refs/tags/v0.2.0

# Push again
git push origin main
```

### Build Failed

1. Check Actions tab for error logs
2. Common issues:
   - Linting errors (fails before build)
   - Dependency issues (clear cache)
   - Platform-specific bugs

### Auto-updater Not Working

1. Ensure `latest.json` exists in release
2. Check pubkey matches in `tauri.conf.json`
3. Verify GitHub repo URL is correct
4. Check app version is older than release

## Manual Release (Fallback)

If automation fails, create release manually:

```bash
# 1. Create tag
git tag v0.2.0
git push origin v0.2.0

# 2. Go to GitHub Actions
# 3. Wait for build to complete
# 4. Go to Releases
# 5. Edit and publish the release
```

## Security: Code Signing

For production releases, configure code signing:

### macOS

Add to GitHub Secrets:
- `APPLE_CERTIFICATE`
- `APPLE_CERTIFICATE_PASSWORD`
- `APPLE_ID`
- `APPLE_PASSWORD`
- `APPLE_TEAM_ID`

### Windows

Add to GitHub Secrets:
- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`

See [Tauri Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos) for details.

## Best Practices

1. ✅ **Update CHANGELOG** - Always document changes
2. ✅ **Test locally** - Run `npm run tauri:build` before releasing
3. ✅ **Use semantic versioning** - Follow version conventions
4. ✅ **Review changes** - Check diff before committing
5. ✅ **Monitor builds** - Watch GitHub Actions for failures
6. ✅ **Test installers** - Download and test after release

## CI/CD Costs

### GitHub Free Tier
- 2,000 minutes/month (private repos)
- Unlimited (public repos)

### Per Release
- ~50 minutes (3 platforms + lint)
- ~12 MB artifacts

### Estimate
- ~40 releases/month on free tier (private repos)
- Unlimited on public repos

## Next Steps

- [ ] Configure code signing for distribution
- [ ] Add automated tests to workflow
- [ ] Set up release notes automation
- [ ] Configure crash reporting
- [ ] Add download statistics

## Resources

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Tauri Updater](https://tauri.app/v1/guides/distribution/updater/)
- [GitHub Actions](https://docs.github.com/en/actions)
