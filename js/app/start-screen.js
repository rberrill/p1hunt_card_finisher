/* =====================================================================
   js/app/start-screen.js: the start screen's Resume prompt (Resume / Start fresh).
   Shell modules share one namespace, CF (created in core.js). Names from core are
   destructured below; anything from another module is called as CF.name.
   tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';
  const { byId, shortText, app, toast } = CF;

  // Resume and Start fresh on the start screen.
  function bindStartScreen() {
    byId('btnResume').onclick = resumeSession;
    byId('btnFresh').onclick = () => {
      CF.Session.clear();
      hideResume();
    };
  }

  // How long ago a timestamp was, roughly.
  function timeAgo(time) {
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} h ago`;
    return `${Math.round(minutes / 1440)} d ago`;
  }

  async function offerResume() {
    const record = await CF.Session.peek();
    if (!record || app.img) return;
    // The records come from storage.
    const pair = await CF.peekPair();
    byId('resumeName').textContent = resumeName(record, pair);
    const when = Number.isFinite(record.savedAt) ? '(' + timeAgo(record.savedAt) + ')' : '';
    byId('resumeWhen').textContent = when;
    byId('resume').hidden = false;
    byId('btnOpenEmpty').classList.remove('primary');
  }

  // The Resume prompt's name: the photo, or a pair's front + back.
  function resumeName(record, pair) {
    const name = shortText(record.name) || 'your last photo';
    const other = pair && pair.other && pair.other.edits;
    const otherName = other && shortText(other.name);
    if (!otherName) return name;
    return pair.current === 'front' ? `${name} + ${otherName}` : `${otherName} + ${name}`;
  }

  function hideResume() {
    byId('resume').hidden = true;
    byId('btnOpenEmpty').classList.add('primary');
  }

  async function resumeSession() {
    hideResume();
    try {
      const [photo, edits, pair] = await Promise.all([
        CF.Session.loadPhoto(),
        CF.Session.peek(),
        CF.peekPair(),
      ]);
      // The record comes from storage: its bytes, name and type are checked before use.
      if (!photo || !(photo.buf instanceof ArrayBuffer)) {
        toast('The saved photo is gone. Open it again.', 'warn', 5000);
        return;
      }
      const name = shortText(photo.name, 200) || 'photo';
      const type = typeof photo.type === 'string' ? photo.type : '';
      // A pair's waiting side comes back first, so one full-size photo is decoded at a time.
      if (pair) await CF.restorePair(pair);
      const file = new File([photo.buf], name, { type });
      const isOpen = await CF.openFile(file, name, edits);
      if (!isOpen) app.pair = null;
      CF.finishResume();
    } catch (error) {
      console.error(error);
      toast('Couldn’t resume: ' + error.message, 'error', 6000);
    }
  }

  Object.assign(CF, {
    bindStartScreen,
    offerResume,
    resumeSession,
  });
})(window.CF);
