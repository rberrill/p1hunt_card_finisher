---
name: sweep
description: Audit the project's instructions and docs (CLAUDE.md, rules, skills, agents, hooks, settings, every Markdown file and the comments in the code) for conflicts, orphaned to-dos and lists, rules that cost more than they earn, dead references, duplicates, rules with no source, stale text, and instructions that fight how Claude Code works. Reports in chat, then takes Rich through the findings one at a time. Changes nothing without his approval on that item. Only when Rich runs /sweep.
disable-model-invocation: true
argument-hint: "[full | followup]"
---

# Sweep

Rich typed `/sweep $ARGUMENTS`. With no argument this is the **scan**; with `full` it is the
**full sweep** (see Depth); with `followup` it is no sweep at all, only the walk through the
follow-up list (see `/sweep followup`).

**What Rich set (2026-11-17, in an interview of eleven questions):** the scope, the kinds of
finding, the cost test for a blocking rule, the report in chat, an edit made as each item is
approved, the ledger of kept items, the two depths, what to do about files that can't be read,
the edit limits, and the grouping of obvious fixes. The steps, the search patterns, the order
and the formats are Claude's way of meeting that.

## The rule

**Nothing is changed, removed or added without Rich's approval of that item** (or of its
group). Until the walk-through the sweep only reads: no edit, however obvious, and none to its
own ledger. An approval covers the exact text shown with it and nothing else.

The sweep audits the text, not the product. A settled product decision is not reopened on its
merits; it is a finding only when another line contradicts it, or when it meets one of the
kinds below.

## What it reads

| Tier | Files | How |
|---|---|---|
| A: what steers the work | `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/`, `.claude/skills/` (this one too), `.claude/agents/`, `.claude/hooks/`, `.claude/settings*.json`; `tests/README.md`, `tests/WRITING-CASES.md`, `tests/catalog/README.md`, `docs/`, `README.md`, `SECURITY.md`, `CHANGELOG.md`; the ledgers `tests/bugs.md` and the catalog's `rulings.md`, `wording.md`, `find-out.md`, `retired.md`; `../../decision-log.md` and `../../feature-requests/` | In full, by the main session, at both depths |
| B: everything else | The catalog's area files, `tests/checklists/`, and the comments in `js/`, `css/`, `index.html`, `tests/*.js`, `tests/automation/`, `tests/tools/` and the scripts under `.claude/` | Scan: searched by pattern, hits read in context. Full: read in full by agents |
| Never | `.git/`, `tests/node_modules/`, `tests/runs/`, `tests/test-results/`, `tests/playwright-report/`, `archive/`, `samples/` | |

**A file that isn't there** (in a cloud session: `CLAUDE.local.md`, the decision log, the
feature requests) does not stop the sweep. The report opens with what could not be read, and a
finding that needs one of those files to settle (a rule with no source, a superseded decision)
is listed as **unverified here**, not raised.

## The kinds of finding

| Kind | What it is |
|---|---|
| Conflict | Two lines that can't both be followed, or a line and what a hook, script or setting really does |
| Harness fight | An instruction that contradicts how Claude Code works in the session: its tools, the session's own instructions (branches, commits, questions, where files live), how rules, skills and agents load. A line can hold on Rich's machine and fail in a cloud session, or the other way round: say which |
| Blocking rule | A never, don't, must, always or only that has a **concrete cost**: an extra step, a blocked tool, a forced question, work done twice. Inventory every such line; report only those whose cost can be named, with who set it (Rich and the date, Claude's call, or no source). Rich's dated decisions and the hard constraints are included, marked as his |
| Over-instruction | Text that makes Claude slower or more hesitant than intended: repeated emphasis, one rule restated in several files, a step that forces a question where a sensible default exists, a file so long its important lines get lost |
| Rule with no source | A line that constrains the product or the process with no decision of Rich's behind it, and not marked as Claude's ("A rule needs a source" in `CLAUDE.md`) |
| Orphaned to-do or list | A TODO or "not yet", an unticked box, a list with a missing or unfinished item, a "Waiting on" whose blocker is gone, a find-out item whose case is gone, a FIX ruling with no case and no bug, a bug row whose state doesn't match its test's mark |
| Stale or superseded | Text about something that is gone or finished, per-version history or counts in a doc, a note overtaken by a later decision, wording two sessions could read two ways |
| Duplicate or wrong home | One fact stated in two places, or a fact outside the home that "Keeping this current" in `CLAUDE.md` gives it |
| Dead reference | A named file, folder, skill, agent, command, script, setting, function or catalog ID that doesn't exist |

**Proof.** A finding has the file and line of each side and the lines quoted word for word, read
in the main session just before the report. Nothing is reported from memory, and a dead
reference is searched for before it is called dead. For a harness fight, compare the line with
the tools and instructions this session really has, and read Claude Code's documentation where
unsure. Where two lines only might conflict, say so in the finding. What the selftest already
enforces (the catalog's form, code style, privacy) is not re-checked here.

## Depth

**The scan (`/sweep`).** Tier A in full. Tier B by search, reading each hit with the lines
around it:

- to-dos: `TODO`, `FIXME`, `XXX`, `HACK`, `TBD`, "for now", "temporary", "placeholder",
  "not yet", "not built", "not started", "to come", `[ ]`;
- rules: "never", "do not", "don't", "must not", "always", where the line instructs whoever
  works on the project (not where it describes what the app does);
- references: paths, script and command names, skill and agent names, in backticks or prose;
- the names of things the project retired (`retired.md`, the lists of what is "gone" in
  `CLAUDE.md` and the CHANGELOG).

The scan can miss a conflict worded in an unusual way deep in tier B. The report says which
depth ran.

**The full sweep (`/sweep full`).** The main session reads tier A and writes the inventory of
rules (each with its file, line and source) to the scratchpad. Then `reviewer` agents, in
parallel, each read one slice of tier B in full against that inventory: the catalog in three or
four groups of areas, the checklists, the app's comments, the tests' comments. Before starting
them, say how many agents and which slices (the `test` skill: say what it will cost first);
Rich typing `full` is the go-ahead, so don't wait for an answer (*Claude's call*). A brief gives
the slice's files, the inventory's path and the table of kinds, never a suspected finding. The
main session re-reads every reported line before it becomes a finding.

## Steps

1. **Start.** Note the depth. Read `kept.md` beside this file. Run `git status`: changes
   already in the working tree are not the sweep's, so say they are there and leave them out of
   the sweep's commit.
2. **Read** tier A and build the inventory: every rule, prohibition, open item and named
   thing, with its file, line and source.
3. **Hunt** each kind, across tier A and then tier B at the depth chosen.
4. **Confirm** each finding against the files as they are now. Drop one that `kept.md` covers
   (see The ledger). Mark the obvious fixes (see The walk-through).
5. **Report**, then go straight into the walk-through.
6. **Close.**

## The report

In chat only: no file and no page (Rich). Short enough to read on the phone:

1. One line: the depth, how many files were read, and what could not be read.
2. The count for each kind.
3. One line for each finding, numbered, most harmful first:
   `7. Conflict: CLAUDE.md:41 and .claude/skills/test/SKILL.md:88. <one sentence>.`
4. The obvious fixes as one line for each group: `G1. Five dead references, one fix each.`
5. How many findings were skipped because `kept.md` covers them, and the list of those
   unverified here.

Order (*Claude's call*): conflicts, harness fights, blocking rules, over-instruction, rules
with no source, orphaned items, stale text, duplicates, dead references, then the groups. Within
a kind, the files every session loads come first: `CLAUDE.md`, rules, skills, agents, docs,
the catalog, comments. No finding is a fine result: say so and stop.

## The walk-through

One item at a time, each as a picker with the question tool (Rich's preference in `CLAUDE.md`).
Rich may see only the picker, so it stands on its own:

- **The question** names the item's number and kind, each file and line, the lines quoted (cut
  to their relevant words when long) and the problem in one sentence.
- **The options:** the recommended edit first, a second edit where there is a real alternative
  (change the other side, or remove instead of change), then **Leave as it is** and **Decide
  later**. Each edit's description says what it does and which file it touches; its exact text,
  before and after, goes in the option's preview. Rich can type any other answer (remove both,
  his own wording): draft that edit and confirm its exact text with one more picker before
  writing.

What each answer does:

| Answer | Then |
|---|---|
| An edit | Make exactly that edit at once. Re-check the items still to come against the new text: drop or reword any it settled, and say so |
| Leave as it is | Add an entry to `kept.md`, with his reason when he gives one |
| Decide later | Nothing is written. The finding comes back on the next sweep |
| "Stop" at any point | Go to Close. Items not reached come back on the next sweep |

**Obvious fixes are grouped** (Rich). A fix is obvious only when it needs no judgment about
which side is right: a dead reference with exactly one evident correction (the thing was renamed
and the new name exists), or a word-for-word duplicate whose home the "Keeping this current"
table decides, or a `kept.md` entry whose quoted lines are gone. One picker for each group
lists every edit, before and after, with **Apply all**, **One at a time** and **Decide later**.
More than about ten edits make a second group. Anything that touches the meaning of a rule is
never grouped.

**Edit limits** (Rich):

- The sweep edits instruction files, process docs and comments. In `js/`, `css/` and
  `index.html` it changes comment text only, never a line of code.
- A finding whose fix would change what the app does, a catalog case's verdict, a ruling or the
  words on screen goes on the **follow-up list**, not edited. Its picker offers **Follow-up
  list**, **Leave as it is** and **Decide later**, and says in plain words that nothing changes
  now (Rich, 2026-11-25: "hand off" meant nothing to him in a picker; never use it there). The
  item is written to `follow-ups.md` with its next step under the `test` skill: a question for
  Rich to rule on, a failing case and then a row in `tests/bugs.md`, or an item for
  `find-out.md`. Those steps are that process's to take, not the sweep's.
- Records are not rewritten: a filled-in checklist, a released section of the CHANGELOG, a past
  entry in the decision log, a release tag. A finding there goes on the follow-up list or gets a
  new dated entry.
- Removing or changing a rule that has Rich's name behind it is his to approve like any other
  item; the edit takes the old source mark with it and the new line carries today's.

## Close

1. If anything changed, run `node tests/selftest.js` and fix what the sweep's edits broke.
2. Record the decisions: one dated entry in `../../decision-log.md` listing each change and
   each kept item with the why. Where the log can't be reached, put the same list in the commit
   message under `Decision log (to copy):`. A product decision Rich settled on the way also gets
   its line under "Settled product decisions" in `CLAUDE.md`.
3. Write every follow-up item to `follow-ups.md` before the commit, so it is in the repository
   and not only in the chat.
4. Commit the sweep's own edits as one commit (`Sweep: <what changed, in a line>`, then one line
   for each item), with `Catalog: none (comments only)` when a comment in the app changed, and
   push as the session's branch rules say.
5. The closing message: what changed (each file, one line), what was kept, what went on the
   follow-up list, what waits for the next sweep, and what was unverified or unread here.

## `/sweep followup`: the follow-up list (`follow-ups.md`)

Rich set this on 2026-11-25: the follow-up items live in `follow-ups.md`, beside this file and
committed, and `/sweep followup` is how they are looked at. The steps are Claude's.

1. Read `follow-ups.md`. Run no sweep and start no agent. No item open is a fine result: say
   so and stop.
2. Check each item against the files as they are now. One that is already done, or whose quoted
   lines are gone, is said to be so and removed with Rich's answer.
3. Say how many items are open, one line each, then take them one at a time, each as a picker
   that stands on its own: what was found, in a sentence or two of plain words, and the next
   step. Its options: **Do it now** (where this session can), **Keep on the list**, **Drop
   it** (recorded in `kept.md` with his reason when the finding is still in the files).
4. **Do it now** starts that work under its own process, not the sweep's limits: the proposal
   and his agreement first for a change to the app (`CLAUDE.md`, "How we work"), the `test`
   skill for a case or a bug, the agents it names. Say first when this session can't do it (a
   cloud session has no decision log, UAT checkout or phone).
5. Remove an item from `follow-ups.md` in the commit that finishes it. A new sweep adds its
   items under a dated heading; it never rewrites the ones already there.

## The ledger (`kept.md`)

Beside this file, committed. One entry for each finding Rich ruled **Leave as it is**: the
kind, the date, each file with its lines quoted word for word, and his reason.

- A later sweep skips a finding the ledger covers **only while every quoted line is still in
  its file, word for word** (match the text, not the line number). When a line has changed, the
  finding is raised again, with a note that it was kept before and what changed.
- An entry is replaced or removed only with Rich's answer on that item.
- The repository is public: nothing from `CLAUDE.local.md` is quoted in `kept.md`. A kept
  finding that involves it is recorded under "Sweep: kept" in `CLAUDE.local.md` instead.
