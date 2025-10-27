# Release Guide

## Quick Release

```bash
# 1. Bump version
npm run version:bump patch  # or minor, major

# 2. Commit and push
git add .
git commit -m "chore: release v0.2.0"
git push origin main
```

The workflow will automatically:
- Create a git tag
- Build for all platforms
- Publish the release
- Generate updater manifest

## Version Bumping

```bash
npm run version:bump patch   # 0.1.0 -> 0.1.1 (bug fixes)
npm run version:bump minor   # 0.1.0 -> 0.2.0 (new features)
npm run version:bump major   # 0.1.0 -> 1.0.0 (breaking changes)
```

Updates `package.json`, `Cargo.toml`, `tauri.conf.json`, and `CHANGELOG.md` automatically.

## Auto-Updater

Users get automatic updates on app startup. The app checks GitHub releases for newer versions.

Configuration in `src-tauri/tauri.conf.json`:
```json
"updater": {
  "active": true,
  "endpoints": ["..."],
  "dialog": true
}
```

## Manual Release

If needed, create releases manually:

```bash
git tag v0.2.0
git push origin v0.2.0
```

Then GitHub Actions will handle the rest.
