import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
})
try {
  const page = await browser.newPage()
  await page.goto(process.argv[2] || 'http://127.0.0.1:5187')
  const result = await page.evaluate(async () => {
    const s = await import('/src/lib/signature-storage.ts')
    const { createDefaultData } = await import('/src/data/signature.ts')
    const put = (key, value) =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open('assinatura-serpa', 1)
        q.onsuccess = () => {
          const db = q.result,
            tx = db.transaction('dados', 'readwrite')
          tx.objectStore('dados').put(value, key)
          tx.oncomplete = () => {
            db.close()
            resolve()
          }
          tx.onerror = () => reject(tx.error)
        }
      })
    // Wait for initial app save, then run storage module checks in isolation.
    await s.persistAppData(createDefaultData())
    const a = createDefaultData()
    a.workspace = { tab: 'course', courseSection: 'academy' }
    a.draft.penType = 'flex'
    await s.persistAppData(a)
    a.draft.penType = 'ultra-flex'
    await s.persistAppData(a)
    const latest = await s.loadAppData()
    await put('estado-principal', { broken: true })
    const recovery = await s.loadAppData()
    const newer = { ...a, __savedAt: Date.now() + 1000 }
    localStorage.setItem('assinatura-serpa-fallback-v1', JSON.stringify(newer))
    const fallback = await s.loadAppData()
    localStorage.clear()
    await put('estado-principal-recovery', { broken: true })
    let refused = false
    try {
      await s.loadAppData()
    } catch {
      refused = true
    }
    return {
      latest: latest.data.draft.penType,
      recovery: recovery.data.draft.penType,
      recovered: recovery.recovered,
      tab: recovery.data.workspace.tab,
      fallback: fallback.storage,
      fallbackPen: fallback.data.draft.penType,
      refused,
    }
  })
  assert.deepEqual(result, {
    latest: 'ultra-flex',
    recovery: 'flex',
    recovered: true,
    tab: 'course',
    fallback: 'localStorage',
    fallbackPen: 'ultra-flex',
    refused: true,
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Seu progresso foi preservado' }).waitFor()
  console.log(
    'PASS: latest save, recovery, newer fallback, corrupt copies rejected, autosave paused.',
  )
} finally {
  await browser.close()
}
