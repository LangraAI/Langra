# Release Quick Start

## Create a New Release (3 Steps)

### 1. Bump Version

```bash
# For bug fixes
npm run version:bump patch

# For new features
npm run version:bump minor

# For breaking changes
npm run version:bump major
```

### 2. Commit Changes

```bash
git add .
git commit -m "chore: release v0.2.0"
```

### 3. Push to Main

```bash
git push origin main
```

**Done!** 🎉

Your release will be:
- ✅ Automatically built for Windows, macOS, Linux
- ✅ Published to GitHub Releases
- ✅ Available for auto-update in ~15-18 minutes

## What Happens Automatically

```
npm run version:bump patch
    ↓
Updates: package.json, Cargo.toml, tauri.conf.json, CHANGELOG.md
    ↓
git commit + push
    ↓
Auto-release workflow creates tag
    ↓
Build workflow starts (3 platforms in parallel)
    ↓
Release published with installers
    ↓
Users get auto-update notification
```

## Version Bump Examples

```bash
# 0.1.0 -> 0.1.1
npm run version:bump patch

# 0.1.0 -> 0.2.0
npm run version:bump minor

# 0.1.0 -> 1.0.0
npm run version:bump major

# Set specific version
npm run version:bump 1.2.3
```

## Manual Version Update

If you prefer to update manually:

1. Edit 3 files:
   - `package.json` → `"version": "0.2.0"`
   - `src-tauri/Cargo.toml` → `version = "0.2.0"`
   - `src-tauri/tauri.conf.json` → `"version": "0.2.0"`

2. Update `CHANGELOG.md`

3. Commit and push

## Check Release Status

1. Go to **GitHub Actions** tab
2. Watch the build progress
3. Check **Releases** page after ~15-18 minutes

## Full Documentation

See [docs/RELEASE.md](./docs/RELEASE.md) for complete guide including:
- Auto-updater configuration
- Code signing setup
- Troubleshooting
- Pre-releases
- Best practices
