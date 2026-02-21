import { clearAccessToken, getAccessToken } from "@/utils/apiClient";

type DirectoryHandle = FileSystemDirectoryHandle;

let sessionVaultHandle: DirectoryHandle | null = null;

function createBackendHandle(): DirectoryHandle {
  return {
    name: "SmartFood Backend",
    kind: "directory"
  } as unknown as DirectoryHandle;
}

export function setSessionVaultDirectoryHandle(handle: DirectoryHandle | null): void {
  sessionVaultHandle = handle;
}

export async function saveVaultDirectoryHandle(handle: DirectoryHandle): Promise<void> {
  sessionVaultHandle = handle;
}

export async function loadVaultDirectoryHandle(): Promise<DirectoryHandle | null> {
  if (sessionVaultHandle) {
    return sessionVaultHandle;
  }

  const token = getAccessToken();
  if (!token) {
    return null;
  }

  sessionVaultHandle = createBackendHandle();
  return sessionVaultHandle;
}

export async function clearVaultDirectoryHandle(): Promise<void> {
  sessionVaultHandle = null;
  clearAccessToken();
}

export function createSessionBackendHandle(): DirectoryHandle {
  const handle = createBackendHandle();
  setSessionVaultDirectoryHandle(handle);
  return handle;
}
