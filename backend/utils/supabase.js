const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder_key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file to a specific Supabase storage bucket
 * @param {string} bucket - The name of the bucket (e.g., 'avatars', 'workspace-assets')
 * @param {string} path - The destination path within the bucket
 * @param {Buffer|File|Blob} file - The file data
 * @param {string} contentType - The MIME type of the file
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
const uploadFile = async (bucket, path, file, contentType) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (error) {
    console.error('Supabase Upload Error:', error);
    return { url: null, error };
  }
};

/**
 * Generates a signed URL for secure file access (e.g., for private buckets)
 */
const getSignedUrl = async (bucket, path, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
      
    if (error) throw error;
    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error('Supabase Signed URL Error:', error);
    return { url: null, error };
  }
};

module.exports = {
  supabase,
  uploadFile,
  getSignedUrl
};
