/**
 * Origin Private File System (OPFS) & Local Storage Helper for AstraMind
 * Zero-server file retention - stores PDFs, Images, Audio recordings locally on device.
 */

export async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.getDirectory) {
    try {
      return await navigator.storage.getDirectory();
    } catch (e) {
      console.warn("OPFS not supported or blocked in this context:", e);
      return null;
    }
  }
  return null;
}

export async function saveLocalFileToOPFS(
  filename: string,
  data: Blob | ArrayBuffer | string
): Promise<string> {
  const root = await getOpfsRoot();
  if (root) {
    try {
      const fileHandle = await root.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      if (typeof data === "string") {
        await writable.write(data);
      } else if (data instanceof Blob) {
        await writable.write(await data.arrayBuffer());
      } else {
        await writable.write(data);
      }
      await writable.close();
      return `opfs://${filename}`;
    } catch (e) {
      console.error("Failed writing to OPFS:", e);
    }
  }
  // Fallback if OPFS is unavailable in current iframe sandbox
  return filename;
}

export async function readLocalFileFromOPFS(filename: string): Promise<Blob | null> {
  const cleanName = filename.replace(/^opfs:\/\//, "");
  const root = await getOpfsRoot();
  if (root) {
    try {
      const fileHandle = await root.getFileHandle(cleanName);
      const file = await fileHandle.getFile();
      return file;
    } catch (e) {
      console.warn("Could not read file from OPFS:", filename, e);
    }
  }
  return null;
}

export async function deleteLocalFileFromOPFS(filename: string): Promise<boolean> {
  const cleanName = filename.replace(/^opfs:\/\//, "");
  const root = await getOpfsRoot();
  if (root) {
    try {
      await root.removeEntry(cleanName);
      return true;
    } catch (e) {
      console.warn("Could not delete OPFS file:", filename, e);
    }
  }
  return false;
}
