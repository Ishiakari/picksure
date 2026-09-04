import { calculateCropRectangle, CameraRatio } from '../cropMath';

describe('calculateCropRectangle', () => {
  describe('Matching Target Ratio (No-op / Full frame)', () => {
    it('returns full dimensions when portrait image matches 4:3 portrait ratio (3:4)', () => {
      // 3000x4000 = 3:4
      const result = calculateCropRectangle(3000, 4000, '4:3');
      expect(result).toEqual({ originX: 0, originY: 0, width: 3000, height: 4000 });
    });

    it('returns full dimensions when square image matches 1:1 ratio', () => {
      const result = calculateCropRectangle(1080, 1080, '1:1');
      expect(result).toEqual({ originX: 0, originY: 0, width: 1080, height: 1080 });
    });

    it('returns full dimensions when portrait image matches 16:9 portrait ratio (9:16)', () => {
      // 1080x1920 = 9:16
      const result = calculateCropRectangle(1080, 1920, '16:9');
      expect(result).toEqual({ originX: 0, originY: 0, width: 1080, height: 1920 });
    });

    it('returns full dimensions when ratio is "Full"', () => {
      const result = calculateCropRectangle(1200, 1800, 'Full');
      expect(result).toEqual({ originX: 0, originY: 0, width: 1200, height: 1800 });
    });
  });

  describe('Supported Ratios (4:3, 1:1, 16:9, Full)', () => {
    it('crops 16:9 portrait image to 1:1 square centered', () => {
      // 1080x1920 -> 1080x1080, originY = (1920 - 1080) / 2 = 420
      const result = calculateCropRectangle(1080, 1920, '1:1');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1080);
      expect(result.originX).toBe(0);
      expect(result.originY).toBe(420);
    });

    it('crops 16:9 portrait image to 4:3 (3:4) portrait', () => {
      // 1080x1920 has ratio 0.5625. 3:4 target is 0.75.
      // Image is taller than 3:4, so crop height = 1080 / 0.75 = 1440.
      // originY = (1920 - 1440) / 2 = 240.
      const result = calculateCropRectangle(1080, 1920, '4:3');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1440);
      expect(result.originX).toBe(0);
      expect(result.originY).toBe(240);
    });

    it('crops 4:3 portrait image to 16:9 (9:16) portrait', () => {
      // 3000x4000 has ratio 0.75. 9:16 target is 0.5625.
      // Image is wider than 9:16, so crop width = 4000 * (9/16) = 2250.
      // originX = (3000 - 2250) / 2 = 375.
      const result = calculateCropRectangle(3000, 4000, '16:9');
      expect(result.width).toBe(2250);
      expect(result.height).toBe(4000);
      expect(result.originX).toBe(375);
      expect(result.originY).toBe(0);
    });
  });

  describe('Orientation Conversions (Landscape & Portrait)', () => {
    it('crops landscape source (1920x1080) to landscape 4:3 (4/3 target)', () => {
      // 1920x1080: ratio 1.777. Target 4:3 is 1.333.
      // Wider than 4:3, crop width = 1080 * (4/3) = 1440.
      // originX = (1920 - 1440) / 2 = 240.
      const result = calculateCropRectangle(1920, 1080, '4:3');
      expect(result.width).toBe(1440);
      expect(result.height).toBe(1080);
      expect(result.originX).toBe(240);
      expect(result.originY).toBe(0);
    });

    it('crops landscape source (1920x1080) to 1:1 square', () => {
      // 1920x1080: crop width = 1080.
      // originX = (1920 - 1080) / 2 = 420.
      const result = calculateCropRectangle(1920, 1080, '1:1');
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1080);
      expect(result.originX).toBe(420);
      expect(result.originY).toBe(0);
    });

    it('crops portrait source (1000x2000) to 1:1', () => {
      const result = calculateCropRectangle(1000, 2000, '1:1');
      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
      expect(result.originX).toBe(0);
      expect(result.originY).toBe(500);
    });
  });

  describe('Boundary Guarantees & Edge Cases', () => {
    const testRatios: CameraRatio[] = ['4:3', '1:1', '16:9', 'Full'];
    const testDimensions = [
      { w: 1080, h: 1920 },
      { w: 1920, h: 1080 },
      { w: 3000, h: 4000 },
      { w: 4000, h: 3000 },
      { w: 1000, h: 1000 },
      { w: 300, h: 1500 },
      { w: 1500, h: 300 },
    ];

    test.each(testRatios)('never exceeds source image bounds for ratio %s', (ratio) => {
      for (const { w, h } of testDimensions) {
        const crop = calculateCropRectangle(w, h, ratio);

        expect(crop.originX).toBeGreaterThanOrEqual(0);
        expect(crop.originY).toBeGreaterThanOrEqual(0);
        expect(crop.originX + crop.width).toBeLessThanOrEqual(w);
        expect(crop.originY + crop.height).toBeLessThanOrEqual(h);
        expect(crop.width).toBeGreaterThan(0);
        expect(crop.height).toBeGreaterThan(0);
      }
    });

    it('handles zero or invalid dimensions gracefully', () => {
      expect(calculateCropRectangle(0, 1000, '4:3')).toEqual({ originX: 0, originY: 0, width: 0, height: 1000 });
      expect(calculateCropRectangle(1000, 0, '1:1')).toEqual({ originX: 0, originY: 0, width: 1000, height: 0 });
      expect(calculateCropRectangle(-100, -100, '16:9')).toEqual({ originX: 0, originY: 0, width: 0, height: 0 });
      expect(calculateCropRectangle(NaN, 1000, '4:3')).toEqual({ originX: 0, originY: 0, width: 0, height: 1000 });
    });
  });
});
