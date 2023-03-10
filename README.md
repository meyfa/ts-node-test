# ts-node-test

[![CI](https://github.com/meyfa/ts-node-test/actions/workflows/main.yml/badge.svg)](https://github.com/meyfa/ts-node-test/actions/workflows/main.yml)

Use the [Node.js test runner](https://nodejs.org/dist/latest-v18.x/docs/api/test.html), but with TypeScript via ts-node.
You need to have `typescript` installed as a (dev) dependency and must be using Node version 18.7.0 or later.

Imagine it like `ts-node --test`, if that command existed.

## Usage

Install as a dev dependency:

```
npm i -D ts-node-test
```

Then add a script to your `package.json`:

```
{
  "scripts": {
    "test": "ts-node-test test-file1.ts foo/test-file2.ts another-dir/"
  }
}
```

The command syntax is similar to `node --test`. Multiple paths can be passed. Directories will be searched recursively
for any files with supported extensions (currently: `.js`, `.mjs`, `.cjs`; `.ts`, `.mts`, `.cts`).
Then, Node's test runner will be started on all files that were found in this process.

### Extensions

You can override the list of extensions by setting an environment variable (`TEST_EXTENSIONS`). This list will then be
used instead of the default extensions. For example:

```
TEST_EXTENSIONS=.test.ts,.test.js ts-node-test test/
```

The above will recursively look for files in the `test/` directory ending in `.test.ts` or `.test.js`.

### CLI flags

The following additional CLI flags are supported, and will be passed along to Node.js when provided:

* `--test-name-pattern <pattern>` *
* `--test-reporter <reporter>` *
* `--test-reporter-destination <destination>` *
* `--test-only`
* `--watch`
* `--watch-preserve-output`
* `--experimental-test-coverage`

_Flags marked with `*` can be passed multiple times._

## Why this is needed

TL;DR: Node.js (at the time of writing) does not allow to override the list of extensions that are used when searching
for test files. The official recommendation is to list all files explicitly. That is precisely what this CLI wrapper
does behind the scenes.

Please refer to the following issues for further information:

* [Node.js #44023](https://github.com/nodejs/node/issues/44023)
* [ts-node #1853](https://github.com/TypeStrong/ts-node/issues/1853)
