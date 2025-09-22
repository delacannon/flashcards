import { supabase } from '../lib/supabase';

const BACKGROUND_IMAGES_BUCKET = 'background-images';
const AVATARS_BUCKET = 'avatars';

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export class StorageService {
  static async uploadBackgroundImage(
    file: File,
    userId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(BACKGROUND_IMAGES_BUCKET)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(BACKGROUND_IMAGES_BUCKET)
        .getPublicUrl(fileName);

      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading background image:', error);
      return { url: null, error: error as Error };
    }
  }

  static async uploadAvatar(
    file: File,
    userId: string
  ): Promise<UploadResult> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(fileName);

      return { url: data.publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { url: null, error: error as Error };
    }
  }

  static async deleteBackgroundImage(url: string): Promise<{ error: Error | null }> {
    try {
      const path = url.split('/').slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from(BACKGROUND_IMAGES_BUCKET)
        .remove([path]);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error deleting background image:', error);
      return { error: error as Error };
    }
  }

  static async listUserBackgroundImages(userId: string): Promise<{
    data: string[] | null;
    error: Error | null;
  }> {
    try {
      const { data, error } = await supabase.storage
        .from(BACKGROUND_IMAGES_BUCKET)
        .list(userId);

      if (error) throw error;

      const urls = data?.map((file) => {
        const { data } = supabase.storage
          .from(BACKGROUND_IMAGES_BUCKET)
          .getPublicUrl(`${userId}/${file.name}`);
        return data.publicUrl;
      }) || [];

      return { data: urls, error: null };
    } catch (error) {
      console.error('Error listing background images:', error);
      return { data: null, error: error as Error };
    }
  }
}