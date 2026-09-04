export type TemplateAspectRatio = '3:4 RATIO' | '4:5 RATIO' | '1:1 RATIO' | '9:16 RATIO';

interface RatioCandidate {
  ratio: TemplateAspectRatio;
  value: number;
}

const RATIO_CANDIDATES: RatioCandidate[] = [
  { ratio: '1:1 RATIO', value: 1.0 },
  { ratio: '4:5 RATIO', value: 0.8 }, // 4/5 = 0.8
  { ratio: '3:4 RATIO', value: 0.75 }, // 3/4 = 0.75
  { ratio: '9:16 RATIO', value: 9 / 16 }, // 0.5625
];

/**
 * Classifies an image with dimensions (width, height) to the closest supported aspect ratio.
 * Uses Euclidean nearest-neighbor distance against the portrait ratio values.
 */
export function detectBestRatio(w: number, h: number): TemplateAspectRatio {
  if (!w || !h || h <= 0 || w <= 0 || Number.isNaN(w) || Number.isNaN(h)) {
    return '3:4 RATIO';
  }

  const r = w / h;
  let best = RATIO_CANDIDATES[0];
  let minDiff = Math.abs(r - RATIO_CANDIDATES[0].value);

  for (let i = 1; i < RATIO_CANDIDATES.length; i++) {
    const diff = Math.abs(r - RATIO_CANDIDATES[i].value);
    if (diff < minDiff) {
      minDiff = diff;
      best = RATIO_CANDIDATES[i];
    }
  }

  return best.ratio;
}
