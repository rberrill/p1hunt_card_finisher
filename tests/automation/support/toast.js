// The one reader of the message over the photo (the toast, js/app/parts/toast.js) that every
// helper shares, and where the message sits on the page. A helper that reads the toast's words
// calls toastWords, whether it looks at the toast now (toastNow) or records it from inside the
// page (support/messages.js, edits-drop-keys.js, front-and-back.js).
'use strict';

// Rounding allowed when comparing page positions (isInside), in CSS px.
const BOX_TOLERANCE_PX = 1;

// Runs in the page. A message's words, from the nodes that hold them: the child nodes of the
// toast's text element, or the nodes a change has just added to it. A plain message is one text
// node, so its words come back as they are. A message of several lines (Load edits; a finished
// export with more than one sentence) is a node for each line, and comes back as its lines with
// ONE SPACE between them: the words in reading order, as a case's row quotes them.
// It therefore cannot see where a line ends: "A. B." reads the same on one line as on two. A
// case about the lines themselves (each on a line of its own, none cut off) reads them with
// toastShownLines (support/edits-files.js), which asks the screen.
function toastWords(nodes) {
  return [...nodes].map(node => node.textContent).join(' ');
}

// A script for the page that runs `read(toastWords)` there and gives back what it returns, for
// page.evaluate or page.addInitScript. `read` runs in the page, so it can use nothing from this
// side but the reader it is handed.
//   page.evaluate(withToastWords(wordsOf => wordsOf(textEl.childNodes)));
const withToastWords = read => `(${read})(${toastWords})`;

// The toast over the photo now: { text, kind, isShown }; kind is 'error', 'warn' or '' (its
// class), text its words (toastWords: a message of several lines reads as its lines with a
// space between them). Before the toast is built it is { text: '', kind: '', isShown: false }.
function toastNow(page) {
  return page.evaluate(withToastWords(wordsOf => {
    const toast = document.getElementById('toast');
    if (!toast) return { text: '', kind: '', isShown: false };
    let kind = '';
    if (toast.classList.contains('is-error')) kind = 'error';
    if (toast.classList.contains('is-warn')) kind = 'warn';
    const text = wordsOf(toast.querySelector('.toast-text').childNodes);
    return { text, kind, isShown: toast.classList.contains('is-shown') };
  }));
}

// Where the message over the photo sits: { stage, toast, lines }, the photo area's box, the
// message's and each of its lines' (none for a plain message), as { top, bottom, left, right }
// in CSS px.
function messageBoxes(page) {
  return page.evaluate(() => {
    const boxOf = el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    const toast = document.getElementById('toast');
    return {
      stage: boxOf(document.getElementById('stage')),
      toast: boxOf(toast),
      lines: [...toast.querySelectorAll('.toast-line')].map(boxOf),
    };
  });
}

// True when `inner` lies wholly inside `outer` (boxes from messageBoxes), to the rounding of
// BOX_TOLERANCE_PX.
const isInside = (inner, outer) => inner.top >= outer.top - BOX_TOLERANCE_PX
  && inner.bottom <= outer.bottom + BOX_TOLERANCE_PX
  && inner.left >= outer.left - BOX_TOLERANCE_PX
  && inner.right <= outer.right + BOX_TOLERANCE_PX;

module.exports = {
  toastWords,
  withToastWords,
  toastNow,
  messageBoxes,
  isInside,
};
