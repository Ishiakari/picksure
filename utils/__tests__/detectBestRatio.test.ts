import { detectBestRatio } from '../detectBestRatio';

describe('detectBestRatio', () => {
  describe('Exact Matches', () => {
    it('returns "1:1 RATIO" for exact square dimensions', () => {
      expect(detectBestRatio(1000, 1000)).toBe('1:1 RATIO');
      expect(detectBestRatio(500, 500)).toBe('1:1 RATIO');
    });

    it('returns "4:5 RATIO" for exact 4:5 portrait dimensions', () => {
      expect(detectBestRatio(400, 500)).toBe('4:5 RATIO');
      expect(detectBestRatio(1080, 1350)).toBe('4:5 RATIO');
      expect(detectBestRatio(800, 1000)).toBe('4:5 RATIO');
    });

    it('returns "3:4 RATIO" for exact 3:4 portrait dimensions', () => {
      expect(detectBestRatio(300, 400)).toBe('3:4 RATIO');
      expect(detectBestRatio(1500, 2000)).toBe('3:4 RATIO');
    });

    it('returns "9:16 RATIO" for exact 9:16 portrait dimensions', () => {
      expect(detectBestRatio(900, 1600)).toBe('9:16 RATIO');
      expect(detectBestRatio(1080, 1920)).toBe('9:16 RATIO');
    });
  });

  describe('Near-boundary / Nearest-Neighbor Decisions', () => {
    it('selects 4:5 when ratio is closer to 0.8 than 1.0', () => {
      // ratio = 890 / 1000 = 0.89 (|0.89 - 0.80| = 0.09 < |0.89 - 1.00| = 0.11)
      expect(detectBestRatio(890, 1000)).toBe('4:5 RATIO');
    });

    it('selects 1:1 when ratio is closer to 1.0 than 0.8', () => {
      // ratio = 910 / 1000 = 0.91 (|0.91 - 1.00| = 0.09 < |0.91 - 0.80| = 0.11)
      expect(detectBestRatio(910, 1000)).toBe('1:1 RATIO');
    });

    it('selects 3:4 when ratio is closer to 0.75 than 0.80', () => {
      // ratio = 760 / 1000 = 0.76 (|0.76 - 0.75| = 0.01 < |0.76 - 0.80| = 0.04)
      expect(detectBestRatio(760, 1000)).toBe('3:4 RATIO');
    });

    it('selects 4:5 when ratio is closer to 0.80 than 0.75', () => {
      // ratio = 790 / 1000 = 0.79 (|0.79 - 0.80| = 0.01 < |0.79 - 0.75| = 0.04)
      expect(detectBestRatio(790, 1000)).toBe('4:5 RATIO');
    });

    it('selects 9:16 when ratio is closer to 0.5625 than 0.75', () => {
      // ratio = 600 / 1000 = 0.60 (|0.60 - 0.5625| = 0.0375 < |0.60 - 0.75| = 0.15)
      expect(detectBestRatio(600, 1000)).toBe('9:16 RATIO');
    });
  });

  describe('Extreme & Unusual Dimensions', () => {
    it('returns "1:1 RATIO" for very wide / landscape images', () => {
      expect(detectBestRatio(3000, 1000)).toBe('1:1 RATIO');
      expect(detectBestRatio(4000, 500)).toBe('1:1 RATIO');
    });

    it('returns "9:16 RATIO" for extremely tall / narrow images', () => {
      expect(detectBestRatio(100, 2000)).toBe('9:16 RATIO');
    });

    it('returns "1:1 RATIO" for near-square images', () => {
      expect(detectBestRatio(1001, 1000)).toBe('1:1 RATIO');
      expect(detectBestRatio(999, 1000)).toBe('1:1 RATIO');
    });
  });

  describe('Zero and Invalid Inputs', () => {
    it('returns safe default "3:4 RATIO" on zero dimensions', () => {
      expect(detectBestRatio(0, 1000)).toBe('3:4 RATIO');
      expect(detectBestRatio(1000, 0)).toBe('3:4 RATIO');
      expect(detectBestRatio(0, 0)).toBe('3:4 RATIO');
    });

    it('returns safe default "3:4 RATIO" on negative dimensions', () => {
      expect(detectBestRatio(-100, 500)).toBe('3:4 RATIO');
      expect(detectBestRatio(500, -100)).toBe('3:4 RATIO');
    });

    it('returns safe default "3:4 RATIO" on NaN inputs', () => {
      expect(detectBestRatio(NaN, 1000)).toBe('3:4 RATIO');
      expect(detectBestRatio(1000, NaN)).toBe('3:4 RATIO');
      expect(detectBestRatio(NaN, NaN)).toBe('3:4 RATIO');
    });
  });
});
