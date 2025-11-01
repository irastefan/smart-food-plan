declare global {
  type FileSystemPermissionMode = "read" | "readwrite";

  interface FileSystemPermissionDescriptor {
    mode?: FileSystemPermissionMode;
  }

  interface FileSystemHandle {
    kind: "file" | "directory";
    queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
    requestPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>;
  }

  type FileSystemWriteChunkType = string | BufferSource | Blob;

  interface FileSystemWritableFileStream {
    write: (data: FileSystemWriteChunkType) => Promise<void>;
    close: () => Promise<void>;
  }

  interface FileSystemFileHandle extends FileSystemHandle {
    name: string;
    getFile: () => Promise<File>;
    createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileSystemWritableFileStream>;
  }

  interface FileSystemDirectoryHandle extends FileSystemHandle {
    name: string;
    getDirectoryHandle: (
      name: string,
      options?: { create?: boolean }
    ) => Promise<FileSystemDirectoryHandle>;
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
    removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
    entries: () => AsyncIterableIterator<[string, FileSystemFileHandle | FileSystemDirectoryHandle]>;
    values: () => AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
    keys: () => AsyncIterableIterator<string>;
    [Symbol.asyncIterator]: () => AsyncIterableIterator<
      [string, FileSystemFileHandle | FileSystemDirectoryHandle]
    >;
  }

  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export {};
