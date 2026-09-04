import { parseTips } from '../templateService';

describe('templateService - parseTips', () => {
  describe('Array Input (Native Array)', () => {
    it('passes through an already-parsed array of strings', () => {
      const input = [
        'Position camera at knee level',
        'Tilt up 15 degrees',
        'Align subject in center third',
      ];
      const result = parseTips(input, 'A great street photo');

      expect(result.tips).toEqual(input);
      expect(result.cleanDescription).toBe('A great street photo');
    });

    it('filters out empty or whitespace-only items in native arrays', () => {
      const input = ['Step 1', '   ', '', 'Step 2'];
      const result = parseTips(input, 'Desc');

      expect(result.tips).toEqual(['Step 1', 'Step 2']);
    });
  });

  describe('JSON-stringified Array Input', () => {
    it('parses valid JSON array string into tips array', () => {
      const jsonString = JSON.stringify([
        'Hold phone vertically',
        'Use soft window light',
      ]);
      const result = parseTips(jsonString, 'Studio portrait');

      expect(result.tips).toEqual([
        'Hold phone vertically',
        'Use soft window light',
      ]);
    });

    it('falls back gracefully to description on malformed JSON string starting with [', () => {
      const malformedJson = '[{"bad json", ';
      const result = parseTips(malformedJson, 'Fallback description text');

      expect(result.tips).toEqual(['Fallback description text']);
      expect(result.cleanDescription).toBe('Fallback description text');
    });

    it('falls back to empty array if both JSON is malformed and description is missing', () => {
      const malformedJson = '[unparseable';
      const result = parseTips(malformedJson, null);

      expect(result.tips).toEqual([]);
      expect(result.cleanDescription).toBe('');
    });
  });

  describe('Legacy Delimiter / Text Blobs', () => {
    it('parses newline-delimited bullet points', () => {
      const bulletText = '• Step one\n- Step two\n* Step three';
      const result = parseTips(bulletText, 'General overview');

      expect(result.tips).toEqual(['Step one', 'Step two', 'Step three']);
    });

    it('extracts tips and separates description from legacy DIRECTOR\'S GUIDE: marker', () => {
      const legacyDesc =
        "Relaxed coffee stance. DIRECTOR'S GUIDE:\n• Hold cup with both hands\n• Look toward window";
      const result = parseTips(null, legacyDesc);

      expect(result.cleanDescription).toBe('Relaxed coffee stance.');
      expect(result.tips).toEqual([
        'Hold cup with both hands',
        'Look toward window',
      ]);
    });
  });

  describe('Empty, Null, and Undefined Inputs', () => {
    it('handles null tips and null description safely with empty array fallback', () => {
      const result = parseTips(null, null);

      expect(result.tips).toEqual([]);
      expect(result.cleanDescription).toBe('');
    });

    it('handles undefined tips and empty description safely', () => {
      const result = parseTips(undefined, '');

      expect(result.tips).toEqual([]);
      expect(result.cleanDescription).toBe('');
    });

    it('uses description as single fallback tip if tips are null but description is provided', () => {
      const result = parseTips(null, 'Casual sunset walk along the beach');

      expect(result.tips).toEqual(['Casual sunset walk along the beach']);
      expect(result.cleanDescription).toBe('Casual sunset walk along the beach');
    });

    it('handles unexpected types (numbers, booleans, objects) without crashing', () => {
      expect(parseTips(12345, null).tips).toEqual([]);
      expect(parseTips(true, 'Test').tips).toEqual(['Test']);
      expect(parseTips({}, null).tips).toEqual([]);
    });
  });
});
