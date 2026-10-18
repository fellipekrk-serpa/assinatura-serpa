import { getCourseFocus } from '@/data/course-focus'
import { BookOpen, ArrowRight, X } from 'lucide-react'
import { getLesson, MODE_LABELS } from '@/data/course'
import type { DraftState, ModelId } from '@/data/signature'

export default function CoursePracticePanel({
  draft,
  onReturn,
  onNext,
  onExit,
}: {
  draft: DraftState
  onReturn: (id: number) => void
  onNext: (id: number, index: number, model: ModelId) => void
  onExit: () => void
}) {
  const context = draft.coursePractice
  const lesson = context && getLesson(context.sessionId)
  const exercise = lesson?.steps[context?.stepIndex ?? -1]
  if (!lesson || !exercise || !context) return null
  return (
    <aside className="course-practice-panel" aria-label="Exercício em andamento">
      <div className="course-practice-top">
        <span className="eyebrow">
          Sessão {lesson.id} · Bloco {context.stepIndex + 1}/3 · {MODE_LABELS[exercise.mode]}
        </span>
        <button
          className="text-button"
          onClick={onExit}
          aria-label="Sair da orientação da aula e continuar no treino livre"
        >
          <X size={17} /> Treino livre
        </button>
      </div>
      <h2>{exercise.title}</h2>
      <p>
        <strong>
          {exercise.repetitions} · cerca de {exercise.minutes} min.
        </strong>{' '}
        {exercise.instruction}
      </p>
      <p className="course-practice-hint">
        {getCourseFocus(lesson.id)
          ? 'Use “Concluir repetição” junto à área de escrita: sua tentativa é salva, a contagem aumenta e a tela fica pronta para repetir.'
          : 'Uma tentativa por vez. Salve antes de limpar para comparar depois. Ao abrir outro bloco, os traços atuais serão guardados no Histórico.'}
      </p>
      <div className="course-practice-actions">
        <button className="text-button" onClick={() => onReturn(lesson.id)}>
          <BookOpen size={17} /> Voltar à aula e revisar
        </button>
        {context.stepIndex < lesson.steps.length - 1 && (
          <button
            className="secondary-button"
            onClick={() =>
              onNext(lesson.id, context.stepIndex + 1, context.completeModel ?? lesson.modelId)
            }
          >
            Próximo bloco <ArrowRight size={16} />
          </button>
        )}
      </div>
    </aside>
  )
}
