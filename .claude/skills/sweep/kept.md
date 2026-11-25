# Sweep: kept items

Findings Rich has ruled **Leave as it is** in a `/sweep` walk-through (the `sweep` skill). A
sweep skips a finding listed here only while every line quoted in its entry is still in its
file, word for word. When one has changed, the finding is raised again, and the entry is
replaced or removed with Rich's answer.

Nothing from `CLAUDE.local.md` is quoted here: this file is public. A kept finding that
involves it goes under "Sweep: kept" in `CLAUDE.local.md`.

An entry looks like this:

```
## K-001 Conflict (kept 2026-11-17)

- `CLAUDE.md`: "the first line, word for word"
- `.claude/skills/test/SKILL.md`: "the second line, word for word"
- Rich: his reason
```

## Kept

## K-001 Conflict (kept 2026-11-25)

- `tests/catalog/rulings.md`: "the Upscale question is asked only when Yes would save a bigger file than No, wherever it is asked from (a single photo, a pair, corner shots)"
- `tests/catalog/upscale-question.md`: "For corner shots it is asked when the file (the sheet, or each photo) would be under 2000 px; **Yes** makes the file exactly 2000 px, bicubic and sharpened."
- `js/app/corner-shots.js`: "CF.askUpscale(targetPx, text, isUpscaled => renderAndSave(kind, isUpscaled));"
- Rich: leave as it is (no reason given).

## K-002 Orphaned to-do (kept 2026-11-25)

- `tests/catalog/speed.md`: "Limit: none yet. This case measures the time on a real iPhone, and Rich sets the limit from it."
- `tests/catalog/speed.md`: "- Limit: to be measured"
- Rich: leave as it is (no reason given).

## K-003 Conflict of record (kept 2026-11-25)

- `tests/catalog/find-out.md`: "No item is open. Q-01 to Q-10 were answered by Rich on 2026-11-24; the next item is Q-11."
- `tests/checklists/1.10.0-dev.18_001d4bf.md`: "What I saw: Closed by Claude, not Rich: whether Chrome's developer tools can edit a stored value is a question about a tool. The cases are run by the script. (2026-11-24)"
- Rich: whether he ticks a checklist's boxes himself or tells Claude to do it for him makes no difference; raising it is pedantic.

## K-004 Stale (kept 2026-11-25)

Comments that call **Tap to find card** "Find card":

- `js/config.js`: "// A quad that misses the point tapped with Find card scores this much; candidates whose"
- `js/app/core.js`: "// Find card is armed: the next still tap on the photo finds the card there."
- `js/app/input.js`: "// Find card: a still tap (however long) finds the card where the photo was tapped."
- `js/app/state.js`: "// Find card: disarms it, then finds the card containing `point` (source px, where the photo"
- Rich: leave as it is (no reason given).

## K-005 Conflict of record (kept 2026-11-25)

Cases the checklist's own text says could not be run are ticked pass (follow-up item F-01):

- `tests/checklists/1.10.0-dev.18_001d4bf.md`: "Rich reported on 2026-11-24 that everything passed on his iPhone on the UAT site; the cases below were marked passed from that report, not one by one."
- Rich: dropped from the follow-up list; his reason for K-003 covers it.
