import { describe, it } from 'node:test'
import assert from 'node:assert'
import sinon from 'sinon'
import path from 'node:path'
import * as resolution from '../src/resolution.js'

const ENOTDIR = (): Error => Object.assign(new Error(), { code: 'ENOTDIR' })

void describe('resolution', () => {
  void it('walks directories', async () => {
    const predicate = sinon.stub()
    predicate.withArgs(path.join('some-project', 'file.ts')).returns(true)
    predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).returns(true)
    predicate.returns(false)

    const dirReader = sinon.stub()
    dirReader.withArgs('some-project').resolves(['subdir1', 'subdir2', 'file.ts'])
    dirReader.withArgs(path.join('some-project', 'subdir1')).resolves(['subfile.ts'])
    dirReader.withArgs(path.join('some-project', 'subdir2')).resolves([])
    dirReader.withArgs(path.join('some-project', 'file.ts')).rejects(ENOTDIR())
    dirReader.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).rejects(ENOTDIR())

    const results = await resolution.walkPath('some-project', predicate, dirReader)
    const expectedResults = [path.join('some-project', 'file.ts'), path.join('some-project', 'subdir1', 'subfile.ts')]
    assert.deepStrictEqual(results.sort(), expectedResults.sort())

    assert.strictEqual(predicate.callCount, 2)
    assert.strictEqual(predicate.withArgs(path.join('some-project', 'file.ts')).callCount, 1)
    assert.strictEqual(predicate.withArgs(path.join('some-project', 'subdir1', 'subfile.ts')).callCount, 1)
  })

  void it('resolves test paths', async () => {
    const files = ['a.ts', 'a.test.ts', 'b.ts', 'b.test.ts']
    const extensions = ['.test.ts']

    const dirReader = sinon.stub()
    dirReader.withArgs('project').resolves(files)
    for (const file of files) {
      dirReader.withArgs(path.join('project', file)).rejects(ENOTDIR())
    }

    const results = await resolution.resolveTestPaths(['project'], extensions, dirReader)
    const expectedResults = [path.join('project', 'a.test.ts'), path.join('project', 'b.test.ts')]
    assert.deepStrictEqual(results.sort(), expectedResults.sort())
  })

  void it('does not descend into node_modules unless explicitly provided', async () => {
    const predicate = sinon.stub()
    predicate.withArgs(path.join('foo', 'node_modules', 'file1.ts')).returns(true)
    predicate.withArgs(path.join('foo', 'bar', 'file2.ts')).returns(true)
    predicate.withArgs(path.join('foo', 'bar', 'node_modules', 'file3.ts')).returns(true)
    predicate.returns(false)

    const dirReader = sinon.stub()

    // foo, foo/node_modules, foo/node_modules/file1.ts
    dirReader.withArgs('foo').resolves(['node_modules', 'bar'])
    dirReader.withArgs(path.join('foo', 'node_modules')).resolves(['file1.ts'])
    dirReader.withArgs(path.join('foo', 'node_modules', 'file1.ts')).rejects(ENOTDIR())

    // foo/bar, foo/bar/file2.ts
    dirReader.withArgs(path.join('foo', 'bar')).resolves(['file2.ts', 'node_modules'])
    dirReader.withArgs(path.join('foo', 'bar', 'file2.ts')).rejects(ENOTDIR())

    // foo/bar/node_modules, foo/bar/node_modules/file3.ts
    dirReader.withArgs(path.join('foo', 'bar', 'node_modules')).resolves(['file3.ts'])
    dirReader.withArgs(path.join('foo', 'bar', 'node_modules', 'file3.ts')).rejects(ENOTDIR())

    const results = await resolution.walkPath('foo', predicate, dirReader)
    assert.deepStrictEqual(results, [path.join('foo', 'bar', 'file2.ts')])
    assert.equal(predicate.callCount, 1)
    assert.equal(predicate.withArgs(path.join('foo', 'node_modules', 'file1.ts')).callCount, 0)
    assert.equal(predicate.withArgs(path.join('foo', 'bar', 'file2.ts')).callCount, 1)
    assert.equal(predicate.withArgs(path.join('foo', 'bar', 'node_modules', 'file3.ts')).callCount, 0)

    predicate.resetHistory()

    const results2 = await resolution.walkPath(path.join('foo', 'node_modules'), predicate, dirReader)
    assert.deepStrictEqual(results2, [path.join('foo', 'node_modules', 'file1.ts')])
    assert.equal(predicate.callCount, 1)
    assert.equal(predicate.withArgs(path.join('foo', 'node_modules', 'file1.ts')).callCount, 1)
    assert.equal(predicate.withArgs(path.join('foo', 'bar', 'file2.ts')).callCount, 0)
    assert.equal(predicate.withArgs(path.join('foo', 'bar', 'node_modules', 'file3.ts')).callCount, 0)
  })
})
