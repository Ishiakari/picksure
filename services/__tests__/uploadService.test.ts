import {
  MAX_UPLOAD_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  validateUploadFileSize,
  isAllowedExtension,
  createTemplateRecord,
} from '../uploadService';
import { supabase } from '@/lib/supabase';

describe('uploadService', () => {
  describe('File Size Validation', () => {
    it('accepts files strictly under the 15MB limit', () => {
      expect(validateUploadFileSize(1024)).toBe(true); // 1KB
      expect(validateUploadFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
      expect(validateUploadFileSize(14.9 * 1024 * 1024)).toBe(true); // 14.9MB
    });

    it('accepts files exactly at the 15MB limit boundary', () => {
      expect(validateUploadFileSize(MAX_UPLOAD_SIZE_BYTES)).toBe(true);
    });

    it('rejects files 1 byte over the 15MB limit boundary', () => {
      expect(validateUploadFileSize(MAX_UPLOAD_SIZE_BYTES + 1)).toBe(false);
    });

    it('rejects files significantly exceeding the limit', () => {
      expect(validateUploadFileSize(25 * 1024 * 1024)).toBe(false); // 25MB
    });

    it('rejects zero or negative byte sizes', () => {
      expect(validateUploadFileSize(0)).toBe(false);
      expect(validateUploadFileSize(-1)).toBe(false);
    });
  });

  describe('File Extension Allowlist', () => {
    test.each(ALLOWED_EXTENSIONS)(
      'accepts allowed extension: .%s',
      (ext) => {
        expect(isAllowedExtension(`photo.${ext}`)).toBe(true);
        expect(isAllowedExtension(`https://example.com/asset.${ext.toUpperCase()}`)).toBe(true);
        expect(isAllowedExtension(`/local/path/image.${ext}?v=123`)).toBe(true);
      }
    );

    it('rejects disallowed file extensions', () => {
      expect(isAllowedExtension('document.pdf')).toBe(false);
      expect(isAllowedExtension('video.mp4')).toBe(false);
      expect(isAllowedExtension('script.js')).toBe(false);
      expect(isAllowedExtension('archive.zip')).toBe(false);
      expect(isAllowedExtension('vector.svg')).toBe(false);
      expect(isAllowedExtension('image.bmp')).toBe(false);
      expect(isAllowedExtension('')).toBe(false);
    });
  });

  describe('Database Insert Foreign-Key Fallback Branch', () => {
    const mockInput = {
      title: 'Neon Tokyo Street',
      category: 'OOTD & Streetwear' as const,
      description: 'Night photography guide',
      tips: ['Use ISO 800', 'Stabilize with rail'],
      imageUrl: 'https://mock.supabase.co/image.jpg',
      creatorId: 'deleted-or-unregistered-user-id',
      difficulty: 'Intermediate' as const,
      ratio: '3:4 RATIO',
    };

    it('falls back to creator_id: null when first insert encounters foreign key constraint error', async () => {
      const mockInsert = jest.fn();

      // First insert attempt fails with foreign key violation
      mockInsert.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({
          data: null,
          error: {
            message: 'insert or update on table "templates" violates foreign key constraint "templates_creator_id_fkey"',
            code: '23503',
          },
        }),
      });

      // Second insert attempt (fallback with creator_id: null) succeeds
      const fallbackCreatedRow = {
        id: 'tmpl-fallback-789',
        title: 'Neon Tokyo Street',
        category: 'Street',
        description: 'Night photography guide',
        image_url: 'https://mock.supabase.co/image.jpg',
        creator_id: null,
        difficulty: 'Intermediate',
        time_setup: '2 min',
        ratio: '3:4 RATIO',
        tips: ['Use ISO 800', 'Stabilize with rail'],
        created_at: new Date().toISOString(),
        used_count: 0,
        saved_count: 0,
      };

      mockInsert.mockReturnValueOnce({
        select: jest.fn().mockResolvedValueOnce({
          data: [fallbackCreatedRow],
          error: null,
        }),
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await createTemplateRecord(mockInput);

      // Verify the fallback call was made with creator_id: null
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(mockInsert.mock.calls[1][0][0]).toMatchObject({
        title: 'Neon Tokyo Street',
        creator_id: null,
      });

      expect(result).toEqual(fallbackCreatedRow);
      expect(result.creator_id).toBeNull();
    });

    it('throws error when database returns a non-foreign-key error', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValueOnce({
          data: null,
          error: {
            message: 'relation "templates" does not exist',
            code: '42P01',
          },
        }),
      });

      jest.spyOn(supabase, 'from').mockReturnValue({
        insert: mockInsert,
      } as any);

      await expect(createTemplateRecord(mockInput)).rejects.toThrow(
        'Database insert failed: relation "templates" does not exist'
      );
    });
  });
});
