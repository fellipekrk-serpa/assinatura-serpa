import { getCourseFocus, repetitionTarget } from '@/data/course-focus'
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

export function completeCourseRepetition(data: AppData): AppData {
  const context = data.draft.coursePractice
  const target = repetitionTarget(context)
  if (!context || !target || !data.draft.strokes.some((stroke) => stroke.tool !== 'eraser'))
    return data
  const entry = data.courseJournal?.[context.sessionId] ?? { notes: '', checks: [], updatedAt: '' }
  const count = entry.repetitions?.[String(context.stepIndex)] ?? 0
  if (count >= target) return data
  const now = new Date().toISOString()
  const focus = getCourseFocus(context.sessionId)!
  const result = startCoursePractice(
    data,
    context.sessionId,
    context.stepIndex,
    context.completeModel,
  )
  result.attempts[0].name = `Aula ${context.sessionId} · ${focus.label} · bloco ${context.stepIndex + 1} · ${count + 1}/${target}`
  result.courseJournal = {
    ...data.courseJournal,
    [context.sessionId]: {
      ...entry,
      updatedAt: now,
      repetitions: { ...entry.repetitions, [String(context.stepIndex)]: count + 1 },
    },
  }
  return result
}
