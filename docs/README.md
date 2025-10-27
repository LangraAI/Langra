# Langra Documentation

Welcome to the Langra documentation! This folder contains comprehensive guides for building, troubleshooting, and deploying Langra.

## 📚 Documentation Index

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Building Guide](./BUILDING.md) - How to build on all platforms
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute

### Development
- [Code Style Guide](./CODE_STYLE.md) - Coding standards and rules
- [Building Guide](./BUILDING.md#local-development-build) - Development environment setup
- [CI/CD Guide](./CICD.md) - Automated builds and releases

### Operations
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes
- [CI/CD](./CICD.md) - GitHub Actions workflow details

## 🎯 Quick Links by Platform

### Windows Developers
1. [Windows Build Prerequisites](./BUILDING.md#windows)
2. [Windows Troubleshooting](./TROUBLESHOOTING.md#windows-missing-optional-dependencies)

### macOS Developers
1. [macOS Build Prerequisites](./BUILDING.md#macos)
2. [macOS Code Signing](./TROUBLESHOOTING.md#macos-code-signing-issues)

### Linux Developers
1. [Linux Build Prerequisites](./BUILDING.md#linux-ubuntudebian)
2. [Linux System Libraries](./TROUBLESHOOTING.md#linux-missing-system-libraries)

## 🚀 Quick Start Guide

### First Time Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd langra

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run tauri:dev
```

### Building for Distribution

```bash
# Build for your current platform
npm run tauri:build

# Output locations:
# Windows: src-tauri/target/release/bundle/
# macOS: src-tauri/target/release/bundle/
# Linux: src-tauri/target/release/bundle/
```

### Automated Multi-Platform Builds

```bash
# Push code to trigger automatic builds
git push origin main

# Or create a release
git tag v1.0.0
git push origin v1.0.0
```

See [CI/CD Guide](./CICD.md) for details.

## 🔧 Common Tasks

### I want to...

**...build the app locally**
→ See [Building Guide](./BUILDING.md)

**...fix build errors**
→ See [Troubleshooting](./TROUBLESHOOTING.md)

**...create a release**
→ See [CI/CD Guide](./CICD.md#creating-a-new-release)

**...set up automatic builds**
→ Already done! See [CI/CD Guide](./CICD.md)

**...contribute code**
→ See [Building Guide](./BUILDING.md) and create a PR

## 📖 Documentation Structure

```
docs/
├── README.md              # This file - documentation index
├── BUILDING.md            # How to build on all platforms
├── CODE_STYLE.md          # Coding standards and rules
├── RELEASE.md             # Release guide
├── CICD.md                # CI/CD workflow documentation
└── TROUBLESHOOTING.md     # Common issues and solutions

Root level:
├── CONTRIBUTING.md        # Contribution guidelines
├── CHANGELOG.md           # Version history
└── README.md              # Project overview
```

## 🆘 Need Help?

1. **Check the docs** - Search this documentation
2. **Search issues** - Check [existing issues](../../issues)
3. **Ask questions** - Open a [new issue](../../issues/new)

## 🤝 Contributing to Docs

Found an error or want to improve the docs?

1. Edit the relevant `.md` file
2. Submit a pull request
3. Docs are reviewed with code changes

## 📝 Conventions

- **Code blocks** - Always include language: ```bash, ```javascript, etc.
- **Links** - Use relative links for internal docs
- **Headers** - Use ## for main sections, ### for subsections
- **Emojis** - Use sparingly for visual organization

---

**Last Updated**: 2025-10-27
**Langra Version**: 0.1.0
