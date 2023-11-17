import { describe, it } from 'node:test'
import assert from 'node:assert'
import * as index from '../src/index.js'

void describe('index', () => {
  void it('exports main()', () => {
    assert.equal(typeof index.main, 'function')
  })

  void it('uses default extensions', () => {
    const results = index.getTestExtensions()
    const expectedResults = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']

    assert.deepStrictEqual(results, expectedResults)
  })

  void it('gets supported extensions from environment variables', () => {
    process.env.TEST_EXTENSIONS = '.foo,.bar,.baz'

    const results = index.getTestExtensions()
    const expectedResults = ['.foo', '.bar', '.baz']

    assert.deepStrictEqual(results, expectedResults)
  })
})
