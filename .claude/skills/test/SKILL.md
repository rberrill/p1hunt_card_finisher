---
name: test
description: Card Finisher's testing process - keep the catalog current with every change, run the automated cases, start or refresh a UAT round on the UAT site, and handle the phone checklist's results. Use when proposing, building or fixing anything in js/, css/ or index.html, before a commit, when Rich asks for a UAT build, and as the release preflight.
argument-hint: "[uat | refresh]"
---

# Test

Rich approved this process on 2026-11-15 (the report "Card Finisher Testing Redesign"; the
decision log has the entries). Lines marked *Claude's call* are working habits, not his rules.

## The pieces

| Piece | Where | What it is |
|---|---|---|
| The catalog | `tests/catalog/`, one file per area | Every capability of the app, each with its test cases. Its `README.md` is the format and the language standard; `rulings.md`, `wording.md`, `find-out.md`, `retired.md` and `journeys.md` sit beside it |
| The automated cases | `tests/automation/` (Playwright) | One test for each automated case, titled with the case's ID. `tests/README.md` says how to install and run them |
| The selftest | `node tests/selftest.js` | Engine, security, privacy and style checks, and the catalog check: every entry well formed, every anchor in the code, one test per automated case, and no control or message in the code that no entry claims |
| The bugs | `tests/bugs.md` | One row per open defect. A test for a ruling the app doesn't meet starts with `test.fail(true, 'BUG-0NN')` |
| The UAT site | https://rberrill.github.io/p1hunt_card_finisher_uat/ | Unreleased builds over HTTPS, so a phone can run everything before a release |
| The phone checklist | `tests/checklists/<version>_<commit>.md` | What Rich runs on his iPhone: Part A the phone cases of what changed, Part B the main flow, Part C the find-out items |

## The catalog is part of done

A feature, an enhancement or a bug fix is finished only when the catalog matches it
(Rich, 2026-11-17). In the same change as the code:

1. **Before the code:** write or change the catalog entries and cases (`tests/WRITING-CASES.md`
   is the writers' guide). A new capability gets an entry; a changed one gets its `Changed`
   field and its cases updated; a removed one moves to `retired.md`.
2. **Test first:** write each automated case's test and see it fail for the right reason. For a
   bug, that is a row in `tests/bugs.md` and a test marked `test.fail(true, 'BUG-0NN')`.
3. **Build**, then remove the `test.fail` mark and close the bug's row. A marked test that
   passes fails the run, so a fix can't be forgotten.
4. **Run:** `node tests/selftest.js`, then the specs of every area the change touches
   (`cd tests`, `npx playwright test automation/<area>.spec.js`; one case:
   `npx playwright test -g "EXP-06.4"`).
5. **Commit** with a `Catalog:` line in the message (a hook checks it when app files changed):
   `Catalog: EXP-41 added; MSG-27 changed` or `Catalog: none (refactor, no behavior change)`.

New wording on screen needs Rich's approval before it is built (`wording.md`). A behavior
nobody has ruled on is asked, one question at a time, and recorded in `rulings.md`; things only
an iPhone can settle go in `find-out.md`, which puts them on the next checklist.

## Running the cases

| Run | Command (from `tests/`) | When |
|---|---|---|
| One area | `npx playwright test automation/<area>.spec.js` | While working on it |
| The complete run | `npx playwright test` | Before a UAT round, and after any change that crosses areas |
| The full run | `CARD_FINISHER_FULL=1 npx playwright test` | Release preflight: every case in WebKit too |
| Against a site | `CARD_FINISHER_URL=<address> npx playwright test` | To check a deployed build |

Each run writes `tests/runs/<time>_<version>_<commit>/` with `summary.md`, `results.json` and
a screenshot for every verdict. Report from `summary.md`: case runs, failures, known-defect
runs, time. Don't pass `--reporter`; it replaces the reporter that writes the summary.

A failure is a regression until shown otherwise. Fix the cause; or, when the change moved the
behavior on purpose, change the case and its test in the same change; or, when it is a defect
to fix later, open a row in `tests/bugs.md` and mark the test. Never weaken a check to make a
run pass.

## Agents

Delegated work goes to the four agents in `.claude/agents/` (Rich, 2026-11-17), never to a
general-purpose agent with a hand-written brief. Each file holds its role's standing rules,
so a brief only says what is particular: the area, bug or diff, the bug-number range, and
a port (`CARD_FINISHER_PORT`) no other run is using.

| Agent | Use it to | It can't |
|---|---|---|
| `case-writer` | Write or fix one area's catalog entries, cases and tests | Edit `js/`, `css/` or `index.html` (a hook blocks it) |
| `fixer` | Fix one bug or build one agreed ruling, test-first | Decide a design or a wording: it stops and reports |
| `reviewer` | Review cases, tests or a diff before the commit | Change anything (read-only tools) |
| `triage-tester` | Run cases and sort failures into defect, test fault, flaky, fixed | Edit anything but `tests/bugs.md` (a hook blocks it) |

None of them can start agents of its own, and none commits: check the report against the
diff and the selftest, then commit yourself.

How many at once: one `case-writer` or `fixer` at a time (Rich, 2026-11-16: several writers
at once hit his usage limit and collided; Rich, 2026-11-17: five fixers at once, each in
its own worktree, loaded the machine until WebKit cases timed out and one run hung, so
fixers went back to one at a time). The fixer works in the main checkout under its standing
rules; the next one starts only when this one is reviewed and committed. Two or three bugs on
the same flow go to the same fixer in one brief, never a whole area's worth (Rich,
2026-11-17: not for speed, but so the same flow is not retested fix after fix). One reviewer then reads the whole diff, and it is one commit naming every bug. A fixer
never runs the complete run: it runs its areas' specs and the related cases only. The main
session runs the complete run once, when every fix of a cycle is in, to find what isn't fixed and any regression (Rich, 2026-11-17: a complete
run per fix repeats nine minutes of tests each time). Several
`triage-tester` or `reviewer` runs in parallel are fine where it helps; say what it will
cost first. The usual chain for a bug: `case-writer` (if no test fails for it yet), `fixer`,
`reviewer`, commit.

## `/test uat`: start a UAT round

Rich running this is his go-ahead for the push to the UAT repository.

1. `main` is committed and pushed, and `node tests/selftest.js` passes.
2. The complete run has no unexpected failure. Stop and report if it has.
3. If app files changed since the last UAT build, raise the dev number so the phone can tell
   the builds apart (*Claude's call*):
   `node .claude/skills/release/set-version.js X.Y.Z-dev.N`, commit, push.
4. `node tests/tools/publish-uat.js` copies the app's files into the UAT repository's checkout
   (beside this one) as one commit. Then push it:
   `git -C ../p1hunt_card_finisher_uat push origin main`.
5. Pages takes a minute or two. Check the site serves the build: open it, and read the version
   line in Export's options.
6. `node tests/tools/make-checklist.js` writes the checklist (`--all` puts every phone case in
   Part A; use it only when Rich asks). Commit it, push `main`, and send Rich the file.

## `/test refresh`: put the current build on the UAT site

For trying work in progress on the phone. No checklist, no complete run.

1. `node tests/selftest.js` passes, and so do the specs of the areas being worked on.
2. Steps 3 to 5 of a UAT round.
3. Tell Rich the version and commit now on the site.

## Bugs: rate, review with Rich, then fix

Rich's rule (2026-11-17): every bug gets a severity when it is opened, and nothing is fixed
until he has reviewed the run's bugs and said which to fix.

1. **Rate.** Whoever opens a row in `tests/bugs.md` gives it a Severity (Critical, High,
   Medium, Low; his definitions are at the top of that file) and the Decision "Not reviewed".
2. **Review.** When a run or a phone checklist is finished, put all of its "Not reviewed"
   rows to Rich before any fix: a table, most severe first, with the ID, the severity, what
   happens in one line, and your recommendation (Fix or Open for now). He confirms Fix or
   Open for now for each, and may change a severity. Ask by severity group, one picker at a
   time, and let him name the exceptions (*Claude's call* on the grouping).
3. **Record** his answer in each row's Decision.
4. **Fix** only rows that read "Fix", most severe first, test-first as above. A row that
   reads "Open for now" keeps its `test.fail` mark and may ship; the release tag's message
   lists those.

## When the checklist comes back

- A failed case: a row in `tests/bugs.md` with the checklist's file name, the case, what
  Rich saw and a severity. It joins the bug review above; it is not fixed until he says so.
- A Part C answer: write it into the case that was waiting, add a ruling if the answer is a
  decision, and delete the item from `find-out.md`.
- Commit the filled-in checklist; it is the record of the round. The release tag's message
  cites it.

A real iPhone is the only judge of what Safari and iOS do (the share sheet, Photos, the
keyboard, safe areas). Playwright's WebKit is not Safari.
