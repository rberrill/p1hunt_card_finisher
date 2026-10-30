---
name: release
description: Release a Card Finisher version to GitHub Pages - preflight, version bump, merge to main, tag, live-site check, start the next dev branch. Only after Rich's UAT has passed and he has said go.
disable-model-invocation: true
argument-hint: "[X.Y.Z]"
---

# Release $ARGUMENTS

Pushing `main` updates the live site at https://rberrill.github.io/p1hunt_card_finisher/. **Stop and ask** if Rich hasn't said go in this conversation, or if `tests/UAT-X.Y.md` isn't signed off as Ship.

Branches: `main` is the release branch (served by Pages). Work happens on `dev/X.Y`, or on `fix/<name>` for a patch. Both are branched from `main`.

## 1. Preflight (on the dev or fix branch)

- `git fetch origin`. Rich sometimes edits on GitHub (CNAME, settings). If `git log HEAD..origin/main` shows anything, merge `origin/main` in first.
- The working tree is clean.
- Run the `verify` skill at full scope. Everything passes.
- Privacy audit: `git diff --stat vPREV..HEAD` and `git ls-files`. Nothing local-only is tracked (`CLAUDE.local.md`, `tests/UAT-*.md`, `archive/`, `.claude/settings.local.json`), and every new file is meant to be public.

## 2. Version commit

- `node .claude/skills/release/set-version.js X.Y.Z` sets `appVersion` in `js/config.js` and every `?v=` in `index.html`.
- CHANGELOG: `## [X.Y.0] - Unreleased` becomes `## [X.Y.Z] - YYYY-MM-DD`. Update the README if features or usage changed.
- Local: fold the UAT's "New in X.Y" part into the core (the `uat` skill).
- `node tests/selftest.js`, then commit `X.Y.Z: version, changelog date`.

## 3. Merge, push, tag

```
git checkout main
git pull --ff-only origin main
git merge --no-ff dev/X.Y
git push origin main
git tag vX.Y.Z
git push origin refs/tags/vX.Y.Z
```

**Never `git push --tags`**; push one tag at a time.

The merge commit message is the release's **technical record**, since there's no VERSION file:

```
Release X.Y.Z

<one line: what this release is>

Verified: selftest n/n; regression n/n; file:// (main n/n, worker n/n, no off-site requests);
subfolder; 390×844, 375×667, 1280×800. UAT passed on desktop + iPhone Safari (Rich, YYYY-MM-DD).

Caught during the work:
- <bug found before release, and the test that now guards it>

Decisions: decision-log.md, YYYY-MM-DD entries.

Co-Authored-By: …
```

## 4. Live check

Pages takes a minute or two to deploy, and caches files for about 10 minutes. Open `https://rberrill.github.io/p1hunt_card_finisher/?selftest=1` in the preview, refreshing the assets with `fetch(url, {cache: 'reload'})` as needed. Check that:
- the console reads `vX.Y.Z`;
- the toast shows main and worker self-tests passing;
- there are no CSP errors.

## 5. Start the next version

- `git checkout -b dev/X.Y+1 main`.
- `node .claude/skills/release/set-version.js X.Y+1.0-dev`.
- Add `## [X.Y+1.0] - Unreleased` above the release in the CHANGELOG.
- Commit `Start X.Y+1.0-dev`. Push `dev/X.Y+1` for backup (`git push -u origin dev/X.Y+1`).
- Local: start `tests/UAT-X.Y+1.md` (the `uat` skill).

For a **patch** from `fix/<name>`: merge it into `main` as above, then merge `main` into the open `dev/` branch so the fix isn't lost.

## 6. Record

- Add a dated `decision-log.md` entry: released, the live-check results, the next dev branch.
- Update the "Waiting on" line in `CLAUDE.local.md`.
