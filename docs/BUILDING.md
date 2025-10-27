# Build Instructions

## Prerequisites

### All Platforms
- **Node.js**: v22.12.0 or higher ([Download](https://nodejs.org/))
- **Rust**: Latest stable version ([Install via rustup](https://rustup.rs/))

### Platform-Specific Requirements

#### Windows
- No additional requirements

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libx11-dev \
  libxdo-dev \
  libxcb1-dev
```

## Local Development Build

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run tauri:dev
```

### 3. Build for Production
```bash
npm run tauri:build
```

### Build Output Locations

**Windows:**
- Executable: `src-tauri/target/release/Langra.exe`
- MSI Installer: `src-tauri/target/release/bundle/msi/Langra_0.1.0_x64_en-US.msi`
- NSIS Installer: `src-tauri/target/release/bundle/nsis/Langra_0.1.0_x64-setup.exe`

**macOS:**
- App Bundle: `src-tauri/target/release/bundle/macos/Langra.app`
- DMG: `src-tauri/target/release/bundle/dmg/Langra_0.1.0_x64.dmg`

**Linux:**
- AppImage: `src-tauri/target/release/bundle/appimage/langra_0.1.0_amd64.AppImage`
- Deb: `src-tauri/target/release/bundle/deb/langra_0.1.0_amd64.deb`

## Automated Cross-Platform Builds (GitHub Actions)

### Automatic Builds on Push

The repository is configured with GitHub Actions to automatically build for all platforms when you push to the `main` branch or create a tag.

### Manual Build Trigger

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Build and Release** workflow
4. Click **Run workflow**
5. Select branch and click **Run workflow**

### Create a Release

To create a new release with installers for all platforms:

```bash
# Create and push a version tag
git tag v0.1.1
git push origin v0.1.1
```

This will:
1. Trigger GitHub Actions
2. Build for Windows, macOS, and Linux in parallel
3. Create a draft release on GitHub
4. Upload all installers as release assets

### Artifacts

After the workflow completes, you can find the built installers:
- Go to **Actions** tab
- Click on the completed workflow run
- Download artifacts from the **Artifacts** section

## Troubleshooting

### Windows: Missing Optional Dependencies

If you encounter errors about missing `@rollup/rollup-win32-x64-msvc` or `lightningcss-win32-x64-msvc`:

**Root Cause:** npm config `os` is set to a non-Windows value (common in Git Bash/MSYS environments)

**Solution:**
```bash
npm config delete os
rm -rf node_modules package-lock.json
npm install
```

See [WINDOWS_BUILD.md](./WINDOWS_BUILD.md) for more details.

### Build Times

First build times (approximate):
- **Frontend**: ~10 seconds
- **Rust compilation**: ~10-12 minutes (first time)
- **Subsequent builds**: ~2-3 minutes (cached)

### Cache

To speed up builds, Rust compilation is cached:
- **Local**: Cargo caches in `~/.cargo`
- **CI/CD**: GitHub Actions caches Rust dependencies automatically

## CI/CD Configuration

The GitHub Actions workflow (`.github/workflows/build.yml`) is configured to:

- ✅ Build on push to `main` branch
- ✅ Build on pull requests
- ✅ Build on version tags (`v*`)
- ✅ Allow manual workflow dispatch
- ✅ Run on Windows, macOS, and Linux in parallel
- ✅ Create draft releases for tagged versions
- ✅ Cache dependencies for faster builds

## Build Matrix

| Platform | Runner | Output Formats |
|----------|--------|----------------|
| Windows | `windows-latest` | `.exe`, `.msi`, `.exe` (NSIS) |
| macOS | `macos-latest` | `.app`, `.dmg` |
| Linux | `ubuntu-22.04` | `.AppImage`, `.deb` |

## Environment Variables

No environment variables are required for basic builds. If you add API keys or secrets, configure them in:
- Local: `.env` file (add to `.gitignore`)
- CI/CD: GitHub repository secrets

## Next Steps

1. **Commit the workflow:**
   ```bash
   git add .github/workflows/build.yml BUILD.md WINDOWS_BUILD.md
   git commit -m "ci: add cross-platform build workflow"
   git push
   ```

2. **Test the workflow:**
   - Push to GitHub
   - Go to Actions tab to see the builds

3. **Create your first release:**
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

Your app will automatically build for Windows, macOS, and Linux!
