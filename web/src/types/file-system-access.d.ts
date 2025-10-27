declare global {
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemPermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemHandle {
    queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
    requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  }

  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export {};
