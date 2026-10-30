---
name: release
description: Release a Card Finisher version to GitHub Pages - preflight, version bump, merge to main, tag, live-site check, start the next dev branch. Only after Rich's UAT has passed and he has said go.
disable-model-invocation: true
argument-hint: "[X.Y.Z]"
---

# Release $ARGUMENTS

Pushing `main` updates the live site at https://rberrill.github.io/p1hunt_card_finisher/. **Stop and ask** if Rich hasn't said go in this conversation, or if `tests/UAT-X.Y.md` isn't signed off as Ship. That sign-off covers its cases and the pre-release smoke test, run on the dev build; (HTTPS) rows wait for step 4.

Branches: `main` is the release branch (served by Pages). Work happens on `dev/X.Y`, or on `fix/<name>` for a patch. Both are branched from `main`.

## 1. Preflight (on the dev or fix branch)

- `git fetch origin`. Rich sometimes edits on GitHub (CNAME, settings). If `git log HEAD..origin/main` shows anything, merge `origin/main` in first.
- The working tree is clean.
- Run the `verify` skill at full scope. Everything passes.
- Privacy audit: `git diff --stat vPREV..HEAD` and `git ls-files`. Nothing local-only is tracked (`CLAUDE.local.md`, `tests/UAT-*.md`, `tests/uat/`, `archive/`, `.claude/settings.local.json`), and every new file is meant to be public.

## 2. Version commit

- `node .claude/skills/release/set-version.js X.Y.Z` sets `appVersion` in `js/config.js` and every `?v=` in `index.html`.
- CHANGELOG: `## [X.Y.0] - Unreleased` becomes `## [X.Y.Z] - YYYY-MM-DD`. Update the README if features or usage changed.
- Local (the `uat` skill): record Rich's sign-off in `tests/UAT-X.Y.md`, then merge its 🆕, changed and retired cases into `tests/uat/catalog.md`.
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
subfolder; 390×844, 375×667, 1280×800. UAT and smoke passed on the dev build
(desktop localhost + iPhone Safari over the LAN; Rich, YYYY-MM-DD).

Caught during the work:
- <bug found before release, and the test that now guards it>

Decisions: decision-log.md, YYYY-MM-DD entries.

Co-Authored-By: …
```

## 4. Live check

Pages takes a minute or two to deploy, and caches files for about 10 minutes.

1. **Claude:** open `https://rberrill.github.io/p1hunt_card_finisher/?selftest=1` in the preview, refreshing the assets with `fetch(url, {cache: 'reload'})` as needed. Check that:
   - the console reads `vX.Y.Z`;
   - the toast shows main and worker self-tests passing;
   - there are no CSP errors.

   Then tell Rich it's ready for his live check.
2. **Rich:** follow the "After deploy" section of `tests/UAT-X.Y.md`:
   - the smoke test again, filling in the **Live** column, on desktop and iPhone;
   - the version's (HTTPS) rows;
   - Keep or Roll back.

**Roll back** only on Rich's go-ahead:
1. On `main`, run `git revert -m 1 <release merge>`, then `git push origin main`. Pages redeploys the previous version.
2. Leave the `vX.Y.Z` tag; it records what was released.
3. Fix on `fix/<name>` from `main`. That branch must first `git revert` the revert commit, or the release's changes won't come back when it merges.
4. Release the fix as `X.Y.Z+1`.
5. Log the rollback in `decision-log.md`.

## 5. Start the next version

- `git checkout -b dev/X.Y+1 main`.
- `node .claude/skills/release/set-version.js X.Y+1.0-dev`.
- Add `## [X.Y+1.0] - Unreleased` above the release in the CHANGELOG.
- Commit `Start X.Y+1.0-dev`. Push `dev/X.Y+1` for backup (`git push -u origin dev/X.Y+1`).
- Local: start `tests/UAT-X.Y+1.md` (the `uat` skill: header, empty scope, setup, smoke test) and move the released version's file to `archive/`.

For a **patch** from `fix/<name>`: merge it into `main` as above, then merge `main` into the open `dev/` branch so the fix isn't lost.

## 6. Record

- Add a dated `decision-log.md` entry: released, the live-check results, the next dev branch.
- Update the "Waiting on" line in `CLAUDE.local.md`.
