import fs from "fs/promises";
import path from "path";

/**
 * Resolves a path, handling both absolute and relative paths
 * If the path is relative, it will be resolved against the current working directory
 */
export function resolvePath(inputPath: string): string {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);
}

/**
 * Find the mono repo root by traversing up the directory tree
 * looking for the .ahh.virtual.monorepo.json file
 */
export async function findMonoRepoRoot(
  startPath?: string
): Promise<string | null> {
  const start = startPath ? resolvePath(startPath) : process.cwd();
  let current = start;

  while (true) {
    try {
      const configPath = path.join(current, ".ahh.virtual.monorepo.json");
      await fs.access(configPath);
      return current; // Found the mono repo root
    } catch (err) {
      // Config not found in this directory, try parent
      const parentDir = path.dirname(current);

      // If we've reached the root directory and still haven't found it
      if (parentDir === current) {
        return null;
      }

      current = parentDir;
    }
  }
}

/**
 * Creates a relative path from one absolute path to another
 */
export function createRelativePath(from: string, to: string): string {
  return path.relative(resolvePath(from), resolvePath(to));
}
