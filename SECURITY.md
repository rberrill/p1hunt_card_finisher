# Security

P1Hunt Card Finisher is a static web page. It has no server, no accounts and no analytics, and it never uploads anything: photos, logos and edits are processed in your browser and stay on your device.

## What the app does to stay safe

- **Nothing from outside runs.** A Content Security Policy allows only the site's own scripts and styles; there are no third-party scripts, fonts or trackers.
- **Untrusted input is checked.** Links can only change number and on/off settings. Edits files, remembered settings and resumed sessions are checked field by field, and anything malformed is reset to its default. Logos (including SVG) are only ever drawn as images, so anything embedded in them doesn't run.
- **Text never becomes markup.** The interface builds its controls as page elements rather than from HTML text, and an automated check fails the build if that rule is broken.

## What's stored on your device

- The last photo and its edits, so you can resume after a reload (**Start fresh** clears them).
- Your last logo, if you added one (**Delete saved overlay** clears it).
- Your last export and crop choices.

All of this lives in your browser's own storage for this site. Clearing the site's data in your browser removes it.

## Reporting a problem

If you find a security issue, please report it privately through GitHub's **Report a vulnerability** button on the repository's Security tab, rather than opening a public issue. Include the browser, the steps, and what you expected to happen.
