import { cloneStrokes, makeId, strokesDuration } from '@/data/signature'
import type { AppData, ModelId, SavedAttempt } from '@/data/signature'
import { getLesson, practiceModel } from '@/data/course'

// Pure state transition: archive ink before replacing a draft for a course exercise.
export function startCoursePractice(
  data: AppData,
  sessionId: number,
  stepIndex: number,
  selectedModel?: ModelId,
): AppData {
  const lesson = getLesson(sessionId)
  const exercise = lesson?.steps[stepIndex]
  if (!lesson || !exercise) throw new Error('Exercício desconhecido')
  const now = new Date().toISOString()
  const draft = data.draft
  const archived: SavedAttempt[] = draft.strokes.length
    ? [
        {
          id: makeId('tentativa'),
          name: `Rascunho preservado — ${now.slice(0, 10)}`,
          modelId: draft.modelId,
          createdAt: now,
          duration: strokesDuration(draft.strokes),
          strokes: cloneStrokes(draft.strokes),
          favorite: draft.favorite,
          inkColor: draft.inkColor,
          lineWidth: draft.lineWidth,
          courseSessionId: draft.coursePractice?.sessionId,
        },
      ]
    : []
  return {
    ...data,
    attempts: [...archived, ...data.attempts],
    draft: {
      ...draft,
      strokes: [],
      redoStack: [],
      clearedBuffer: null,
      favorite: false,
      modelId: practiceModel(lesson, stepIndex, selectedModel),
      mode: exercise.mode,
      referenceVisible: true,
      startedAt: now,
      updatedAt: now,
      coursePractice: {
        sessionId,
        stepIndex,
        completeModel: selectedModel === 'a5-04' ? 'a5-04' : 'a4',
      },
    },
  }
}
