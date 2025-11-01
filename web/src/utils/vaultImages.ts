/**
 * Utilities for managing recipe images in the Vault
 */

const IMAGES_DIRECTORY_NAME = "images";

/**
 * Ensure the images directory exists in the vault
 */
export async function ensureImagesDirectory(vaultHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
  try {
    return await vaultHandle.getDirectoryHandle(IMAGES_DIRECTORY_NAME);
  } catch (error) {
    // Directory doesn't exist, create it
    return await vaultHandle.getDirectoryHandle(IMAGES_DIRECTORY_NAME, { create: true });
  }
}

/**
 * Save an image file to the vault and return the relative path
 */
export async function saveImageToVault(
  vaultHandle: FileSystemDirectoryHandle,
  file: File,
  recipeSlug: string
): Promise<string> {
  const imagesDir = await ensureImagesDirectory(vaultHandle);
  
  // Generate unique filename with recipe slug and timestamp
  const timestamp = Date.now();
  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${recipeSlug}-${timestamp}.${extension}`;
  
  // Create file handle
  const fileHandle = await imagesDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  
  // Write the file
  await writable.write(file);
  await writable.close();
  
  // Return relative path
  return `${IMAGES_DIRECTORY_NAME}/${filename}`;
}

/**
 * Get image URL from vault path
 */
export async function getImageFromVault(
  vaultHandle: FileSystemDirectoryHandle,
  imagePath: string
): Promise<string | null> {
  try {
    // Parse path (e.g., "images/recipe-slug-123456.jpg")
    const pathParts = imagePath.split('/');
    if (pathParts.length !== 2 || pathParts[0] !== IMAGES_DIRECTORY_NAME) {
      return null;
    }
    
    const filename = pathParts[1];
    const imagesDir = await vaultHandle.getDirectoryHandle(IMAGES_DIRECTORY_NAME);
    const fileHandle = await imagesDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    
    // Convert to blob URL
    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Failed to load image from vault:', error);
    return null;
  }
}

/**
 * Delete an image from the vault
 */
export async function deleteImageFromVault(
  vaultHandle: FileSystemDirectoryHandle,
  imagePath: string
): Promise<void> {
  try {
    const pathParts = imagePath.split('/');
    if (pathParts.length !== 2 || pathParts[0] !== IMAGES_DIRECTORY_NAME) {
      return;
    }
    
    const filename = pathParts[1];
    const imagesDir = await vaultHandle.getDirectoryHandle(IMAGES_DIRECTORY_NAME);
    await imagesDir.removeEntry(filename);
  } catch (error) {
    console.error('Failed to delete image from vault:', error);
  }
}

/**
 * Clean up unused images (images not referenced by any recipe)
 */
export async function cleanupUnusedImages(
  vaultHandle: FileSystemDirectoryHandle,
  usedImagePaths: string[]
): Promise<void> {
  try {
    const imagesDir = await vaultHandle.getDirectoryHandle(IMAGES_DIRECTORY_NAME);
    const usedFilenames = new Set(
      usedImagePaths
        .filter(path => path.startsWith(IMAGES_DIRECTORY_NAME + '/'))
        .map(path => path.split('/')[1])
    );
    
    for await (const [filename, handle] of imagesDir.entries()) {
      if (handle?.kind === 'file' && !usedFilenames.has(filename)) {
        await imagesDir.removeEntry(filename);
        console.log(`Cleaned up unused image: ${filename}`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup unused images:', error);
  }
}