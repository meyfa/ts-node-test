import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import sinon from 'sinon'
import path from 'node:path'
import * as resolution from '../src/resolution.js'

describe('resolution', () => {
  it('walks directories', async () => {
    const predicate = sinon.stub()
    predicate.withArgs(path.join('some-project', 'file.ts')).returns(true)
    predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).returns(true)
    predicate.returns(false)

    const dirReader = sinon.stub()
    dirReader.withArgs('some-project').returns(Promise.resolve(['subdir1', 'subdir2', 'file.ts']))
    dirReader.withArgs(path.join('some-project', 'subdir1')).returns(Promise.resolve(['subfile.ts']))
    dirReader.withArgs(path.join('some-project', 'subdir2')).returns(Promise.resolve([]))
    // eslint-disable-next-line prefer-promise-reject-errors
    dirReader.withArgs(path.join('some-project', 'file.ts')).returns(Promise.reject({ code: 'ENOTDIR' }))
    // eslint-disable-next-line prefer-promise-reject-errors
    dirReader.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).returns(Promise.reject({ code: 'ENOTDIR' }))

    const results = (await resolution.walkPath('some-project', predicate, dirReader)).sort()
    const expectedResults = [path.join('some-project', 'file.ts'), path.join('some-project', 'subdir1', 'subfile.ts')].sort()

    assert.equal(1, predicate.withArgs(path.join('some-project', 'file.ts')).callCount)
    assert.equal(1, predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).callCount)

    for (let index = 0; index < results.length; index++) {
      assert.equal(expectedResults[index], results[index])
    }
  })

  it('resolves test paths', async () => {
    const files = ['a.ts', 'a.test.ts', 'b.ts', 'b.test.ts']
    const extensions = ['.test.ts']

    const dirReader = sinon.stub()
    dirReader.withArgs('project').returns(Promise.resolve(files))
    for (const file of files) {
      // eslint-disable-next-line prefer-promise-reject-errors
      dirReader.withArgs(path.join('project', file)).returns(Promise.reject({ code: 'ENOTDIR' }))
    }

    const results = (await resolution.resolveTestPaths(['project'], extensions, dirReader)).sort()
    const expectedResults = [path.join('project', 'a.test.ts'), path.join('project', 'b.test.ts')].sort()

    for (let index = 0; index < results.length; index++) {
      assert.equal(expectedResults[index], results[index])
    }
  })
})
