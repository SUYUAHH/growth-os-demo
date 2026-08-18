import test from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { resolveStateFilePath } from '../server/store.js'

test('uses a mounted state directory when one is configured', () => {
  assert.equal(resolveStateFilePath('C:/render-disk'), join('C:/render-disk', 'state.json'))
})

test('falls back to the local server data directory without a mount', () => {
  assert.match(resolveStateFilePath(), /server[\\/]data[\\/]state\.json$/)
})
