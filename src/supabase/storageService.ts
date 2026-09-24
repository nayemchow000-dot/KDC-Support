import { supabase, isSupabaseConfigured } from './config';

const BUCKET_NAME = 'support-attachments';

/**
 * Uploads a customer or support attachment to Supabase Storage
 */
export async function uploadSupportAttachment(
  file: File | Blob,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    // Return blob URL if Supabase not configured in preview
    return { url: URL.createObjectURL(file), error: null };
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      return { url: null, error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err?.message || 'Storage upload failed' };
  }
}
