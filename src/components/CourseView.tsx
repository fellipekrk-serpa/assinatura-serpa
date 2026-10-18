import { getCourseFocus } from '@/data/course-focus'
import ReferenceImage from '@/components/ReferenceImage'
import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Clock3, PenLine } from 'lucide-react'
import { COURSE_LESSONS, MODE_LABELS, practiceModel } from '@/data/course'
import type { CourseJournal, LessonJournal } from '@/data/course'
import { REFERENCE_MODELS } from '@/data/signature'
import type { ModelId } from '@/data/signature'

interface CourseViewProps {
  completedSessions: number[]
  journal: CourseJournal
  defaultCompleteModel?: ModelId
  selectedId: number
  onSelect: (id: number) => void
  onJournalChange: (id: number, entry: LessonJournal) => void
  onToggleSession: (id: number) => void
  onPractice: (id: number, stepIndex: number, modelId: ModelId) => void
}

export default function CourseView({
  completedSessions,
  journal,
  defaultCompleteModel = 'a4',
  selectedId,
  onSelect,
  onJournalChange,
  onToggleSession,
  onPractice,
}: CourseViewProps) {
  const [completeModel, setCompleteModel] = useState<ModelId>(
    defaultCompleteModel === 'a5-04' ? 'a5-04' : 'a4',
  )
  const lesson = COURSE_LESSONS.find((item) => item.id === selectedId) ?? COURSE_LESSONS[0]
  const focus = getCourseFocus(lesson.id)
  const entry = journal[lesson.id] ?? { notes: '', checks: [], updatedAt: '' }
  const heading = useRef<HTMLHeadingElement>(null)
  const select = (id: number) => {
    onSelect(id)
    requestAnimationFrame(() => {
      heading.current?.focus()
      heading.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }
  const updateEntry = (patch: Partial<LessonJournal>) =>
    onJournalChange(lesson.id, { ...entry, ...patch, updatedAt: new Date().toISOString() })
  const models =
    lesson.id >= 11
      ? REFERENCE_MODELS
      : REFERENCE_MODELS.filter((model) => model.id === lesson.modelId)
  const suggested =
    COURSE_LESSONS.find((item) => !completedSessions.includes(item.id)) ?? COURSE_LESSONS[13]

  return (
    <section className="course-screen" aria-labelledby="course-heading">
      <div className="course-hero">
        <div>
          <p className="eyebrow">Seu gesto, sua assinatura</p>
          <h2 id="course-heading">Curso de assinatura</h2>
          <p>14 sessões · cerca de 12–15 minutos cada · no seu ritmo</p>
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
        <PenLine size={22} />
        <div>
          <strong>Feito para você, destro</strong>
          <p>
            Treine apenas Serpa e Fellipe Serpa, usando B4 original, A4 original e A5-04. Uma sessão
            pode ocupar mais de um dia. Conclusão e avaliação são suas.
          </p>
        </div>
      </div>
      <details className="course-preparation">
        <summary>Antes de começar: caneta, postura e como praticar</summary>
        <div className="course-preparation-body">
          <p>
            Apoie o celular em uma superfície firme; use a horizontal se precisar de mais espaço.
            Deixe o antebraço apoiado e ajuste a inclinação do aparelho para o movimento ficar
            confortável. Evite apertar a caneta; pause se sentir desconforto.
          </p>
          <p>
            Faça um traço em Treinar. A caneta deve aparecer como detectada. Se sua caneta for
            reconhecida como toque, ative Modo teste; nesse modo, os dedos também desenham. A
            rejeição da palma depende do aparelho e do navegador.
          </p>
          <p>
            <strong>Cobrir:</strong> referência sob o traço. <strong>Copiar:</strong> referência
            fora da área. <strong>Memória:</strong> faça sem olhar, depois revele para comparar. As
            miniaturas também ficam ocultas até você revelar a referência.
          </p>
          <p>
            Faça uma tentativa por vez. Salve as que quiser comparar antes de limpar. Ao abrir outro
            exercício, o rascunho com tinta é guardado no Histórico. Reserve 2–5 minutos para
            revisão e papel além dos blocos de prática.
          </p>
          <p>
            As imagens mostram o resultado, não uma ordem original de execução. As sequências das
            aulas são sugestões para encontrar seu gesto. O Replay reproduz somente os traços que
            você fez.
          </p>
          <p>
            Seu progresso fica neste navegador. Use Ajustes → Exportar backup antes de trocar de
            aparelho ou limpar os dados do navegador.
          </p>
        </div>
      </details>
      <div className="course-resume">
        <span>
          {completedSessions.length === 14
            ? 'Percurso concluído. Você pode revisar qualquer sessão.'
            : `Próxima sugestão: sessão ${suggested.id} — ${suggested.title}`}
        </span>
        <button className="text-button" onClick={() => select(suggested.id)}>
          Abrir sessão <ArrowRight size={16} />
        </button>
      </div>
      <div className="course-layout">
        <nav className="course-syllabus" aria-label="Sessões do curso">
          {COURSE_LESSONS.map((item, index) => (
            <div key={item.id}>
              {(!index || item.phase !== COURSE_LESSONS[index - 1].phase) && (
                <p className="course-phase">{item.phase}</p>
              )}
              <button
                className={`course-lesson-link ${item.id === lesson.id ? 'is-selected' : ''}`}
                aria-current={item.id === lesson.id ? 'step' : undefined}
                onClick={() => select(item.id)}
              >
                <span className="course-lesson-number">
                  {completedSessions.includes(item.id) ? (
                    <Check size={16} aria-label="Concluída" />
                  ) : (
                    item.id
                  )}
                </span>
                <span>{item.title}</span>
              </button>
            </div>
          ))}
        </nav>
        <article className="course-lesson" aria-labelledby="lesson-heading">
          <p className="eyebrow">
            Sessão {lesson.id} de 14 · {lesson.phase.split(' · ')[1]}
          </p>
          <h3 id="lesson-heading" ref={heading} tabIndex={-1}>
            {lesson.title}
          </h3>
          <p className="lesson-objective">{lesson.objective}</p>
          {focus && (
            <p className="lesson-focus-goal">
              <strong>Meta: 20 repetições apenas de {focus.label}.</strong> 8 cobrindo, 8 copiando e
              4 de memória. Cada botão de prática abre somente esse trecho.
            </p>
          )}
          <div className={`lesson-references ${models.length > 1 ? 'has-many' : ''}`}>
            {models.map((model) => (
              <figure key={model.id}>
                {focus ? (
                  <ReferenceImage
                    src={model.asset}
                    alt={`Trecho original: ${focus.label}`}
                    focus={focus}
                  />
                ) : (
                  <img
                    src={model.asset}
                    alt={`Referência escolhida: ${model.name}, ${model.subtitle}`}
                    loading="lazy"
                  />
                )}
                <figcaption>
                  {model.name} · {model.subtitle}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="lesson-section">
            <h4>1. Observe o modelo</h4>
            <p>{lesson.observe}</p>
          </div>
          <div className="lesson-section">
            <h4>2. Prepare o gesto</h4>
            <ol>
              {lesson.technique.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ol>
          </div>
          <div className="lesson-section">
            <h4>3. Pratique em três blocos</h4>
            <p>
              Os tempos e repetições são sugestões. Faça pausas e repita um bloco quando precisar.
            </p>
            {lesson.id >= 12 && (
              <label className="course-model-choice">
                Sua completa nesta sessão
                <select
                  value={completeModel}
                  onChange={(event) => setCompleteModel(event.target.value as ModelId)}
                >
                  <option value="a4">A4 original — uma linha</option>
                  <option value="a5-04">A5-04 — dois níveis</option>
                </select>
              </label>
            )}
            <div className="lesson-exercises">
              {lesson.steps.map((exercise, index) => {
                const modelId = practiceModel(lesson, index, completeModel)
                const model = REFERENCE_MODELS.find((item) => item.id === modelId)!
                return (
                  <div className="lesson-exercise" key={exercise.title}>
                    <div className="session-kicker">
                      <span>
                        Bloco {index + 1} · {MODE_LABELS[exercise.mode]}
                      </span>
                      <span>
                        <Clock3 size={13} /> {exercise.minutes} min
                      </span>
                    </div>
                    <h5>{exercise.title}</h5>
                    <p className="exercise-target">
                      {exercise.repetitions} · {model.name}
                    </p>
                    <p>{exercise.instruction}</p>
                    <button
                      className="secondary-button"
                      onClick={() => onPractice(lesson.id, index, completeModel)}
                    >
                      <PenLine size={16} /> Praticar bloco {index + 1}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="lesson-section">
            <h4>4. Ajuste uma coisa por vez</h4>
            <dl className="lesson-corrections">
              {lesson.corrections.map((item) => (
                <div key={item.problem}>
                  <dt>{item.problem}</dt>
                  <dd>{item.action}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lesson-paper">
            <h4>Leve para o papel</h4>
            <p>{lesson.paper}</p>
          </div>
          <div className="lesson-section">
            <h4>5. Faça sua revisão</h4>
            <p>Marque o que você percebeu. Não há nota automática nem bloqueio para avançar.</p>
            <div className="lesson-checks">
              {lesson.checks.map((check, index) => (
                <label key={`${lesson.id}-${index}`}>
                  <input
                    type="checkbox"
                    checked={entry.checks.includes(String(index))}
                    onChange={() =>
                      updateEntry({
                        checks: entry.checks.includes(String(index))
                          ? entry.checks.filter((id) => id !== String(index))
                          : [...entry.checks, String(index)],
                      })
                    }
                  />
                  <span>{check}</span>
                </label>
              ))}
            </div>
            <label className="lesson-notes">
              Minhas observações
              <textarea
                maxLength={3000}
                rows={4}
                placeholder="O que ficou confortável? O que vou ajustar na próxima? Qual versão prefiro?"
                value={entry.notes}
                onChange={(event) => updateEntry({ notes: event.target.value })}
              />
            </label>
            <p className="lesson-repeat">{lesson.repeat}</p>
          </div>
          <div className="lesson-footer">
            <button
              className={
                completedSessions.includes(lesson.id) ? 'secondary-button' : 'primary-button'
              }
              aria-pressed={completedSessions.includes(lesson.id)}
              onClick={() => onToggleSession(lesson.id)}
            >
              <Check size={17} />
              {completedSessions.includes(lesson.id)
                ? 'Concluída · desfazer marcação'
                : 'Marcar sessão como concluída'}
            </button>
            <div className="lesson-navigation">
              <button
                className="text-button"
                disabled={lesson.id === 1}
                onClick={() => select(lesson.id - 1)}
              >
                <ArrowLeft size={16} /> Anterior
              </button>
              <button
                className="text-button"
                disabled={lesson.id === 14}
                onClick={() => select(lesson.id + 1)}
              >
                Próxima <ArrowRight size={16} />
              </button>
            </div>
          </div>
          {lesson.id === 14 && (
            <aside className="lesson-maintenance">
              <h4>Depois do curso</h4>
              <p>
                Como ponto de partida, reserve duas sessões de 5 minutos por semana: 3 completas e 3
                B4, com uma pequena comparação ao final. Faça parte delas no papel. Se um detalhe
                variar muito, retome a aula correspondente.
              </p>
              <p>
                Guarde suas três favoritas e exporte um backup em Ajustes. O objetivo é uma
                assinatura sua, confortável e reconhecível; pequenas variações são naturais.
              </p>
            </aside>
          )}
        </article>
      </div>
    </section>
  )
}
