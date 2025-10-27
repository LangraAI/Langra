#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Usage:
 *   npm run version:bump patch   # 0.1.0 -> 0.1.1
 *   npm run version:bump minor   # 0.1.0 -> 0.2.0
 *   npm run version:bump major   # 0.1.0 -> 1.0.0
 *   npm run version:bump 1.2.3   # Set specific version
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get bump type from command line
const bumpType = process.argv[2];

if (!bumpType) {
  console.error('❌ Error: Please specify bump type (patch|minor|major) or version number');
  console.log('\nUsage:');
  console.log('  npm run version:bump patch   # 0.1.0 -> 0.1.1');
  console.log('  npm run version:bump minor   # 0.1.0 -> 0.2.0');
  console.log('  npm run version:bump major   # 0.1.0 -> 1.0.0');
  console.log('  npm run version:bump 1.2.3   # Set specific version');
  process.exit(1);
}

// Read current version from package.json
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Current version: ${currentVersion}`);

// Calculate new version
let newVersion;

if (bumpType.match(/^\d+\.\d+\.\d+$/)) {
  // Specific version provided
  newVersion = bumpType;
} else {
  // Bump type provided (patch, minor, major)
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (bumpType) {
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    default:
      console.error(`❌ Error: Invalid bump type "${bumpType}". Use: patch, minor, major, or a version number.`);
      process.exit(1);
  }
}

console.log(`🎯 New version: ${newVersion}`);

// Update package.json
console.log('\n📝 Updating package.json...');
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('   ✅ package.json updated');

// Update Cargo.toml
console.log('📝 Updating Cargo.toml...');
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(
  /^version = ".*"$/m,
  `version = "${newVersion}"`
);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log('   ✅ Cargo.toml updated');

// Update tauri.conf.json
console.log('📝 Updating tauri.conf.json...');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
tauriConf.version = newVersion;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log('   ✅ tauri.conf.json updated');

// Update CHANGELOG.md
console.log('📝 Updating CHANGELOG.md...');
const changelogPath = path.join(rootDir, 'CHANGELOG.md');
let changelog = fs.readFileSync(changelogPath, 'utf8');

const today = new Date().toISOString().split('T')[0];

// Check if there's an [Unreleased] section to move
if (changelog.includes('## [Unreleased]')) {
  // Add new version section after Unreleased
  const unreleasedIndex = changelog.indexOf('## [Unreleased]');
  const nextSectionIndex = changelog.indexOf('\n## ', unreleasedIndex + 1);

  const newSection = `\n## [${newVersion}] - ${today}\n`;

  if (nextSectionIndex !== -1) {
    changelog = changelog.slice(0, nextSectionIndex) + newSection + changelog.slice(nextSectionIndex);
  } else {
    changelog += newSection;
  }

  // Update version comparison links at the bottom
  const linksSection = changelog.match(/\[Unreleased\]:.*\n/);
  if (linksSection) {
    const oldLink = linksSection[0];
    const repoUrl = oldLink.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+/)?.[0];

    if (repoUrl) {
      const newLinks = `[Unreleased]: ${repoUrl}/compare/v${newVersion}...HEAD\n[${newVersion}]: ${repoUrl}/releases/tag/v${newVersion}\n`;
      changelog = changelog.replace(oldLink, newLinks);
    }
  }

  fs.writeFileSync(changelogPath, changelog);
  console.log('   ✅ CHANGELOG.md updated');
} else {
  console.log('   ⚠️  No [Unreleased] section found in CHANGELOG.md - skipped');
}

console.log(`\n✨ Version bumped successfully: ${currentVersion} → ${newVersion}`);
console.log('\n📋 Next steps:');
console.log('   1. Review the changes');
console.log('   2. git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md');
console.log(`   3. git commit -m "chore: release v${newVersion}"`);
console.log(`   4. git tag v${newVersion}`);
console.log('   5. git push origin main --tags');
