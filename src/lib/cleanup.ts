import { File } from 'expo-file-system';

/**
 * Best-effort deletion. A file that cannot be removed must never break the flow,
 * so failures are logged in dev and otherwise swallowed.
 */
export function deleteLocalFiles(uris: Iterable<string>): void {
  for (const uri of uris) {
    if (!uri.startsWith('file:')) continue;
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch (error) {
      if (__DEV__) console.warn(`[cleanup] could not delete ${uri}`, error);
    }
  }
}
