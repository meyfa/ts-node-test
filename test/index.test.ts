import { describe, it } from 'node:test'
import assert from 'assert/strict'
import * as index from '../src/index.js'

// These are dummy tests for now.

describe('index', () => {
  it('exports main()', () => {
    assert.equal(typeof index.main, 'function')
  })
})
