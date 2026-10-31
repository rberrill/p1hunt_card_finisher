/* =====================================================================
   CardEngine: pure geometry and image processing.
   No DOM and no browser globals beyond what a Web Worker also has
   (tests/selftest.js checks). The whole engine is one named function,
   CardEngineModule: calling it defines CardEngine, and the shell builds
   the Web Worker from its source text (CardEngineModule.toString()),
   which also works from file://.

   Sections, in order:
     MATH                 3×3 matrices, vectors, quads, lines, linear solve, homography
     PERSPECTIVE TARGETS  where the four source corners should land
     IMAGE HELPERS        pure pixel helpers over ImageData-like objects
     DETECTION            Canny → Hough → paired line families → scored quads → refine
     OVERLAY              logo placement relative to the crop
     UNTRUSTED INPUT      URL overrides, edits files, stored sessions
     RENDER PIPELINE      state → geometry → warp
     LEVELS               white and black point correction in linear light
     SELF-TEST            runs the same on the main thread and in the Worker
   ===================================================================== */
function CardEngineModule(globalScope) {
  'use strict';

  // Below this, a determinant or homogeneous weight counts as zero.
  const EPSILON = 1e-12;
  // Below this, a pivot in the linear solve counts as zero (the system is singular).
  const PIVOT_EPSILON = 1e-14;
  // Below this, a turn or line crossing counts as straight (collinear or parallel).
  const COLLINEAR_EPSILON = 1e-9;
  const RADIANS_PER_DEGREE = Math.PI / 180;
  // A standard trading card is 63.5 × 88.9 mm; this is its width ÷ height (5:7).
  const CARD_ASPECT = 63.5 / 88.9;

  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Limits value to [low, high].
  function clamp(value, low, high) {
    if (value < low) return low;
    if (value > high) return high;
    return value;
  }

  // Limits a pixel index to [0, size − 1] (clamp-to-edge sampling).
  function clampIndex(index, size) {
    return Math.min(Math.max(index, 0), size - 1);
  }

  /* ===================================================================
     MATH
     =================================================================== */

  // 3×3 matrices as row-major arrays of 9 numbers.
  const Mat3 = {
    identity: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],

    // left · right, so `right` is applied to a point first.
    multiply(left, right) {
      const product = new Array(9);
      for (let row = 0; row < 3; row++) {
        for (let column = 0; column < 3; column++) {
          product[row * 3 + column] = left[row * 3] * right[column]
            + left[row * 3 + 1] * right[3 + column]
            + left[row * 3 + 2] * right[6 + column];
        }
      }
      return product;
    },

    // chain(A, B, C) = A·B·C, so C is applied to a point first.
    chain(...matrices) {
      return matrices.reduce((product, matrix) => Mat3.multiply(product, matrix));
    },

    // Inverse via the adjugate (the transposed cofactors) ÷ the determinant; null if singular.
    invert(matrix) {
      const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = matrix;
      const cofactor00 = m11 * m22 - m12 * m21;
      const cofactor01 = -(m10 * m22 - m12 * m20);
      const cofactor02 = m10 * m21 - m11 * m20;
      const determinant = m00 * cofactor00 + m01 * cofactor01 + m02 * cofactor02;
      if (!isFinite(determinant) || Math.abs(determinant) < EPSILON) return null;
      const scale = 1 / determinant;
      return [
        cofactor00 * scale,
        -(m01 * m22 - m02 * m21) * scale,
        (m01 * m12 - m02 * m11) * scale,
        cofactor01 * scale,
        (m00 * m22 - m02 * m20) * scale,
        -(m00 * m12 - m02 * m10) * scale,
        cofactor02 * scale,
        -(m00 * m21 - m01 * m20) * scale,
        (m00 * m11 - m01 * m10) * scale,
      ];
    },

    // Projective apply: [x', y'] = (M·[x, y, 1]) ÷ w.
    apply(matrix, x, y) {
      const homogeneous = matrix[6] * x + matrix[7] * y + matrix[8];
      return [
        (matrix[0] * x + matrix[1] * y + matrix[2]) / homogeneous,
        (matrix[3] * x + matrix[4] * y + matrix[5]) / homogeneous,
      ];
    },

    // The homogeneous w of M·[x, y, 1]. A point with w ≤ 0 maps through the horizon.
    homogeneousW: (matrix, x, y) => matrix[6] * x + matrix[7] * y + matrix[8],

    translate: (offsetX, offsetY) => [1, 0, offsetX, 0, 1, offsetY, 0, 0, 1],

    scale: (scaleX, scaleY = scaleX) => [scaleX, 0, 0, 0, scaleY, 0, 0, 0, 1],

    rotate(radians) {
      let cos = Math.cos(radians);
      let sin = Math.sin(radians);
      // Snap float noise so exact quarter turns give exact integer frames.
      if (Math.abs(cos) < EPSILON) cos = 0;
      if (Math.abs(sin) < EPSILON) sin = 0;
      return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
    },

    // Scales the matrix so its bottom-right entry is 1.
    normalize(matrix) {
      const last = matrix[8];
      return Math.abs(last) > EPSILON ? matrix.map(value => value / last) : matrix.slice();
    },
  };

  // 2D points as [x, y] arrays.
  const Vec2 = {
    distance: (first, second) => Math.hypot(first[0] - second[0], first[1] - second[1]),

    midpoint: (first, second) => [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2],

    // The point a fraction `amount` of the way from `first` to `second`.
    interpolate: (first, second, amount) => [
      first[0] + (second[0] - first[0]) * amount,
      first[1] + (second[1] - first[1]) * amount,
    ],

    // z of (first − origin) × (second − origin): > 0 for a clockwise turn in image space (y down).
    cross: (origin, first, second) => (first[0] - origin[0]) * (second[1] - origin[1])
      - (first[1] - origin[1]) * (second[0] - origin[0]),
  };

  // Quads are always [topLeft, topRight, bottomRight, bottomLeft] in image pixels (y down).
  const Quad = {
    centroid(points) {
      let sumX = 0;
      let sumY = 0;
      for (const point of points) {
        sumX += point[0];
        sumY += point[1];
      }
      return [sumX / points.length, sumY / points.length];
    },

    // Shoelace formula.
    area(quad) {
      let twiceArea = 0;
      for (let i = 0; i < quad.length; i++) {
        const point = quad[i];
        const next = quad[(i + 1) % quad.length];
        twiceArea += point[0] * next[1] - next[0] * point[1];
      }
      return Math.abs(twiceArea) / 2;
    },

    // Convex and simple ⇔ every consecutive turn has the same (non-zero) sign. A bow-tie
    // (self-intersecting) quad always mixes signs, so this rejects both failure modes.
    isConvex(quad) {
      let turnSign = 0;
      for (let i = 0; i < 4; i++) {
        const turn = Vec2.cross(quad[i], quad[(i + 1) % 4], quad[(i + 2) % 4]);
        if (Math.abs(turn) < COLLINEAR_EPSILON) return false;
        const sign = turn > 0 ? 1 : -1;
        if (turnSign === 0) turnSign = sign;
        else if (sign !== turnSign) return false;
      }
      return true;
    },

    // Sorts 4 points into TL, TR, BR, BL: clockwise by angle around the centroid (y down),
    // then starting at the point nearest the top-left (smallest x + y).
    sortCorners(points) {
      const center = Quad.centroid(points);
      const angleOf = point => Math.atan2(point[1] - center[1], point[0] - center[0]);
      const clockwise = points.slice().sort((first, second) => angleOf(first) - angleOf(second));
      let topLeft = 0;
      for (let i = 1; i < 4; i++) {
        const sum = clockwise[i][0] + clockwise[i][1];
        const bestSum = clockwise[topLeft][0] + clockwise[topLeft][1];
        const isHigherLeft = sum < bestSum;
        if (isHigherLeft) topLeft = i;
      }
      return [0, 1, 2, 3].map(i => clockwise[(i + topLeft) % 4].slice());
    },

    // True when the point is inside the convex polygon or on its edge.
    contains(polygon, point) {
      let turnSign = 0;
      for (let i = 0; i < polygon.length; i++) {
        const turn = Vec2.cross(polygon[i], polygon[(i + 1) % polygon.length], point);
        const sign = Math.sign(turn) || 0;
        if (sign === 0) continue;
        if (turnSign === 0) turnSign = sign;
        else if (sign !== turnSign) return false;
      }
      return true;
    },

    // Interior angle at each corner, in degrees.
    cornerAngles(quad) {
      return quad.map((corner, i) => {
        const previous = quad[(i + 3) % 4];
        const next = quad[(i + 1) % 4];
        const toPrevious = [previous[0] - corner[0], previous[1] - corner[1]];
        const toNext = [next[0] - corner[0], next[1] - corner[1]];
        const dot = toPrevious[0] * toNext[0] + toPrevious[1] * toNext[1];
        const cosine = dot / (Math.hypot(...toPrevious) * Math.hypot(...toNext));
        return Math.acos(Math.max(-1, Math.min(1, cosine))) / RADIANS_PER_DEGREE;
      });
    },

    sides(quad) {
      return {
        top: Vec2.distance(quad[0], quad[1]),
        right: Vec2.distance(quad[1], quad[2]),
        bottom: Vec2.distance(quad[3], quad[2]),
        left: Vec2.distance(quad[0], quad[3]),
      };
    },

    // { left, top, right, bottom, width, height } around the points.
    boundingBox(points) {
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const point of points) {
        left = Math.min(left, point[0]);
        top = Math.min(top, point[1]);
        right = Math.max(right, point[0]);
        bottom = Math.max(bottom, point[1]);
      }
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    },

    // Checks that a quad is usable for the perspective solve; { ok } or { ok: false, reason }.
    validate(quad, minDistance) {
      const isBadPoint = point => !point || !isFinite(point[0]) || !isFinite(point[1]);
      if (!Array.isArray(quad) || quad.length !== 4 || quad.some(isBadPoint)) {
        return { ok: false, reason: 'Corners are missing or invalid.' };
      }
      for (let i = 0; i < 4; i++) {
        for (let j = i + 1; j < 4; j++) {
          if (Vec2.distance(quad[i], quad[j]) < minDistance) {
            return { ok: false, reason: 'Two corners are too close together.' };
          }
        }
      }
      if (!Quad.isConvex(quad)) {
        return {
          ok: false,
          reason: 'Corners cross or fold inward — drag them back into a convex shape.',
        };
      }
      return { ok: true };
    },
  };

  // A line in normal form: normal · point = offset, with |normal| = 1.
  function lineThrough(start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    return { normalX, normalY, offset: normalX * start[0] + normalY * start[1] };
  }

  // Where two normal-form lines cross, or null if they are parallel.
  function intersectLines(first, second) {
    const determinant = first.normalX * second.normalY - first.normalY * second.normalX;
    if (Math.abs(determinant) < COLLINEAR_EPSILON) return null;
    return [
      (first.offset * second.normalY - first.normalY * second.offset) / determinant,
      (first.normalX * second.offset - first.offset * second.normalX) / determinant,
    ];
  }

  // Solves coefficients · solution = constants by Gaussian elimination with partial pivoting.
  // coefficients: n rows of n numbers; constants: n numbers. Returns null when singular.
  function solveLinear(coefficients, constants) {
    const size = constants.length;
    const augmented = coefficients.map((row, index) => row.concat([constants[index]]));
    for (let column = 0; column < size; column++) {
      let pivotRow = column;
      let pivotSize = Math.abs(augmented[column][column]);
      for (let row = column + 1; row < size; row++) {
        const candidateSize = Math.abs(augmented[row][column]);
        if (candidateSize > pivotSize) {
          pivotSize = candidateSize;
          pivotRow = row;
        }
      }
      if (pivotSize < PIVOT_EPSILON) return null; // singular: degenerate correspondences
      if (pivotRow !== column) {
        const swap = augmented[pivotRow];
        augmented[pivotRow] = augmented[column];
        augmented[column] = swap;
      }
      for (let row = column + 1; row < size; row++) {
        const factor = augmented[row][column] / augmented[column][column];
        if (factor === 0) continue;
        for (let entry = column; entry <= size; entry++) {
          augmented[row][entry] -= factor * augmented[column][entry];
        }
      }
    }
    const solution = new Array(size);
    for (let row = size - 1; row >= 0; row--) {
      let sum = augmented[row][size];
      for (let column = row + 1; column < size; column++) {
        sum -= augmented[row][column] * solution[column];
      }
      solution[row] = sum / augmented[row][row];
    }
    return solution;
  }

  // Hartley normalization: move the points' centroid to the origin and scale so the mean
  // distance is √2. Solving in this frame keeps the 8×8 system well conditioned even with
  // 8000-px coordinates (x·u terms would otherwise reach ~1e7 next to 1s).
  function hartleyNormalization(points) {
    let centerX = 0;
    let centerY = 0;
    for (const point of points) {
      centerX += point[0];
      centerY += point[1];
    }
    centerX /= points.length;
    centerY /= points.length;
    let meanDistance = 0;
    for (const point of points) meanDistance += Math.hypot(point[0] - centerX, point[1] - centerY);
    meanDistance /= points.length;
    const scale = meanDistance > EPSILON ? Math.SQRT2 / meanDistance : 1;
    return [scale, 0, -scale * centerX, 0, scale, -scale * centerY, 0, 0, 1];
  }

  /**
   * solveHomography(source, target) → H (3×3, h33 = 1) with H·source[k] ∝ target[k] for the
   * 4 correspondences, or null. Each pair (x, y) → (u, v) gives, after multiplying out
   * u = (h0x + h1y + h2) / (h6x + h7y + 1):
   *   h0x + h1y + h2 − h6·x·u − h7·y·u = u
   *   h3x + h4y + h5 − h6·x·v − h7·y·v = v
   * Four pairs → an 8×8 linear system in h0..h7, solved in Hartley-normalized frames.
   * Formula names: u v
   */
  function solveHomography(source, target) {
    const normalizeSource = hartleyNormalization(source);
    const normalizeTarget = hartleyNormalization(target);
    const sourceNormalized = source.map(point => Mat3.apply(normalizeSource, point[0], point[1]));
    const targetNormalized = target.map(point => Mat3.apply(normalizeTarget, point[0], point[1]));
    const coefficients = [];
    const constants = [];
    for (let k = 0; k < 4; k++) {
      const [x, y] = sourceNormalized[k];
      const [u, v] = targetNormalized[k];
      coefficients.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
      constants.push(u);
      coefficients.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
      constants.push(v);
    }
    const solution = solveLinear(coefficients, constants);
    if (!solution) return null;
    const normalizedHomography = [...solution.slice(0, 8), 1];
    const denormalizeTarget = Mat3.invert(normalizeTarget);
    if (!denormalizeTarget) return null;
    // source → normalized source → normalized target → target
    return Mat3.normalize(Mat3.chain(denormalizeTarget, normalizedHomography, normalizeSource));
  }

  /* ===================================================================
     PERSPECTIVE TARGETS: where the four source corners should land
     0% (squared up): a symmetric trapezoid, horizontal top and bottom, mirrored sides,
       widths = the measured top and bottom lengths, centered on the quad's centroid.
     100% (flat): a true rectangle at the card's aspect, area-matched to the quad so the
       pixel resolution is preserved.
     Strength blends the two corner by corner, so every value is an isosceles trapezoid.
     =================================================================== */

  /**
   * rectAspect(quad, center, focal) → the true width ÷ height of the physical rectangle seen
   * as `quad`. Zhang & He, "Whiteboard scanning and image enhancement" (2007). With the
   * rectangle's corners M1..M4 = (0,0),(w,0),(0,h),(w,h) and image points m1..m4 (homogeneous):
   *   k2 = ((m1×m4)·m3)/((m2×m4)·m3),  k3 = ((m1×m4)·m2)/((m3×m4)·m2)
   *   n2 = k2·m2 − m1 ∝ A·r1·w,        n3 = k3·m3 − m1 ∝ A·r2·h
   * r1 ⊥ r2 gives the focal length f (when both vanishing points are finite);
   * |r1| = |r2| gives (w/h)² = (n2ᵀA⁻ᵀA⁻¹n2)/(n3ᵀA⁻ᵀA⁻¹n3), A = [[f,0,u0],[0,f,v0],[0,0,1]].
   * f is only estimable with two finite vanishing points; otherwise focal.fallback is used.
   * In a near-frontal view n·z → 0 and the result tends to the plain side-length ratio.
   * Formula names: m1 m2 m3 m4 k2 k3 n2 n3 u0 v0
   */
  function rectAspect(quad, center, focal) {
    const cross3 = (first, second) => [
      first[1] * second[2] - first[2] * second[1],
      first[2] * second[0] - first[0] * second[2],
      first[0] * second[1] - first[1] * second[0],
    ];
    const dot3 = (first, second) => first[0] * second[0]
      + first[1] * second[1]
      + first[2] * second[2];
    // The paper numbers the corners in reading order, so m3 is bottom-left and m4 bottom-right.
    const m1 = [quad[0][0], quad[0][1], 1];
    const m2 = [quad[1][0], quad[1][1], 1];
    const m4 = [quad[2][0], quad[2][1], 1];
    const m3 = [quad[3][0], quad[3][1], 1];
    const k2 = dot3(cross3(m1, m4), m3) / dot3(cross3(m2, m4), m3);
    const k3 = dot3(cross3(m1, m4), m2) / dot3(cross3(m3, m4), m2);
    const n2 = m2.map((value, i) => k2 * value - m1[i]);
    const n3 = m3.map((value, i) => k3 * value - m1[i]);
    const [u0, v0] = center;
    let focalLength = focal.fallback;
    const denominator = n2[2] * n3[2];
    if (Math.abs(denominator) > EPSILON) {
      const focalSquared = -(
        (n2[0] - u0 * n2[2]) * (n3[0] - u0 * n3[2])
        + (n2[1] - v0 * n2[2]) * (n3[1] - v0 * n3[2])
      ) / denominator;
      const estimate = Math.sqrt(focalSquared);
      const isPlausible = focalSquared > 0 && estimate >= focal.min && estimate <= focal.max;
      if (isPlausible) focalLength = estimate;
    }
    const direction = vector => [
      (vector[0] - u0 * vector[2]) / focalLength,
      (vector[1] - v0 * vector[2]) / focalLength,
      vector[2],
    ];
    const direction2 = direction(n2);
    const direction3 = direction(n3);
    const aspect = Math.sqrt(dot3(direction2, direction2) / dot3(direction3, direction3));
    if (isFinite(aspect) && aspect > 0) return aspect;
    const sides = Quad.sides(quad);
    return (sides.top + sides.bottom) / (sides.left + sides.right);
  }

  // Focal-length model in pixels: estimated when possible, else focalFactor × the long side.
  function focalModel(width, height, factor) {
    const longSide = Math.max(width, height);
    return { fallback: (factor || 2.5) * longSide, min: 0.6 * longSide, max: 6 * longSide };
  }

  // The corners of a trapezoid centered on (centerX, centerY) with horizontal top and bottom.
  function centeredTrapezoid(centerX, centerY, topWidth, bottomWidth, height) {
    return [
      [centerX - topWidth / 2, centerY - height / 2],
      [centerX + topWidth / 2, centerY - height / 2],
      [centerX + bottomWidth / 2, centerY + height / 2],
      [centerX - bottomWidth / 2, centerY + height / 2],
    ];
  }

  // The squared-up trapezoid's height, by CONFIG.squareUpHeight:
  //   meanEdge: the mean side length; visual: the distance between the top and bottom midpoints;
  //   preserveEdges: the height at which each mirrored slanted side keeps the mean side length,
  //   side² = height² + ((bottomWidth − topWidth) / 2)².
  function squaredUpHeight(quad, sides, heightMode) {
    const sideLength = (sides.left + sides.right) / 2;
    if (heightMode === 'meanEdge') return sideLength;
    if (heightMode === 'visual') {
      return Vec2.distance(Vec2.midpoint(quad[0], quad[1]), Vec2.midpoint(quad[3], quad[2]));
    }
    const slant = (sides.bottom - sides.top) / 2;
    return Math.sqrt(Math.max(sideLength * sideLength - slant * slant, (sideLength * 0.1) ** 2));
  }

  /**
   * perspectiveTargets(quad, options) → the 4 corners `quad` should map to, in its own pixels.
   * options: { strength 0–1, ratio (card width ÷ height), orientation 'auto' | 'portrait' |
   * 'landscape', heightMode (see squaredUpHeight) }.
   */
  function perspectiveTargets(quad, options) {
    const {
      strength = 1,
      ratio = CARD_ASPECT,
      orientation = 'auto',
      heightMode = 'preserveEdges',
    } = options;
    const sides = Quad.sides(quad);
    const [centerX, centerY] = Quad.centroid(quad);
    const topWidth = sides.top;
    const bottomWidth = sides.bottom;
    const height = squaredUpHeight(quad, sides, heightMode);
    const squaredUp = centeredTrapezoid(centerX, centerY, topWidth, bottomWidth, height);

    const meanWidth = (topWidth + bottomWidth) / 2;
    const meanHeight = (sides.left + sides.right) / 2;
    const portraitAspect = Math.min(ratio, 1 / ratio);
    const isLandscape = orientation === 'landscape'
      || (orientation === 'auto' && meanWidth > meanHeight);
    const targetAspect = isLandscape ? 1 / portraitAspect : portraitAspect;
    const flatHeight = Math.sqrt((meanWidth * meanHeight) / targetAspect);
    const flatWidth = targetAspect * flatHeight;
    const flat = centeredTrapezoid(centerX, centerY, flatWidth, flatWidth, flatHeight);

    const blend = Math.max(0, Math.min(1, strength));
    return squaredUp.map((corner, i) => Vec2.interpolate(corner, flat[i], blend));
  }

  /* ===================================================================
     IMAGE HELPERS: pure pixel helpers over ImageData-like { data, width, height }
     =================================================================== */

  // Luma (Rec. 601 weights) as one float per pixel.
  function toGray(img) {
    const { data, width, height } = img;
    const pixelCount = width * height;
    const gray = new Float32Array(pixelCount);
    for (let pixel = 0, offset = 0; pixel < pixelCount; pixel++, offset += 4) {
      gray[pixel] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
    }
    return gray;
  }

  // One RGBA channel (0 red, 1 green, 2 blue) as one float per pixel.
  function channelValues(img, channel) {
    const { data, width, height } = img;
    const pixelCount = width * height;
    const values = new Float32Array(pixelCount);
    for (let pixel = 0, offset = channel; pixel < pixelCount; pixel++, offset += 4) {
      values[pixel] = data[offset];
    }
    return values;
  }

  // Separable Gaussian blur of a one-channel float image, clamp-to-edge.
  function gaussianBlur(values, width, height, sigma) {
    if (!(sigma > 0)) return values;
    const radius = Math.max(1, Math.ceil(sigma * 3));
    const kernel = new Float32Array(2 * radius + 1);
    let kernelSum = 0;
    for (let offset = -radius; offset <= radius; offset++) {
      kernel[offset + radius] = Math.exp(-(offset * offset) / (2 * sigma * sigma));
      kernelSum += kernel[offset + radius];
    }
    for (let i = 0; i < kernel.length; i++) kernel[i] /= kernelSum;

    const horizontal = new Float32Array(width * height);
    const blurred = new Float32Array(width * height);
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        let total = 0;
        for (let offset = -radius; offset <= radius; offset++) {
          const sourceX = clampIndex(x + offset, width);
          total += values[row + sourceX] * kernel[offset + radius];
        }
        horizontal[row + x] = total;
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let total = 0;
        for (let offset = -radius; offset <= radius; offset++) {
          const sourceY = clampIndex(y + offset, height);
          total += horizontal[sourceY * width + x] * kernel[offset + radius];
        }
        blurred[y * width + x] = total;
      }
    }
    return blurred;
  }

  // Sobel gradients of a one-channel image → { gradientX, gradientY, magnitude }.
  // The one-pixel border is left at 0.
  function sobel(values, width, height) {
    const gradientX = new Float32Array(width * height);
    const gradientY = new Float32Array(width * height);
    const magnitude = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const topLeft = values[i - width - 1];
        const top = values[i - width];
        const topRight = values[i - width + 1];
        const left = values[i - 1];
        const right = values[i + 1];
        const bottomLeft = values[i + width - 1];
        const bottom = values[i + width];
        const bottomRight = values[i + width + 1];
        const horizontal = (topRight + 2 * right + bottomRight) - (topLeft + 2 * left + bottomLeft);
        const vertical = (bottomLeft + 2 * bottom + bottomRight) - (topLeft + 2 * top + topRight);
        gradientX[i] = horizontal;
        gradientY[i] = vertical;
        magnitude[i] = Math.hypot(horizontal, vertical);
      }
    }
    return { gradientX, gradientY, magnitude };
  }

  // Bilinear sample of a one-channel float image at (x, y), clamp-to-edge.
  function sampleBilinear(values, width, height, x, y) {
    // Pixel centers sit at +0.5.
    const sampleX = clamp(x - 0.5, 0, width - 1);
    const sampleY = clamp(y - 0.5, 0, height - 1);
    const leftColumn = Math.floor(sampleX);
    const topRow = Math.floor(sampleY);
    const rightColumn = Math.min(leftColumn + 1, width - 1);
    const bottomRow = Math.min(topRow + 1, height - 1);
    const fractionX = sampleX - leftColumn;
    const fractionY = sampleY - topRow;
    const topLeft = values[topRow * width + leftColumn];
    const topRight = values[topRow * width + rightColumn];
    const bottomLeft = values[bottomRow * width + leftColumn];
    const bottomRight = values[bottomRow * width + rightColumn];
    return (topLeft * (1 - fractionX) + topRight * fractionX) * (1 - fractionY)
      + (bottomLeft * (1 - fractionX) + bottomRight * fractionX) * fractionY;
  }

  /* ===================================================================
     DETECTION: Canny → Hough → paired line families → scored quads → refine
     All detection coordinates are in the working image's pixels unless noted.
     =================================================================== */

  // The built-in defaults. They mirror CONFIG.detect (js/config.js says what each does), and
  // tests/selftest.js checks that the two match.
  const DETECT_DEFAULTS = {
    blurSigma: 1.6,
    colorEdges: true,
    cannyLow: 20,
    cannyHigh: 55,
    angleStepDeg: 0.5,
    houghGradWinDeg: 6,
    houghThreshold: 45,
    houghMaxLines: 48,
    mergeAngleDeg: 2,
    mergeRhoPx: 6,
    maxPerspectiveDeg: 25,
    perpTolDeg: 30,
    minSideFrac: 0.08,
    minAreaFrac: 0.03,
    maxAreaFrac: 0.9,
    edgeMarginFrac: 0.02,
    supportRadiusPx: 2,
    cornerTrim: 0.12,
    aspectDeadband: 0.06,
    aspectTol: 0.10,
    angleTolDeg: 22,
    focalFactor: 2.5,
    wSupport: 1.0,
    wAspect: 0.4,
    wAngle: 0.35,
    wCenter: 0.25,
    wArea: -0.45,
    seedMissFactor: 0.3,
    dupCornerFrac: 0.02,
    maxCandidates: 3,
    minConfidence: 0.5,
    retryConfidence: 0.8,
    retryCannyLow: 8,
    retryCannyHigh: 30,
    refineSearchWorkingPx: 3,
    refineSamples: 48,
    refineBlur: 1.0,
    refineMinGrad: 6,
    refineInlierPx: 1.5,
  };

  // tan(22.5°): splits gradient directions into 4 bins without atan2.
  const TAN_22_5_DEG = 0.41421356;
  // Gradient orientations are binned into this many 15° bins for the support map.
  const ORIENTATION_BINS = 12;
  // A Hough peak must beat its neighbors this many angle and rho cells away.
  const PEAK_WINDOW = { angleCells: 2, rhoCells: 3 };
  // Samples per side when scoring a quad's edge support.
  const SIDE_SAMPLES = { min: 8, max: 80 };

  // Edge gradients of an RGBA image after a Gaussian blur.
  function edgeGradients(img, params) {
    const width = img.width;
    const height = img.height;
    if (!params.colorEdges) {
      return sobel(gaussianBlur(toGray(img), width, height, params.blurSigma), width, height);
    }
    // Per-channel gradients, keeping the strongest channel at each pixel. Catches red-on-black
    // and chroma-only edges that luminance alone flattens (red playmats, colored slab labels).
    let strongest = null;
    for (let channel = 0; channel < 3; channel++) {
      const blurred = gaussianBlur(channelValues(img, channel), width, height, params.blurSigma);
      const gradients = sobel(blurred, width, height);
      if (!strongest) {
        strongest = gradients;
        continue;
      }
      for (let i = 0; i < width * height; i++) {
        if (gradients.magnitude[i] > strongest.magnitude[i]) {
          strongest.magnitude[i] = gradients.magnitude[i];
          strongest.gradientX[i] = gradients.gradientX[i];
          strongest.gradientY[i] = gradients.gradientY[i];
        }
      }
    }
    return strongest;
  }

  // Canny edge map (1 = edge): non-maximum suppression along the gradient, then hysteresis.
  function canny(gradients, width, height, lowThreshold, highThreshold) {
    const { gradientX, gradientY, magnitude } = gradients;
    const suppressed = new Float32Array(width * height);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        const strength = magnitude[i];
        if (strength < lowThreshold) continue;
        const absX = Math.abs(gradientX[i]);
        const absY = Math.abs(gradientY[i]);
        let before;
        let after;
        if (absY <= absX * TAN_22_5_DEG) {
          before = magnitude[i - 1];
          after = magnitude[i + 1];
        } else if (absX <= absY * TAN_22_5_DEG) {
          before = magnitude[i - width];
          after = magnitude[i + width];
        } else if (gradientX[i] * gradientY[i] > 0) {
          before = magnitude[i - width - 1];
          after = magnitude[i + width + 1];
        } else {
          before = magnitude[i - width + 1];
          after = magnitude[i + width - 1];
        }
        if (strength >= before && strength > after) suppressed[i] = strength;
      }
    }
    // Hysteresis: grow from strong pixels through weak ones.
    const edges = new Uint8Array(width * height);
    const stack = [];
    for (let i = 0; i < width * height; i++) {
      if (suppressed[i] >= highThreshold) {
        edges[i] = 1;
        stack.push(i);
      }
    }
    while (stack.length) {
      const i = stack.pop();
      const x = i % width;
      for (let rowStep = -width; rowStep <= width; rowStep += width) {
        for (let columnStep = -1; columnStep <= 1; columnStep++) {
          if ((x === 0 && columnStep < 0) || (x === width - 1 && columnStep > 0)) continue;
          const neighbor = i + rowStep + columnStep;
          if (neighbor < 0 || neighbor >= width * height || edges[neighbor]) continue;
          if (suppressed[neighbor] >= lowThreshold) {
            edges[neighbor] = 1;
            stack.push(neighbor);
          }
        }
      }
    }
    return edges;
  }

  // The direction of a gradient as an angle in [0, π).
  function gradientAngle(gradientX, gradientY, i) {
    const angle = Math.atan2(gradientY[i], gradientX[i]);
    return angle < 0 ? angle + Math.PI : angle;
  }

  // Hough voting, line model x·cosθ + y·sinθ = ρ about the image center.
  // Each edge pixel votes only for θ within ±houghGradWinDeg of its own gradient direction,
  // which cuts texture and text clutter and is ~30× faster than voting for every θ.
  function houghVotes(edges, gradients, width, height, params) {
    const angleStep = params.angleStepDeg * RADIANS_PER_DEGREE;
    const angleCount = Math.round(Math.PI / angleStep);
    const cosines = new Float32Array(angleCount);
    const sines = new Float32Array(angleCount);
    for (let angle = 0; angle < angleCount; angle++) {
      cosines[angle] = Math.cos(angle * angleStep);
      sines[angle] = Math.sin(angle * angleStep);
    }
    const centerX = width / 2;
    const centerY = height / 2;
    const rhoMax = Math.ceil(Math.hypot(width, height) / 2);
    const rhoCount = 2 * rhoMax + 1;
    const votes = new Uint32Array(angleCount * rhoCount);
    const voteSpread = Math.ceil(params.houghGradWinDeg / params.angleStepDeg);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!edges[i]) continue;
        const direction = gradientAngle(gradients.gradientX, gradients.gradientY, i);
        const ownAngle = Math.round(direction / angleStep);
        const fromCenterX = x + 0.5 - centerX;
        const fromCenterY = y + 0.5 - centerY;
        for (let step = -voteSpread; step <= voteSpread; step++) {
          const angle = ((ownAngle + step) % angleCount + angleCount) % angleCount;
          const rho = Math.round(fromCenterX * cosines[angle] + fromCenterY * sines[angle]);
          votes[angle * rhoCount + rho + rhoMax]++;
        }
      }
    }
    return { votes, angleCount, rhoCount, rhoMax, angleStep, centerX, centerY };
  }

  // True when no cell within PEAK_WINDOW of (angle, rho) beats it. Ties go to the lower index.
  // Wrapping θ past π flips the sign of ρ.
  function isHoughPeak(accumulator, angle, rho) {
    const { votes, angleCount, rhoCount } = accumulator;
    const index = angle * rhoCount + rho;
    const count = votes[index];
    const { angleCells, rhoCells } = PEAK_WINDOW;
    for (let angleStep = -angleCells; angleStep <= angleCells; angleStep++) {
      let neighborAngle = angle + angleStep;
      let mirroredRho = rho;
      if (neighborAngle < 0) {
        neighborAngle += angleCount;
        mirroredRho = rhoCount - 1 - rho;
      } else if (neighborAngle >= angleCount) {
        neighborAngle -= angleCount;
        mirroredRho = rhoCount - 1 - rho;
      }
      for (let rhoStep = -rhoCells; rhoStep <= rhoCells; rhoStep++) {
        const neighborRho = mirroredRho + rhoStep;
        const isSelf = angleStep === 0 && rhoStep === 0;
        if (isSelf || neighborRho < 0 || neighborRho >= rhoCount) continue;
        const neighborIndex = neighborAngle * rhoCount + neighborRho;
        const neighborCount = votes[neighborIndex];
        const beatsPeak = neighborCount > count
          || (neighborCount === count && neighborIndex < index);
        if (beatsPeak) return false;
      }
    }
    return true;
  }

  // Local maxima of the Hough votes at or above houghThreshold, most votes first.
  function houghPeaks(accumulator, params) {
    const { votes, angleCount, rhoCount, rhoMax, angleStep } = accumulator;
    const peaks = [];
    for (let angle = 0; angle < angleCount; angle++) {
      for (let rho = 0; rho < rhoCount; rho++) {
        const count = votes[angle * rhoCount + rho];
        if (count < params.houghThreshold) continue;
        if (isHoughPeak(accumulator, angle, rho)) {
          peaks.push({ theta: angle * angleStep, rho: rho - rhoMax, votes: count });
        }
      }
    }
    peaks.sort((first, second) => second.votes - first.votes);
    return peaks;
  }

  // Drops peaks within mergeAngleDeg and mergeRhoPx of a stronger one; keeps houghMaxLines.
  function mergeNearbyPeaks(peaks, params) {
    const kept = [];
    const mergeAngle = params.mergeAngleDeg * RADIANS_PER_DEGREE;
    for (const peak of peaks) {
      const isDuplicate = kept.some(other => {
        let angleGap = Math.abs(peak.theta - other.theta);
        let rhoGap = Math.abs(peak.rho - other.rho);
        // Lines near θ = 0 and θ = π are the same line with ρ negated.
        if (angleGap > Math.PI / 2) {
          angleGap = Math.PI - angleGap;
          rhoGap = Math.abs(peak.rho + other.rho);
        }
        return angleGap < mergeAngle && rhoGap < params.mergeRhoPx;
      });
      if (!isDuplicate) kept.push(peak);
      if (kept.length >= params.houghMaxLines) break;
    }
    return kept;
  }

  // The strongest straight lines in the edge map, in image normal form (normal · point = offset).
  function houghLines(edges, gradients, width, height, params) {
    const accumulator = houghVotes(edges, gradients, width, height, params);
    const lines = mergeNearbyPeaks(houghPeaks(accumulator, params), params);
    return lines.map(peak => {
      const normalX = Math.cos(peak.theta);
      const normalY = Math.sin(peak.theta);
      const offset = peak.rho + normalX * accumulator.centerX + normalY * accumulator.centerY;
      return { theta: peak.theta, rho: peak.rho, votes: peak.votes, normalX, normalY, offset };
    });
  }

  // Orientation-tagged support map: bit b of map[i] is set when an edge pixel within `radius`
  // of i has a gradient normal in orientation bin b (or a neighboring bin). Lets quad scoring
  // ask "is there an edge here running this way?" in O(1).
  function supportMap(edges, gradients, width, height, radius) {
    const map = new Uint16Array(width * height);
    const binWidth = Math.PI / ORIENTATION_BINS;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        if (!edges[i]) continue;
        const angle = gradientAngle(gradients.gradientX, gradients.gradientY, i);
        const bin = Math.min(ORIENTATION_BINS - 1, Math.floor(angle / binWidth));
        const nextBin = (bin + 1) % ORIENTATION_BINS;
        const previousBin = (bin + ORIENTATION_BINS - 1) % ORIENTATION_BINS;
        const bits = (1 << bin) | (1 << nextBin) | (1 << previousBin);
        for (let rowOffset = -radius; rowOffset <= radius; rowOffset++) {
          const neighborY = y + rowOffset;
          if (neighborY < 0 || neighborY >= height) continue;
          for (let columnOffset = -radius; columnOffset <= radius; columnOffset++) {
            const neighborX = x + columnOffset;
            if (neighborX < 0 || neighborX >= width) continue;
            map[neighborY * width + neighborX] |= bits;
          }
        }
      }
    }
    return map;
  }

  // The share (0–1) of points along a quad side with an edge running the side's way.
  // The corner ends (cornerTrim of the length) are skipped: card corners are rounded.
  function sideSupport(start, end, context) {
    const { supportBits, width, height, cornerTrim } = context;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const length = Math.hypot(dx, dy);
    // The side's normal, perpendicular to (dx, dy), as an angle in [0, π).
    let normalAngle = Math.atan2(dx, -dy);
    if (normalAngle < 0) normalAngle += Math.PI;
    if (normalAngle >= Math.PI) normalAngle -= Math.PI;
    const binWidth = Math.PI / ORIENTATION_BINS;
    const bin = Math.min(ORIENTATION_BINS - 1, Math.floor(normalAngle / binWidth));
    const bit = 1 << bin;
    const wanted = Math.round(length * (1 - 2 * cornerTrim) / 2);
    const sampleCount = Math.max(SIDE_SAMPLES.min, Math.min(SIDE_SAMPLES.max, wanted));
    let hits = 0;
    let onImage = 0;
    for (let sample = 0; sample < sampleCount; sample++) {
      const along = cornerTrim + (1 - 2 * cornerTrim) * (sample + 0.5) / sampleCount;
      const x = Math.floor(start[0] + dx * along);
      const y = Math.floor(start[1] + dy * along);
      // Off-image parts neither help nor hurt.
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      onImage++;
      if (supportBits[y * width + x] & bit) hits++;
    }
    if (onImage >= sampleCount * 0.5) return hits / onImage;
    if (onImage) return hits / sampleCount;
    return 0;
  }

  // Scores one quad. Shared by the Hough path and any external quad source (such as native
  // detection in phase two). Returns { score, confidence, parts } (parts for the debug panel).
  function scoreQuad(quad, context) {
    const { width, height, params, ratio, seed } = context;
    const sideScores = [0, 1, 2, 3].map(k => sideSupport(quad[k], quad[(k + 1) % 4], context));
    const supportMean = (sideScores[0] + sideScores[1] + sideScores[2] + sideScores[3]) / 4;
    const supportMin = Math.min(...sideScores);
    const support = 0.5 * supportMean + 0.5 * supportMin;

    let aspect = 1;
    let correctedAspect = null;
    if (ratio) {
      // Compare the perspective-corrected aspect, with a dead band: cards on stands are
      // foreshortened a few percent even after correction, so near-misses aren't penalized.
      correctedAspect = rectAspect(quad, [width / 2, height / 2], context.focal);
      const measured = Math.min(correctedAspect, 1 / correctedAspect);
      const expected = Math.min(ratio, 1 / ratio);
      const error = Math.max(0, Math.abs(Math.log(measured / expected)) - params.aspectDeadband);
      aspect = Math.exp(-((error / params.aspectTol) ** 2));
    }

    const maxDeviation = Math.max(...Quad.cornerAngles(quad).map(angle => Math.abs(angle - 90)));
    const angle = Math.exp(-((maxDeviation / params.angleTolDeg) ** 2));
    const areaFrac = Quad.area(quad) / (width * height);
    const centroid = Quad.centroid(quad);
    const offCenter = Math.hypot(centroid[0] - width / 2, centroid[1] - height / 2);
    const center = 1 - Math.min(1, offCenter / (Math.hypot(width, height) / 2));

    let score = params.wSupport * support
      + params.wAspect * aspect
      + params.wAngle * angle
      + params.wCenter * center
      + params.wArea * Math.sqrt(areaFrac);
    const containsSeed = seed ? Quad.contains(quad, seed) : null;
    if (seed && !containsSeed) score *= params.seedMissFactor;
    const evidence = Math.pow(support, 0.75) * Math.sqrt(aspect) * Math.sqrt(angle);
    const confidence = Math.max(0, Math.min(1, evidence));
    return {
      score,
      confidence,
      parts: {
        support,
        supportMin,
        aspect,
        correctedAspect,
        angle,
        areaFrac,
        center,
        containsSeed,
      },
    };
  }

  // The angle between two line directions, folded into [0, π/2].
  function angleBetweenLines(first, second) {
    const difference = Math.abs(first - second) % Math.PI;
    return difference > Math.PI / 2 ? Math.PI - difference : difference;
  }

  // Pairs of near-parallel lines far enough apart to be opposite sides of a card.
  function parallelLinePairs(lines, context) {
    const { width, height, params } = context;
    const minSeparation = params.minSideFrac * Math.min(width, height);
    const maxSkew = params.maxPerspectiveDeg * RADIANS_PER_DEGREE;
    const pairs = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const first = lines[i];
        const second = lines[j];
        if (angleBetweenLines(first.theta, second.theta) > maxSkew) continue;
        // Separation: the distance from the point of `first` nearest the image center to `second`.
        const centerX = width / 2;
        const centerY = height / 2;
        const fromCenter = first.normalX * centerX + first.normalY * centerY - first.offset;
        const nearest = [
          centerX - first.normalX * fromCenter,
          centerY - first.normalY * fromCenter,
        ];
        const separation = second.normalX * nearest[0]
          + second.normalY * nearest[1]
          - second.offset;
        if (Math.abs(separation) < minSeparation) continue;
        pairs.push([first, second]);
      }
    }
    return pairs;
  }

  // Builds and scores every quad formed by two line pairs that are roughly perpendicular to
  // each other. Corners come from line intersections, so rounded corners (where no straight
  // edge exists) don't matter.
  function quadsFromLines(lines, context) {
    const { width, height, params } = context;
    const perpendicularTolerance = params.perpTolDeg * RADIANS_PER_DEGREE;
    const margin = params.edgeMarginFrac * Math.max(width, height);
    const isOffImage = point => !point
      || point[0] < -margin
      || point[1] < -margin
      || point[0] > width + margin
      || point[1] > height + margin;
    const pairs = parallelLinePairs(lines, context);
    const quads = [];
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const [sideA1, sideA2] = pairs[i];
        const [sideB1, sideB2] = pairs[j];
        const crossing = angleBetweenLines(sideA1.theta, sideB1.theta);
        if (Math.abs(Math.PI / 2 - crossing) > perpendicularTolerance) continue;
        const sharesLine = sideA1 === sideB1
          || sideA1 === sideB2
          || sideA2 === sideB1
          || sideA2 === sideB2;
        if (sharesLine) continue;
        const corners = [
          intersectLines(sideA1, sideB1),
          intersectLines(sideA1, sideB2),
          intersectLines(sideA2, sideB2),
          intersectLines(sideA2, sideB1),
        ];
        if (corners.some(isOffImage)) continue;
        const quad = Quad.sortCorners(corners);
        if (!Quad.isConvex(quad)) continue;
        const areaFrac = Quad.area(quad) / (width * height);
        if (areaFrac < params.minAreaFrac || areaFrac > params.maxAreaFrac) continue;
        const scored = scoreQuad(quad, context);
        const sides = [sideA1, sideA2, sideB1, sideB2];
        quads.push(Object.assign({ corners: quad, lines: sides }, scored));
      }
    }
    return quads;
  }

  // Keeps the best `count` candidates whose corners differ meaningfully. Sorts `quads` in place.
  function pickCandidates(quads, params, diagonal, count) {
    quads.sort((first, second) => second.score - first.score);
    const kept = [];
    const duplicateDistance = params.dupCornerFrac * diagonal;
    const cornerGap = (first, second) => Math.max(
      ...first.corners.map((corner, i) => Vec2.distance(corner, second.corners[i])),
    );
    for (const quad of quads) {
      if (kept.some(other => cornerGap(other, quad) < duplicateDistance)) continue;
      kept.push(quad);
      if (kept.length >= count) break;
    }
    return kept;
  }

  // Shared preprocessing: edge map, Hough lines, support map.
  function analyze(img, paramOverrides) {
    const params = Object.assign({}, DETECT_DEFAULTS, paramOverrides || {});
    const width = img.width;
    const height = img.height;
    const gradients = edgeGradients(img, params);
    const edges = canny(gradients, width, height, params.cannyLow, params.cannyHigh);
    const lines = houghLines(edges, gradients, width, height, params);
    const radius = Math.round(params.supportRadiusPx);
    const supportBits = supportMap(edges, gradients, width, height, radius);
    return { params, width, height, edges, lines, supportBits };
  }

  // One detection pass at the given parameter overrides: analysis, every scored quad (the Hough
  // quads plus any external proposals, never instead of them) and the picked candidates.
  function detectionPass(img, paramOverrides, options) {
    const analysis = analyze(img, paramOverrides);
    const { params, width, height, lines, supportBits } = analysis;
    const context = {
      width,
      height,
      params,
      supportBits,
      cornerTrim: params.cornerTrim,
      ratio: options.ratio || CARD_ASPECT,
      seed: options.seed || null,
      focal: focalModel(width, height, params.focalFactor),
    };
    const analyzedTime = now();
    const quads = quadsFromLines(lines, context);
    for (const external of options.quads || []) {
      const corners = Quad.sortCorners(external);
      if (!Quad.isConvex(corners)) continue;
      quads.push(Object.assign({ corners }, scoreQuad(corners, context)));
    }
    const diagonal = Math.hypot(width, height);
    const candidates = pickCandidates(quads, params, diagonal, params.maxCandidates);
    return { analysis, quads, candidates, analyzedTime };
  }

  // The top candidate's confidence, or 0 when there is none.
  function topConfidence(candidates) {
    return candidates.length ? candidates[0].confidence : 0;
  }

  /**
   * detect(img, options) → { candidates: [{ corners, confidence, score, parts }], lines, timing,
   * debug }. img: ImageData-like at working size. options: { ratio (card width ÷ height, default
   * 5:7), seed: [x, y] working px or null, params: overrides of DETECT_DEFAULTS, debug: bool,
   * quads: optional external candidate quads (such as native detection in phase two), scored
   * alongside the Hough quads }.
   */
  function detect(img, options = {}) {
    const startTime = now();
    let pass = detectionPass(img, options.params, options);
    // A doubtful top pick (such as a black card on a black mat, whose edges are too faint for
    // the usual thresholds) gets a second pass with more sensitive edges. The pass with the
    // more confident top pick wins, so a confident result is never second-guessed.
    const firstConfidence = topConfidence(pass.candidates);
    const isDoubtful = firstConfidence < pass.analysis.params.retryConfidence;
    if (isDoubtful) {
      const { params } = pass.analysis;
      const sensitive = Object.assign({}, options.params, {
        cannyLow: params.retryCannyLow,
        cannyHigh: params.retryCannyHigh,
      });
      const retry = detectionPass(img, sensitive, options);
      if (topConfidence(retry.candidates) > firstConfidence) pass = retry;
    }
    const { analysis, quads, candidates, analyzedTime } = pass;
    const { params, width, height, lines } = analysis;
    const diagonal = Math.hypot(width, height);
    const result = {
      candidates: candidates.map(candidate => ({
        corners: candidate.corners,
        confidence: candidate.confidence,
        score: candidate.score,
        parts: candidate.parts,
      })),
      // Used for snap-to-edge.
      lines: lines.map(line => ({
        normalX: line.normalX,
        normalY: line.normalY,
        offset: line.offset,
        votes: line.votes,
      })),
      timing: {
        analyze: analyzedTime - startTime,
        quads: now() - analyzedTime,
        total: now() - startTime,
        lines: lines.length,
        quadCount: quads.length,
        retried: isDoubtful,
      },
    };
    if (options.debug) {
      result.debug = {
        width,
        height,
        edges: analysis.edges,
        quads: pickCandidates(quads.slice(), params, diagonal, 30).map(quad => ({
          corners: quad.corners,
          score: quad.score,
          confidence: quad.confidence,
        })),
      };
    }
    return result;
  }

  // Scores externally proposed quads with the same edge evidence as detection.
  function scoreQuads(img, quads, options = {}) {
    return detect(img, Object.assign({}, options, { quads }));
  }

  // The strongest edge response along the normal of one quad side, at refineSamples points.
  // Returns [{ baseX, baseY, responses }]: responses[step] is the directional derivative at
  // distance −searchRadius + step·0.5 along the normal.
  function normalProfiles(blurred, size, start, end, normal, searchRadius, params) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const trim = params.cornerTrim;
    const profiles = [];
    for (let sample = 0; sample < params.refineSamples; sample++) {
      const along = trim + (1 - 2 * trim) * (sample + 0.5) / params.refineSamples;
      const baseX = start[0] + dx * along;
      const baseY = start[1] + dy * along;
      const responses = [];
      for (let distance = -searchRadius; distance <= searchRadius; distance += 0.5) {
        // Central difference along the normal, ±0.75 px.
        const ahead = sampleBilinear(blurred, size.width, size.height,
          baseX + normal[0] * (distance + 0.75), baseY + normal[1] * (distance + 0.75));
        const behind = sampleBilinear(blurred, size.width, size.height,
          baseX + normal[0] * (distance - 0.75), baseY + normal[1] * (distance - 0.75));
        responses.push((ahead - behind) / 1.5);
      }
      profiles.push({ baseX, baseY, responses });
    }
    return profiles;
  }

  // +1 when the side's edge goes dark → light along the normal, −1 for light → dark: the sign of
  // the strongest response, summed over the samples.
  function dominantPolarity(profiles) {
    let positive = 0;
    let negative = 0;
    for (const profile of profiles) {
      let strongest = 0;
      for (const response of profile.responses) {
        if (Math.abs(response) > Math.abs(strongest)) strongest = response;
      }
      if (strongest > 0) positive += strongest;
      else negative -= strongest;
    }
    return positive >= negative ? 1 : -1;
  }

  // The sub-pixel edge point on each profile (parabolic peak), weighted by its strength.
  function edgePoints(profiles, polarity, normal, searchRadius, params) {
    const points = [];
    for (const profile of profiles) {
      const { responses } = profile;
      let peak = -1;
      let peakValue = 0;
      for (let i = 0; i < responses.length; i++) {
        const value = polarity * responses[i];
        if (value > peakValue) {
          peakValue = value;
          peak = i;
        }
      }
      if (peak < 1 || peak >= responses.length - 1 || peakValue < params.refineMinGrad) continue;
      // Parabolic sub-sample peak.
      const before = polarity * responses[peak - 1];
      const after = polarity * responses[peak + 1];
      const curvature = before - 2 * peakValue + after;
      const shift = curvature < 0 ? 0.5 * (before - after) / curvature : 0;
      const distance = -searchRadius + (peak + shift) * 0.5;
      points.push({
        x: profile.baseX + normal[0] * distance,
        y: profile.baseY + normal[1] * distance,
        weight: peakValue,
      });
    }
    return points;
  }

  /**
   * refineQuad(roi, corners, options) → { corners, refined: [bool × 4] }
   * Sub-pixel edge refinement on a high-resolution crop. roi: ImageData-like plus
   * { originX, originY, scale }: roi pixel = (source − origin) · scale. corners in source px.
   * For each side, sample points along it, search along the side's normal for the strongest
   * gradient of the dominant polarity, fit a robust line, then re-intersect the four lines.
   */
  function refineQuad(roi, corners, options = {}) {
    const params = Object.assign({}, DETECT_DEFAULTS, options.params || {});
    const size = { width: roi.width, height: roi.height };
    const scale = roi.scale;
    const blurred = gaussianBlur(toGray(roi), size.width, size.height, params.refineBlur);
    const toRoi = point => [(point[0] - roi.originX) * scale, (point[1] - roi.originY) * scale];
    const toSource = point => [point[0] / scale + roi.originX, point[1] / scale + roi.originY];
    const quad = corners.map(toRoi);
    const searchRadius = Math.max(2, (options.searchPx || 12) * scale);
    const lines = [];
    const refined = [];
    for (let k = 0; k < 4; k++) {
      const start = quad[k];
      const end = quad[(k + 1) % 4];
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length = Math.hypot(dx, dy);
      const normal = [-dy / length, dx / length];
      const profiles = normalProfiles(blurred, size, start, end, normal, searchRadius, params);
      const polarity = dominantPolarity(profiles);
      const points = edgePoints(profiles, polarity, normal, searchRadius, params);
      const fit = robustLine(points, params.refineInlierPx * Math.max(1, scale));
      const isGoodFit = fit && fit.inliers >= params.refineSamples * 0.3;
      lines.push(isGoodFit ? fit.line : lineThrough(start, end));
      refined.push(Boolean(isGoodFit));
    }
    const refinedCorners = [];
    for (let k = 0; k < 4; k++) {
      const corner = intersectLines(lines[(k + 3) % 4], lines[k]);
      // Fall back to the input corner if the refined lines blow up.
      const isClose = corner && Vec2.distance(corner, quad[k]) <= 2.5 * searchRadius;
      refinedCorners.push(isClose ? toSource(corner) : corners[k].slice());
    }
    return { corners: refinedCorners, refined };
  }

  // Weighted total-least-squares line through { x, y, weight } points, with iterative
  // outlier rejection. Returns { line, inliers } or null.
  function robustLine(points, inlierTolerance) {
    let current = points.slice();
    let line = null;
    for (let iteration = 0; iteration < 4 && current.length >= 4; iteration++) {
      let totalWeight = 0;
      let meanX = 0;
      let meanY = 0;
      for (const point of current) {
        totalWeight += point.weight;
        meanX += point.weight * point.x;
        meanY += point.weight * point.y;
      }
      meanX /= totalWeight;
      meanY /= totalWeight;
      let covarianceXX = 0;
      let covarianceXY = 0;
      let covarianceYY = 0;
      for (const point of current) {
        const dx = point.x - meanX;
        const dy = point.y - meanY;
        covarianceXX += point.weight * dx * dx;
        covarianceXY += point.weight * dx * dy;
        covarianceYY += point.weight * dy * dy;
      }
      // Principal direction of the 2×2 covariance; the line's normal is perpendicular to it.
      const direction = 0.5 * Math.atan2(2 * covarianceXY, covarianceXX - covarianceYY);
      const normalX = -Math.sin(direction);
      const normalY = Math.cos(direction);
      line = { normalX, normalY, offset: normalX * meanX + normalY * meanY };
      const offset = line.offset;
      const distanceTo = point => Math.abs(normalX * point.x + normalY * point.y - offset);
      const residuals = current.map(distanceTo);
      // Median absolute deviation, scaled to a standard deviation for normal noise.
      const sorted = residuals.slice().sort((first, second) => first - second);
      const deviation = sorted[sorted.length >> 1] * 1.4826;
      const tolerance = Math.max(inlierTolerance, 2.5 * deviation);
      const inliers = current.filter((point, i) => residuals[i] <= tolerance);
      if (inliers.length === current.length) break;
      current = inliers;
    }
    return line ? { line, inliers: current.length } : null;
  }

  /* ===================================================================
     OVERLAY: logo placement, in the output frame (the crop)
     overlay = { cx, cy, w, aspect, opacity }: the center as fractions of the frame, the width
     as a fraction of the frame width, aspect = logo width ÷ height. Being relative to the
     frame, the same overlay lands in the same place at every export size.
     =================================================================== */
  const OVERLAY_DEFAULTS = { width: 0.25, minWidthPx: 8, snapMargin: 0.03 };

  // The overlay's rectangle in pixels of a frameWidth × frameHeight frame.
  function overlayRect(overlay, frameWidth, frameHeight) {
    const width = overlay.w * frameWidth;
    const height = width / overlay.aspect;
    return {
      x: overlay.cx * frameWidth - width / 2,
      y: overlay.cy * frameHeight - height / 2,
      width,
      height,
    };
  }

  // Keeps the whole overlay inside the frame: shrinks it if it can't fit, then pulls its
  // center in. Never smaller than minWidthPx (unless the frame is).
  function clampOverlay(
    overlay,
    frameWidth,
    frameHeight,
    minWidthPx = OVERLAY_DEFAULTS.minWidthPx,
  ) {
    const maxWidth = Math.min(frameWidth, frameHeight * overlay.aspect);
    const wanted = Math.min(overlay.w * frameWidth, maxWidth);
    const width = Math.max(wanted, Math.min(minWidthPx, maxWidth));
    const height = width / overlay.aspect;
    return Object.assign({}, overlay, {
      w: width / frameWidth,
      cx: clamp(overlay.cx * frameWidth, width / 2, frameWidth - width / 2) / frameWidth,
      cy: clamp(overlay.cy * frameHeight, height / 2, frameHeight - height / 2) / frameHeight,
    });
  }

  // Where a snapped overlay's center lands along one axis: at the start margin, the end margin,
  // or centered, depending on which of the two letters `where` contains.
  function snapCenter(where, startLetter, endLetter, frameSize, marginPx, size) {
    if (where.includes(startLetter)) return marginPx + size / 2;
    if (where.includes(endLetter)) return frameSize - marginPx - size / 2;
    return frameSize / 2;
  }

  // Snap presets: corners 'tl' 'tr' 'bl' 'br', side middles 't' 'b' 'l' 'r', or 'c'. The margin
  // is a fraction of the frame width. A preset without 'l' or 'r' is centered across; one
  // without 't' or 'b' is centered down.
  function snapOverlay(
    overlay,
    where,
    frameWidth,
    frameHeight,
    margin = OVERLAY_DEFAULTS.snapMargin,
  ) {
    const rect = overlayRect(overlay, frameWidth, frameHeight);
    const marginPx = margin * frameWidth;
    const x = snapCenter(where, 'l', 'r', frameWidth, marginPx, rect.width);
    const y = snapCenter(where, 't', 'b', frameHeight, marginPx, rect.height);
    const snapped = Object.assign({}, overlay, { cx: x / frameWidth, cy: y / frameHeight });
    return clampOverlay(snapped, frameWidth, frameHeight);
  }

  /* ===================================================================
     UNTRUSTED INPUT: URL overrides, edits files, stored sessions
     These arrive from outside the app (a link, a file someone sent, storage another page on
     the same origin could write), so only known keys with well-formed values get through.
     =================================================================== */
  const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  const isPlainObject = value => value !== null
    && typeof value === 'object'
    && !Array.isArray(value);
  const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const ownKey = (object, key) => isPlainObject(object)
    && !BLOCKED_KEYS.has(key)
    && hasOwn(object, key);

  /**
   * applyConfigOverrides(config, entries, limits) → { applied, rejected } (keys).
   * URL overrides of CONFIG ("?detect.cannyHigh=90"): only existing number and on/off settings.
   * Text, lists and objects can't be set from a link, so a link can't inject markup or a script
   * URL. limits: { 'dotted.key': [min, max] }; a number outside its range is rejected, so a link
   * can't lift a memory cap.
   */
  function applyConfigOverrides(config, entries, limits = {}) {
    const applied = [];
    const rejected = [];
    const isInRange = (key, number) => !hasOwn(limits, key)
      || (number >= limits[key][0] && number <= limits[key][1]);
    for (const [key, value] of entries) {
      const path = String(key).split('.');
      const lastKey = path.pop();
      let target = config;
      for (const part of path) {
        target = ownKey(target, part) && isPlainObject(target[part]) ? target[part] : null;
      }
      const current = ownKey(target, lastKey) ? target[lastKey] : undefined;
      const isNumberSetting = typeof current === 'number'
        && String(value).trim() !== ''
        && Number.isFinite(Number(value))
        && isInRange(String(key), Number(value));
      const isSwitchSetting = typeof current === 'boolean' && /^(1|0|true|false)$/.test(value);
      if (isNumberSetting) {
        target[lastKey] = Number(value);
        applied.push(key);
      } else if (isSwitchSetting) {
        target[lastKey] = value === '1' || value === 'true';
        applied.push(key);
      } else {
        rejected.push(key);
      }
    }
    return { applied, rejected };
  }

  // The checks sanitizeState applies to each state field. Each check is a function returning
  // true for a good value; `shape` and `optional` checks also carry the nested keys to keep.
  function stateRules(options) {
    const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
    const isPositive = value => isFiniteNumber(value) && value > 0;
    const isUnit = value => isFiniteNumber(value) && value >= 0 && value <= 1;
    const isBoolean = value => typeof value === 'boolean';
    const oneOf = (...allowed) => value => allowed.includes(value);
    const isPoint = value => Array.isArray(value)
      && value.length === 2
      && value.every(isFiniteNumber);
    // A color pick: 3 channels 0–255 (Auto gives fractions), or null.
    const isRgb = value => value === null || (
      Array.isArray(value)
      && value.length === 3
      && value.every(channel => isFiniteNumber(channel) && channel >= 0 && channel <= 255)
    );
    // The value may also be missing or null.
    const optional = rule => Object.assign(
      value => value === undefined || value === null || rule(value),
      { keys: rule.keys },
    );
    // A nested object: every listed key must pass; on output only the listed keys are kept.
    const shape = rules => Object.assign(
      value => isPlainObject(value) && Object.keys(rules).every(key => rules[key](value[key])),
      { keys: Object.keys(rules) },
    );
    const presetIds = options.presetIds || [];
    const maxLongEdge = options.maxPx || 12000;
    return {
      corners: value => Array.isArray(value) && value.length === 4 && value.every(isPoint),
      strength: isUnit,
      aspect: { ratio: isPositive, orientation: oneOf('auto', 'portrait', 'landscape') },
      squareUpHeight: oneOf('preserveEdges', 'meanEdge', 'visual'),
      rotation: {
        quarter: oneOf(0, 1, 2, 3),
        fine: value => isFiniteNumber(value) && Math.abs(value) <= 180,
        fillFrame: isBoolean,
      },
      flip: { h: isBoolean, v: isBoolean },
      crop: {
        mode: oneOf('fit', 'manual', 'full'),
        preset: value => presetIds.includes(value),
        ratio: value => value === null || value === 'original' || isPositive(value),
        swapped: isBoolean,
        orient: oneOf(null, 'portrait', 'landscape'),
        rect: optional(shape({
          cx: isFiniteNumber,
          cy: isFiniteNumber,
          w: isPositive,
          h: isPositive,
        })),
      },
      levels: optional(shape({
        white: isRgb,
        black: isRgb,
        whiteAt: optional(isPoint),
        blackAt: optional(isPoint),
      })),
      overlay: optional(shape({
        id: value => typeof value === 'string' && value.length <= 64,
        aspect: isPositive,
        cx: isUnit,
        cy: isUnit,
        w: value => isPositive(value) && value <= 1,
        opacity: isUnit,
      })),
      export: {
        format: oneOf('jpeg', 'png', 'webp'),
        quality: isUnit,
        longEdge: value => Number.isInteger(value) && value >= 0 && value <= maxLongEdge,
        interp: oneOf('bilinear', 'bicubic'),
        fill: value => value === 'transparent' || /^#[0-9a-f]{6}$/i.test(value),
      },
    };
  }

  // Of an object value, only the keys a shape rule lists; any other value as it is.
  function keepListedKeys(rule, value) {
    if (!rule.keys || !isPlainObject(value)) return value;
    const listed = rule.keys.filter(key => value[key] !== undefined);
    return Object.fromEntries(listed.map(key => [key, value[key]]));
  }

  /**
   * sanitizeState(input, base, options) → { state, invalid, fields }.
   * Edits files and resumed sessions: the state is rebuilt field by field on top of `base` (a
   * fresh state for this photo). A malformed field keeps the base value and is listed in
   * `invalid`; a missing sub-field takes the base value (older files); unknown fields are
   * dropped. options: { presetIds: crop preset ids, maxPx: the largest export long edge }.
   * `fields` lists every state field this checks (regression R14 compares).
   */
  function sanitizeState(input, base, options = {}) {
    const state = JSON.parse(JSON.stringify(base));
    const invalid = [];
    const rules = stateRules(options);
    const fields = ['version', 'source', ...Object.keys(rules)];
    if (!isPlainObject(input)) return { state, invalid: Object.keys(rules), fields };
    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];
      if (value === undefined) continue;
      let cleaned = value;
      let ok;
      if (typeof rule === 'function') {
        ok = rule(value);
        cleaned = keepListedKeys(rule, value);
      } else {
        // An object of sub-rules: check each sub-field, filling missing ones from the base.
        ok = isPlainObject(value);
        if (ok) {
          cleaned = {};
          for (const subField of Object.keys(rule)) {
            const subValue = value[subField];
            cleaned[subField] = subValue === undefined
              ? state[field][subField]
              : keepListedKeys(rule[subField], subValue);
            if (!rule[subField](cleaned[subField])) ok = false;
          }
        }
      }
      if (ok) state[field] = JSON.parse(JSON.stringify(cleaned));
      else invalid.push(field);
    }
    return { state, invalid, fields };
  }

  /* ===================================================================
     RENDER PIPELINE: state → geometry → warp
     Frames, as in docs/architecture.md:
       source (photo px) —homography→ perspective (corrected) —flip, rotate→ rotated
       —crop, scale→ output
     =================================================================== */
  const GEOMETRY_DEFAULTS = {
    maxOutputPx: 12000,
    maxOutputArea: 16777216,
    maxBoundsFactor: 3,
    minCornerDistPx: 8,
    fitPaddingPct: 8,
    allowUpscale: false,
  };
  // shrinkToValid's bisection halves the scale range this many times (≈1e-12 precision).
  const BISECTION_STEPS = 40;

  // The crop's width ÷ height from crop state, or null for a free crop.
  function cropRatio(crop, sourceWidth, sourceHeight) {
    if (!crop || crop.ratio == null) return null;
    const ratio = crop.ratio === 'original' ? sourceWidth / sourceHeight : crop.ratio;
    return crop.swapped ? 1 / ratio : ratio;
  }

  // A crop around the card quad, padded by paddingPct of its long side, widened or heightened
  // to `ratio`, and shrunk and moved to fit inside the frame.
  function fitCrop(quad, ratio, paddingPct, frameWidth, frameHeight) {
    const box = Quad.boundingBox(quad);
    const padding = (paddingPct / 100) * Math.max(box.width, box.height);
    let width = box.width + 2 * padding;
    let height = box.height + 2 * padding;
    const centerX = (box.left + box.right) / 2;
    const centerY = (box.top + box.bottom) / 2;
    if (ratio) {
      if (width / height < ratio) width = height * ratio;
      else height = width / ratio;
    }
    const scale = Math.min(1, frameWidth / width, frameHeight / height);
    width *= scale;
    height *= scale;
    return {
      x: clamp(centerX - width / 2, 0, frameWidth - width),
      y: clamp(centerY - height / 2, 0, frameHeight - height),
      width,
      height,
    };
  }

  function rectCorners(rect) {
    return [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y],
      [rect.x + rect.width, rect.y + rect.height],
      [rect.x, rect.y + rect.height],
    ];
  }

  // Shrinks a crop about its center until all four corners sit inside every polygon.
  function shrinkToValid(crop, polygons) {
    const isInside = rect => rectCorners(rect).every(
      point => polygons.every(polygon => Quad.contains(polygon, point)),
    );
    if (isInside(crop)) return crop;
    let centerX = crop.x + crop.width / 2;
    let centerY = crop.y + crop.height / 2;
    if (!polygons.every(polygon => Quad.contains(polygon, [centerX, centerY]))) {
      [centerX, centerY] = Quad.centroid(polygons[0]);
    }
    const scaledAboutCenter = scale => ({
      x: centerX - crop.width * scale / 2,
      y: centerY - crop.height * scale / 2,
      width: crop.width * scale,
      height: crop.height * scale,
    });
    let low = 0;
    let high = 1;
    for (let i = 0; i < BISECTION_STEPS; i++) {
      const middle = (low + high) / 2;
      if (isInside(scaledAboutCenter(middle))) low = middle;
      else high = middle;
    }
    return scaledAboutCenter(low);
  }

  // The perspective frame: the source photo mapped through the homography, bounded to
  // maxBoundsFactor card sizes around the card (protects against near-horizon blow-ups) and
  // scaled down to maxOutputPx. Returns its size and the source → perspective matrix.
  function perspectiveFrame(homography, cardTargets, sourceCorners, config) {
    const cardBox = Quad.boundingBox(cardTargets);
    const factor = config.maxBoundsFactor;
    const limit = {
      left: cardBox.left - cardBox.width * factor,
      top: cardBox.top - cardBox.height * factor,
      right: cardBox.right + cardBox.width * factor,
      bottom: cardBox.bottom + cardBox.height * factor,
    };
    let bounds = limit;
    let isLimited = true;
    const isInFront = point => Mat3.homogeneousW(homography, point[0], point[1]) > EPSILON;
    if (sourceCorners.every(isInFront)) {
      const mappedCorners = sourceCorners.map(point => Mat3.apply(homography, point[0], point[1]));
      const mapped = Quad.boundingBox(mappedCorners);
      bounds = {
        left: Math.max(mapped.left, limit.left),
        top: Math.max(mapped.top, limit.top),
        right: Math.min(mapped.right, limit.right),
        bottom: Math.min(mapped.bottom, limit.bottom),
      };
      isLimited = bounds.left > mapped.left
        || bounds.top > mapped.top
        || bounds.right < mapped.right
        || bounds.bottom < mapped.bottom;
    }
    const boundsWidth = bounds.right - bounds.left;
    const boundsHeight = bounds.bottom - bounds.top;
    const scale = Math.min(1, config.maxOutputPx / Math.max(boundsWidth, boundsHeight));
    return {
      width: boundsWidth * scale,
      height: boundsHeight * scale,
      scale,
      isClamped: scale < 1,
      isLimited,
      sourceToPerspective: Mat3.chain(
        Mat3.scale(scale),
        Mat3.translate(-bounds.left, -bounds.top),
        homography,
      ),
      cardPerspective: cardTargets.map(point => [
        (point[0] - bounds.left) * scale,
        (point[1] - bounds.top) * scale,
      ]),
    };
  }

  // The rotated frame: flip, then rotate about the perspective frame's center. The rotated
  // frame is the bounding box of the rotated perspective frame.
  function rotatedFrame(perspective, rotation, flip) {
    const degrees = ((rotation.quarter || 0) * 90 + (rotation.fine || 0));
    const rotate = Mat3.rotate(degrees * RADIANS_PER_DEGREE);
    const cos = Math.abs(rotate[0]);
    const sin = Math.abs(rotate[3]);
    const width = cos * perspective.width + sin * perspective.height;
    const height = sin * perspective.width + cos * perspective.height;
    const perspectiveToRotated = Mat3.chain(
      Mat3.translate(width / 2, height / 2),
      rotate,
      Mat3.scale(flip.h ? -1 : 1, flip.v ? -1 : 1),
      Mat3.translate(-perspective.width / 2, -perspective.height / 2),
    );
    return { width, height, perspectiveToRotated };
  }

  // The crop in rotated-frame px. Manual rects are stored relative to the rotated frame's
  // center in units of the perspective frame's long side, so they stay proportionally placed
  // when earlier steps change.
  function cropInRotated(cropState, ratio, rotated, longSide, cardRotated, config) {
    const frameWidth = rotated.width;
    const frameHeight = rotated.height;
    if (cropState.mode === 'fit') {
      return fitCrop(cardRotated, ratio, config.fitPaddingPct, frameWidth, frameHeight);
    }
    if (cropState.mode === 'manual' && cropState.rect) {
      const rect = cropState.rect;
      const left = frameWidth / 2 + (rect.cx - rect.w / 2) * longSide;
      const top = frameHeight / 2 + (rect.cy - rect.h / 2) * longSide;
      const clampedLeft = clamp(left, 0, frameWidth);
      const clampedTop = clamp(top, 0, frameHeight);
      return {
        x: clampedLeft,
        y: clampedTop,
        width: clamp(left + rect.w * longSide, 0, frameWidth) - clampedLeft,
        height: clamp(top + rect.h * longSide, 0, frameHeight) - clampedTop,
      };
    }
    if (!ratio) return { x: 0, y: 0, width: frameWidth, height: frameHeight };
    // The whole frame, trimmed to the ratio and centered.
    let width = frameWidth;
    let height = width / ratio;
    if (height > frameHeight) {
      height = frameHeight;
      width = height * ratio;
    }
    return { x: (frameWidth - width) / 2, y: (frameHeight - height) / 2, width, height };
  }

  // The export size: the optional long-edge resize, then hard clamps against huge canvases
  // (maxOutputPx on the long side, maxOutputArea in total).
  function outputSize(crop, exportState, config) {
    const longSide = Math.max(crop.width, crop.height);
    let scale = 1;
    if (exportState.longEdge) {
      const resize = exportState.longEdge / longSide;
      scale = config.allowUpscale ? resize : Math.min(1, resize);
    }
    let width = Math.max(1, Math.round(crop.width * scale));
    let height = Math.max(1, Math.round(crop.height * scale));
    let isClamped = false;
    const cap = Math.min(
      1,
      config.maxOutputPx / Math.max(width, height),
      Math.sqrt(config.maxOutputArea / (width * height)),
    );
    if (cap < 1) {
      width = Math.max(1, Math.floor(width * cap));
      height = Math.max(1, Math.floor(height * cap));
      isClamped = true;
    }
    return { width, height, scale, isClamped };
  }

  /**
   * computeGeometry(state, config) → every transform needed to render `state`, or
   * { ok: false, reason }. A pure function of (state, config); preview and export both use it.
   */
  function computeGeometry(state, configIn) {
    const config = Object.assign({}, GEOMETRY_DEFAULTS, configIn || {});
    const sourceWidth = state.source.width;
    const sourceHeight = state.source.height;
    const corners = state.corners;
    const check = Quad.validate(corners, config.minCornerDistPx);
    if (!check.ok) return { ok: false, reason: check.reason };
    const cardTargets = perspectiveTargets(corners, {
      strength: state.strength,
      ratio: (state.aspect && state.aspect.ratio) || CARD_ASPECT,
      orientation: state.aspect ? state.aspect.orientation : 'auto',
      heightMode: state.squareUpHeight || 'preserveEdges',
    });
    const homography = solveHomography(corners, cardTargets);
    if (!homography) {
      return { ok: false, reason: 'Could not solve the perspective for these corners.' };
    }

    const sourceCorners = [
      [0, 0],
      [sourceWidth, 0],
      [sourceWidth, sourceHeight],
      [0, sourceHeight],
    ];
    const perspective = perspectiveFrame(homography, cardTargets, sourceCorners, config);
    const { sourceToPerspective, cardPerspective } = perspective;

    const rotation = state.rotation || { quarter: 0, fine: 0 };
    const rotated = rotatedFrame(perspective, rotation, state.flip || {});
    const { perspectiveToRotated } = rotated;
    const sourceToRotated = Mat3.multiply(perspectiveToRotated, sourceToPerspective);
    const toRotated = matrix => point => Mat3.apply(matrix, point[0], point[1]);
    const cardRotated = cardPerspective.map(toRotated(perspectiveToRotated));
    const perspectiveCorners = [
      [0, 0],
      [perspective.width, 0],
      [perspective.width, perspective.height],
      [0, perspective.height],
    ];
    const frameRotated = Quad.sortCorners(perspectiveCorners.map(toRotated(perspectiveToRotated)));
    const isSourceInFront = sourceCorners.every(
      point => Mat3.homogeneousW(sourceToRotated, point[0], point[1]) > EPSILON,
    );
    // The photo's own outline in the rotated frame (null when part of it maps past the horizon).
    const validRotated = isSourceInFront
      ? Quad.sortCorners(sourceCorners.map(toRotated(sourceToRotated)))
      : null;

    const perspectiveLongSide = Math.max(perspective.width, perspective.height);
    const cropState = state.crop || { mode: 'full' };
    const ratio = cropRatio(cropState, sourceWidth, sourceHeight);
    let crop = cropInRotated(cropState, ratio, rotated, perspectiveLongSide, cardRotated, config);
    if (rotation.fillFrame) {
      const polygons = validRotated ? [frameRotated, validRotated] : [frameRotated];
      crop = shrinkToValid(crop, polygons);
    }
    if (!(crop.width >= 1 && crop.height >= 1)) return { ok: false, reason: 'Crop is empty.' };

    const output = outputSize(crop, state.export || {}, config);
    const sourceToOutput = Mat3.chain(
      Mat3.scale(output.width / crop.width, output.height / crop.height),
      Mat3.translate(-crop.x, -crop.y),
      sourceToRotated,
    );
    const outputToSource = Mat3.invert(sourceToOutput);
    if (!outputToSource) return { ok: false, reason: 'Transform is not invertible.' };
    return {
      ok: true,
      cardTargets,
      homography,
      sourceToPerspective,
      perspectiveToRotated,
      sourceToRotated,
      sourceToOutput,
      outputToSource,
      perspective: {
        width: perspective.width,
        height: perspective.height,
        scale: perspective.scale,
        isClamped: perspective.isClamped,
        isLimited: perspective.isLimited,
      },
      rotated: { width: rotated.width, height: rotated.height },
      perspectiveLongSide,
      cardPerspective,
      cardRotated,
      frameRotated,
      validRotated,
      crop,
      output,
    };
  }

  // Writes one RGBA fill color at a byte offset.
  function fillPixel(data, offset, fill) {
    data[offset] = fill[0];
    data[offset + 1] = fill[1];
    data[offset + 2] = fill[2];
    data[offset + 3] = fill[3];
  }

  // Bilinear RGBA sample of `source` at grid position (column + fractionX, row + fractionY),
  // clamp-to-edge, written to `data` at `offset`.
  function writeBilinear(source, column, row, fractionX, fractionY, data, offset) {
    const { width, height } = source;
    const pixels = source.data;
    const left = clampIndex(column, width);
    const right = clampIndex(column + 1, width);
    const top = clampIndex(row, height);
    const bottom = clampIndex(row + 1, height);
    const topLeft = (top * width + left) * 4;
    const topRight = (top * width + right) * 4;
    const bottomLeft = (bottom * width + left) * 4;
    const bottomRight = (bottom * width + right) * 4;
    const weightTopLeft = (1 - fractionX) * (1 - fractionY);
    const weightTopRight = fractionX * (1 - fractionY);
    const weightBottomLeft = (1 - fractionX) * fractionY;
    const weightBottomRight = fractionX * fractionY;
    for (let channel = 0; channel < 4; channel++) {
      data[offset + channel] = pixels[topLeft + channel] * weightTopLeft
        + pixels[topRight + channel] * weightTopRight
        + pixels[bottomLeft + channel] * weightBottomLeft
        + pixels[bottomRight + channel] * weightBottomRight;
    }
  }

  // Bicubic (Keys) RGBA sample over the 4×4 neighborhood starting one pixel up and left of
  // (column, row), clamp-to-edge, written to `data` at `offset`. weightsX / weightsY come from
  // keysWeights. The Uint8ClampedArray clamps any overshoot.
  function writeBicubic(source, column, row, weightsX, weightsY, data, offset) {
    const { width, height } = source;
    const pixels = source.data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let alpha = 0;
    for (let rowStep = 0; rowStep < 4; rowStep++) {
      const sourceRow = clampIndex(row - 1 + rowStep, height) * width;
      const weightY = weightsY[rowStep];
      for (let columnStep = 0; columnStep < 4; columnStep++) {
        const sourceColumn = clampIndex(column - 1 + columnStep, width);
        const weight = weightsX[columnStep] * weightY;
        const pixel = (sourceRow + sourceColumn) * 4;
        red += pixels[pixel] * weight;
        green += pixels[pixel + 1] * weight;
        blue += pixels[pixel + 2] * weight;
        alpha += pixels[pixel + 3] * weight;
      }
    }
    data[offset] = red;
    data[offset + 1] = green;
    data[offset + 2] = blue;
    data[offset + 3] = alpha;
  }

  /**
   * warp(dst, src, outputToSource, options): inverse-maps every dst pixel through
   * outputToSource into src and samples it. dst and src: ImageData-like RGBA.
   * outputToSource maps dst pixel coordinates (+ options.rowOffset, for row bands) to src
   * pixel coordinates. options.bounds [left, top, right, bottom]: the valid source area in src
   * coordinates; outside it, options.fill (RGBA 0–255). options.interp: 'bilinear' | 'bicubic'.
   */
  function warp(dst, src, outputToSource, options = {}) {
    const isBicubic = options.interp === 'bicubic';
    const fill = options.fill || [0, 0, 0, 0];
    const rowOffset = options.rowOffset || 0;
    const bounds = options.bounds || [0, 0, src.width, src.height];
    const [boundsLeft, boundsTop, boundsRight, boundsBottom] = bounds;
    const data = dst.data;
    const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = outputToSource;
    const weightsX = new Float32Array(4);
    const weightsY = new Float32Array(4);
    for (let y = 0; y < dst.height; y++) {
      const outputY = y + rowOffset + 0.5;
      // M·[x + 0.5, outputY, 1], stepped by one column per pixel.
      let homogeneousX = m00 * 0.5 + m01 * outputY + m02;
      let homogeneousY = m10 * 0.5 + m11 * outputY + m12;
      let homogeneousW = m20 * 0.5 + m21 * outputY + m22;
      let offset = y * dst.width * 4;
      for (let x = 0; x < dst.width; x++) {
        const sourceX = homogeneousX / homogeneousW;
        const sourceY = homogeneousY / homogeneousW;
        const isOutside = homogeneousW <= EPSILON
          || sourceX < boundsLeft
          || sourceY < boundsTop
          || sourceX >= boundsRight
          || sourceY >= boundsBottom;
        if (isOutside) {
          fillPixel(data, offset, fill);
        } else {
          // Pixel centers sit at +0.5.
          const gridX = sourceX - 0.5;
          const gridY = sourceY - 0.5;
          const column = Math.floor(gridX);
          const row = Math.floor(gridY);
          const fractionX = gridX - column;
          const fractionY = gridY - row;
          if (isBicubic) {
            keysWeights(fractionX, weightsX);
            keysWeights(fractionY, weightsY);
            writeBicubic(src, column, row, weightsX, weightsY, data, offset);
          } else {
            writeBilinear(src, column, row, fractionX, fractionY, data, offset);
          }
        }
        homogeneousX += m00;
        homogeneousY += m10;
        homogeneousW += m20;
        offset += 4;
      }
    }
    return dst;
  }

  // Keys cubic convolution with a = −0.5 (Catmull-Rom).
  const KEYS_A = -0.5;
  function keysKernel(distance) {
    const x = Math.abs(distance);
    if (x <= 1) return (KEYS_A + 2) * x * x * x - (KEYS_A + 3) * x * x + 1;
    if (x < 2) return KEYS_A * x * x * x - 5 * KEYS_A * x * x + 8 * KEYS_A * x - 4 * KEYS_A;
    return 0;
  }
  // Keys weights for the pixels at offsets −1, 0, 1, 2 from a sample `fraction` past a pixel.
  function keysWeights(fraction, weights) {
    weights[0] = keysKernel(1 + fraction);
    weights[1] = keysKernel(fraction);
    weights[2] = keysKernel(1 - fraction);
    weights[3] = keysKernel(2 - fraction);
  }

  /* ===================================================================
     LEVELS: white and black point correction in linear light
     =================================================================== */
  const LEVELS_DEFAULTS = {
    whiteTarget: 245,
    blackTarget: 8,
    autoWhitePct: 1,
    autoBlackPct: 0.5,
    autoBlackMaxSpread: 24,
    autoBlackMinNeutralPct: 10,
    autoClipAt: 250,
  };
  // Rec. 709 luminance weights, for brightness on sRGB values.
  const LUMA = [0.2126, 0.7152, 0.0722];

  // sRGB 0–255 → linear 0–1 (the sRGB transfer function).
  function srgbToLinear(value) {
    const encoded = Math.max(0, Math.min(255, value)) / 255;
    return encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4);
  }
  // Linear 0–1 → sRGB 0–255 (not rounded).
  function linearToSrgb(value) {
    const linear = Math.max(0, Math.min(1, value));
    return 255 * (linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055);
  }
  // srgbToLinear for every byte value, for pixel loops.
  const SRGB_TO_LINEAR = new Float64Array(256);
  for (let i = 0; i < 256; i++) SRGB_TO_LINEAR[i] = srgbToLinear(i);

  const luminanceAt = (data, offset) => LUMA[0] * data[offset]
    + LUMA[1] * data[offset + 1]
    + LUMA[2] * data[offset + 2];

  /**
   * levelsLut(levels, options) → [lutRed, lutGreen, lutBlue] (256-entry Uint8ClampedArrays),
   * or null for no change. levels: { white: [r, g, b] | null, black: [r, g, b] | null } in
   * sRGB 0–255. Per channel, in linear light, the white pick maps to whiteTarget and the black
   * pick to blackTarget, so both come out neutral. Scaling linear light is what a camera's
   * white balance does; doing it on gamma-encoded values would shift midtone hues.
   */
  function levelsLut(levels, options) {
    if (!levels || (!levels.white && !levels.black)) return null;
    const settings = Object.assign({}, LEVELS_DEFAULTS, options || {});
    const targetWhite = srgbToLinear(levels.white ? settings.whiteTarget : 255);
    const targetBlack = srgbToLinear(levels.black ? settings.blackTarget : 0);
    return [0, 1, 2].map(channel => {
      const white = levels.white ? srgbToLinear(levels.white[channel]) : 1;
      const black = levels.black ? srgbToLinear(levels.black[channel]) : 0;
      const span = Math.max(white - black, 0.02);
      const table = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        const targetRange = targetWhite - targetBlack;
        const linear = targetBlack + (SRGB_TO_LINEAR[i] - black) / span * targetRange;
        table[i] = Math.round(linearToSrgb(linear));
      }
      return table;
    });
  }

  // Applies per-channel lookup tables to an RGBA image in place (alpha untouched).
  function applyLut(img, lut) {
    const data = img.data;
    const [red, green, blue] = lut;
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = red[data[offset]];
      data[offset + 1] = green[data[offset + 1]];
      data[offset + 2] = blue[data[offset + 2]];
    }
    return img;
  }

  /**
   * meanColor(img, trim) → the mean color of the opaque pixels, averaged in linear light,
   * as sRGB 0–255 (one decimal), or null. With trim > 0, only the (1 − 2·trim) share of pixels
   * closest in brightness to the patch's median are averaged. A dropper patch that is mostly
   * label with some text (or a speck of glare) then reads the surface it is mostly on.
   */
  function meanColor(img, trim = 0) {
    const data = img.data;
    const opaque = [];
    for (let offset = 0; offset < data.length; offset += 4) {
      if (data[offset + 3] !== 0) opaque.push(offset);
    }
    if (!opaque.length) return null;
    if (trim > 0) {
      const levels = opaque.map(offset => luminanceAt(data, offset));
      const sorted = levels.sort((first, second) => first - second);
      const median = sorted[sorted.length >> 1];
      const gap = offset => Math.abs(luminanceAt(data, offset) - median);
      opaque.sort((first, second) => gap(first) - gap(second));
    }
    const count = Math.max(1, Math.ceil(opaque.length * (1 - 2 * trim)));
    let red = 0;
    let green = 0;
    let blue = 0;
    for (let k = 0; k < count; k++) {
      const offset = opaque[k];
      red += SRGB_TO_LINEAR[data[offset]];
      green += SRGB_TO_LINEAR[data[offset + 1]];
      blue += SRGB_TO_LINEAR[data[offset + 2]];
    }
    const toOneDecimal = value => Math.round(linearToSrgb(value) * 10) / 10;
    return [red / count, green / count, blue / count].map(toOneDecimal);
  }

  // Brightness level (0–255) at which the running count, from `start` stepping by `step`,
  // first reaches `needed`.
  function histogramThreshold(histogram, start, step, needed) {
    let level = start;
    let count = 0;
    for (; step < 0 ? level > 0 : level < 255; level += step) {
      count += histogram[level];
      if (count >= needed) break;
    }
    return level;
  }

  // Pixel status in autoLevels: transparent pixels are skipped, unclipped ones can be white.
  const LEVELS_OPAQUE = 1;
  const LEVELS_UNCLIPPED = 2;

  // autoLevels' first pass: each pixel's brightness (0–255) and status, and brightness
  // histograms of the opaque and the unclipped pixels.
  function levelsHistograms(data, settings) {
    const pixelCount = data.length / 4;
    const result = {
      brightness: new Uint8Array(pixelCount),
      status: new Uint8Array(pixelCount),
      opaqueHistogram: new Uint32Array(256),
      unclippedHistogram: new Uint32Array(256),
      opaqueCount: 0,
      unclippedCount: 0,
    };
    for (let pixel = 0, offset = 0; pixel < pixelCount; pixel++, offset += 4) {
      if (data[offset + 3] === 0) continue;
      const level = Math.round(luminanceAt(data, offset));
      result.brightness[pixel] = level;
      result.status[pixel] = LEVELS_OPAQUE;
      result.opaqueHistogram[level]++;
      result.opaqueCount++;
      if (Math.max(data[offset], data[offset + 1], data[offset + 2]) < settings.autoClipAt) {
        result.status[pixel] = LEVELS_UNCLIPPED;
        result.unclippedHistogram[level]++;
        result.unclippedCount++;
      }
    }
    return result;
  }

  // autoLevels' second pass: linear-light sums of the white pixels (at or above whiteThreshold)
  // and of the dark pixels (at or below blackThreshold) that are near-neutral, with the counts.
  function sumLevelsSamples(data, histograms, whiteThreshold, blackThreshold, settings) {
    const { brightness, status } = histograms;
    const sums = {
      white: [0, 0, 0],
      black: [0, 0, 0],
      whiteCount: 0,
      darkCount: 0,
      neutralDarkCount: 0,
    };
    for (let pixel = 0, offset = 0; pixel < brightness.length; pixel++, offset += 4) {
      if (status[pixel] === LEVELS_UNCLIPPED && brightness[pixel] >= whiteThreshold) {
        for (let channel = 0; channel < 3; channel++) {
          sums.white[channel] += SRGB_TO_LINEAR[data[offset + channel]];
        }
        sums.whiteCount++;
      }
      if (status[pixel] && brightness[pixel] <= blackThreshold) {
        sums.darkCount++;
        const red = data[offset];
        const green = data[offset + 1];
        const blue = data[offset + 2];
        const spread = Math.max(red, green, blue) - Math.min(red, green, blue);
        if (spread > settings.autoBlackMaxSpread) continue;
        sums.black[0] += SRGB_TO_LINEAR[red];
        sums.black[1] += SRGB_TO_LINEAR[green];
        sums.black[2] += SRGB_TO_LINEAR[blue];
        sums.neutralDarkCount++;
      }
    }
    return sums;
  }

  // Linear-light channel sums and a pixel count → their mean as sRGB, to one decimal.
  function meanSrgb(sums, count) {
    return sums.map(sum => Math.round(linearToSrgb(sum / count) * 10) / 10);
  }

  // Brightness (0–255) of an sRGB color.
  function colorLuminance(color) {
    return LUMA[0] * color[0] + LUMA[1] * color[1] + LUMA[2] * color[2];
  }

  /**
   * autoLevels(img, options) → { white, black } as a starting point, or null (transparent
   * pixels ignored). White = the mean of the brightest autoWhitePct% of pixels that aren't
   * clipped (a white-patch estimate; clipped pixels carry no color). Black = the mean of the
   * darkest autoBlackPct% that are near-neutral (channel spread at most autoBlackMaxSpread).
   * Colored darks, such as a blue slab label, would push their color into the black point and
   * cast the whole image, so they're left out. There's no black when fewer than
   * autoBlackMinNeutralPct% of the darkest pixels are neutral, or when it's more than half as
   * bright as the white.
   */
  function autoLevels(img, options) {
    const settings = Object.assign({}, LEVELS_DEFAULTS, options || {});
    const data = img.data;
    const histograms = levelsHistograms(data, settings);
    if (!histograms.unclippedCount) return null;
    const whiteNeeded = Math.max(1, histograms.unclippedCount * settings.autoWhitePct / 100);
    const whiteThreshold = histogramThreshold(
      histograms.unclippedHistogram,
      255,
      -1,
      whiteNeeded,
    );
    const blackNeeded = Math.max(1, histograms.opaqueCount * settings.autoBlackPct / 100);
    const blackThreshold = histogramThreshold(histograms.opaqueHistogram, 0, 1, blackNeeded);
    const sums = sumLevelsSamples(data, histograms, whiteThreshold, blackThreshold, settings);

    const white = meanSrgb(sums.white, sums.whiteCount);
    const neutralPct = sums.darkCount ? sums.neutralDarkCount / sums.darkCount * 100 : 0;
    const hasNeutralBlack = sums.neutralDarkCount > 0
      && neutralPct >= settings.autoBlackMinNeutralPct;
    const black = hasNeutralBlack ? meanSrgb(sums.black, sums.neutralDarkCount) : null;
    // A "black" more than half as bright as white is a low-contrast scene, not a black point.
    const isRealBlack = black && colorLuminance(black) < colorLuminance(white) * 0.5;
    return { white, black: isRealBlack ? black : null };
  }

  /* ===================================================================
     SELF-TEST: runs the same on the main thread and in a Worker
     Each test records { name, pass, detail }; the details carry the measured errors.
     =================================================================== */

  // Random convex-ish card quads in a 4032×3024 frame (a base rectangle plus jitter), from a
  // fixed seed so every run tests the same quads.
  function randomTestQuads() {
    let seed = 12345;
    const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    const quads = [];
    for (let attempt = 0; attempt < 50; attempt++) {
      const centerX = 1000 + random() * 2000;
      const centerY = 800 + random() * 1400;
      const width = 600 + random() * 900;
      const height = width * (1.2 + random() * 0.4);
      const jitter = 0.18;
      const rectangle = centeredTrapezoid(centerX, centerY, width, width, height);
      const quad = rectangle.map(point => [
        point[0] + (random() - 0.5) * width * jitter,
        point[1] + (random() - 0.5) * height * jitter,
      ]);
      if (Quad.isConvex(quad)) quads.push(quad);
    }
    return quads;
  }

  // 1. Homography round trip: corners map within 0.01 px, and back through the inverse.
  function testHomography(record, quads) {
    let worst = 0;
    for (const quad of quads) {
      const targets = perspectiveTargets(quad, { strength: 1, ratio: CARD_ASPECT });
      const homography = solveHomography(quad, targets);
      const inverse = Mat3.invert(homography);
      quad.forEach((point, i) => {
        const forward = Mat3.apply(homography, point[0], point[1]);
        const back = Mat3.apply(inverse, targets[i][0], targets[i][1]);
        worst = Math.max(worst, Vec2.distance(forward, targets[i]));
        worst = Math.max(worst, Vec2.distance(back, point));
      });
    }
    record('Homography round-trips corners within 0.01 px', worst < 0.01,
      `max error ${worst.toExponential(2)} px over ${quads.length} quads`);
  }

  // 2. Flatten 0% (squared up): top and bottom horizontal, left and right edge angles mirrored.
  function testFlattenZero(record, quads) {
    let worstAngle = 0;
    let worstTilt = 0;
    for (const quad of quads) {
      const targets = perspectiveTargets(quad, { strength: 0 });
      const topTilt = Math.abs(targets[0][1] - targets[1][1]);
      const bottomTilt = Math.abs(targets[3][1] - targets[2][1]);
      worstTilt = Math.max(worstTilt, topTilt, bottomTilt);
      const left = Math.atan2(targets[3][0] - targets[0][0], targets[3][1] - targets[0][1]);
      const right = Math.atan2(targets[2][0] - targets[1][0], targets[2][1] - targets[1][1]);
      worstAngle = Math.max(worstAngle, Math.abs(left + right) / RADIANS_PER_DEGREE);
    }
    const pass = worstAngle < 1e-6 && worstTilt < 1e-6;
    record('Flatten 0%: top/bottom horizontal, left/right angles mirror', pass,
      `angle mismatch ${worstAngle.toExponential(2)}°, edge tilt ${worstTilt.toExponential(2)} px`);
  }

  // 3. Flatten 100%: four 90° corners at 5:7 (portrait), and the landscape pick.
  function testFlattenFull(record, quads) {
    let worstAngle = 0;
    let worstAspect = 0;
    for (const quad of quads) {
      const targets = perspectiveTargets(quad, { strength: 1, ratio: CARD_ASPECT });
      const deviations = Quad.cornerAngles(targets).map(angle => Math.abs(angle - 90));
      worstAngle = Math.max(worstAngle, ...deviations);
      const sides = Quad.sides(targets);
      const aspect = Math.min(sides.top, sides.left) / Math.max(sides.top, sides.left);
      worstAspect = Math.max(worstAspect, Math.abs(aspect - CARD_ASPECT));
    }
    record('Flatten 100%: corners are 90° at 5:7', worstAngle < 1e-9 && worstAspect < 1e-9,
      `angle error ${worstAngle.toExponential(2)}°, aspect error ${worstAspect.toExponential(2)}`);
  }

  // 3b. Perspective-corrected aspect: project a 5:7 card tilted 25° and 12° through a pinhole
  // camera, then recover its aspect.
  function testCorrectedAspect(record) {
    const focalPx = 1500;
    const centerU = 750;
    const centerV = 1000;
    const tiltX = 25 * RADIANS_PER_DEGREE;
    const tiltY = 12 * RADIANS_PER_DEGREE;
    const project = ([x, y, z]) => {
      const rotatedY = y * Math.cos(tiltX) - z * Math.sin(tiltX);
      const rotatedZ = y * Math.sin(tiltX) + z * Math.cos(tiltX);
      const turnedX = x * Math.cos(tiltY) + rotatedZ * Math.sin(tiltY);
      const depth = -x * Math.sin(tiltY) + rotatedZ * Math.cos(tiltY) + 400;
      return [
        centerU + focalPx * (turnedX + 10) / depth,
        centerV + focalPx * (rotatedY - 20) / depth,
      ];
    };
    const cardMm = [[-31.75, -44.45, 0], [31.75, -44.45, 0], [31.75, 44.45, 0], [-31.75, 44.45, 0]];
    const projected = cardMm.map(project);
    const focal = { fallback: 3000, min: 100, max: 10000 };
    const recovered = rectAspect(projected, [centerU, centerV], focal);
    const sides = Quad.sides(projected);
    const naive = (sides.top + sides.bottom) / (sides.left + sides.right);
    record('Perspective-corrected aspect recovers 5:7', Math.abs(recovered - CARD_ASPECT) < 1e-6,
      `recovered ${recovered.toFixed(5)} vs naive ${naive.toFixed(4)}`);
  }

  // 4. Degenerate input is rejected: a bow-tie, and two corners nearly on top of each other.
  function testDegenerateQuads(record) {
    const bowTie = [[0, 0], [100, 100], [100, 0], [0, 100]];
    const nearDuplicate = [[0, 0], [2, 0], [100, 100], [0, 100]];
    const bothRejected = !Quad.validate(bowTie, 8).ok && !Quad.validate(nearDuplicate, 8).ok;
    record('Degenerate quads rejected', bothRejected,
      'bow-tie and near-duplicate corners');
  }

  // 5. Pipeline: the exported card corners land on a 5:7 rectangle with 90° corners.
  function testPipeline(record, quad) {
    const state = {
      source: { width: 4032, height: 3024 },
      corners: quad,
      strength: 1,
      aspect: { ratio: CARD_ASPECT, orientation: 'auto' },
      rotation: { quarter: 1, fine: 3.5 },
      flip: { h: true },
      crop: { mode: 'fit', ratio: 1 },
      export: {},
    };
    const geometry = computeGeometry(state, {});
    const cardOutput = quad.map(point => Mat3.apply(geometry.sourceToOutput, point[0], point[1]));
    const deviations = Quad.cornerAngles(cardOutput).map(angle => Math.abs(angle - 90));
    const angleError = Math.max(...deviations);
    const sides = Quad.sides(cardOutput);
    const aspect = Math.min(sides.top, sides.left) / Math.max(sides.top, sides.left);
    record('Pipeline (rotate+flip+crop) keeps card rectangular at 5:7',
      geometry.ok && angleError < 1e-6 && Math.abs(aspect - CARD_ASPECT) < 1e-6,
      `angle error ${angleError.toExponential(2)}°, aspect ${aspect.toFixed(6)}`);
  }

  // A synthetic photo: a warm card on a dark background, 4×4 supersampled for anti-aliased
  // edges like a real photo. shades: the red channel of the background and the card.
  function syntheticCardImage(width, height, card, shades = { background: 50, card: 200 }) {
    const img = { width, height, data: new Uint8ClampedArray(width * height * 4) };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let coverage = 0;
        for (let subY = 0; subY < 4; subY++) {
          for (let subX = 0; subX < 4; subX++) {
            if (Quad.contains(card, [x + (subX + 0.5) / 4, y + (subY + 0.5) / 4])) coverage++;
          }
        }
        const value = shades.background + (shades.card - shades.background) * coverage / 16;
        const offset = (y * width + x) * 4;
        img.data[offset] = value;
        img.data[offset + 1] = value * 0.9;
        img.data[offset + 2] = value * 0.8;
        img.data[offset + 3] = 255;
      }
    }
    return img;
  }

  // 6–7. Warp: identity reproduces the source; a synthetic card is detected, then refined.
  function testWarpAndDetection(record) {
    const width = 480;
    const height = 640;
    const card = [[120, 140], [370, 128], [384, 470], [110, 486]];
    const img = syntheticCardImage(width, height, card);
    const blank = { width, height, data: new Uint8ClampedArray(width * height * 4) };
    const copy = warp(blank, img, Mat3.identity());
    let maxDiff = 0;
    for (let k = 0; k < copy.data.length; k++) {
      maxDiff = Math.max(maxDiff, Math.abs(copy.data[k] - img.data[k]));
    }
    record('Identity warp reproduces source', maxDiff === 0, `max channel diff ${maxDiff}`);

    const found = detect(img, {}).candidates[0];
    const cornerError = corners => Math.max(
      ...corners.map((point, i) => Vec2.distance(point, card[i])),
    );
    const detectError = found ? cornerError(found.corners) : Infinity;
    record('Detects a synthetic card within 2 px', detectError < 2, found
      ? `max corner error ${detectError.toFixed(2)} px, confidence ${found.confidence.toFixed(2)}`
      : 'no candidate');

    const roi = Object.assign({ originX: 0, originY: 0, scale: 1 }, img);
    const refined = refineQuad(roi, found ? found.corners : card, { searchPx: 4 });
    const refineError = cornerError(refined.corners);
    record('Refinement lands within 0.5 px', refineError < 0.5,
      `max corner error ${refineError.toFixed(3)} px`);

    // A dark card on a dark background (red 54 on 30): too faint for the usual Canny
    // thresholds, found by the second, more sensitive pass.
    const faint = syntheticCardImage(width, height, card, { background: 30, card: 54 });
    const firstPassOnly = detect(faint, { params: { retryConfidence: 0 } }).candidates[0];
    const withRetry = detect(faint, {});
    const faintFound = withRetry.candidates[0];
    const faintError = faintFound ? cornerError(faintFound.corners) : Infinity;
    record('A faint card is found by the second pass',
      !firstPassOnly && withRetry.timing.retried && faintError < 2,
      `first pass alone ${firstPassOnly ? 'found a candidate' : 'finds nothing'}; `
      + `second pass max corner error ${faintError.toFixed(2)} px`);
  }

  // 8. Levels: the white pick comes out neutral at whiteTarget, the black pick at blackTarget.
  function testLevelsTargets(record) {
    const levels = { white: [200, 180, 150], black: [40, 30, 20] };
    const lut = levelsLut(levels, {});
    const whiteOut = [0, 1, 2].map(channel => lut[channel][levels.white[channel]]);
    const blackOut = [0, 1, 2].map(channel => lut[channel][levels.black[channel]]);
    const isNear = target => value => Math.abs(value - target) <= 1;
    record('Levels: white pick → neutral 245, black pick → neutral 8',
      whiteOut.every(isNear(245)) && blackOut.every(isNear(8)),
      `white → ${whiteOut.join(',')}, black → ${blackOut.join(',')}`);
  }

  // 8b. A dropper patch that is 70% white label and 30% black text still reads the white.
  function testDropperTrim(record) {
    const patch = { width: 10, height: 10, data: new Uint8ClampedArray(400) };
    for (let i = 0; i < 100; i++) {
      const value = i % 10 < 3 ? 20 : 232;
      patch.data.set([value, value - 6, value - 14, 255], i * 4);
    }
    const color = meanColor(patch, 0.25);
    const plainMean = meanColor(patch).map(Math.round).join(',');
    record('Dropper ignores text inside a white patch',
      color && Math.abs(color[0] - 232) < 1 && Math.abs(color[2] - 218) < 1,
      color ? `read ${color.join(',')} (plain mean ${plainMean})` : 'none');
  }

  // 9. Auto levels finds a warm white patch covering 5% of the image.
  function testAutoLevels(record) {
    const img = { width: 100, height: 100, data: new Uint8ClampedArray(40000) };
    for (let i = 0; i < 10000; i++) {
      const offset = i * 4;
      const shade = i < 500 ? 1 : (i % 97) / 120 + 0.1;
      img.data[offset] = 230 * shade;
      img.data[offset + 1] = 215 * shade;
      img.data[offset + 2] = 190 * shade;
      img.data[offset + 3] = 255;
    }
    const found = autoLevels(img, {});
    const expected = [230, 215, 190];
    record('Auto levels finds the white patch',
      found && found.white.every((value, channel) => Math.abs(value - expected[channel]) < 1),
      found ? `white ${found.white.join(',')}` : 'none');
  }

  // A 100×100 test image: a 1% white patch, a mid-grey body, and a 1% dark patch whose first
  // blueCount pixels are a saturated dark blue and the rest a neutral dark grey.
  function darkPatchImage(blueCount) {
    const img = { width: 100, height: 100, data: new Uint8ClampedArray(40000) };
    const colors = {
      white: [240, 240, 240],
      grey: [128, 128, 128],
      blue: [10, 10, 90],
      darkGrey: [20, 20, 20],
    };
    for (let i = 0; i < 10000; i++) {
      let color = colors.grey;
      if (i < 100) color = colors.white;
      else if (i >= 9900) color = i - 9900 < blueCount ? colors.blue : colors.darkGrey;
      img.data.set(color, i * 4);
      img.data[i * 4 + 3] = 255;
    }
    return img;
  }

  // 9b. Auto's black point leaves out colored darks (a blue slab label would turn the image
  // yellow), and there's no black point when the darks are all colored.
  function testAutoLevelsColoredDarks(record) {
    const mixed = autoLevels(darkPatchImage(40), {});
    const isNeutral = mixed && mixed.black
      && mixed.black.every(value => Math.abs(value - 20) < 1);
    record('Auto black ignores colored darks', isNeutral,
      mixed && mixed.black ? `black ${mixed.black.join(',')}` : 'no black');
    const allBlue = autoLevels(darkPatchImage(100), {});
    record('Auto sets no black from colored darks only', allBlue && !allBlue.black,
      allBlue && allBlue.black ? `black ${allBlue.black.join(',')}` : 'no black');
  }

  // 10. Overlay placement scales with the frame (resolution-independent) and stays fully inside.
  function testOverlayPlacement(record) {
    const overlay = { cx: 0.7, cy: 0.2, w: 0.3, aspect: 2, opacity: 1 };
    const small = overlayRect(overlay, 1000, 800);
    const large = overlayRect(overlay, 2500, 2000);
    const scalesUp = key => Math.abs(large[key] - small[key] * 2.5) < 1e-9;
    const scales = ['x', 'y', 'width', 'height'].every(scalesUp);
    const oversized = { cx: 0.95, cy: 0.02, w: 1.6, aspect: 0.5, opacity: 1 };
    const clamped = overlayRect(clampOverlay(oversized, 1000, 800), 1000, 800);
    const isInside = clamped.x >= -1e-9
      && clamped.y >= -1e-9
      && clamped.x + clamped.width <= 1000 + 1e-9
      && clamped.y + clamped.height <= 800 + 1e-9
      && Math.abs(clamped.width / clamped.height - 0.5) < 1e-9;
    const clampedSize = `${clamped.width.toFixed(0)}×${clamped.height.toFixed(0)}`;
    const clampedAt = `${clamped.x.toFixed(0)},${clamped.y.toFixed(0)}`;
    record('Overlay placement scales with the frame and stays inside it', scales && isInside,
      `same relative rect at 2.5×: ${scales}; `
        + `oversized logo clamped to ${clampedSize} at ${clampedAt}`);
  }

  // 11. Snap presets sit at the margin (3% of the frame width).
  function testOverlaySnap(record) {
    const overlay = { cx: 0.7, cy: 0.2, w: 0.3, aspect: 2, opacity: 1 };
    const snapped = where => overlayRect(snapOverlay(overlay, where, 1000, 800), 1000, 800);
    const bottomRight = snapped('br');
    const center = snapped('c');
    const bottom = snapped('b');
    const left = snapped('l');
    const isNear = (value, target) => Math.abs(value - target) < 1e-6;
    const bottomRightGapX = 1000 - bottomRight.x - bottomRight.width;
    const bottomRightGapY = 800 - bottomRight.y - bottomRight.height;
    const bottomGap = 800 - bottom.y - bottom.height;
    const sides = isNear(bottom.x + bottom.width / 2, 500)
      && isNear(bottomGap, 30)
      && isNear(left.x, 30)
      && isNear(left.y + left.height / 2, 400);
    const pass = sides
      && isNear(bottomRightGapX, 30)
      && isNear(bottomRightGapY, 30)
      && isNear(center.x + center.width / 2, 500);
    record('Overlay snap presets keep a margin', pass,
      `bottom-right gap ${bottomRightGapX.toFixed(1)}, ${bottomRightGapY.toFixed(1)} px; `
      + `bottom-middle gap ${bottomGap.toFixed(1)} px, centered: ${sides}`);
  }

  // 12. URL overrides: only existing number and on/off settings; never text, lists or prototype
  // keys. 12b: limited settings accept values inside their range only.
  function testConfigOverrides(record) {
    const config = { a: 1, b: true, s: 'x', list: [{ label: 'L' }], o: { n: 2, url: 'u' } };
    const result = applyConfigOverrides(config, [
      ['a', '5'],
      ['b', '0'],
      ['o.n', '3'],
      ['s', '<b>'],
      ['list.0.label', '<img>'],
      ['o.url', 'https://x'],
      ['__proto__.toString', '1'],
      ['constructor.name', '1'],
      ['a', 'NaN'],
      ['b', 'yes'],
      ['nope', '1'],
    ]);
    const ok = config.a === 5
      && config.b === false
      && config.o.n === 3
      && config.s === 'x'
      && config.list[0].label === 'L'
      && config.o.url === 'u'
      && typeof Object.prototype.toString === 'function'
      && result.applied.length === 3
      && result.rejected.length === 8;
    record('URL overrides accept only number and on/off settings', ok,
      `applied ${result.applied.join(', ')}; rejected ${result.rejected.length}`);

    const limited = { cap: 100, o: { n: 10 }, free: 1 };
    const limits = { cap: [10, 100], 'o.n': [1, 50] };
    const limitedResult = applyConfigOverrides(limited, [
      ['cap', '40'], ['o.n', '50'], ['cap', '1e9'], ['cap', '0'], ['o.n', '51'], ['free', '1e9'],
    ], limits);
    const limitedOk = limited.cap === 40
      && limited.o.n === 50
      && limited.free === 1e9
      && limitedResult.applied.length === 3
      && limitedResult.rejected.join() === 'cap,cap,o.n';
    record('URL overrides stay inside safe ranges', limitedOk,
      `applied ${limitedResult.applied.join(', ')}; rejected ${limitedResult.rejected.join(', ')}`);
  }

  // 13. Edits files and sessions: a valid state passes unchanged; malformed fields fall back;
  // unknown fields are dropped.
  function testSanitizeState(record) {
    const clone = value => JSON.parse(JSON.stringify(value));
    const base = {
      version: 2,
      source: { name: 'a.jpg', width: 100, height: 80 },
      corners: [[0, 0], [100, 0], [100, 80], [0, 80]],
      strength: 1,
      aspect: { ratio: 0.71, orientation: 'auto' },
      squareUpHeight: 'preserveEdges',
      rotation: { quarter: 0, fine: 0, fillFrame: false },
      flip: { h: false, v: false },
      crop: { mode: 'fit', preset: '1:1', ratio: 1, swapped: false, orient: null, rect: null },
      levels: null,
      overlay: null,
      export: {
        format: 'jpeg',
        quality: 0.92,
        longEdge: 2000,
        interp: 'bilinear',
        fill: '#ffffff',
      },
    };
    const options = { presetIds: ['free', '1:1', 'original'], maxPx: 12000 };
    const good = Object.assign(clone(base), {
      strength: 0.4,
      rotation: { quarter: 3, fine: -2.5, fillFrame: true },
      levels: {
        white: [237.9, 241.5, 231.8],
        black: [46.9, 33.6, 61.7],
        whiteAt: [120, 88],
        blackAt: null,
      },
      overlay: { id: 'abc-12', aspect: 2, cx: 0.5, cy: 0.9, w: 0.25, opacity: 0.6 },
      crop: {
        mode: 'manual',
        preset: 'free',
        ratio: null,
        swapped: false,
        orient: 'portrait',
        rect: { cx: 0, cy: 0, w: 0.5, h: 0.6 },
      },
    });
    const goodResult = sanitizeState(good, base, options);
    const bad = Object.assign(clone(good), {
      extra: '<x>',
      export: Object.assign({}, good.export, { format: '<img src=x onerror=alert(1)>' }),
      crop: Object.assign({}, good.crop, { preset: '"]x' }),
      levels: { white: [300, 0, 0], black: null },
      overlay: 'nope',
      corners: [[0, 0], [1, 1]],
    });
    const badResult = sanitizeState(bad, base, options);
    const overlayWithExtra = Object.assign({ evil: '<x>' }, good.overlay);
    const withExtraKey = Object.assign(clone(good), { overlay: overlayWithExtra });
    const nested = sanitizeState(withExtraKey, base, options);
    const isGoodUnchanged = JSON.stringify(goodResult.state) === JSON.stringify(good);
    const ok = isGoodUnchanged
      && !goodResult.invalid.length
      && badResult.state.export.format === 'jpeg'
      && badResult.state.crop.preset === '1:1'
      && badResult.state.levels === null
      && badResult.state.overlay === null
      && !('extra' in badResult.state)
      && badResult.state.strength === 0.4
      && badResult.invalid.sort().join() === 'corners,crop,export,levels,overlay'
      && !nested.invalid.length
      && !('evil' in nested.state.overlay)
      && nested.state.overlay.opacity === 0.6;
    record('Edits files are checked field by field', ok,
      `valid state unchanged: ${isGoodUnchanged}; reset: ${badResult.invalid.join(', ')}`);
  }

  function selfTest() {
    const results = [];
    const record = (name, pass, detail) => results.push({ name, pass: !!pass, detail });
    const quads = randomTestQuads();
    testHomography(record, quads);
    testFlattenZero(record, quads);
    testFlattenFull(record, quads);
    testCorrectedAspect(record);
    testDegenerateQuads(record);
    testPipeline(record, quads[0]);
    testWarpAndDetection(record);
    testLevelsTargets(record);
    testDropperTrim(record);
    testAutoLevels(record);
    testAutoLevelsColoredDarks(record);
    testOverlayPlacement(record);
    testOverlaySnap(record);
    testConfigOverrides(record);
    testSanitizeState(record);
    return { passed: results.every(result => result.pass), results };
  }

  globalScope.CardEngine = {
    version: 1,
    Mat3,
    Vec2,
    Quad,
    solveLinear,
    solveHomography,
    perspectiveTargets,
    rectAspect,
    focalModel,
    lineThrough,
    intersectLines,
    toGray,
    gaussianBlur,
    sobel,
    DETECT_DEFAULTS,
    analyze,
    detect,
    scoreQuads,
    refineQuad,
    GEOMETRY_DEFAULTS,
    computeGeometry,
    fitCrop,
    shrinkToValid,
    cropRatio,
    warp,
    OVERLAY_DEFAULTS,
    overlayRect,
    clampOverlay,
    snapOverlay,
    applyConfigOverrides,
    sanitizeState,
    LEVELS_DEFAULTS,
    levelsLut,
    applyLut,
    meanColor,
    autoLevels,
    selfTest,
  };
}
CardEngineModule(typeof globalThis !== 'undefined' ? globalThis : self);
