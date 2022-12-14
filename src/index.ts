import { spawn } from 'child_process'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { resolveTestPaths } from './resolution.js'

const DEFAULT_TEST_EXTENSIONS = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']

export function getTestExtensions (): string[] {
  if (typeof process.env.TEST_EXTENSIONS !== 'undefined' && process.env.TEST_EXTENSIONS !== null) {
    return process.env.TEST_EXTENSIONS.split(',').map(e => e.trim())
  }
  return DEFAULT_TEST_EXTENSIONS
}

export interface Options {
  watch: boolean
}

export async function main (paths: string[], options: Options): Promise<void> {
  const require = createRequire(import.meta.url)
  const esmLoader = pathToFileURL(require.resolve('ts-node/esm')).toString()
  const extensions = getTestExtensions()
  const resolvedPaths = await resolveTestPaths(paths, extensions)
  if (resolvedPaths.length === 0) {
    throw new Error('no test files found')
  }

  spawnChild(esmLoader, resolvedPaths, options)
}

/**
 * Execute the Node.js test runner with the given loader and set of test file paths.
 *
 * @param loader The loader to use (fully resolved path to the loader script).
 * @param resolvedTestPaths The files under test.
 * @param options Additional options.
 */
function spawnChild (loader: string, resolvedTestPaths: string[], options: Options): void {
  const args = ['--loader', loader, '--test']
  if (options.watch) {
    args.push('--watch')
  }
  args.push(...resolvedTestPaths)
  const child = spawn(process.execPath, args, {
    stdio: 'inherit',
    argv0: process.argv0
  })
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
