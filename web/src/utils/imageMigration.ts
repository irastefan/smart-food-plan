/**
 * Migration utilities for converting base64 images to file-based storage
 */

import { saveImageToVault } from './vaultImages';
import { loadRecipeDetail, updateRecipe } from './vaultRecipes';

/**
 * Convert base64 data URL to File object
 */
function dataURLtoFile(dataURL: string, filename: string): File {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Migrate a single recipe's base64 image to file storage
 */
export async function migrateRecipeImage(
  vaultHandle: FileSystemDirectoryHandle,
  recipeFileName: string
): Promise<boolean> {
  try {
    const recipe = await loadRecipeDetail(vaultHandle, recipeFileName);
    
    // Check if recipe has base64 image
    if (!recipe.photoUrl || !recipe.photoUrl.startsWith('data:image/')) {
      return false; // No base64 image to migrate
    }
    
    // Convert base64 to file
    const recipeSlug = recipe.slug || recipe.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${recipeSlug}-migrated.jpg`;
    const file = dataURLtoFile(recipe.photoUrl, filename);
    
    // Save to vault
    const newPhotoUrl = await saveImageToVault(vaultHandle, file, recipeSlug);
    
    // Update recipe
    await updateRecipe(vaultHandle, recipeFileName, {
      ...recipe,
      photoUrl: newPhotoUrl
    });
    
    console.log(`Migrated image for recipe: ${recipe.title}`);
    return true;
  } catch (error) {
    console.error(`Failed to migrate image for recipe ${recipeFileName}:`, error);
    return false;
  }
}

/**
 * Migrate all recipes with base64 images in the vault
 */
export async function migrateAllRecipeImages(
  vaultHandle: FileSystemDirectoryHandle
): Promise<{ migrated: number; total: number }> {
  try {
    const recipesDir = await vaultHandle.getDirectoryHandle('recipes');
    let total = 0;
    let migrated = 0;
    
    for await (const [filename, handle] of recipesDir.entries()) {
      if (handle.kind === 'file' && filename.endsWith('.md')) {
        total++;
        const success = await migrateRecipeImage(vaultHandle, filename);
        if (success) {
          migrated++;
        }
      }
    }
    
    return { migrated, total };
  } catch (error) {
    console.error('Failed to migrate recipe images:', error);
    return { migrated: 0, total: 0 };
  }
}