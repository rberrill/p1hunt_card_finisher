---
paths:
  - "README.md"
  - "CHANGELOG.md"
  - "SECURITY.md"
  - "docs/**"
  - "tests/README.md"
---

# Public docs

These files are published on GitHub for users and contributors.

- Write for a user or contributor: plain language, no internal working notes, no private addresses, local paths or personal details (selftest checks for addresses and paths).
- **CHANGELOG.md** follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and SemVer. Work in progress goes under `## [X.Y.0] - Unreleased` with `Added` / `Changed` / `Fixed` / `Removed` / `Security`. Add an entry with every user-visible change, in the user's words.
- **README.md**: update when features or usage change.
- **SECURITY.md**: update when what the app stores, or its protections, change.
- **docs/architecture.md** and **tests/README.md** describe stable structure. Don't record pass counts or per-release history in them; counts come from the test output, and history goes in the CHANGELOG and the release tag message.
