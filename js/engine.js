/* =====================================================================
   CardEngine — pure geometry + image processing. No DOM, no browser
   globals beyond what a Web Worker also has (tests/selftest.js checks).
   The whole engine is one named function, CardEngineModule: calling it
   defines CardEngine, and the shell builds the Web Worker from its
   source text (CardEngineModule.toString()), which also works from file://.
   Sections: MATH → IMAGE I/O (pure pixel helpers) → DETECTION → RENDER PIPELINE → SELF-TEST
   ===================================================================== */
function CardEngineModule(G) {
  'use strict';
  const EPS = 1e-12;
  const DEG = Math.PI / 180;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* ===================================================================
     MATH — 3×3 matrices (row-major arrays of 9), linear solve, homography, quads
     =================================================================== */
  const M3 = {
    identity: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    mul(a, b) {
      const r = new Array(9);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++)
        r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
      return r;
    },
    // chain(A, B, C) = A·B·C, i.e. C is applied to a point first.
    chain(...ms) { return ms.reduce((acc, m) => M3.mul(acc, m)); },
    // Inverse via the adjugate (cofactor transpose) / determinant.
    inv(m) {
      const [a, b, c, d, e, f, g, h, i] = m;
      const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
      const det = a * A + b * B + c * C;
      if (!isFinite(det) || Math.abs(det) < EPS) return null;
      const s = 1 / det;
      return [A * s, -(b * i - c * h) * s, (b * f - c * e) * s,
              B * s, (a * i - c * g) * s, -(a * f - c * d) * s,
              C * s, -(a * h - b * g) * s, (a * e - b * d) * s];
    },
    // Projective apply: [x', y'] = (M·[x, y, 1]) / w
    apply(m, x, y) {
      const w = m[6] * x + m[7] * y + m[8];
      return [(m[0] * x + m[1] * y + m[2]) / w, (m[3] * x + m[4] * y + m[5]) / w];
    },
    w: (m, x, y) => m[6] * x + m[7] * y + m[8],
    translate: (tx, ty) => [1, 0, tx, 0, 1, ty, 0, 0, 1],
    scale: (sx, sy = sx) => [sx, 0, 0, 0, sy, 0, 0, 0, 1],
    rotate(rad) {
      let c = Math.cos(rad), s = Math.sin(rad);
      // Snap float noise so exact quarter turns give exact integer frames.
      if (Math.abs(c) < 1e-12) c = 0; if (Math.abs(s) < 1e-12) s = 0;
      return [c, -s, 0, s, c, 0, 0, 0, 1];
    },
    normalize(m) { const k = m[8]; return Math.abs(k) > EPS ? m.map(v => v / k) : m.slice(); },
  };

  // Gaussian elimination with partial pivoting. A: n rows of n numbers, b: n numbers.
  function solveLinear(A, b) {
    const n = b.length;
    const M = A.map((row, i) => row.concat([b[i]]));
    for (let col = 0; col < n; col++) {
      let piv = col, best = Math.abs(M[col][col]);
      for (let r = col + 1; r < n; r++) { const v = Math.abs(M[r][col]); if (v > best) { best = v; piv = r; } }
      if (best < 1e-14) return null; // singular: degenerate correspondences
      if (piv !== col) { const t = M[piv]; M[piv] = M[col]; M[col] = t; }
      for (let r = col + 1; r < n; r++) {
        const f = M[r][col] / M[col][col];
        if (f === 0) continue;
        for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
      }
    }
    const x = new Array(n);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
      x[r] = s / M[r][r];
    }
    return x;
  }

  // Hartley normalization: move the points' centroid to the origin and scale so the mean
  // distance is √2. Solving in this frame keeps the 8×8 system well conditioned even with
  // 8000-px coordinates (x·u terms would otherwise reach ~1e7 next to 1s).
  function normTransform(pts) {
    let cx = 0, cy = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; }
    cx /= pts.length; cy /= pts.length;
    let d = 0;
    for (const p of pts) d += Math.hypot(p[0] - cx, p[1] - cy);
    d /= pts.length;
    const s = d > EPS ? Math.SQRT2 / d : 1;
    return [s, 0, -s * cx, 0, s, -s * cy, 0, 0, 1];
  }

  // Homography H (3×3, h33 = 1) with H·src[k] ∝ dst[k] for the 4 correspondences.
  // Each pair (x,y)→(u,v) gives, after multiplying out u = (h0x+h1y+h2)/(h6x+h7y+1):
  //   h0x + h1y + h2 − h6·x·u − h7·y·u = u
  //   h3x + h4y + h5 − h6·x·v − h7·y·v = v
  // Four pairs → an 8×8 linear system in h0..h7.
  function solveHomography(src, dst) {
    const Ts = normTransform(src), Td = normTransform(dst);
    const s = src.map(p => M3.apply(Ts, p[0], p[1]));
    const d = dst.map(p => M3.apply(Td, p[0], p[1]));
    const A = [], b = [];
    for (let k = 0; k < 4; k++) {
      const [x, y] = s[k], [u, v] = d[k];
      A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -x * v, -y * v]); b.push(v);
    }
    const h = solveLinear(A, b);
    if (!h) return null;
    const Hn = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
    const Tdi = M3.inv(Td);
    if (!Tdi) return null;
    // src → normalized src → normalized dst → dst
    return M3.normalize(M3.chain(Tdi, Hn, Ts));
  }

  const V = {
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]),
    mid: (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    cross: (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]),
  };

  // Quads are always [TL, TR, BR, BL] in image pixels (y down).
  const Quad = {
    centroid(q) { let x = 0, y = 0; for (const p of q) { x += p[0]; y += p[1]; } return [x / q.length, y / q.length]; },
    area(q) {
      let a = 0;
      for (let i = 0; i < q.length; i++) { const p = q[i], n = q[(i + 1) % q.length]; a += p[0] * n[1] - n[0] * p[1]; }
      return Math.abs(a) / 2;
    },
    // Convex and simple ⇔ every consecutive turn has the same (non-zero) sign. A bow-tie
    // (self-intersecting) quad always mixes signs, so this rejects both failure modes.
    isConvex(q) {
      let sign = 0;
      for (let i = 0; i < 4; i++) {
        const c = V.cross(q[i], q[(i + 1) % 4], q[(i + 2) % 4]);
        if (Math.abs(c) < 1e-9) return false;
        const s = c > 0 ? 1 : -1;
        if (sign === 0) sign = s; else if (s !== sign) return false;
      }
      return true;
    },
    // Sort 4 points into TL, TR, BR, BL: clockwise by angle around the centroid (y down),
    // then start at the point nearest the top-left (min x + y).
    order(pts) {
      const c = Quad.centroid(pts);
      const s = pts.slice().sort((a, b) => Math.atan2(a[1] - c[1], a[0] - c[0]) - Math.atan2(b[1] - c[1], b[0] - c[0]));
      let k = 0;
      for (let i = 1; i < 4; i++) if (s[i][0] + s[i][1] < s[k][0] + s[k][1]) k = i;
      return [0, 1, 2, 3].map(i => s[(i + k) % 4].slice());
    },
    contains(q, p) {
      let sign = 0;
      for (let i = 0; i < q.length; i++) {
        const c = V.cross(q[i], q[(i + 1) % q.length], p);
        const s = c > 0 ? 1 : c < 0 ? -1 : 0;
        if (s === 0) continue;
        if (sign === 0) sign = s; else if (s !== sign) return false;
      }
      return true;
    },
    // Interior angle at each corner, degrees.
    angles(q) {
      return q.map((p, i) => {
        const a = q[(i + 3) % 4], b = q[(i + 1) % 4];
        const v1 = [a[0] - p[0], a[1] - p[1]], v2 = [b[0] - p[0], b[1] - p[1]];
        const c = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2));
        return Math.acos(Math.max(-1, Math.min(1, c))) / DEG;
      });
    },
    sides(q) {
      return { top: V.dist(q[0], q[1]), right: V.dist(q[1], q[2]), bottom: V.dist(q[3], q[2]), left: V.dist(q[0], q[3]) };
    },
    bbox(pts) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
    },
    validate(q, minDist) {
      if (!Array.isArray(q) || q.length !== 4 || q.some(p => !p || !isFinite(p[0]) || !isFinite(p[1])))
        return { ok: false, reason: 'Corners are missing or invalid.' };
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++)
        if (V.dist(q[i], q[j]) < minDist) return { ok: false, reason: 'Two corners are too close together.' };
      if (!Quad.isConvex(q)) return { ok: false, reason: 'Corners cross or fold inward — drag them back into a convex shape.' };
      return { ok: true };
    },
  };

  // Line in normal form: n·p = c with |n| = 1.
  function lineThrough(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    return { nx, ny, c: nx * a[0] + ny * a[1] };
  }
  function intersect(l1, l2) {
    const det = l1.nx * l2.ny - l1.ny * l2.nx;
    if (Math.abs(det) < 1e-9) return null;
    return [(l1.c * l2.ny - l1.ny * l2.c) / det, (l1.nx * l2.c - l1.c * l2.nx) / det];
  }

  /* ===================================================================
     PERSPECTIVE TARGETS — where the four source corners should land
     =================================================================== */
  // 0% (squared up): symmetric trapezoid, horizontal top/bottom, mirrored sides,
  //   widths = measured top/bottom lengths, centered on the quad's centroid.
  // 100% (flat): true rectangle at the card's aspect, area-matched to the quad
  //   so pixel resolution is preserved.
  // strength t blends the two corner-by-corner, so every value is an isosceles trapezoid.

  /**
   * rectAspect(q, center, focal) → true W/H of the physical rectangle seen as quad q.
   * Zhang & He, "Whiteboard scanning and image enhancement" (2007). With the rectangle's
   * corners M1..M4 = (0,0),(w,0),(0,h),(w,h) and image points m1..m4 (homogeneous):
   *   k2 = ((m1×m4)·m3)/((m2×m4)·m3),  k3 = ((m1×m4)·m2)/((m3×m4)·m2)
   *   n2 = k2·m2 − m1 ∝ A·r1·w,        n3 = k3·m3 − m1 ∝ A·r2·h
   * r1 ⊥ r2 gives the focal length f (when both vanishing points are finite);
   * |r1| = |r2| gives (w/h)² = (n2ᵀA⁻ᵀA⁻¹n2)/(n3ᵀA⁻ᵀA⁻¹n3), A = [[f,0,u0],[0,f,v0],[0,0,1]].
   * f is only estimable with two finite vanishing points; otherwise the fallback is used.
   * In a near-frontal view n·z → 0 and the result tends to the plain side-length ratio.
   */
  function rectAspect(q, center, focal) {
    const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dt = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const m1 = [q[0][0], q[0][1], 1], m2 = [q[1][0], q[1][1], 1], m4 = [q[2][0], q[2][1], 1], m3 = [q[3][0], q[3][1], 1];
    const k2 = dt(cr(m1, m4), m3) / dt(cr(m2, m4), m3), k3 = dt(cr(m1, m4), m2) / dt(cr(m3, m4), m2);
    const n2 = m2.map((v, i) => k2 * v - m1[i]), n3 = m3.map((v, i) => k3 * v - m1[i]);
    const [u0, v0] = center;
    let f = focal.fallback;
    const den = n2[2] * n3[2];
    if (Math.abs(den) > 1e-12) {
      const f2 = -((n2[0] - u0 * n2[2]) * (n3[0] - u0 * n3[2]) + (n2[1] - v0 * n2[2]) * (n3[1] - v0 * n3[2])) / den;
      if (f2 > 0 && Math.sqrt(f2) >= focal.min && Math.sqrt(f2) <= focal.max) f = Math.sqrt(f2);
    }
    const a = n => [(n[0] - u0 * n[2]) / f, (n[1] - v0 * n[2]) / f, n[2]];
    const A2 = a(n2), A3 = a(n3), r = Math.sqrt(dt(A2, A2) / dt(A3, A3));
    if (isFinite(r) && r > 0) return r;
    const s = Quad.sides(q);
    return (s.top + s.bottom) / (s.left + s.right);
  }
  // Focal model in pixels: estimate when possible, else focalFactor × long side.
  function focalModel(w, h, factor) { const L = Math.max(w, h); return { fallback: (factor || 2.5) * L, min: 0.6 * L, max: 6 * L }; }

  function perspectiveTargets(q, opts) {
    const { strength = 1, ratio = 63.5 / 88.9, orientation = 'auto', heightMode = 'preserveEdges' } = opts;
    const s = Quad.sides(q);
    const [cx, cy] = Quad.centroid(q);
    const wt = s.top, wb = s.bottom, side = (s.left + s.right) / 2;
    let h;
    if (heightMode === 'meanEdge') h = side;
    else if (heightMode === 'visual') h = V.dist(V.mid(q[0], q[1]), V.mid(q[3], q[2]));
    else {
      // preserveEdges: choose the vertical height so each mirrored slanted side keeps the
      // mean measured side length: side² = h² + ((wb − wt)/2)².
      const d = (wb - wt) / 2;
      h = Math.sqrt(Math.max(side * side - d * d, (side * 0.1) ** 2));
    }
    const A = [[cx - wt / 2, cy - h / 2], [cx + wt / 2, cy - h / 2], [cx + wb / 2, cy + h / 2], [cx - wb / 2, cy + h / 2]];
    const wMean = (wt + wb) / 2, hMean = side;
    const portrait = Math.min(ratio, 1 / ratio);
    const land = orientation === 'landscape' || (orientation === 'auto' && wMean > hMean);
    const r = land ? 1 / portrait : portrait; // target W/H
    const H = Math.sqrt((wMean * hMean) / r), W = r * H;
    const B = [[cx - W / 2, cy - H / 2], [cx + W / 2, cy - H / 2], [cx + W / 2, cy + H / 2], [cx - W / 2, cy + H / 2]];
    const t = Math.max(0, Math.min(1, strength));
    return A.map((a, i) => V.lerp(a, B[i], t));
  }

  /* ===================================================================
     IMAGE I/O — pure pixel helpers over ImageData-like {data, width, height}
     =================================================================== */
  function toGray(img) {
    const { data, width, height } = img, n = width * height, g = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
    return g;
  }
  function channel(img, c) {
    const { data, width, height } = img, n = width * height, g = new Float32Array(n);
    for (let i = 0, j = c; i < n; i++, j += 4) g[i] = data[j];
    return g;
  }
  // Separable Gaussian blur, clamp-to-edge.
  function gaussianBlur(src, w, h, sigma) {
    if (!(sigma > 0)) return src;
    const r = Math.max(1, Math.ceil(sigma * 3)), k = new Float32Array(2 * r + 1);
    let sum = 0;
    for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + r]; }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) { const xx = x + i < 0 ? 0 : x + i >= w ? w - 1 : x + i; acc += src[row + xx] * k[i + r]; }
        tmp[row + x] = acc;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) { const yy = y + i < 0 ? 0 : y + i >= h ? h - 1 : y + i; acc += tmp[yy * w + x] * k[i + r]; }
        out[y * w + x] = acc;
      }
    }
    return out;
  }
  function sobel(g, w, h) {
    const gx = new Float32Array(w * h), gy = new Float32Array(w * h), mag = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const a = g[i - w - 1], b = g[i - w], c = g[i - w + 1], d = g[i - 1], f = g[i + 1], p = g[i + w - 1], q = g[i + w], r = g[i + w + 1];
        const sx = (c + 2 * f + r) - (a + 2 * d + p), sy = (p + 2 * q + r) - (a + 2 * b + c);
        gx[i] = sx; gy[i] = sy; mag[i] = Math.hypot(sx, sy);
      }
    }
    return { gx, gy, mag };
  }
  // Bilinear sample of a single-channel float image with clamp-to-edge.
  function sampleGray(g, w, h, x, y) {
    x -= 0.5; y -= 0.5; // pixel centers at +0.5
    if (x < 0) x = 0; if (y < 0) y = 0; if (x > w - 1) x = w - 1; if (y > h - 1) y = h - 1;
    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
    const fx = x - x0, fy = y - y0;
    const a = g[y0 * w + x0], b = g[y0 * w + x1], c = g[y1 * w + x0], d = g[y1 * w + x1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }

  /* ===================================================================
     DETECTION — Canny → Hough → paired line families → scored quads → refine
     All detection coordinates are in the working image's pixels unless noted.
     =================================================================== */
  const DETECT_DEFAULTS = {
    blurSigma: 1.6, colorEdges: true, cannyLow: 20, cannyHigh: 55,
    angleStepDeg: 0.5, houghGradWinDeg: 6, houghThreshold: 45, houghMaxLines: 48, mergeAngleDeg: 2, mergeRhoPx: 6,
    maxPerspectiveDeg: 25, perpTolDeg: 30, minSideFrac: 0.08, minAreaFrac: 0.03, maxAreaFrac: 0.9, edgeMarginFrac: 0.02,
    supportRadiusPx: 2, cornerTrim: 0.12, aspectDeadband: 0.06, aspectTol: 0.10, angleTolDeg: 22, focalFactor: 2.5,
    wSupport: 1.0, wAspect: 0.4, wAngle: 0.35, wCenter: 0.25, wArea: -0.45,
    seedMissFactor: 0.3, dupCornerFrac: 0.02, maxCandidates: 3, minConfidence: 0.5,
    refineSearchWorkingPx: 3, refineSamples: 48, refineBlur: 1.0, refineMinGrad: 6, refineInlierPx: 1.5,
  };

  function edgeImage(img, o) {
    const w = img.width, h = img.height;
    if (!o.colorEdges) {
      const s = sobel(gaussianBlur(toGray(img), w, h, o.blurSigma), w, h);
      return s;
    }
    // Per-channel gradients, keep the strongest channel at each pixel. Catches red-on-black
    // and chroma-only edges that luminance alone flattens (red playmats, colored slab labels).
    let best = null;
    for (let c = 0; c < 3; c++) {
      const s = sobel(gaussianBlur(channel(img, c), w, h, o.blurSigma), w, h);
      if (!best) { best = s; continue; }
      for (let i = 0; i < w * h; i++) if (s.mag[i] > best.mag[i]) { best.mag[i] = s.mag[i]; best.gx[i] = s.gx[i]; best.gy[i] = s.gy[i]; }
    }
    return best;
  }

  function canny(gx, gy, mag, w, h, low, high) {
    const nms = new Float32Array(w * h);
    const T = 0.41421356; // tan(22.5°): quantize the gradient direction into 4 bins without atan2
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x, m = mag[i];
        if (m < low) continue;
        const ax = Math.abs(gx[i]), ay = Math.abs(gy[i]);
        let n1, n2;
        if (ay <= ax * T) { n1 = mag[i - 1]; n2 = mag[i + 1]; }
        else if (ax <= ay * T) { n1 = mag[i - w]; n2 = mag[i + w]; }
        else if (gx[i] * gy[i] > 0) { n1 = mag[i - w - 1]; n2 = mag[i + w + 1]; }
        else { n1 = mag[i - w + 1]; n2 = mag[i + w - 1]; }
        if (m >= n1 && m > n2) nms[i] = m;
      }
    }
    // Hysteresis: grow from strong pixels through weak ones.
    const edges = new Uint8Array(w * h), stack = [];
    for (let i = 0; i < w * h; i++) if (nms[i] >= high) { edges[i] = 1; stack.push(i); }
    while (stack.length) {
      const i = stack.pop(), x = i % w;
      for (let dy = -w; dy <= w; dy += w) for (let dx = -1; dx <= 1; dx++) {
        if ((x === 0 && dx < 0) || (x === w - 1 && dx > 0)) continue;
        const j = i + dy + dx;
        if (j < 0 || j >= w * h || edges[j]) continue;
        if (nms[j] >= low) { edges[j] = 1; stack.push(j); }
      }
    }
    return edges;
  }

  // Hough transform, line model x·cosθ + y·sinθ = ρ about the image center.
  // Each edge pixel votes only for θ within ±houghGradWinDeg of its own gradient
  // direction, which cuts texture/text clutter and is ~30× faster than voting all θ.
  function hough(edges, gx, gy, w, h, o) {
    const step = o.angleStepDeg * DEG, nT = Math.round(Math.PI / step);
    const cosT = new Float32Array(nT), sinT = new Float32Array(nT);
    for (let t = 0; t < nT; t++) { cosT[t] = Math.cos(t * step); sinT[t] = Math.sin(t * step); }
    const cx = w / 2, cy = h / 2, rMax = Math.ceil(Math.hypot(w, h) / 2), nR = 2 * rMax + 1;
    const acc = new Uint32Array(nT * nR);
    const win = Math.ceil(o.houghGradWinDeg / o.angleStepDeg);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!edges[i]) continue;
        let phi = Math.atan2(gy[i], gx[i]);
        if (phi < 0) phi += Math.PI;
        const t0 = Math.round(phi / step), xc = x + 0.5 - cx, yc = y + 0.5 - cy;
        for (let dt = -win; dt <= win; dt++) {
          const t = ((t0 + dt) % nT + nT) % nT;
          acc[t * nR + Math.round(xc * cosT[t] + yc * sinT[t]) + rMax]++;
        }
      }
    }
    const peaks = [], tw = 2, rw = 3;
    for (let t = 0; t < nT; t++) {
      for (let r = 0; r < nR; r++) {
        const v = acc[t * nR + r];
        if (v < o.houghThreshold) continue;
        let isMax = true;
        for (let dt = -tw; dt <= tw && isMax; dt++) {
          let tt = t + dt, rr0 = r;
          // Wrapping θ past π flips the sign of ρ.
          if (tt < 0) { tt += nT; rr0 = nR - 1 - r; } else if (tt >= nT) { tt -= nT; rr0 = nR - 1 - r; }
          for (let dr = -rw; dr <= rw; dr++) {
            const rr = rr0 + dr;
            if ((dt === 0 && dr === 0) || rr < 0 || rr >= nR) continue;
            const u = acc[tt * nR + rr];
            if (u > v || (u === v && (tt * nR + rr) < (t * nR + r))) { isMax = false; break; }
          }
        }
        if (isMax) peaks.push({ theta: t * step, rho: r - rMax, votes: v });
      }
    }
    peaks.sort((a, b) => b.votes - a.votes);
    const out = [], mA = o.mergeAngleDeg * DEG;
    for (const p of peaks) {
      let dup = false;
      for (const q of out) {
        let dA = Math.abs(p.theta - q.theta), dR = Math.abs(p.rho - q.rho);
        if (dA > Math.PI / 2) { dA = Math.PI - dA; dR = Math.abs(p.rho + q.rho); }
        if (dA < mA && dR < o.mergeRhoPx) { dup = true; break; }
      }
      if (!dup) out.push(p);
      if (out.length >= o.houghMaxLines) break;
    }
    // Convert to image-coordinate normal form n·p = c.
    return out.map(p => {
      const nx = Math.cos(p.theta), ny = Math.sin(p.theta);
      return { theta: p.theta, rho: p.rho, votes: p.votes, nx, ny, c: p.rho + nx * cx + ny * cy };
    });
  }

  // Orientation-tagged support map: bit b of map[i] is set when an edge pixel within
  // supportRadius of i has a gradient normal in orientation bin b (or a neighbor bin).
  // Lets quad scoring check "is there an edge here running this way?" in O(1).
  const N_BINS = 12;
  function supportMap(edges, gx, gy, w, h, radius) {
    const map = new Uint16Array(w * h), binW = Math.PI / N_BINS;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!edges[i]) continue;
        let phi = Math.atan2(gy[i], gx[i]);
        if (phi < 0) phi += Math.PI;
        const b = Math.min(N_BINS - 1, Math.floor(phi / binW));
        const bits = (1 << b) | (1 << ((b + 1) % N_BINS)) | (1 << ((b + N_BINS - 1) % N_BINS));
        for (let dy = -radius; dy <= radius; dy++) {
          const yy = y + dy; if (yy < 0 || yy >= h) continue;
          for (let dx = -radius; dx <= radius; dx++) {
            const xx = x + dx; if (xx < 0 || xx >= w) continue;
            map[yy * w + xx] |= bits;
          }
        }
      }
    }
    return map;
  }

  function sideSupport(a, b, ctx) {
    const { map, w, h, trim } = ctx;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    let phi = Math.atan2(dx, -dy); // normal of the side (perpendicular to (dx, dy))
    if (phi < 0) phi += Math.PI; if (phi >= Math.PI) phi -= Math.PI;
    const bit = 1 << Math.min(N_BINS - 1, Math.floor(phi / (Math.PI / N_BINS)));
    const n = Math.max(8, Math.min(80, Math.round(len * (1 - 2 * trim) / 2)));
    let hits = 0, valid = 0;
    for (let k = 0; k < n; k++) {
      const t = trim + (1 - 2 * trim) * (k + 0.5) / n;
      const x = Math.floor(a[0] + dx * t), y = Math.floor(a[1] + dy * t);
      if (x < 0 || y < 0 || x >= w || y >= h) continue; // off-image parts neither help nor hurt
      valid++;
      if (map[y * w + x] & bit) hits++;
    }
    return valid >= n * 0.5 ? hits / valid : (valid ? hits / n : 0);
  }

  // Score one quad. Shared by the Hough path and any external quad source (OpenCV).
  function scoreQuad(q, ctx) {
    const { w, h, o, ratio, seed } = ctx;
    const sup = [0, 1, 2, 3].map(k => sideSupport(q[k], q[(k + 1) % 4], ctx));
    const supMean = (sup[0] + sup[1] + sup[2] + sup[3]) / 4, supMin = Math.min(...sup);
    const support = 0.5 * supMean + 0.5 * supMin;
    let aspect = 1, rAsp = null;
    if (ratio) {
      // Compare the perspective-corrected aspect, with a dead band: cards on stands are
      // foreshortened a few percent even after correction, so near-misses aren't penalized.
      rAsp = rectAspect(q, [w / 2, h / 2], ctx.focal);
      const r = Math.min(rAsp, 1 / rAsp), tr = Math.min(ratio, 1 / ratio);
      const err = Math.max(0, Math.abs(Math.log(r / tr)) - o.aspectDeadband);
      aspect = Math.exp(-((err / o.aspectTol) ** 2));
    }
    const maxDev = Math.max(...Quad.angles(q).map(a => Math.abs(a - 90)));
    const angle = Math.exp(-((maxDev / o.angleTolDeg) ** 2));
    const areaFrac = Quad.area(q) / (w * h);
    const c = Quad.centroid(q);
    const center = 1 - Math.min(1, Math.hypot(c[0] - w / 2, c[1] - h / 2) / (Math.hypot(w, h) / 2));
    let score = o.wSupport * support + o.wAspect * aspect + o.wAngle * angle + o.wCenter * center + o.wArea * Math.sqrt(areaFrac);
    const seedHit = seed ? Quad.contains(q, seed) : null;
    if (seed && !seedHit) score *= o.seedMissFactor;
    const confidence = Math.max(0, Math.min(1, Math.pow(support, 0.75) * Math.sqrt(aspect) * Math.sqrt(angle)));
    return { score, confidence, parts: { support, supMin, aspect, rAsp, angle, areaFrac, center, seedHit } };
  }

  function angDiff(a, b) { let d = Math.abs(a - b) % Math.PI; return d > Math.PI / 2 ? Math.PI - d : d; }

  // Build and score every quad formed by two near-parallel line pairs that are roughly
  // perpendicular to each other. Corners come from line intersections, so rounded
  // corners (where no straight edge exists) don't matter.
  function quadsFromLines(lines, ctx) {
    const { w, h, o } = ctx, minSep = o.minSideFrac * Math.min(w, h);
    const maxP = o.maxPerspectiveDeg * DEG, perpTol = o.perpTolDeg * DEG, margin = o.edgeMarginFrac * Math.max(w, h);
    const pairs = [];
    for (let i = 0; i < lines.length; i++) for (let j = i + 1; j < lines.length; j++) {
      const a = lines[i], b = lines[j];
      if (angDiff(a.theta, b.theta) > maxP) continue;
      // Separation: distance from the point of `a` nearest the image center to line `b`.
      const t = a.nx * (w / 2) + a.ny * (h / 2) - a.c, p = [w / 2 - a.nx * t, h / 2 - a.ny * t];
      if (Math.abs(b.nx * p[0] + b.ny * p[1] - b.c) < minSep) continue;
      pairs.push([a, b]);
    }
    const out = [];
    for (let p = 0; p < pairs.length; p++) for (let r = p + 1; r < pairs.length; r++) {
      const [a1, a2] = pairs[p], [b1, b2] = pairs[r];
      if (Math.abs(Math.PI / 2 - angDiff(a1.theta, b1.theta)) > perpTol) continue;
      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
      const pts = [intersect(a1, b1), intersect(a1, b2), intersect(a2, b2), intersect(a2, b1)];
      if (pts.some(x => !x || x[0] < -margin || x[1] < -margin || x[0] > w + margin || x[1] > h + margin)) continue;
      const q = Quad.order(pts);
      if (!Quad.isConvex(q)) continue;
      const af = Quad.area(q) / (w * h);
      if (af < o.minAreaFrac || af > o.maxAreaFrac) continue;
      const sc = scoreQuad(q, ctx);
      out.push(Object.assign({ corners: q, lines: [a1, a2, b1, b2] }, sc));
    }
    return out;
  }

  // Keep the best few candidates whose corners differ meaningfully.
  function pickCandidates(quads, o, diag, n) {
    quads.sort((a, b) => b.score - a.score);
    const keep = [], dupD = o.dupCornerFrac * diag;
    for (const q of quads) {
      if (keep.some(k => Math.max(...k.corners.map((c, i) => V.dist(c, q.corners[i]))) < dupD)) continue;
      keep.push(q);
      if (keep.length >= n) break;
    }
    return keep;
  }

  // Shared preprocessing: edge map, Hough lines, support map.
  function analyze(img, params) {
    const o = Object.assign({}, DETECT_DEFAULTS, params || {});
    const w = img.width, h = img.height;
    const { gx, gy, mag } = edgeImage(img, o);
    const edges = canny(gx, gy, mag, w, h, o.cannyLow, o.cannyHigh);
    const lines = hough(edges, gx, gy, w, h, o);
    const map = supportMap(edges, gx, gy, w, h, Math.round(o.supportRadiusPx));
    return { o, w, h, edges, lines, map };
  }

  /**
   * detect(img, opts) → { candidates: [{corners, confidence, score, parts}], debug }
   * img: ImageData-like at working size. opts: { ratio (card W/H, default 5:7),
   * seed: [x,y] working px or null, params: overrides of DETECT_DEFAULTS, debug: bool,
   * quads: optional external candidate quads (e.g. from OpenCV) scored alongside the Hough quads }.
   */
  function detect(img, opts = {}) {
    const t0 = now();
    const A = analyze(img, opts.params);
    const { o, w, h, lines, map } = A;
    const ctx = { w, h, o, map, trim: o.cornerTrim, ratio: opts.ratio || 63.5 / 88.9,
      seed: opts.seed || null, focal: focalModel(w, h, o.focalFactor) };
    const diag = Math.hypot(w, h);
    const t1 = now();
    let quads = quadsFromLines(lines, ctx);
    // External proposals (e.g. OpenCV contours) are added to the Hough quads, never replace them.
    if (opts.quads) for (const q of opts.quads) { const c = Quad.order(q); if (Quad.isConvex(c)) quads.push(Object.assign({ corners: c }, scoreQuad(c, ctx))); }
    const cands = pickCandidates(quads, o, diag, o.maxCandidates);
    const result = {
      candidates: cands.map(c => ({ corners: c.corners, confidence: c.confidence, score: c.score, parts: c.parts })),
      lines: lines.map(l => ({ nx: l.nx, ny: l.ny, c: l.c, votes: l.votes })), // used for snap-to-edge
      timing: { analyze: t1 - t0, quads: now() - t1, total: now() - t0, lines: lines.length, quadCount: quads.length },
    };
    if (opts.debug) {
      result.debug = {
        width: w, height: h, edges: A.edges,
        quads: pickCandidates(quads.slice(), o, diag, 30).map(q => ({ corners: q.corners, score: q.score, confidence: q.confidence })),
      };
    }
    return result;
  }

  // Score externally-proposed quads (OpenCV path) with the same edge evidence.
  function scoreQuads(img, quads, opts = {}) { return detect(img, Object.assign({}, opts, { quads })); }

  /**
   * refineQuad(roi, corners, opts) → { corners, refined: [bool×4] }
   * Sub-pixel edge refinement on a high-resolution crop. roi: ImageData-like plus
   * { ox, oy, scale }: roi pixel = (source − o) · scale. corners in source px.
   * For each side, sample points along it, search along the side's normal for the
   * strongest gradient of the dominant polarity, fit a robust line, re-intersect.
   */
  function refineQuad(roi, corners, opts = {}) {
    const o = Object.assign({}, DETECT_DEFAULTS, opts.params || {});
    const w = roi.width, h = roi.height, s = roi.scale;
    const g = gaussianBlur(toGray(roi), w, h, o.refineBlur);
    const toR = p => [(p[0] - roi.ox) * s, (p[1] - roi.oy) * s];
    const toS = p => [p[0] / s + roi.ox, p[1] / s + roi.oy];
    const q = corners.map(toR);
    const R = Math.max(2, (opts.searchPx || 12) * s), trim = o.cornerTrim;
    const lines = [], refined = [];
    for (let k = 0; k < 4; k++) {
      const a = q[k], b = q[(k + 1) % 4];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      const nx = -dy / L, ny = dx / L;
      const prof = [];
      for (let i = 0; i < o.refineSamples; i++) {
        const t = trim + (1 - 2 * trim) * (i + 0.5) / o.refineSamples;
        const bx = a[0] + dx * t, by = a[1] + dy * t;
        const vals = [];
        for (let d = -R; d <= R; d += 0.5) {
          // Directional derivative along the normal (central difference, ±0.75 px).
          const g1 = sampleGray(g, w, h, bx + nx * (d + 0.75), by + ny * (d + 0.75));
          const g0 = sampleGray(g, w, h, bx + nx * (d - 0.75), by + ny * (d - 0.75));
          vals.push((g1 - g0) / 1.5);
        }
        prof.push({ bx, by, vals });
      }
      // Dominant polarity = sign of the strongest response summed over samples.
      let pos = 0, neg = 0;
      for (const p of prof) { let m = 0; for (const v of p.vals) if (Math.abs(v) > Math.abs(m)) m = v; if (m > 0) pos += m; else neg -= m; }
      const sign = pos >= neg ? 1 : -1;
      const pts = [];
      for (const p of prof) {
        let bi = -1, bv = 0;
        for (let i = 0; i < p.vals.length; i++) { const v = sign * p.vals[i]; if (v > bv) { bv = v; bi = i; } }
        if (bi < 1 || bi >= p.vals.length - 1 || bv < o.refineMinGrad) continue;
        // Parabolic sub-sample peak.
        const y0 = sign * p.vals[bi - 1], y1 = bv, y2 = sign * p.vals[bi + 1];
        const den = y0 - 2 * y1 + y2, off = den < 0 ? 0.5 * (y0 - y2) / den : 0;
        const d = -R + (bi + off) * 0.5;
        pts.push({ x: p.bx + nx * d, y: p.by + ny * d, wt: bv });
      }
      const fit = robustLine(pts, o.refineInlierPx * Math.max(1, s));
      if (fit && fit.inliers >= o.refineSamples * 0.3) { lines.push(fit.line); refined.push(true); }
      else { lines.push(lineThrough(a, b)); refined.push(false); }
    }
    const out = [];
    for (let k = 0; k < 4; k++) {
      const p = intersect(lines[(k + 3) % 4], lines[k]);
      // Fall back to the input corner if the refined lines blow up.
      out.push(p && V.dist(p, q[k]) <= 2.5 * R ? toS(p) : corners[k].slice());
    }
    return { corners: out, refined };
  }

  // Weighted total-least-squares line with iterative outlier rejection.
  function robustLine(pts, inlierTol) {
    let cur = pts.slice();
    let line = null;
    for (let iter = 0; iter < 4 && cur.length >= 4; iter++) {
      let sw = 0, mx = 0, my = 0;
      for (const p of cur) { sw += p.wt; mx += p.wt * p.x; my += p.wt * p.y; }
      mx /= sw; my /= sw;
      let sxx = 0, sxy = 0, syy = 0;
      for (const p of cur) { const dx = p.x - mx, dy = p.y - my; sxx += p.wt * dx * dx; sxy += p.wt * dx * dy; syy += p.wt * dy * dy; }
      // Principal direction of the 2×2 covariance; the line normal is perpendicular to it.
      const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
      const nx = -Math.sin(ang), ny = Math.cos(ang);
      line = { nx, ny, c: nx * mx + ny * my };
      const res = cur.map(p => Math.abs(nx * p.x + ny * p.y - line.c));
      const sorted = res.slice().sort((a, b) => a - b), mad = sorted[sorted.length >> 1] * 1.4826;
      const tol = Math.max(inlierTol, 2.5 * mad);
      const next = cur.filter((p, i) => res[i] <= tol);
      if (next.length === cur.length) break;
      cur = next;
    }
    return line ? { line, inliers: cur.length } : null;
  }

  /* ===================================================================
     RENDER PIPELINE — state → geometry → warp
     Frames: S (source px) —H→ P (perspective-corrected) —MR→ R (rotated/flipped) —crop/scale→ O (output)
     =================================================================== */
  const GEOMETRY_DEFAULTS = { maxOutputPx: 12000, maxOutputArea: 16777216, maxBoundsFactor: 3, minCornerDistPx: 8, fitPaddingPct: 8, allowUpscale: false };

  function cropRatio(crop, srcW, srcH) {
    if (!crop || crop.ratio == null) return null;
    let r = crop.ratio === 'original' ? srcW / srcH : crop.ratio;
    return crop.swapped ? 1 / r : r;
  }

  /* ---- Overlay placement (logo / watermark), in the output frame = the crop.
     ov = { cx, cy, w, aspect, opacity }: center as fractions of the frame, width as a
     fraction of the frame width, aspect = logo width ÷ height. Being relative to the frame,
     the same ov lands in the same place at every export size. ---- */
  const OVERLAY_DEFAULTS = { width: 0.25, minWidthPx: 8, snapMargin: 0.03 };
  function overlayRect(ov, fw, fh) {
    const w = ov.w * fw, h = w / ov.aspect;
    return { x: ov.cx * fw - w / 2, y: ov.cy * fh - h / 2, w, h };
  }
  // Keep the whole overlay inside the frame: shrink it if it can't fit, then pull its center in.
  function clampOverlay(ov, fw, fh, minWidthPx = OVERLAY_DEFAULTS.minWidthPx) {
    const maxW = Math.min(fw, fh * ov.aspect);
    const w = Math.max(Math.min(ov.w * fw, maxW), Math.min(minWidthPx, maxW)), h = w / ov.aspect;
    return Object.assign({}, ov, { w: w / fw, cx: clamp(ov.cx * fw, w / 2, fw - w / 2) / fw, cy: clamp(ov.cy * fh, h / 2, fh - h / 2) / fh });
  }
  // Snap presets: corners 'tl' 'tr' 'bl' 'br', side middles 't' 'b' 'l' 'r', or 'c'; the margin is a fraction of the frame width.
  // A preset without 'l' or 'r' is centered across; one without 't' or 'b' is centered down.
  function snapOverlay(ov, where, fw, fh, margin = OVERLAY_DEFAULTS.snapMargin) {
    const r = overlayRect(ov, fw, fh), m = margin * fw;
    const x = where.includes('l') ? m + r.w / 2 : where.includes('r') ? fw - m - r.w / 2 : fw / 2;
    const y = where.includes('t') ? m + r.h / 2 : where.includes('b') ? fh - m - r.h / 2 : fh / 2;
    return clampOverlay(Object.assign({}, ov, { cx: x / fw, cy: y / fh }), fw, fh);
  }

  function fitCrop(quad, ratio, padPct, Rw, Rh) {
    const bb = Quad.bbox(quad), pad = (padPct / 100) * Math.max(bb.w, bb.h);
    let w = bb.w + 2 * pad, h = bb.h + 2 * pad;
    const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
    if (ratio) { if (w / h < ratio) w = h * ratio; else h = w / ratio; }
    const s = Math.min(1, Rw / w, Rh / h); w *= s; h *= s;
    return { x: clamp(cx - w / 2, 0, Rw - w), y: clamp(cy - h / 2, 0, Rh - h), w, h };
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function rectCorners(r) { return [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]; }

  // Shrink a crop about its center until all four corners sit inside every polygon.
  function shrinkToValid(crop, polys) {
    const inside = r => rectCorners(r).every(p => polys.every(poly => Quad.contains(poly, p)));
    if (inside(crop)) return crop;
    let cx = crop.x + crop.w / 2, cy = crop.y + crop.h / 2;
    if (!polys.every(poly => Quad.contains(poly, [cx, cy]))) [cx, cy] = Quad.centroid(polys[0]);
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (inside({ x: cx - crop.w * m / 2, y: cy - crop.h * m / 2, w: crop.w * m, h: crop.h * m })) lo = m; else hi = m;
    }
    return { x: cx - crop.w * lo / 2, y: cy - crop.h * lo / 2, w: crop.w * lo, h: crop.h * lo };
  }

  /**
   * computeGeometry(state, cfg) → every transform needed to render `state`.
   * Pure function of (state, cfg); preview and export both derive from it.
   */
  function computeGeometry(st, cfgIn) {
    const cfg = Object.assign({}, GEOMETRY_DEFAULTS, cfgIn || {});
    const W = st.source.width, Hs = st.source.height, c = st.corners;
    const v = Quad.validate(c, cfg.minCornerDistPx);
    if (!v.ok) return { ok: false, reason: v.reason };
    const dst = perspectiveTargets(c, {
      strength: st.strength, ratio: (st.aspect && st.aspect.ratio) || 63.5 / 88.9,
      orientation: st.aspect ? st.aspect.orientation : 'auto', heightMode: st.squareUpHeight || 'preserveEdges',
    });
    const H0 = solveHomography(c, dst);
    if (!H0) return { ok: false, reason: 'Could not solve the perspective for these corners.' };

    // P-frame bounds: forward-map the source image's corners, but never further than
    // maxBoundsFactor card-sizes beyond the card (protects against near-horizon blowups).
    const qb = Quad.bbox(dst), F = cfg.maxBoundsFactor;
    const lim = { x0: qb.x0 - qb.w * F, y0: qb.y0 - qb.h * F, x1: qb.x1 + qb.w * F, y1: qb.y1 + qb.h * F };
    const src4 = [[0, 0], [W, 0], [W, Hs], [0, Hs]];
    let b, limited = false;
    if (src4.every(p => M3.w(H0, p[0], p[1]) > EPS)) {
      const m = Quad.bbox(src4.map(p => M3.apply(H0, p[0], p[1])));
      b = { x0: Math.max(m.x0, lim.x0), y0: Math.max(m.y0, lim.y0), x1: Math.min(m.x1, lim.x1), y1: Math.min(m.y1, lim.y1) };
      limited = b.x0 > m.x0 || b.y0 > m.y0 || b.x1 < m.x1 || b.y1 < m.y1;
    } else { b = lim; limited = true; }
    const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    const sP = Math.min(1, cfg.maxOutputPx / Math.max(bw, bh));
    const HP = M3.chain(M3.scale(sP), M3.translate(-b.x0, -b.y0), H0);
    const Pw = bw * sP, Ph = bh * sP;
    const cardP = dst.map(p => [(p[0] - b.x0) * sP, (p[1] - b.y0) * sP]);

    // R frame: flip, then rotate about the P center; R is the rotated P rect's bbox.
    const rot = st.rotation || { quarter: 0, fine: 0 };
    const deg = ((rot.quarter || 0) * 90 + (rot.fine || 0));
    const Rm = M3.rotate(deg * DEG), cs = Math.abs(Rm[0]), sn = Math.abs(Rm[3]);
    const Rw = cs * Pw + sn * Ph, Rh = sn * Pw + cs * Ph;
    const flip = st.flip || {};
    const MR = M3.chain(M3.translate(Rw / 2, Rh / 2), Rm, M3.scale(flip.h ? -1 : 1, flip.v ? -1 : 1), M3.translate(-Pw / 2, -Ph / 2));
    const SR = M3.mul(MR, HP);
    const cardR = cardP.map(p => M3.apply(MR, p[0], p[1]));
    const frameR = Quad.order([[0, 0], [Pw, 0], [Pw, Ph], [0, Ph]].map(p => M3.apply(MR, p[0], p[1])));
    const validR = src4.every(p => M3.w(SR, p[0], p[1]) > EPS) ? Quad.order(src4.map(p => M3.apply(SR, p[0], p[1]))) : null;

    // Crop, in R px. Manual rects are stored relative to the R center in units of the P
    // frame's long side, so they stay proportionally placed when earlier steps change.
    const L = Math.max(Pw, Ph), cr = st.crop || { mode: 'full' };
    const ratio = cropRatio(cr, W, Hs);
    let crop;
    if (cr.mode === 'fit') crop = fitCrop(cardR, ratio, cfg.fitPaddingPct, Rw, Rh);
    else if (cr.mode === 'manual' && cr.rect) {
      const r = cr.rect;
      crop = { x: Rw / 2 + (r.cx - r.w / 2) * L, y: Rh / 2 + (r.cy - r.h / 2) * L, w: r.w * L, h: r.h * L };
      const x0 = clamp(crop.x, 0, Rw), y0 = clamp(crop.y, 0, Rh);
      crop = { x: x0, y: y0, w: clamp(crop.x + crop.w, 0, Rw) - x0, h: clamp(crop.y + crop.h, 0, Rh) - y0 };
    } else {
      crop = { x: 0, y: 0, w: Rw, h: Rh };
      if (ratio) { let w = Rw, h = w / ratio; if (h > Rh) { h = Rh; w = h * ratio; } crop = { x: (Rw - w) / 2, y: (Rh - h) / 2, w, h }; }
    }
    if (rot.fillFrame) crop = shrinkToValid(crop, validR ? [frameR, validR] : [frameR]);
    if (!(crop.w >= 1 && crop.h >= 1)) return { ok: false, reason: 'Crop is empty.' };

    // Output size: optional long-edge resize, then hard clamps against huge canvases.
    const ex = st.export || {};
    const long = Math.max(crop.w, crop.h);
    let e = 1;
    if (ex.longEdge) e = cfg.allowUpscale ? ex.longEdge / long : Math.min(1, ex.longEdge / long);
    let outW = Math.max(1, Math.round(crop.w * e)), outH = Math.max(1, Math.round(crop.h * e)), outClamped = false;
    const k = Math.min(1, cfg.maxOutputPx / Math.max(outW, outH), Math.sqrt(cfg.maxOutputArea / (outW * outH)));
    if (k < 1) { outW = Math.max(1, Math.floor(outW * k)); outH = Math.max(1, Math.floor(outH * k)); outClamped = true; }
    const Mout = M3.chain(M3.scale(outW / crop.w, outH / crop.h), M3.translate(-crop.x, -crop.y), SR);
    const MoutInv = M3.inv(Mout);
    if (!MoutInv) return { ok: false, reason: 'Transform is not invertible.' };
    return {
      ok: true, dst, H0, HP, MR, SR, Mout, MoutInv,
      P: { w: Pw, h: Ph, scale: sP, clamped: sP < 1, limited },
      R: { w: Rw, h: Rh }, L, cardP, cardR, frameR, validR, crop,
      out: { w: outW, h: outH, scale: e, clamped: outClamped },
    };
  }

  /**
   * warp(dst, src, Minv, opts) — inverse-map every dst pixel through Minv into src and sample.
   * dst/src: ImageData-like RGBA. Minv maps dst pixel coords (+rowOffset) → src pixel coords.
   * opts.bounds [x0,y0,x1,y1]: valid source area in src coords; outside → opts.fill (RGBA 0–255).
   */
  function warp(dst, src, Minv, opts = {}) {
    const interp = opts.interp === 'bicubic' ? 'bicubic' : 'bilinear';
    const fill = opts.fill || [0, 0, 0, 0], rowOffset = opts.rowOffset || 0;
    const [bx0, by0, bx1, by1] = opts.bounds || [0, 0, src.width, src.height];
    const sw = src.width, sh = src.height, sd = src.data, dd = dst.data, dw = dst.width, dh = dst.height;
    const [a, b, c, d, e, f, g, h, i] = Minv;
    const f0 = fill[0], f1 = fill[1], f2 = fill[2], f3 = fill[3];
    const cub = new Float32Array(4), cubY = new Float32Array(4);
    for (let y = 0; y < dh; y++) {
      const oy = y + rowOffset + 0.5;
      let X = a * 0.5 + b * oy + c, Y = d * 0.5 + e * oy + f, Wd = g * 0.5 + h * oy + i;
      let o = y * dw * 4;
      for (let x = 0; x < dw; x++, X += a, Y += d, Wd += g, o += 4) {
        if (Wd <= EPS) { dd[o] = f0; dd[o + 1] = f1; dd[o + 2] = f2; dd[o + 3] = f3; continue; }
        const u = X / Wd, v = Y / Wd;
        if (u < bx0 || v < by0 || u >= bx1 || v >= by1) { dd[o] = f0; dd[o + 1] = f1; dd[o + 2] = f2; dd[o + 3] = f3; continue; }
        const fx = u - 0.5, fy = v - 0.5;
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
        if (interp === 'bilinear') {
          const xa = x0 < 0 ? 0 : x0 >= sw ? sw - 1 : x0, xb = x0 + 1 < 0 ? 0 : x0 + 1 >= sw ? sw - 1 : x0 + 1;
          const ya = y0 < 0 ? 0 : y0 >= sh ? sh - 1 : y0, yb = y0 + 1 < 0 ? 0 : y0 + 1 >= sh ? sh - 1 : y0 + 1;
          const p00 = (ya * sw + xa) * 4, p10 = (ya * sw + xb) * 4, p01 = (yb * sw + xa) * 4, p11 = (yb * sw + xb) * 4;
          const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
          dd[o] = sd[p00] * w00 + sd[p10] * w10 + sd[p01] * w01 + sd[p11] * w11;
          dd[o + 1] = sd[p00 + 1] * w00 + sd[p10 + 1] * w10 + sd[p01 + 1] * w01 + sd[p11 + 1] * w11;
          dd[o + 2] = sd[p00 + 2] * w00 + sd[p10 + 2] * w10 + sd[p01 + 2] * w01 + sd[p11 + 2] * w11;
          dd[o + 3] = sd[p00 + 3] * w00 + sd[p10 + 3] * w10 + sd[p01 + 3] * w01 + sd[p11 + 3] * w11;
        } else {
          keys(tx, cub); keys(ty, cubY);
          let r = 0, gg = 0, bb = 0, aa = 0;
          for (let m = 0; m < 4; m++) {
            let yy = y0 - 1 + m; yy = yy < 0 ? 0 : yy >= sh ? sh - 1 : yy;
            const wy = cubY[m], row = yy * sw;
            for (let n = 0; n < 4; n++) {
              let xx = x0 - 1 + n; xx = xx < 0 ? 0 : xx >= sw ? sw - 1 : xx;
              const wgt = cub[n] * wy, p = (row + xx) * 4;
              r += sd[p] * wgt; gg += sd[p + 1] * wgt; bb += sd[p + 2] * wgt; aa += sd[p + 3] * wgt;
            }
          }
          dd[o] = r; dd[o + 1] = gg; dd[o + 2] = bb; dd[o + 3] = aa; // Uint8ClampedArray clamps overshoot
        }
      }
    }
    return dst;
  }
  // Keys cubic convolution weights (a = −0.5, Catmull-Rom) for offsets −1, 0, 1, 2.
  function keys(t, out) {
    const A = -0.5;
    const k = x => { x = Math.abs(x); return x <= 1 ? (A + 2) * x * x * x - (A + 3) * x * x + 1 : x < 2 ? A * x * x * x - 5 * A * x * x + 8 * A * x - 4 * A : 0; };
    out[0] = k(1 + t); out[1] = k(t); out[2] = k(1 - t); out[3] = k(2 - t);
  }

  /* ===================================================================
     LEVELS — white/black point correction in linear light
     =================================================================== */
  const LEVELS_DEFAULTS = { whiteTarget: 245, blackTarget: 8, autoWhitePct: 1, autoBlackPct: 0.5, autoClipAt: 250 };
  const SRGB_LIN = new Float64Array(256);
  for (let i = 0; i < 256; i++) { const v = i / 255; SRGB_LIN[i] = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  const toLin = v => { v = Math.max(0, Math.min(255, v)) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const toSrgb = l => { l = Math.max(0, Math.min(1, l)); return 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055); };

  /**
   * levelsLUT(levels, opts) → [lutR, lutG, lutB] (Uint8ClampedArray 256 each), or null for no change.
   * levels: { white: [r,g,b] | null, black: [r,g,b] | null } in sRGB 0–255.
   * Per channel, in linear light, the white pick maps to whiteTarget and the black pick to
   * blackTarget, so both come out neutral. Scaling linear light is what a camera's white
   * balance does; doing it on gamma-encoded values would shift midtone hues.
   */
  function levelsLUT(lv, opts) {
    if (!lv || (!lv.white && !lv.black)) return null;
    const o = Object.assign({}, LEVELS_DEFAULTS, opts || {});
    const tw = toLin(lv.white ? o.whiteTarget : 255), tb = toLin(lv.black ? o.blackTarget : 0);
    return [0, 1, 2].map(c => {
      const w = lv.white ? toLin(lv.white[c]) : 1, b = lv.black ? toLin(lv.black[c]) : 0;
      const span = Math.max(w - b, 0.02);
      const t = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) t[i] = Math.round(toSrgb(tb + (SRGB_LIN[i] - b) / span * (tw - tb)));
      return t;
    });
  }
  function applyLUT(img, lut) {
    const d = img.data, [r, g, b] = lut;
    for (let i = 0; i < d.length; i += 4) { d[i] = r[d[i]]; d[i + 1] = g[d[i + 1]]; d[i + 2] = b[d[i + 2]]; }
    return img;
  }
  // Mean color of the opaque pixels, averaged in linear light, returned as sRGB 0–255.
  // With trim > 0, only the (1 − 2·trim) share of pixels closest in brightness to the patch's
  // median brightness are averaged. A dropper patch that is mostly label with some text (or a
  // speck of glare) then reads the surface it is mostly on, not a blend.
  function meanColor(img, trim = 0) {
    const d = img.data, idx = [];
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] !== 0) idx.push(i);
    if (!idx.length) return null;
    const lum = i => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    if (trim > 0) {
      const sorted = idx.map(lum).sort((a, b) => a - b), med = sorted[sorted.length >> 1];
      idx.sort((a, b) => Math.abs(lum(a) - med) - Math.abs(lum(b) - med));
    }
    const lo = 0, hi = Math.max(1, Math.ceil(idx.length * (1 - 2 * trim)));
    let r = 0, g = 0, b = 0;
    for (let k = lo; k < hi; k++) { const i = idx[k]; r += SRGB_LIN[d[i]]; g += SRGB_LIN[d[i + 1]]; b += SRGB_LIN[d[i + 2]]; }
    const n = hi - lo;
    return [r / n, g / n, b / n].map(v => Math.round(toSrgb(v) * 10) / 10);
  }
  /**
   * autoLevels(img, opts) → { white, black } starting point from an image (transparent pixels ignored).
   * White = mean of the brightest autoWhitePct% of pixels that aren't clipped (a white-patch
   * estimate; clipped pixels carry no color information). Black = mean of the darkest autoBlackPct%.
   */
  function autoLevels(img, opts) {
    const o = Object.assign({}, LEVELS_DEFAULTS, opts || {});
    const d = img.data, N = d.length / 4, L = new Uint8Array(N), ok = new Uint8Array(N);
    const hw = new Uint32Array(256), hb = new Uint32Array(256);
    let nw = 0, nb = 0;
    for (let j = 0, i = 0; j < N; j++, i += 4) {
      if (d[i + 3] === 0) continue;
      const l = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      L[j] = l; ok[j] = 1; hb[l]++; nb++;
      if (Math.max(d[i], d[i + 1], d[i + 2]) < o.autoClipAt) { ok[j] = 2; hw[l]++; nw++; }
    }
    if (!nw) return null;
    let tw = 255, acc = 0;
    const needW = Math.max(1, nw * o.autoWhitePct / 100);
    for (; tw > 0; tw--) { acc += hw[tw]; if (acc >= needW) break; }
    let tb = 0; acc = 0;
    const needB = Math.max(1, nb * o.autoBlackPct / 100);
    for (; tb < 255; tb++) { acc += hb[tb]; if (acc >= needB) break; }
    const sw = [0, 0, 0], sb = [0, 0, 0]; let cw = 0, cb = 0;
    for (let j = 0, i = 0; j < N; j++, i += 4) {
      if (ok[j] === 2 && L[j] >= tw) { sw[0] += SRGB_LIN[d[i]]; sw[1] += SRGB_LIN[d[i + 1]]; sw[2] += SRGB_LIN[d[i + 2]]; cw++; }
      if (ok[j] && L[j] <= tb) { sb[0] += SRGB_LIN[d[i]]; sb[1] += SRGB_LIN[d[i + 1]]; sb[2] += SRGB_LIN[d[i + 2]]; cb++; }
    }
    const enc = (sum, n) => sum.map(v => Math.round(toSrgb(v / n) * 10) / 10);
    const white = enc(sw, cw), black = cb ? enc(sb, cb) : null;
    const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    // A "black" that is more than half as bright as white is a low-contrast scene, not a black point.
    return { white, black: black && lum(black) < lum(white) * 0.5 ? black : null };
  }

  /* ===================================================================
     SELF-TEST — runs identically on the main thread and in a Worker
     =================================================================== */
  function selfTest() {
    const results = [];
    const rec = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const quads = [];
    for (let n = 0; n < 50; n++) {
      // Random convex-ish card quads in a 4032×3024 frame: base rectangle + jitter.
      const cx = 1000 + rnd() * 2000, cy = 800 + rnd() * 1400, w = 600 + rnd() * 900, h = w * (1.2 + rnd() * 0.4), j = 0.18;
      const q = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]]
        .map(p => [p[0] + (rnd() - 0.5) * w * j, p[1] + (rnd() - 0.5) * h * j]);
      if (Quad.isConvex(q)) quads.push(q);
    }
    // 1. Homography round-trip: corners map within 0.01 px, and back through the inverse.
    let worst = 0;
    for (const q of quads) {
      const dst = perspectiveTargets(q, { strength: 1, ratio: 63.5 / 88.9 });
      const H = solveHomography(q, dst), Hi = M3.inv(H);
      q.forEach((p, i) => {
        worst = Math.max(worst, V.dist(M3.apply(H, p[0], p[1]), dst[i]));
        worst = Math.max(worst, V.dist(M3.apply(Hi, dst[i][0], dst[i][1]), p));
      });
    }
    rec('Homography round-trips corners within 0.01 px', worst < 0.01, `max error ${worst.toExponential(2)} px over ${quads.length} quads`);
    // 2. Flatten 0% (squared up): top/bottom horizontal, left/right edge angles mirrored.
    let worstA = 0, worstH = 0;
    for (const q of quads) {
      const t = perspectiveTargets(q, { strength: 0 });
      worstH = Math.max(worstH, Math.abs(t[0][1] - t[1][1]), Math.abs(t[3][1] - t[2][1]));
      const left = Math.atan2(t[3][0] - t[0][0], t[3][1] - t[0][1]), right = Math.atan2(t[2][0] - t[1][0], t[2][1] - t[1][1]);
      worstA = Math.max(worstA, Math.abs(left + right) / DEG);
      const H = solveHomography(q, t);
      q.forEach((p, i) => { worst = Math.max(worst, V.dist(M3.apply(H, p[0], p[1]), t[i])); });
    }
    rec('Flatten 0%: top/bottom horizontal, left/right angles mirror', worstA < 1e-6 && worstH < 1e-6, `angle mismatch ${worstA.toExponential(2)}°, edge tilt ${worstH.toExponential(2)} px`);
    // 3. Flatten 100%: four 90° corners at 5:7 (portrait) and correct landscape pick.
    let worstB = 0, worstR = 0;
    for (const q of quads) {
      const t = perspectiveTargets(q, { strength: 1, ratio: 63.5 / 88.9 });
      worstB = Math.max(worstB, ...Quad.angles(t).map(a => Math.abs(a - 90)));
      const s = Quad.sides(t);
      worstR = Math.max(worstR, Math.abs(Math.min(s.top, s.left) / Math.max(s.top, s.left) - 63.5 / 88.9));
    }
    rec('Flatten 100%: corners are 90° at 5:7', worstB < 1e-9 && worstR < 1e-9, `angle error ${worstB.toExponential(2)}°, aspect error ${worstR.toExponential(2)}`);
    // 3b. Perspective-corrected aspect: project a 5:7 card tilted 25°/12° through a pinhole camera.
    const fpx = 1500, u0 = 750, v0 = 1000, tx = 25 * DEG, ty = 12 * DEG;
    const proj = ([x, y, z]) => {
      const y1 = y * Math.cos(tx) - z * Math.sin(tx), z1 = y * Math.sin(tx) + z * Math.cos(tx);
      const x2 = x * Math.cos(ty) + z1 * Math.sin(ty), z2 = -x * Math.sin(ty) + z1 * Math.cos(ty) + 400;
      return [u0 + fpx * (x2 + 10) / z2, v0 + fpx * (y1 - 20) / z2];
    };
    const pq = [[-31.75, -44.45, 0], [31.75, -44.45, 0], [31.75, 44.45, 0], [-31.75, 44.45, 0]].map(proj);
    const rA = rectAspect(pq, [u0, v0], { fallback: 3000, min: 100, max: 10000 }), s0 = Quad.sides(pq);
    rec('Perspective-corrected aspect recovers 5:7', Math.abs(rA - 63.5 / 88.9) < 1e-6,
      `recovered ${rA.toFixed(5)} vs naive ${((s0.top + s0.bottom) / (s0.left + s0.right)).toFixed(4)}`);
    // 4. Degenerate input is rejected.
    const bow = [[0, 0], [100, 100], [100, 0], [0, 100]];
    rec('Degenerate quads rejected', !Quad.validate(bow, 8).ok && !Quad.validate([[0, 0], [2, 0], [100, 100], [0, 100]], 8).ok, 'bow-tie and near-duplicate corners');
    // 5. Pipeline: exported card corners land on a 5:7 rectangle with 90° corners.
    const st = { source: { width: 4032, height: 3024 }, corners: quads[0], strength: 1, aspect: { ratio: 63.5 / 88.9, orientation: 'auto' }, rotation: { quarter: 1, fine: 3.5 }, flip: { h: true }, crop: { mode: 'fit', ratio: 1 }, export: {} };
    const geo = computeGeometry(st, {});
    const outQ = quads[0].map(p => M3.apply(geo.Mout, p[0], p[1]));
    const angErr = Math.max(...Quad.angles(outQ).map(a => Math.abs(a - 90)));
    const sd = Quad.sides(outQ), asp = Math.min(sd.top, sd.left) / Math.max(sd.top, sd.left);
    rec('Pipeline (rotate+flip+crop) keeps card rectangular at 5:7', geo.ok && angErr < 1e-6 && Math.abs(asp - 63.5 / 88.9) < 1e-6, `angle error ${angErr.toExponential(2)}°, aspect ${asp.toFixed(6)}`);
    // 6. Warp: identity reproduces the source; a synthetic card is detected.
    const W = 480, H = 640, img = { width: W, height: H, data: new Uint8ClampedArray(W * H * 4) };
    const card = [[120, 140], [370, 128], [384, 470], [110, 486]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // 4×4 supersampled fill for anti-aliased edges, like a real photo.
      let cov = 0;
      for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) if (Quad.contains(card, [x + (sx + 0.5) / 4, y + (sy + 0.5) / 4])) cov++;
      const v = 50 + (200 - 50) * cov / 16, o = (y * W + x) * 4;
      img.data[o] = v; img.data[o + 1] = v * 0.9; img.data[o + 2] = v * 0.8; img.data[o + 3] = 255;
    }
    const copy = warp({ width: W, height: H, data: new Uint8ClampedArray(W * H * 4) }, img, M3.identity());
    let maxDiff = 0; for (let k = 0; k < copy.data.length; k++) maxDiff = Math.max(maxDiff, Math.abs(copy.data[k] - img.data[k]));
    rec('Identity warp reproduces source', maxDiff === 0, `max channel diff ${maxDiff}`);
    const det = detect(img, {});
    const got = det.candidates[0];
    const err = got ? Math.max(...got.corners.map((p, i) => V.dist(p, card[i]))) : Infinity;
    rec('Detects a synthetic card within 2 px', err < 2, got ? `max corner error ${err.toFixed(2)} px, confidence ${got.confidence.toFixed(2)}` : 'no candidate');
    const ref = refineQuad(Object.assign({ ox: 0, oy: 0, scale: 1 }, img), got ? got.corners : card, { searchPx: 4 });
    const errR = Math.max(...ref.corners.map((p, i) => V.dist(p, card[i])));
    rec('Refinement lands within 0.5 px', errR < 0.5, `max corner error ${errR.toFixed(3)} px`);
    // 8. Levels: the white pick comes out neutral at whiteTarget, the black pick at blackTarget.
    const lv = { white: [200, 180, 150], black: [40, 30, 20] }, lut = levelsLUT(lv, {});
    const wOut = [0, 1, 2].map(c => lut[c][lv.white[c]]), bOut = [0, 1, 2].map(c => lut[c][lv.black[c]]);
    rec('Levels: white pick → neutral 245, black pick → neutral 8',
      wOut.every(v => Math.abs(v - 245) <= 1) && bOut.every(v => Math.abs(v - 8) <= 1), `white → ${wOut.join(',')}, black → ${bOut.join(',')}`);
    // 9. Auto levels finds a warm white patch covering 5% of the image.
    const ai = { width: 100, height: 100, data: new Uint8ClampedArray(40000) };
    for (let i = 0; i < 10000; i++) {
      const o = i * 4, k = i < 500 ? 1 : (i % 97) / 120 + 0.1;
      ai.data[o] = 230 * k; ai.data[o + 1] = 215 * k; ai.data[o + 2] = 190 * k; ai.data[o + 3] = 255;
    }
    // 8b. Dropper patch that is 70% white label, 30% black text still reads the white.
    const lp = { width: 10, height: 10, data: new Uint8ClampedArray(400) };
    for (let i = 0; i < 100; i++) { const v = i % 10 < 3 ? 20 : 232; lp.data.set([v, v - 6, v - 14, 255], i * 4); }
    const pc = meanColor(lp, 0.25);
    rec('Dropper ignores text inside a white patch', pc && Math.abs(pc[0] - 232) < 1 && Math.abs(pc[2] - 218) < 1, pc ? `read ${pc.join(',')} (plain mean ${meanColor(lp).map(Math.round).join(',')})` : 'none');
    const al = autoLevels(ai, {});
    rec('Auto levels finds the white patch', al && al.white.every((v, c) => Math.abs(v - [230, 215, 190][c]) < 1), al ? `white ${al.white.join(',')}` : 'none');
    // 10. Overlay placement scales with the frame (resolution-independent) and is kept fully inside it.
    const ov = { cx: 0.7, cy: 0.2, w: 0.3, aspect: 2, opacity: 1 };
    const oa = overlayRect(ov, 1000, 800), ob = overlayRect(ov, 2500, 2000);
    const scales = ['x', 'y', 'w', 'h'].every(k => Math.abs(ob[k] - oa[k] * 2.5) < 1e-9);
    const big = overlayRect(clampOverlay({ cx: 0.95, cy: 0.02, w: 1.6, aspect: 0.5, opacity: 1 }, 1000, 800), 1000, 800);
    const inside = big.x >= -1e-9 && big.y >= -1e-9 && big.x + big.w <= 1000 + 1e-9 && big.y + big.h <= 800 + 1e-9 && Math.abs(big.w / big.h - 0.5) < 1e-9;
    rec('Overlay placement scales with the frame and stays inside it', scales && inside,
      `same relative rect at 2.5×: ${scales}; oversized logo clamped to ${big.w.toFixed(0)}×${big.h.toFixed(0)} at ${big.x.toFixed(0)},${big.y.toFixed(0)}`);
    // 11. Snap presets sit at the margin (3% of the frame width).
    const sr = overlayRect(snapOverlay(ov, 'br', 1000, 800), 1000, 800), sc = overlayRect(snapOverlay(ov, 'c', 1000, 800), 1000, 800);
    const sb = overlayRect(snapOverlay(ov, 'b', 1000, 800), 1000, 800), sl = overlayRect(snapOverlay(ov, 'l', 1000, 800), 1000, 800);
    const sides = Math.abs(sb.x + sb.w / 2 - 500) < 1e-6 && Math.abs(800 - sb.y - sb.h - 30) < 1e-6 && Math.abs(sl.x - 30) < 1e-6 && Math.abs(sl.y + sl.h / 2 - 400) < 1e-6;
    rec('Overlay snap presets keep a margin', sides && Math.abs(1000 - sr.x - sr.w - 30) < 1e-6 && Math.abs(800 - sr.y - sr.h - 30) < 1e-6 && Math.abs(sc.x + sc.w / 2 - 500) < 1e-6,
      `bottom-right gap ${(1000 - sr.x - sr.w).toFixed(1)}, ${(800 - sr.y - sr.h).toFixed(1)} px; bottom-middle gap ${(800 - sb.y - sb.h).toFixed(1)} px, centered: ${sides}`);
    return { passed: results.every(r => r.pass), results };
  }

  G.CardEngine = {
    version: 1, M3, V, Quad, solveLinear, solveHomography, perspectiveTargets, rectAspect, focalModel, lineThrough, intersect,
    toGray, gaussianBlur, sobel,
    DETECT_DEFAULTS, analyze, detect, scoreQuads, refineQuad,
    GEOMETRY_DEFAULTS, computeGeometry, fitCrop, shrinkToValid, cropRatio, warp,
    OVERLAY_DEFAULTS, overlayRect, clampOverlay, snapOverlay,
    LEVELS_DEFAULTS, levelsLUT, applyLUT, meanColor, autoLevels,
    selfTest,
  };
}
CardEngineModule(typeof globalThis !== 'undefined' ? globalThis : self);
