import { Check, Clock3, PenLine } from 'lucide-react'
import { COURSE_SESSIONS } from '@/data/signature'
import { cn } from '@/lib/utils'

interface CourseViewProps {
  completedSessions: number[]
  onToggleSession: (id: number) => void
  onPractice: () => void
}

export default function CourseView({
  completedSessions,
  onToggleSession,
  onPractice,
}: CourseViewProps) {
  return (
    <section className="course-screen" aria-labelledby="course-heading">
      <div className="course-hero">
        <div>
          <p className="eyebrow">Percurso livre</p>
          <h2 id="course-heading">Curso em 14 sessões</h2>
          <p>Exercícios de 10–15 minutos, sem travas e sem avaliação automática.</p>
        </div>
        <div
          className="course-progress"
          aria-label={`${completedSessions.length} de 14 sessões concluídas`}
        >
          <strong>{completedSessions.length}</strong>
          <span>/14 concluídas</span>
        </div>
      </div>

      <div className="course-note">
        <PenLine size={21} />
        <div>
          <strong>Orientação para destro</strong>
          <p>
            Incline levemente o suporte para a esquerda e mantenha o antebraço solto. Treine também
            no papel: a tela complementa, mas não substitui o gesto físico.
          </p>
        </div>
      </div>

      <div className="session-list">
        {COURSE_SESSIONS.map((session) => {
          const completed = completedSessions.includes(session.id)
          return (
            <article className={cn('session-card', completed && 'is-complete')} key={session.id}>
              <button
                className="session-check"
                onClick={() => onToggleSession(session.id)}
                aria-label={
                  completed
                    ? `Marcar sessão ${session.id} como não concluída`
                    : `Concluir sessão ${session.id} manualmente`
                }
                aria-pressed={completed}
              >
                {completed ? <Check size={18} /> : session.id}
              </button>
              <div className="session-copy">
                <div className="session-kicker">
                  <span>Sessão {session.id}</span>
                  <span>{session.model}</span>
                  <span>
                    <Clock3 size={13} /> 10–15 min
                  </span>
                </div>
                <h3>{session.title}</h3>
                <p>{session.description}</p>
              </div>
              <button className="text-button" onClick={onPractice}>
                Praticar
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
