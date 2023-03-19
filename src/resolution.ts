import { join } from 'path'
import { readdir } from 'fs/promises'
import { PathLike } from 'fs'

/**
 * Resolve a given set of (user-provided) input paths to explicit file names.
 *
 * Paths referring to singular files will be returned as-is, while paths referring to directories will be recursed into
 * and the list of all deeply nested files will be returned.
 *
 * The resulting list will be filtered to only contain supported file extensions.
 *
 * @param paths The input paths.
 * @param extensions The supported file extensions.
 * @param readDirectory A function which can return the names of the files and folders in a directory (excluding '.' and '..')
 * @returns An array containing all (matching and non-directory) file names explicitly.
 */
export async function resolveTestPaths (paths: string[], extensions: string[], readDirectory?: (path: PathLike) => Promise<string[]>): Promise<string[]> {
  const resolvedPaths = []
  for (const inputPath of paths) {
    resolvedPaths.push(...await walkPath(
      inputPath,
      (fileName) => extensions.some((extension) => fileName.endsWith(extension)),
      readDirectory ?? readdir))
  }
  return resolvedPaths
}

export async function walkPath (path: string, predicate: (fileName: string) => boolean, readDirectory: (path: PathLike) => Promise<string[]>): Promise<string[]> {
  const found = []
  const stack = [path]

  // Walk stack depth-first (in tree order)
  while (stack.length > 0) {
    const [item] = stack.splice(0, 1)
    try {
      // If item can be successfully read as a directory, we add its files to the top-of-stack.
      const dirFileNames = await readDirectory(item)
      stack.unshift(...dirFileNames.filter((fileName) => fileName !== 'node_modules').map((fileName) => join(item, fileName)))
    } catch (err: unknown) {
      if (isNodeError(err) && err.code === 'ENOTDIR') {
        // item seems to refer to a file instead of a directory.
        // We want to return it only if it was provided explicitly by the user, or it matches the predicate.
        if (item === path || predicate(item)) {
          found.push(item)
        }
        continue
      }
      throw err
    }
  }

  return found
}

// TS type guard
function isNodeError (err: unknown): err is { code: unknown } {
  return typeof err === 'object' && err != null && 'code' in err
}
