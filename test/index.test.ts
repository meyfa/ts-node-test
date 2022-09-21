import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as index from '../src/index.js'

describe('index', () => {
  it('exports main()', () => {
    assert.equal(typeof index.main, 'function')
  })

  it('uses default extensions', () => {
    const results = index.getTestExtensions()
    const expectedResults = ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts']

    for (let index = 0; index < results.length; index++) {
      assert.equal(expectedResults[index], results[index])
    }
  })

  it('gets supported extensions from environment variables', () => {
    process.env.TEST_EXTENSIONS = '.foo,.bar,.baz'

    const results = index.getTestExtensions()
    const expectedResults = ['.foo', '.bar', '.baz']

    for (let index = 0; index < results.length; index++) {
      assert.equal(expectedResults[index], results[index])
    }
  })
})
