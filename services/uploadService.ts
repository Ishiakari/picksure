import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { CategoryType } from '@/src/constants/categories';

export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

export function validateUploadFileSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= MAX_UPLOAD_SIZE_BYTES;
}

export function isAllowedExtension(filePathOrUri: string): boolean {
  if (!filePathOrUri) return false;
  const rawExt = (filePathOrUri.split('.').pop() || '').toLowerCase().split('?')[0];
  return ALLOWED_EXTENSIONS.includes(rawExt);
}

export async function getBlobFromUri(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new TypeError('Local file read request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uploadTemplateImage(
  selectedImageUri: string,
  userId: string | null = null
): Promise<string> {
  const blob = await getBlobFromUri(selectedImageUri);

  if (!validateUploadFileSize(blob.size)) {
    throw new Error('Selected photo exceeds the 15MB upload limit. Please select a smaller photo.');
  }

  const rawExt = (selectedImageUri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const fileExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : 'jpg';

  const arrayBuffer = await new Response(blob).arrayBuffer();
  const folderId = userId || 'guest';
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `templates/${folderId}/${fileName}`;

  const contentType =
    fileExt === 'png' ? 'image/png' : fileExt === 'webp' ? 'image/webp' : 'image/jpeg';

  const { data: storageData, error: storageError } = await supabase.storage
    .from('template-overlays')
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: true,
    });

  if (storageError) {
    throw new Error(`Storage upload failed: ${storageError.message}`);
  }

  if (!storageData?.path) {
    throw new Error('Storage did not return an upload path.');
  }

  const { publicUrl } = supabase.storage
    .from('template-overlays')
    .getPublicUrl(storageData.path).data;

  if (!publicUrl) {
    throw new Error('Failed to obtain public URL for uploaded photo.');
  }

  return publicUrl;
}

export interface CreateTemplateInput {
  title: string;
  category: CategoryType;
  description?: string;
  tips: string[];
  imageUrl: string;
  creatorId: string | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeSetup?: string;
  ratio: string;
}

export async function createTemplateRecord(
  input: CreateTemplateInput
): Promise<Database['public']['Tables']['templates']['Row']> {
  const insertPayload = {
    title: input.title.trim(),
    category: input.category,
    description: input.description?.trim() || 'Custom community composition guide.',
    tips: input.tips,
    image_url: input.imageUrl,
    creator_id: input.creatorId || null,
    difficulty: input.difficulty,
    time_setup: input.timeSetup || '2 min',
    ratio: input.ratio,
  };

  const insertResult = await supabase.from('templates').insert([insertPayload]).select();
  let dbError = insertResult.error;
  let insertedRow = insertResult.data?.[0] || null;

  // Fallback for foreign key constraints (e.g. auth user not in custom profiles)
  if (
    dbError &&
    (dbError.message.includes('violates foreign key constraint') || dbError.code === '23503')
  ) {
    const fallbackResult = await supabase
      .from('templates')
      .insert([
        {
          ...insertPayload,
          creator_id: null,
        },
      ])
      .select();

    if (fallbackResult.error) {
      throw new Error(`Database insert failed: ${fallbackResult.error.message}`);
    }
    insertedRow = fallbackResult.data?.[0] || null;
  } else if (dbError) {
    throw new Error(`Database insert failed: ${dbError.message}`);
  }

  if (!insertedRow) {
    throw new Error('Database insert did not return created row.');
  }

  return insertedRow;
}
