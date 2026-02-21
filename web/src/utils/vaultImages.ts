export async function ensureImagesDirectory(
  vaultHandle: FileSystemDirectoryHandle
): Promise<FileSystemDirectoryHandle> {
  return vaultHandle;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read image"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export async function saveImageToVault(
  _vaultHandle: FileSystemDirectoryHandle,
  file: File,
  _recipeSlug: string
): Promise<string> {
  return readFileAsDataUrl(file);
}

export async function getImageFromVault(
  _vaultHandle: FileSystemDirectoryHandle,
  imagePath: string
): Promise<string | null> {
  return imagePath || null;
}

export async function deleteImageFromVault(
  _vaultHandle: FileSystemDirectoryHandle,
  _imagePath: string
): Promise<void> {
  return;
}

export async function cleanupUnusedImages(
  _vaultHandle: FileSystemDirectoryHandle,
  _usedImagePaths: string[]
): Promise<void> {
  return;
}
