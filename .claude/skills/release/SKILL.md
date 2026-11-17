---
name: release
description: Release a Card Finisher version to GitHub Pages - preflight, version bump, annotated tag on main, move the release branch to the tag, live-site check, rollback if needed, start the next version. Only after the phone checklist has passed on the UAT site and Rich has said go.
disable-model-invocation: true
argument-hint: "[X.Y.Z]"
---

# Release $ARGUMENTS

**Stop and ask** if Rich hasn't said go in this conversation, or if any of these is not true (the `test` skill):

- the newest checklist in `tests/checklists/` is for the build being released (no app file changed since), is filled in, and its result is Pass;
- every open row in `tests/bugs.md` has the Decision "Open for now" (Rich reviewed it and it may ship): none reads "Fix" or "Not reviewed";
- `tests/catalog/find-out.md` has no item a case in this release is waiting on.

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
- `node tests/selftest.js` passes.
- The full run passes (from `tests/`: `CARD_FINISHER_FULL=1 npx playwright test`): no unexpected failure. Note its totals for the tag message.
- Privacy audit: `git diff --stat vPREV..HEAD` and `git ls-files`. Nothing local-only is tracked (`CLAUDE.local.md`, `archive/`, `tests/runs/`, `tests/node_modules/`, `.claude/settings.local.json`), and every new file is meant to be public.

## 2. Version commit

- `node .claude/skills/release/set-version.js X.Y.Z` sets `appVersion` in `js/config.js` and every `?v=` in `index.html`.
- CHANGELOG: `## [X.Y.0] - Unreleased` becomes `## [X.Y.Z] - YYYY-MM-DD`. Update the README if features or usage changed.
- `node tests/selftest.js`, then commit `X.Y.Z: version, changelog date` (with `Catalog: none (version only)`) and `git push origin main`. Only the version changed since the checklist passed, so the phone pass stands.

## 3. Tag and deploy

```
git tag -a vX.Y.Z -F <message file>
git push origin refs/tags/vX.Y.Z
git push origin vX.Y.Z^{commit}:refs/heads/release
```

The last push is a fast-forward of `release` to the tag; Pages redeploys from it. If git refuses it as non-fast-forward, stop and ask.

**Never `git push --tags`**; push one tag at a time. A pushed `v*` tag can't be moved or deleted (a GitHub ruleset), so check the tag points at the right commit before pushing it. A wrong tag that's already pushed is fixed by releasing the next patch, not by re-tagging.

The annotated tag's message is the release's **technical record** (`git show vX.Y.Z`):

```
Release X.Y.Z

<one line: what this release is>

Verified: selftest n/n; full run n case runs, 0 failed (Chromium and WebKit; phone, small
phone, desktop, file://). Phone checklist tests/checklists/<file> passed on the UAT site
(iPhone Safari; Rich, YYYY-MM-DD).

Open at release (Rich's decision): <BUG ids and severities, or none>

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
2. **Claude:** run the cases against the live site (from `tests/`: `CARD_FINISHER_URL=https://rberrill.github.io/p1hunt_card_finisher/ npx playwright test`) and report the totals.
3. **Rich:** Part B of the checklist (the main flow) on the live site, on the iPhone; then Keep or Roll back.

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

## Hotfix while `main` has unreleased work

1. `git checkout -b fix/<name> vX.Y.Z` (the live tag).
2. Fix it test-first (the `test` skill), run the full run, and set the version with `set-version.js X.Y.Z+1`. Update the CHANGELOG. Put the fix build on the UAT site (`/test uat`) and have Rich pass its checklist.
3. Tag `vX.Y.Z+1` on the fix branch and deploy it as in step 3. It's a fast-forward, since the fix descends from the live tag.
4. Merge `fix/<name>` into `main` (resolve the version and CHANGELOG to keep `main`'s `-dev` version and its Unreleased section above the new patch). Push `main`, then delete the fix branch.

## 6. Record

- Add a dated `decision-log.md` entry: released, the live-check results.
- Update the "Waiting on" line in `CLAUDE.local.md`.
