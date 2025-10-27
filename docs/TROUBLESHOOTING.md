# Troubleshooting

Common issues and solutions when building Langra.

## Table of Contents

- [Windows: Missing Optional Dependencies](#windows-missing-optional-dependencies)
- [macOS: Code Signing Issues](#macos-code-signing-issues)
- [Linux: Missing System Libraries](#linux-missing-system-libraries)
- [General: Node.js Version Mismatch](#general-nodejs-version-mismatch)

---

## Windows: Missing Optional Dependencies

### Symptoms

Build errors mentioning missing native modules:
- `Cannot find module @rollup/rollup-win32-x64-msvc`
- `Cannot find native binding` for lightningcss
- `npm has a bug related to optional dependencies`

### Root Cause

This happens when npm config `os` is incorrectly set (common in Git Bash/MSYS environments). npm installs Linux binaries instead of Windows binaries.

### Solution

```bash
# Fix npm configuration
npm config delete os

# Clean reinstall
rm -rf node_modules package-lock.json
npm install

# Verify it's fixed
npm run build
```

### Verification

Check your npm config:
```bash
npm config get os
```

Should return `null` or be unset. Any other value (like `linux`) will cause issues.

---

## macOS: Code Signing Issues

### Symptoms

- Build succeeds but app won't open on other Macs
- "App is damaged" or "cannot be opened" errors
- Gatekeeper blocks the app

### Solution

For local development, allow unsigned apps:
```bash
xattr -cr "/path/to/Langra.app"
```

For distribution, you need an Apple Developer account to sign the app. See [Tauri macOS Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos).

---

## Linux: Missing System Libraries

### Symptoms

Build fails with errors about missing libraries:
- `libwebkit2gtk-4.1` not found
- `libappindicator3` not found
- `libxdo` not found

### Solution

Install required system libraries:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libx11-dev \
  libxdo-dev \
  libxcb1-dev
```

**Fedora:**
```bash
sudo dnf install \
  webkit2gtk4.1-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  patchelf \
  libX11-devel \
  libxdo-devel \
  libxcb-devel
```

**Arch Linux:**
```bash
sudo pacman -S \
  webkit2gtk \
  libappindicator-gtk3 \
  librsvg \
  patchelf \
  libx11 \
  xdotool \
  libxcb
```

---

## General: Node.js Version Mismatch

### Symptoms

- Vite warnings about unsupported Node.js version
- Build failures during frontend build
- "Unsupported engine" warnings

### Solution

Upgrade Node.js to v22.12.0 or higher:

**Using nvm:**
```bash
nvm install 22.12.0
nvm use 22.12.0
```

**Direct download:**
- https://nodejs.org/

### Verify

```bash
node --version  # Should be >= v22.12.0
```

---

## Still Having Issues?

1. **Check existing issues**: [GitHub Issues](../../issues)
2. **Clean install**:
   ```bash
   # Clean everything
   rm -rf node_modules package-lock.json
   rm -rf src-tauri/target

   # Reinstall
   npm install
   npm run tauri:build
   ```
3. **Check logs**: Build logs are in `src-tauri/target/`
4. **Open a new issue**: Include error logs and system info
