import { supabase } from './supabase';

/**
 * Uploads a file to a specified Supabase bucket
 * @param {string} bucket - Bucket name ('Avatar' or 'Resume-CV')
 * @param {string} path - File path within bucket
 * @param {File} file - File object from input
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) throw error;
  return data;
}

/**
 * Gets a public URL for a file in a public bucket
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Generates a temporary signed URL for a file in a private bucket
 * @param {string} bucket - Bucket name
 * @param {string} path - File path
 * @param {number} expiry - Expiry in seconds (default 60)
 */
export async function getSignedUrl(bucket, path, expiry = 60) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiry);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Deletes a file from it's bucket
 */
export async function deleteFile(bucket, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);
    
  if (error) throw error;
}
