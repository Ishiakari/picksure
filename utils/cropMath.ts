export type CameraRatio = '4:3' | '1:1' | '16:9' | 'Full';

export interface CropRectangle {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Calculates the bounding crop rectangle for a photo of dimensions (photoW, photoH)
 * to match the framing of the active CameraRatio.
 *
 * Guarantees that returned crop coordinates and dimensions strictly reside within
 * [0, 0, photoW, photoH] without overflowing or producing negative/NaN coordinates.
 */
export function calculateCropRectangle(
  photoW: number,
  photoH: number,
  ratio: CameraRatio
): CropRectangle {
  if (
    ratio === 'Full' ||
    !photoW ||
    !photoH ||
    photoW <= 0 ||
    photoH <= 0 ||
    Number.isNaN(photoW) ||
    Number.isNaN(photoH)
  ) {
    const safeW = Math.max(0, photoW || 0);
    const safeH = Math.max(0, photoH || 0);
    return { originX: 0, originY: 0, width: safeW, height: safeH };
  }

  const isPortrait = photoH >= photoW;

  let targetRatio = 3 / 4; // default portrait 3:4 width/height
  if (ratio === '1:1') {
    targetRatio = 1;
  } else if (ratio === '4:3') {
    targetRatio = 3 / 4;
  } else if (ratio === '16:9') {
    targetRatio = 9 / 16;
  }

  let cropWidth = photoW;
  let cropHeight = photoH;

  if (isPortrait) {
    const currentRatio = photoW / photoH;
    if (Math.abs(currentRatio - targetRatio) < 0.001) {
      // Source image already matches target ratio
      return { originX: 0, originY: 0, width: photoW, height: photoH };
    }

    if (currentRatio > targetRatio) {
      // Image is wider than target ratio: crop left and right sides
      cropWidth = Math.round(photoH * targetRatio);
      cropHeight = photoH;
    } else {
      // Image is taller than target ratio: crop top and bottom
      cropWidth = photoW;
      cropHeight = Math.round(photoW / targetRatio);
    }
  } else {
    // Landscape photo handling
    const landTargetRatio = 1 / targetRatio;
    const currentRatio = photoW / photoH;

    if (Math.abs(currentRatio - landTargetRatio) < 0.001) {
      // Source image already matches landscape target ratio
      return { originX: 0, originY: 0, width: photoW, height: photoH };
    }

    if (currentRatio > landTargetRatio) {
      // Image is wider than landscape ratio: crop sides
      cropWidth = Math.round(photoH * landTargetRatio);
      cropHeight = photoH;
    } else {
      // Image is taller than landscape ratio: crop top and bottom
      cropWidth = photoW;
      cropHeight = Math.round(photoW / landTargetRatio);
    }
  }

  const originX = Math.max(0, Math.round((photoW - cropWidth) / 2));
  const originY = Math.max(0, Math.round((photoH - cropHeight) / 2));

  // Enforce boundary constraints so crop rect strictly fits within source bounds
  const clampedWidth = Math.min(cropWidth, photoW - originX);
  const clampedHeight = Math.min(cropHeight, photoH - originY);

  return {
    originX,
    originY,
    width: clampedWidth,
    height: clampedHeight,
  };
}
