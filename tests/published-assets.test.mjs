import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

test('every catalog page ships as a nonempty WebP in the static deployment', () => {
  const catalog = readFileSync(new URL('../src/data/academy.ts', import.meta.url), 'utf8')
  const books = [...catalog.matchAll(/id: '([^']+)',\s+title: '[^']+',\s+group: '[^']+',\s+pages: (\d+)/g)]
  assert.equal(books.length, 29)
  for (const [, id, pages] of books) {
    for (let page = 1; page <= Number(pages); page++) {
      const url = new URL(`../public/exercicios/${id}/${page}.webp`, import.meta.url)
      const bytes = readFileSync(fileURLToPath(url))
      assert.ok(bytes.length > 100, `${id}/${page}`)
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP')
    }
  }
})
