import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url = process.argv[2]
if (!url || !/^https?:/.test(url)) throw new Error('Use: node scripts/verify-published.mjs <URL>')
const browser = await chromium.launch({
  headless: true,
  ...(process.env.BROWSER_PATH ? { executablePath: process.env.BROWSER_PATH } : {}),
})
const context = await browser.newContext()
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const state = () =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open('assinatura-serpa', 1)
        q.onerror = () => reject(q.error)
        q.onsuccess = () => {
          const db = q.result,
            tx = db.transaction('dados', 'readonly')
          const request = tx.objectStore('dados').get('estado-principal')
          tx.oncomplete = () => {
            db.close()
            resolve(request.result)
          }
          tx.onerror = () => reject(tx.error)
        }
      }),
  )
async function waitState(predicate) {
  for (let i = 0; i < 100; i++) {
    const value = await state()
    if (predicate(value)) return value
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('O progresso esperado não foi salvo')
}
try {
  await page.goto(url, { waitUntil: 'networkidle' })
  // Fresh isolated browser: never modifies the user's stored training.
  for (const model of ['B4 original', 'A4 original', 'A5-04']) {
    const image = page.getByAltText('Miniatura da referência ' + model, { exact: true })
    assert.ok(
      await image.evaluate((img) => img.complete && img.naturalWidth > 0),
      'Referência ausente: ' + model,
    )
  }
  await page.getByRole('button', { name: 'Curso', exact: true }).click()
  await page.getByRole('heading', { name: 'Exercícios de caligrafia', exact: true }).waitFor()
  await page.getByRole('button', { name: /Coordenação motora/ }).click()
  const pen = page.getByLabel('Tipo de caneta', { exact: true })
  await pen.waitFor()
  assert.equal(await pen.locator('option').count(), 7)
  const courseText = await page.locator('.academy-screen').innerText()
  assert.ok(
    ![
      'Cobrir 0/8',
      'Copiar 0/8',
      'Memória 0/4',
      'Baixar original',
      'Carregar PDFs',
      'Academia Fena',
    ].some((text) => courseText.includes(text)),
    'Interface antiga reapareceu',
  )
  assert.equal(
    await page
      .locator('.academy-screen a[href*="drive.google"], .academy-screen input[type="file"]')
      .count(),
    0,
  )
  await page.getByLabel('Folha de treino').selectOption('5')
  await pen.selectOption('ultra-flex')
  await page.getByLabel('Opacidade da referência').fill('0.65')
  await page.getByLabel('Modo teste (dedo/mouse)').check()
  const canvas = page.locator('.academy-stage canvas')
  await canvas.waitFor()
  await page.waitForFunction(() => {
    const img = document.querySelector('.academy-overlay')
    return img?.complete && img.naturalWidth > 0
  })
  await canvas.hover({ position: { x: 80, y: 80 } })
  const box = await canvas.boundingBox()
  assert.ok(box && box.width > 0)
  await page.mouse.move(box.x + 80, box.y + 80)
  await page.mouse.down()
  await page.mouse.move(box.x + 160, box.y + 100, { steps: 8 })
  await page.mouse.up()
  const before = await waitState(
    (s) => s?.academy?.draft?.strokes.length > 0 && s.academy.preferences?.penType === 'ultra-flex',
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByLabel('Tipo de caneta', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Tipo de caneta', { exact: true }).inputValue(), 'ultra-flex')
  assert.equal(await page.getByLabel('Folha de treino').inputValue(), '5')
  assert.equal(await page.getByLabel('Opacidade da referência').inputValue(), '0.65')
  const after = await state()
  assert.deepEqual(after.academy.draft.strokes, before.academy.draft.strokes)
  assert.equal(after.workspace.tab, 'course')
  assert.equal(await page.getByLabel('Modo teste (dedo/mouse)').isChecked(), false)
  assert.deepEqual(errors, [])
  console.log(
    'PASS: B4, curso interno, sete canetas, escrita, retomada de folha/caneta/opacidade e traços.',
  )
} finally {
  await context.close()
  await browser.close()
}
