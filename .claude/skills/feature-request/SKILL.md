---
name: feature-request
description: Write or refine a Card Finisher feature request or update proposal as Rich's two documents - the Markdown file in the workspace's feature-requests folder and the request page in Claude, in the Corner Shots format with drawn wireframes and diagrams. Use when Rich asks for a feature request, a proposal or a write-up of a feature or update, or asks to revise one.
---

# Feature request: the Markdown file and the page

A request is the written form of step 1 of "How we work" in `CLAUDE.md`: what changes, how, the
open questions, and the UAT impact, for Rich to agree before anything is built. Nothing in a
request is agreed until he says so, and its status chip says which it is.

**What Rich set (2026-11-10):** every request has a description, purpose, impact, wireframes and
acceptance criteria; the page uses the same format as the Corner Shots request page; wireframes
are real drawings, not text sketches, at a quality he could take to an architecture review. The
rest of this file is Claude's way of meeting that, and is marked where it matters.

## What you make

| Thing | Where | Name |
|---|---|---|
| The Markdown file | `../../feature-requests/` (the workspace, outside this repo) | `FR-<name>.md` |
| The page script, the page's source | beside it | `FR-<name>.page.js` |
| The page | an Artifact in Claude, private to Rich | "<Name> Request" or "<Name> Proposal" |

The two documents say the same thing. A change goes into both in the same turn, and the page is
rebuilt from its script, never edited by hand (Claude's rule: a hand edit is lost at the next
rebuild).

A **feature request** adds or changes something a user sees. An **update proposal** changes the
engine, the structure or the tooling. They share one format.

## Before you write

- **Read the code the request touches**, and name real things: the buttons as `index.html` words
  them, the functions, the `CONFIG` keys, the catalog rows. Never invent a number, a policy or a
  platform behavior: measure it, look it up and cite it, or say it isn't known and make it an
  open question.
- **Check the settled decisions** in `CLAUDE.md`. A request that reopens one says so.
- **Load the `uat` skill** for the UAT impact section: new cases on their one device, connected
  catalog rows by ID, and whether a full run is triggered.
- **Say what it costs.** Every request has a Code row, a Risk row and a limit or weakness stated
  plainly, including "this may not earn its place".

## The sections, in order

The header carries the kind (Feature request or Update proposal), the title, one sentence that
says what the user gets, and chips: the status first, then `Raised <date>`, `Refined <date>`
once it has been, `Area: …` and `Target: …`.

| # | Section | Holds |
|---|---|---|
| 01 | Description | What it is, in a paragraph or two. A muted **Out of scope** line. |
| 02 | Purpose | Who needs it and when, as two or three named cases, then **Today:** how it is done now. |
| 03 | Impact | Rows of key and effect: what the user gains, then Code, Risk and the limit. |
| 04 | UX | Where it lives, then the drawings. Call it **Design** when no screen changes. |
| 05 | Acceptance criteria | Numbered, each with a bold two-or-three-word lead and one testable statement. |
| 06 | Decisions | Topic, decision, why. Appears once Rich has answered anything. |
| 07 | Open questions | Each with what the request proposes, so a "yes" is enough. |
| 08 | UAT impact | New cases (device, test, expected), connected cases (ID, test, why), the full-run call. |

- **AC numbers are permanent** once Rich has seen them, because UAT rows cite them. A dropped
  criterion stays as a row saying it was removed and why; a reworded one gets the `Changed` tag.
- **Mark whose call a number is.** A threshold or a cap Claude chose reads "proposed" or
  "Claude's number" until Rich agrees it (`CLAUDE.md`: a rule needs a source).
- Status wording: `Proposed · not agreed`, then `Agreed · <date>`, then
  `Agreed · built in <version> · awaiting UAT`, then `Released in <version>`.

## The drawings

Every request has drawings, including one that changes no screen.

- **A screen change** gets a phone wireframe for each new state (the phone is the primary
  device), with what is new outlined in dashed red and a legend above the plates. Draw the
  question cards and the More options rows as they would really sit.
- **A change with no screen** shows what the user sees today that it fixes, and a diagram of
  where it joins the code or the process.
- **A change to state, storage, the export or a flow** also gets a diagram: the pipeline or the
  life of the thing, with new parts dashed red and unchanged context greyed.
- **Draw to scale, and let the drawing test the design.** The phone is 240 units wide; the
  192 px control area is about 118 units and a 44 px row about 27. If the rows don't fit the
  drawing, they don't fit the phone: change the design, not the scale. (The caption request's
  plate style moved under More options this way.)
- **Use the app's real words** on every button and label, and plain sample text. No team, driver
  or series names or marks anywhere, as in the app.
- **Data is drawn to scale** with direct labels (the detection scoreboard), never as a table of
  the same numbers beside it.
- The `.md` file describes each drawing in a line, or keeps a short text sketch; the page holds
  the real ones.

## Build, look, publish

1. Write `FR-<name>.md`.
2. Write `FR-<name>.page.js` beside it. It starts
   `const kit = require(process.env.FR_KIT);` and ends
   `kit.write(process.env.FR_OUT, '<name>', kit.page({ … }));`. Copy the shape of an existing
   page script in that folder; the kit's parts are listed below and commented in `page-kit.js`.
3. Build it into the scratchpad:
   `node .claude/skills/feature-request/build-page.js <page script> <scratchpad folder>`.
   It writes `<name>.html` (the page) and `figures-<name>.html` (its drawings on one dark sheet).
4. **Look once.** Screenshot the figure sheet with headless Chrome
   (`--headless=new --window-size=1300,1560 --virtual-time-budget=6000 --screenshot=…`) and read
   the image. Fix what it shows: text running out of a box or off the plate, lines through
   labels, a dashed outline touching text. Then rebuild; no second look unless something was
   redrawn from scratch.
5. Publish `<name>.html` with the Artifact tool (icon `blueprint`, a one-sentence description).
   To revise a page from another conversation, pass its link as `url` so the link is kept.
6. Record it: the page's link on a `**Page:**` line at the top of the `.md`, an entry in
   `../../decision-log.md`, and the "Waiting on" line in `CLAUDE.local.md`.

## Refining a request

When Rich answers a question or changes his mind: move the answer into Decisions, update the
criteria it touches (tag them `Changed`), add or update the `Refined` chip and the status, then
rebuild and republish to the same link. Once a request is built, its UAT rows live in the
catalog (the `uat` skill), and the page's UAT section says where they went.

## The kit (`page-kit.js`, `page.css`)

| Part | For |
|---|---|
| `page({ title, eyebrow, heading, lede, chips, sections, footer })` | The whole page; sections are numbered in order |
| `impact`, `criteria`, `table`, `list`, `LEGEND` | The section bodies |
| `figure(drawing(width, height, label, body), caption, plateClass)` | A drawing in its plate: `''` for a phone, `'wide'`, or `'full'` for a diagram |
| `phoneFrame`, `photo`, `selects`, `moreBar`, `actionBar`, `scrim`, `dialog` | Phone wireframes |
| `node`, `arrow` | Diagrams: `node` / `flow` exists today, `node-new` / `flow-new` is added, `node-mute` / `flow-mute` is unchanged context |
| `rect`, `line`, `text`, `textLines`, `polygon`, `circle`, `button` | Everything else; the CSS classes are at the end of `page.css` |

Put phone figures in `<div class="plates">` in twos, so no plate sits alone in a row. The page
follows the viewer's light or dark theme through the colour tokens in `page.css`; a drawing
never uses a colour of its own. The two `.js` files follow `.claude/rules/code-style.md` and are
in the style check; page scripts live outside the repo and are not.
