/* =====================================================================
   js/app/parts/icon.js: the icons. One path per icon on a 24 px grid, drawn as an inline SVG in
   the current text color. Not one of the fifteen parts; every part that shows an icon uses it.
   Shell modules share one namespace, CF (created in core.js); anything from another module is
   called as CF.name. tests/selftest.js checks these boundaries.
   ===================================================================== */
(function (CF) {
  'use strict';

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  // Icons are drawn on a 24 × 24 grid.
  const ICON_GRID = '0 0 24 24';
  const ICONS = {
    open: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    redo: 'm15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',
    fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    nudge: 'M12 3v18M3 12h18M9.5 5.5 12 3l2.5 2.5M9.5 18.5 12 21l2.5-2.5'
      + 'M5.5 9.5 3 12l2.5 2.5M18.5 9.5 21 12l-2.5 2.5',
    flatten: 'M6 8l12-3v14L6 16zM3 21h18',
    candidate: 'M9 4h9a1 1 0 0 1 1 1v12M5 8h10v12H5z',
    preview: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    snap: 'M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4zM6 8h4M14 8h4',
    perspective: 'M5 7l14-3v16L5 17z',
    rotateRight: 'M21 4v6h-6M20.5 15a8.5 8.5 0 1 1-2-8.5L21 10',
    rotateLeft: 'M3 4v6h6M3.5 15a8.5 8.5 0 1 0 2-8.5L3 10',
    crop: 'M6 2v16h16M2 6h16v16',
    levels: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18M12 8h7.5M12 12h9M12 16h7.5',
    overlay: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    share: 'M12 3v12M8 7l4-4 4 4M8 10H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7'
      + 'a2 2 0 0 0-2-2h-2',
    download: 'M12 3v12M8 11l4 4 4-4M4 20h16',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    straighten: 'M3 18h18M7 18v-3M12 18v-5M17 18v-3M5 9l14-3',
    flipHorizontal: 'M12 3v18M8 7 3 12l5 5M16 7l5 5-5 5',
    flipVertical: 'M3 12h18M7 8l5-5 5 5M7 16l5 5 5-5',
    fillFrame: 'M4 4h16v16H4zM9 15l6-6M11 9h4v4',
    auto: 'M5 19 16 8M14 6l4 4M18 2v3M16.5 3.5h3M6 5v2M5 6h2',
    close: 'M6 6l12 12M18 6 6 18',
    image: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    up: 'M6 15l6-6 6 6',
    down: 'M6 9l6 6 6-6',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    check: 'M5 12l5 5 9-10',
    warning: 'M12 4 2.5 20h19zM12 10v4M12 17h.01',
    error: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01',
    info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01',
    swap: 'M4 8h14l-3-3M20 16H6l3 3',
    addBack: 'M9 3h10v14H9zM5 7v14h10',
    corners: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    grid: 'M4 4h16v16H4zM4 12h16M12 4v16',
    next: 'M5 12h14M13 6l6 6-6 6',
    pencil: 'M4 20h4L19 9l-4-4L4 16z',
    findCard: 'M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM12 2v4M12 18v4M2 12h4M18 12h4',
    tips: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3'
      + 'c-.6.3-1 .8-1 1.7M12 17h.01',
    unpair: 'M9 7H6a5 5 0 0 0 0 10h3M15 7h3a5 5 0 0 1 0 10h-3M11 4l-1 3M13 20l1-3',
    save: 'M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6',
    keyboard: 'M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
  };

  // Builds an SVG element (core's makeEl builds HTML ones): makeSvgEl('line', { x1: 0 }).
  function makeSvgEl(tag, attributes, ...children) {
    const el = document.createElementNS(SVG_NAMESPACE, tag);
    for (const [name, value] of Object.entries(attributes || {})) el.setAttribute(name, value);
    el.append(...children);
    return el;
  }

  // The icon `name` as an SVG element, sizePx square. It takes the color of the text around it;
  // css/app.css (.icon) sets the stroke.
  function makeIcon(name, sizePx = 22) {
    return makeSvgEl('svg', {
      class: 'icon',
      viewBox: ICON_GRID,
      width: sizePx,
      height: sizePx,
      'aria-hidden': 'true',
    }, makeSvgEl('path', { d: ICONS[name] }));
  }

  Object.assign(CF, { ICONS, makeSvgEl, makeIcon });
})(window.CF);
