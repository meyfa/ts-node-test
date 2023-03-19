import { describe, it } from 'node:test'
import assert from 'node:assert'
import sinon from 'sinon'
import path from 'node:path'
import * as resolution from '../src/resolution.js'

const ENOTDIR = (): Error => Object.assign(new Error(), { code: 'ENOTDIR' })

describe('resolution', () => {
  it('walks directories', async () => {
    const predicate = sinon.stub()
    predicate.withArgs(path.join('some-project', 'file.ts')).returns(true)
    predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).returns(true)
    predicate.returns(false)

    const dirReader = sinon.stub()
    dirReader.withArgs('some-project').resolves(['subdir1', 'subdir2', 'file.ts'])
    dirReader.withArgs(path.join('some-project', 'subdir1')).resolves(['subfile.ts'])
    dirReader.withArgs(path.join('some-project', 'subdir2')).resolves([])
    // eslint-disable-next-line prefer-promise-reject-errors
    dirReader.withArgs(path.join('some-project', 'file.ts')).rejects(ENOTDIR())
    dirReader.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).rejects(ENOTDIR())

    const results = await resolution.walkPath('some-project', predicate, dirReader)
    const expectedResults = [path.join('some-project', 'file.ts'), path.join('some-project', 'subdir1', 'subfile.ts')]
    assert.deepStrictEqual(results.sort(), expectedResults.sort())

    assert.strictEqual(predicate.callCount, 2)
    assert.strictEqual(predicate.withArgs(path.join('some-project', 'file.ts')).callCount, 1)
    assert.strictEqual(predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).callCount, 1)
  })

  it('resolves test paths', async () => {
    const files = ['a.ts', 'a.test.ts', 'b.ts', 'b.test.ts']
    const extensions = ['.test.ts']

    const dirReader = sinon.stub()
    dirReader.withArgs('project').resolves(files)
    for (const file of files) {
      // eslint-disable-next-line prefer-promise-reject-errors
      dirReader.withArgs(path.join('project', file)).rejects(ENOTDIR())
    }

    const results = await resolution.resolveTestPaths(['project'], extensions, dirReader)
    const expectedResults = [path.join('project', 'a.test.ts'), path.join('project', 'b.test.ts')]
    assert.deepStrictEqual(results.sort(), expectedResults.sort())
  })
})
