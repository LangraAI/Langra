<div align="center">

# Langra

**Translation and text enhancement desktop application**

[![Build Status](https://img.shields.io/github/actions/workflow/status/USERNAME/langra/build.yml?branch=main)](https://github.com/USERNAME/langra/actions)
[![License](https://img.shields.io/github/license/USERNAME/langra)](LICENSE)
[![Version](https://img.shields.io/github/v/release/USERNAME/langra)](https://github.com/USERNAME/langra/releases)

[Features](#features) · [Installation](#installation) · [Documentation](#documentation) · [Contributing](#contributing)

</div>

---

## About

Langra is a lightweight desktop application for translation and text enhancement. Built with Tauri for performance and cross-platform compatibility.

## Features

- Real-time translation
- Text enhancement capabilities
- Keyboard shortcut support
- Multiple display modes (popup/window)
- Active window detection
- Cross-platform support (Windows, macOS, Linux)

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI, Tailwind CSS
- **Backend**: Rust, Tauri 2.0
- **Build**: Vite 7, TypeScript 5.8

## Installation

### Download

Pre-built binaries are available for:
- **Windows**: MSI and NSIS installers
- **macOS**: DMG installer
- **Linux**: AppImage and DEB packages

Download the latest release from the [Releases](../../releases) page.

### Build from Source

**Prerequisites:**
- Node.js 22.12.0 or higher
- Rust (latest stable)

**Steps:**

```bash
# Clone repository
git clone <repository-url>
cd langra

# Install dependencies
npm install

# Development build
npm run tauri:dev

# Production build
npm run tauri:build
```

See [docs/BUILDING.md](./docs/BUILDING.md) for detailed instructions.

## Usage

1. Launch the application
2. Configure keyboard shortcuts in settings
3. Select text and use shortcuts for translation/enhancement
4. View results in popup or window mode

## Documentation

- [Building Guide](./docs/BUILDING.md) - Build instructions for all platforms
- [Code Style Guide](./CODE_STYLE.md) - Coding standards and rules
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [CI/CD](./docs/CICD.md) - Automated build workflow

## Development

### Project Structure

```
langra/
├── src/                    # React frontend
├── src-tauri/             # Rust backend
├── docs/                  # Documentation
├── .github/workflows/     # CI/CD
└── public/                # Static assets
```

### Available Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Build frontend
npm run tauri:dev    # Run app in development
npm run tauri:build  # Build production app
```

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting pull requests.

### Quick Start

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

See the contributing guide for detailed guidelines.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

Built with:
- [Tauri](https://tauri.app/) - Desktop application framework
- [React](https://react.dev/) - UI framework
- [Material-UI](https://mui.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## Support

- Check [documentation](./docs/) for guides
- Search [existing issues](../../issues) before creating new ones
- Open an [issue](../../issues/new) for bugs or feature requests

---

<div align="center">

**[Website](#) · [Documentation](./docs/) · [Report Bug](../../issues) · [Request Feature](../../issues)**

</div>
