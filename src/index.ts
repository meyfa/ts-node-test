import { spawn } from 'child_process'
import { join } from 'path'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { readdir } from 'fs/promises'

const SUPPORTED_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']

export async function main (): Promise<void> {
  const require = createRequire(import.meta.url)
  const esmLoader = pathToFileURL(require.resolve('ts-node/esm')).toString()

  const resolvedPaths = await resolveTestPaths(process.argv.slice(2))
  if (resolvedPaths.length === 0) {
    throw new Error('no test files found')
  }

  spawnChild(esmLoader, resolvedPaths)
}

/**
 * Resolve a given set of (user-provided) input paths to explicit file names.
 *
 * Paths referring to singular files will be returned as-is, while paths referring to directories will be recursed into
 * and the list of all deeply nested files will be returned.
 *
 * The resulting list will be filtered to only contain supported file extensions.
 *
 * @param paths The input paths.
 * @returns An array containing all (matching and non-directory) file names explicitly.
 */
async function resolveTestPaths (paths: string[]): Promise<string[]> {
  const resolvedPaths = []
  for (const inputPath of paths) {
    resolvedPaths.push(...await walkPath(inputPath, (fileName) => {
      return SUPPORTED_EXTENSIONS.some((extension) => fileName.endsWith(extension))
    }))
  }
  return resolvedPaths
}

async function walkPath (path: string, predicate: (fileName: string) => boolean): Promise<string[]> {
  const found = []
  const stack = [path]

  // Walk stack depth-first (in tree order)
  while (stack.length > 0) {
    const [item] = stack.splice(0, 1)
    try {
      // If item can be successfully read as a directory, we add its files to the top-of-stack.
      const dirFileNames = await readdir(item)
      stack.unshift(...dirFileNames.map((fileName) => join(item, fileName)))
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

/**
 * Execute the Node.js test runner with the given loader and set of test file paths.
 *
 * @param loader The loader to use (fully resolved path to the loader script).
 * @param resolvedTestPaths The files under test.
 */
function spawnChild (loader: string, resolvedTestPaths: string[]): void {
  const child = spawn(
    process.execPath,
    [
      '--loader',
      loader,
      '--test',
      ...resolvedTestPaths
    ],
    {
      stdio: 'inherit',
      argv0: process.argv0
    }
  )
  child.on('error', (error) => {
    console.error(error)
    process.exit(1)
  })
  child.on('exit', (code) => {
    child.removeAllListeners()
    process.off('SIGINT', sendSignalToChild)
    process.off('SIGTERM', sendSignalToChild)
    process.exitCode = code === null ? 1 : code
  })
  process.on('SIGINT', sendSignalToChild)
  process.on('SIGTERM', sendSignalToChild)

  function sendSignalToChild (signal: string): void {
    if (child.pid != null) {
      process.kill(child.pid, signal)
    }
  }
}

// TS type guard
function isNodeError (err: unknown): err is { code: unknown } {
  return typeof err === 'object' && err != null && 'code' in err
}
