# Changelog

## [0.1.4] - 2025-10-29

- Update release notes here

## [0.1.3] - 2025-10-29

- Update release notes here

## [0.1.2] - 2025-10-29

- Added MacOS signing

## [0.1.1] - 2025-10-27

### Added
- Tiered translation limits (Free: 64K/translation, Pro: 256K/translation)
- Dynamic progress indicator during translation
- Auto-release workflow with GitHub Actions
- Version bump automation script

### Changed
- Increased free tier monthly limit to 250K characters (was 50K)
- Updated Material Design styling across all components
- Improved settings menu with separate Preferences and API Keys dialogs

### Fixed
- Large text translations stopping mid-way (increased max_tokens)
- Progress percentage stuck at 0%
- Normal window flash when pressing Cmd+C+C
- GitHub Actions permission error for auto-release
- Logout option now in red color to distinguish destructive action

### Removed
- Unused Tailwind CSS dependencies
- Unused .env file and dotenvy dependency
- Unnecessary documentation files

## [0.1.0] - Initial Release

- Translation and text enhancement desktop app
- Keyboard shortcut support (Cmd+C+C)
- Multiple display modes (popup and window)
- Cross-platform support (Windows, macOS, Linux)
- Auto-update functionality
