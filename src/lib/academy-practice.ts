import { WORKBOOKS, worksheetKey } from '@/data/academy'
import type { AcademyData, Worksheet, WorksheetProgress } from '@/data/academy'
import { cloneStrokes, makeId } from '@/data/signature'

export function archiveWorksheet(data: AcademyData): AcademyData {
  if (!data.draft?.strokes.length) return data
  return {
    ...data,
    attempts: [
      {
        id: makeId('folha'),
        exercise: data.draft.exercise,
        strokes: cloneStrokes(data.draft.strokes),
        block: data.draft.block,
        createdAt: new Date().toISOString(),
      },
      ...data.attempts,
    ],
    draft: { ...data.draft, strokes: [], redo: [] },
  }
}

export function beginWorksheet(
  data: AcademyData,
  exercise: Worksheet,
  block?: number,
): AcademyData {
  const next = archiveWorksheet(data)
  return {
    ...next,
    selectedBook: exercise.bookId,
    selectedPage: exercise.page,
    draft: { exercise, block: block ?? 0, strokes: [], redo: [] },
  }
}

export function completeWorksheet(data: AcademyData): AcademyData {
  const draft = data.draft
  if (!draft || !draft.strokes.some((s) => s.tool !== 'eraser')) return data
  const key = worksheetKey(draft.exercise)
  const entry = data.progress[key] ?? { counts: [0, 0, 0], notes: '', updatedAt: '' }
  const counts: WorksheetProgress['counts'] = [...entry.counts]
  counts[0]++
  const next = archiveWorksheet(data)
  return {
    ...next,
    draft: {
      ...next.draft!,
      block: 0,
    },
    progress: {
      ...data.progress,
      [key]: { ...entry, counts, updatedAt: new Date().toISOString() },
    },
  }
}

export function validWorksheet(value: unknown): Worksheet {
  const v = value as Worksheet
  const book = WORKBOOKS.find((b) => b.id === v?.bookId)
  if (
    !book ||
    !Number.isInteger(v.page) ||
    v.page < 1 ||
    v.page > book.pages ||
    typeof v.title !== 'string' ||
    v.title.length > 150 ||
    !Array.isArray(v.crop) ||
    v.crop.length !== 4 ||
    v.crop.some((n) => typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1) ||
    v.crop[2] < 0.01 ||
    v.crop[3] < 0.01 ||
    v.crop[0] + v.crop[2] > 1.00001 ||
    v.crop[1] + v.crop[3] > 1.00001
  )
    throw new Error('Folha ou recorte inválido no backup')
  return { bookId: v.bookId, page: v.page, crop: [...v.crop], title: v.title }
}

export function mergeAcademy(
  current?: AcademyData,
  imported?: AcademyData,
): AcademyData | undefined {
  if (!current) return imported
  if (!imported) return current
  const progress = { ...current.progress }
  for (const [key, entry] of Object.entries(imported.progress)) {
    if (!progress[key] || Date.parse(entry.updatedAt) > Date.parse(progress[key].updatedAt))
      progress[key] = entry
  }
  const attempts = new Map(imported.attempts.map((a) => [a.id, a]))
  current.attempts.forEach((a) => attempts.set(a.id, a))
  const exercises = new Map(imported.exercises.map((e) => [worksheetKey(e), e]))
  current.exercises.forEach((e) => exercises.set(worksheetKey(e), e))
  const draft = current.draft ?? imported.draft
  return {
    ...current,
    selectedBook: draft?.exercise.bookId ?? current.selectedBook,
    selectedPage: draft?.exercise.page ?? current.selectedPage,
    progress,
    exercises: [...exercises.values()],
    attempts: [...attempts.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    draft,
  }
}
