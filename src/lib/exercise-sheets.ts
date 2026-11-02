import { WORKBOOKS } from '@/data/academy'
import type { Crop } from '@/data/academy'

export interface ExerciseDocument {
  bookId: string
  numPages: number
  destroy: () => Promise<void>
}
export async function openWorkbook(bookId: string): Promise<ExerciseDocument> {
  const book = WORKBOOKS.find((item) => item.id === bookId)
  if (!book) throw new Error('Treino não encontrado.')
  return { bookId, numPages: book.pages, destroy: async () => {} }
}
export async function renderWorksheet(
  book: ExerciseDocument,
  pageNumber: number,
  crop?: Crop,
): Promise<string> {
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > book.numPages)
    throw new Error('Folha inválida.')
  const url = import.meta.env.BASE_URL + 'exercicios/' + book.bookId + '/' + pageNumber + '.webp'
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch {
    throw new Error('Não foi possível carregar o exercício. Confira a conexão e tente novamente.')
  }
  if (!crop || (crop[0] === 0 && crop[1] === 0 && crop[2] === 1 && crop[3] === 1)) return url
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * crop[2]))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * crop[3]))
  canvas
    .getContext('2d')!
    .drawImage(
      img,
      img.naturalWidth * crop[0],
      img.naturalHeight * crop[1],
      img.naturalWidth * crop[2],
      img.naturalHeight * crop[3],
      0,
      0,
      canvas.width,
      canvas.height,
    )
  return canvas.toDataURL('image/png')
}
