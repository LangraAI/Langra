<div align="center">

# Langra

**Instant translation and text enhancement for your desktop**

[![Build Status](https://img.shields.io/github/actions/workflow/status/ghaithalmasri/langra/build.yml?branch=main)](https://github.com/ghaithalmasri/langra/actions)
[![License](https://img.shields.io/github/license/ghaithalmasri/langra)](LICENSE)
[![Version](https://img.shields.io/github/v/release/ghaithalmasri/langra)](https://github.com/ghaithalmasri/langra/releases)

[Download](#installation) · [Features](#features) · [Documentation](./docs/) · [Contributing](./CONTRIBUTING.md)

</div>

---

## About

Langra is a lightweight desktop translation tool. Press **Cmd+C+C** to instantly translate selected text or enhance your writing with AI.

## Features

- ⚡ Instant translation with **Cmd+C+C** keyboard shortcut
- 🎨 Two display modes: popup and full window
- 🌍 Cross-platform support (Windows, macOS, Linux)
- 🔄 Auto-update functionality
- 🔐 Privacy-first: runs locally on your device

## Installation

Download the latest release for your platform:

- **macOS**: [Apple Silicon](https://github.com/ghaithalmasri/langra/releases/latest/download/Langra_aarch64.dmg) | [Intel](https://github.com/ghaithalmasri/langra/releases/latest/download/Langra_x64.dmg)
- **Windows**: [Installer](https://github.com/ghaithalmasri/langra/releases/latest/download/Langra_x64-setup.exe)
- **Linux**: [AppImage](https://github.com/ghaithalmasri/langra/releases/latest/download/langra_amd64.AppImage) | [DEB](https://github.com/ghaithalmasri/langra/releases/latest/download/langra_amd64.deb)

Or visit the [Releases](../../releases) page for all available downloads.

## Quick Start

1. Launch Langra
2. Select any text
3. Press **Cmd+C+C** (or **Ctrl+C+C** on Windows/Linux)
4. Translation appears instantly

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI
- **Backend**: Rust, Tauri 2.0
- **Build**: Vite 7

## Development

### Prerequisites

- Node.js 22.12.0+
- Rust (latest stable)

### Build from Source

```bash
# Clone repository
git clone https://github.com/ghaithalmasri/langra.git
cd langra

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build production app
npm run tauri:build
```

See [docs/BUILDING.md](./docs/BUILDING.md) for detailed instructions.

## Documentation

- [Building Guide](./docs/BUILDING.md) - Build instructions
- [Code Style](./docs/CODE_STYLE.md) - Coding standards
- [Contributing](./CONTRIBUTING.md) - How to contribute
- [Release Guide](./docs/RELEASE.md) - Creating releases
- [CI/CD](./docs/CICD.md) - Automated builds

## Code Signing Policy

Windows releases are code signed with a certificate provided by [SignPath Foundation](https://signpath.org/).

**Certificate:** Free code signing provided by [SignPath.io](https://signpath.io/), certificate by SignPath Foundation

**Team Roles:**
- **Committers/Reviewers:** [@ghaithalmasri](https://github.com/ghaithalmasri)
- **Approvers:** [@ghaithalmasri](https://github.com/ghaithalmasri)

macOS releases are signed and notarized by Ghaith Almasri using an Apple Developer ID certificate.

## Privacy Policy

This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.

Langra operates entirely locally on your device. No user data is collected, stored, or transmitted to external servers operated by the Langra project.

**AI Provider Options:**
- **Your own API keys:** Translation services use your configured AI provider (OpenAI, Anthropic, etc.), subject to their respective privacy policies.
- **Langra-provided models:** For users without API keys, Langra provides access to Azure OpenAI models. In this case, translated text is sent to Azure OpenAI services operated by the Langra project, subject to [Microsoft Azure's privacy policy](https://privacy.microsoft.com/en-us/privacystatement).

## Contributing

Contributions are welcome! Please read the [contributing guide](./CONTRIBUTING.md) before submitting pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

Built with [Tauri](https://tauri.app/) · [React](https://react.dev/) · [Material-UI](https://mui.com/)

[Report Bug](../../issues) · [Request Feature](../../issues)

</div>
