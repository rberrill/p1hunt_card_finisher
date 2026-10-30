---
name: release
description: Release a Card Finisher version to GitHub Pages - preflight, version bump, annotated tag on main, move the release branch to the tag, live-site check, rollback if needed, start the next version. Only after Rich's UAT has passed and he has said go.
disable-model-invocation: true
argument-hint: "[X.Y.Z]"
---

# Release $ARGUMENTS

**Stop and ask** if Rich hasn't said go in this conversation, or if `tests/UAT-X.Y.md` isn't signed off as Ship. That sign-off covers its cases and the pre-release smoke test, run on the dev build; (HTTPS) rows wait for step 4.

## Branches

| Branch | Role |
|---|---|
| `main` | All work, committed and pushed as you go. Pushing it never changes the live site. Releases are annotated tags on it (`vX.Y.Z`). |
| `release` | What GitHub Pages serves (https://rberrill.github.io/p1hunt_card_finisher/). **Never commit to it.** It only moves to a release tag. |
| `fix/<name>` | Only for a hotfix while `main` has unreleased work. Branched from the live tag. |

Edits Rich makes on GitHub's website go on `main`, never on `release`.

## 1. Preflight (on `main`)

- `git fetch origin`. If `git log HEAD..origin/main` shows anything (an edit on GitHub), `git pull --ff-only` first.
- The working tree is clean.
- `release` is an ancestor of `main`: `git merge-base --is-ancestor origin/release HEAD`. If not, stop and ask; something was committed to `release`.
- Run the `verify` skill at full scope. Everything passes.
- Privacy audit: `git diff --stat vPREV..HEAD` and `git ls-files`. Nothing local-only is tracked (`CLAUDE.local.md`, `tests/UAT-*.md`, `tests/uat/`, `archive/`, `.claude/settings.local.json`), and every new file is meant to be public.

## 2. Version commit

- `node .claude/skills/release/set-version.js X.Y.Z` sets `appVersion` in `js/config.js` and every `?v=` in `index.html`.
- CHANGELOG: `## [X.Y.0] - Unreleased` becomes `## [X.Y.Z] - YYYY-MM-DD`. Update the README if features or usage changed.
- Local (the `uat` skill): record Rich's sign-off in `tests/UAT-X.Y.md`, then merge its 🆕, changed and retired cases into `tests/uat/catalog.md`.
- `node tests/selftest.js`, then commit `X.Y.Z: version, changelog date` and `git push origin main`.

## 3. Tag and deploy

```
git tag -a vX.Y.Z -F <message file>
git push origin refs/tags/vX.Y.Z
git push origin vX.Y.Z^{commit}:refs/heads/release
```

The last push is a fast-forward of `release` to the tag; Pages redeploys from it. If git refuses it as non-fast-forward, stop and ask.

**Never `git push --tags`**; push one tag at a time.

The annotated tag's message is the release's **technical record** (`git show vX.Y.Z`):

```
Release X.Y.Z

<one line: what this release is>

Verified: selftest n/n; regression n/n; file:// (main n/n, worker n/n, no off-site requests);
subfolder; 390×844, 375×667, 1280×800. UAT and smoke passed on the dev build
(desktop localhost + iPhone Safari over the LAN; Rich, YYYY-MM-DD).

Caught during the work:
- <bug found before release, and the test that now guards it>

Decisions: decision-log.md, YYYY-MM-DD entries.
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
1. Move `release` back to the previous tag:
   ```
   git push --force-with-lease=release:vX.Y.Z^{commit} origin vPREV^{commit}:refs/heads/release
   ```
   The lease makes the push fail if `release` isn't where we left it. Pages redeploys the previous version.
   The `release` ruleset blocks force pushes for everyone not on its bypass list. If GitHub refuses the push with a rule violation, stop: Rich adds himself (Repository admin) to the ruleset's bypass list, then retry. Never disable the ruleset to get round it without his say.
2. `main` and the `vX.Y.Z` tag stay as they are; the tag records what was released.
3. Fix on `main`, then release `X.Y.Z+1` the normal way.
4. Log the rollback in `decision-log.md`.

## 5. Start the next version (on `main`)

- `node .claude/skills/release/set-version.js X.Y+1.0-dev`.
- Add `## [X.Y+1.0] - Unreleased` above the release in the CHANGELOG.
- Commit `Start X.Y+1.0-dev` and push `main`.
- Local: start `tests/UAT-X.Y+1.md` (the `uat` skill: header, empty scope, setup, smoke test) and move the released version's file to `archive/`.

## Hotfix while `main` has unreleased work

1. `git checkout -b fix/<name> vX.Y.Z` (the live tag).
2. Fix it, run `verify`, and set the version with `set-version.js X.Y.Z+1`. Update the CHANGELOG. Run a smoke test on the fix build.
3. Tag `vX.Y.Z+1` on the fix branch and deploy it as in step 3. It's a fast-forward, since the fix descends from the live tag.
4. Merge `fix/<name>` into `main` (resolve the version and CHANGELOG to keep `main`'s `-dev` version and its Unreleased section above the new patch). Push `main`, then delete the fix branch.

## 6. Record

- Add a dated `decision-log.md` entry: released, the live-check results.
- Update the "Waiting on" line in `CLAUDE.local.md`.
