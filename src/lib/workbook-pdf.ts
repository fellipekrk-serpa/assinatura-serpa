import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { WORKBOOKS } from '@/data/academy'
import type { Workbook, Crop } from '@/data/academy'

GlobalWorkerOptions.workerSrc = workerUrl
const databaseName = 'assinatura-serpa-apostilas'
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(databaseName, 1)
    req.onupgradeneeded = () => req.result.createObjectStore('pdfs')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(new Error('Não foi possível guardar o PDF neste aparelho.'))
  })
}
export async function installedWorkbooks(): Promise<string[]> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('pdfs')
      const req = tx.objectStore('pdfs').getAllKeys()
      req.onsuccess = () => resolve(req.result.map(String))
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
}
export async function importWorkbook(file: File): Promise<Workbook> {
  if (file.size > 100_000_000) throw new Error('Escolha um PDF de até 100 MB.')
  const bytes = await file.arrayBuffer()
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const matches = WORKBOOKS.filter((b) => b.sha256 === hash)
  const book = matches[0]
  if (!book)
    throw new Error(
      `${file.name}: PDF diferente das versões catalogadas. Baixe o original pelo link da apostila.`,
    )
  const db = await database()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('pdfs', 'readwrite')
      for (const match of matches)
        tx.objectStore('pdfs').put(new Blob([bytes], { type: 'application/pdf' }), match.id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Espaço insuficiente para guardar a apostila.'))
      tx.onabort = () => reject(new Error('A gravação do PDF foi interrompida.'))
    })
  } finally {
    db.close()
  }
  return book
}
export async function openWorkbook(bookId: string): Promise<PDFDocumentProxy | null> {
  const db = await database()
  let blob: Blob | undefined
  try {
    blob = await new Promise((resolve, reject) => {
      const req = db.transaction('pdfs').objectStore('pdfs').get(bookId)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } finally {
    db.close()
  }
  if (!blob) return null
  return getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    isEvalSupported: false,
    useSystemFonts: false,
    standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
  }).promise
}
export async function renderWorksheet(
  pdf: PDFDocumentProxy,
  pageNumber: number,
  crop?: Crop,
): Promise<string> {
  const page = await pdf.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const viewport = page.getViewport({ scale: Math.min(2.5, 1800 / base.width) })
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  await page.render({ canvas, viewport }).promise
  if (!crop) return canvas.toDataURL('image/png')
  const target = document.createElement('canvas')
  target.width = Math.max(1, Math.round(canvas.width * crop[2]))
  target.height = Math.max(1, Math.round(canvas.height * crop[3]))
  target
    .getContext('2d')!
    .drawImage(
      canvas,
      canvas.width * crop[0],
      canvas.height * crop[1],
      canvas.width * crop[2],
      canvas.height * crop[3],
      0,
      0,
      target.width,
      target.height,
    )
  return target.toDataURL('image/png')
}
