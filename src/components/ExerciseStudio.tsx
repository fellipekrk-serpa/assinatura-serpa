import { useEffect, useRef, useState } from 'react'
import SignatureCanvas from './SignatureCanvas'
import PenPicker from './PenPicker'
import { PEN_PRESETS, type PenType } from '@/data/pens'
import {
  BLOCK_NAMES,
  FULL_PAGE,
  WORKBOOKS,
  createAcademyData,
  defaultWorksheet,
  worksheetKey,
} from '@/data/academy'
import type { AcademyData, Crop, Worksheet, WorksheetDraft } from '@/data/academy'
import { archiveWorksheet, beginWorksheet, completeWorksheet } from '@/lib/academy-practice'
import { openWorkbook, renderWorksheet } from '@/lib/exercise-sheets'
import { downloadBlob, drawSignatureStrokes } from '@/lib/signature-drawing'
import type { SignatureStroke } from '@/data/signature'
import type { ExerciseDocument } from '@/lib/exercise-sheets'

interface Props {
  value?: AcademyData
  onChange: (value: AcademyData) => void
}
export default function ExerciseStudio({ value, onChange }: Props) {
  const saved = value ?? createAcademyData()
  // Old copy/memory drafts keep their ink while reopening in cover mode.
  const data = saved.draft && saved.draft.block !== 0
    ? { ...saved, draft: { ...saved.draft, block: 0 } } : saved
  const [pdf, setPdf] = useState<ExerciseDocument | null>(null)
  const [preview, setPreview] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [opening, setOpening] = useState(true)
  const [error, setError] = useState('')
  const [crop, setCrop] = useState<Crop>(FULL_PAGE)
  const [name, setName] = useState('')
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen')
  const [testInput, setTestInput] = useState(false)
  const [pointer, setPointer] = useState('Aguardando caneta')
  const [penType, setPenType] = useState<PenType>('fine')
  const pen = PEN_PRESETS.find((p) => p.id === penType)!
  const [opacity, setOpacity] = useState(0.4)
  const [replay, setReplay] = useState<SignatureStroke[] | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(true)
  const drag = useRef<[number, number] | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const book = WORKBOOKS.find((b) => b.id === data.selectedBook) ?? WORKBOOKS[0]
  const page = data.selectedPage
  const draft = data.draft
  const key = draft ? worksheetKey(draft.exercise) : ''
  const activePage = draft?.exercise.page ?? page
  const activeCrop = draft?.exercise.crop.join(',') ?? ''
  const isPracticing = !!draft
  const entry = data.progress[key] ?? { counts: [0, 0, 0], notes: '', updatedAt: '' }
  const stopReplay = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    setReplay(null)
  }
  const change = (next: AcademyData) => {
    stopReplay()
    onChange(next)
  }
  const updateDraft = (patch: Partial<WorksheetDraft>) => {
    if (draft) onChange({ ...data, draft: { ...draft, ...patch } })
  }
  useEffect(() => {
    let cancelled = false
    let document: ExerciseDocument | null = null
    setPdf(null)
    setOpening(true)
    setPreview('')
    setReference('')
    setError('')
    openWorkbook(book.id)
      .then((result) => {
        document = result
        if (cancelled) {
          void result?.destroy()
          return
        }
        setPdf(result)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setOpening(false)
      })
    return () => {
      cancelled = true
      void document?.destroy()
    }
  }, [book.id])
  useEffect(() => {
    let cancelled = false
    setPreview('')
    setReference('')
    setError('')
    if (!pdf) {
      setLoading(false)
      return
    }
    setLoading(true)
    renderWorksheet(
      pdf,
      activePage,
      activeCrop ? (activeCrop.split(',').map(Number) as Crop) : undefined,
    )
      .then((src) => {
        if (cancelled) return
        if (isPracticing) setReference(src)
        else setPreview(src)
      })
      .catch((e) => {
        if (!cancelled) setError(`Não foi possível renderizar a folha: ${e.message}`)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pdf, activePage, activeCrop, isPracticing])
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  function selectPage(bookId: string, nextPage: number) {
    setCatalogOpen(false)
    const selectedBook = WORKBOOKS.find((item) => item.id === bookId)!
    change(beginWorksheet(data, defaultWorksheet(selectedBook, nextPage)))
    setCrop(FULL_PAGE)
    setName('')
    setShowHistory(false)
  }
  function practice(exercise: Worksheet) {
    change(beginWorksheet(data, exercise))
    setShowHistory(false)
    setTool('pen')
  }
  function startCrop() {
    const exercise: Worksheet = {
      bookId: book.id,
      page,
      crop,
      title: name.trim() || `${book.title} · folha ${page} · recorte`,
    }
    const exists = data.exercises.some((e) => worksheetKey(e) === worksheetKey(exercise))
    change(
      beginWorksheet(
        {
          ...data,
          exercises: exists
            ? data.exercises.map((e) => (worksheetKey(e) === worksheetKey(exercise) ? exercise : e))
            : [...data.exercises, exercise],
        },
        exercise,
      ),
    )
    setTool('pen')
  }
  function point(event: React.PointerEvent<HTMLDivElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect()
    return [
      Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    ]
  }
  function updateCrop(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const [x, y] = point(event),
      [sx, sy] = drag.current
    setCrop([Math.min(x, sx), Math.min(y, sy), Math.abs(x - sx), Math.abs(y - sy)])
  }
  function startReplay(strokes: SignatureStroke[]) {
    stopReplay()
    const points = strokes.flatMap((s) => s.points)
    if (!points.length) return
    const first = points.reduce((n, p) => Math.min(n, p.t), Infinity),
      last = points.reduce((n, p) => Math.max(n, p.t), 0)
    const start = performance.now()
    const tick = (now: number) => {
      const cutoff = first + now - start
      setReplay(
        strokes
          .map((s) => ({ ...s, points: s.points.filter((p) => p.t <= cutoff) }))
          .filter((s) => s.points.length),
      )
      if (cutoff < last) frame.current = requestAnimationFrame(tick)
      else {
        frame.current = null
        setReplay(null)
      }
    }
    frame.current = requestAnimationFrame(tick)
  }
  function exportInk() {
    if (!stage.current || !draft) return
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(stage.current.clientWidth * 2)
    canvas.height = Math.round(stage.current.clientHeight * 2)
    const ctx = canvas.getContext('2d')!
    ctx.scale(2, 2)
    drawSignatureStrokes(ctx, draft.strokes, canvas.width / 2, canvas.height / 2)
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `${draft.exercise.bookId}-folha-${draft.exercise.page}.png`)
    })
  }

  return (
    <section className="academy-screen" aria-labelledby="academy-title">
      <div className="course-hero">
        <div>
          <p className="eyebrow">Caligrafia completa</p>
          <h2 id="academy-title">Exercícios de caligrafia</h2>
          <p>Escolha o treino e escreva com sua caneta diretamente sobre o exercício.</p>
        </div>
      </div>
      <details className="course-preparation">
        <summary>Como praticar e guardar seu progresso</summary>
        <div className="course-preparation-body">
          <p>Pratique a folha inteira ou selecione um trecho. Use Cobrir para escrever sobre o modelo, no seu ritmo.</p>
          <p>Use a caneta digital. Para mouse ou dedo, ative Modo teste. Guarde uma cópia do progresso em Ajustes.</p>
        </div>
      </details>
      <details
        className="academy-books"
        open={catalogOpen}
        onToggle={(e) => setCatalogOpen(e.currentTarget.open)}
      >
        <summary>Escolher treino · {book.title}</summary>
        {(['base', 'bonus', 'complement'] as const).map((group) => (
          <section
            key={group}
            aria-label={
              group === 'base'
                ? 'Fundamentos'
                : group === 'bonus'
                  ? 'Leitura e escrita'
                  : 'Complementos'
            }
          >
            <h3>
              {group === 'base'
                ? 'Fundamentos'
                : group === 'bonus'
                  ? 'Reforço, leitura e escrita'
                  : 'Complementos · Floreios e tinteiro'}
            </h3>
            {group === 'bonus' && (
              <p>
                Inclui atividades infantis de alfabetização. Escolha as pertinentes ao seu treino.
                Curvas 1 e 2 são cópias idênticas na fonte.
              </p>
            )}
            <div className="academy-book-grid">
              {WORKBOOKS.filter((b) => b.group === group).map((b) => (
                <div className={`academy-book ${b.id === book.id ? 'is-selected' : ''}`} key={b.id}>
                  <button
                    onClick={() => {
                      setCatalogOpen(false)
                      practice(defaultWorksheet(b, b.firstPractice))
                    }}
                    aria-pressed={b.id === book.id}
                  >
                    <strong>{b.title}</strong>
                    <span>
                      {b.pages - b.firstPractice + 1} folhas ·{' '}
                      Praticar com caneta
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </details>
      {error && (
        <p className="academy-error" role="alert">
          {error}
        </p>
      )}
      {opening && <p role="status">Preparando exercícios…</p>}
      {pdf && (
        <>
          <div className="academy-toolbar">
            <label>
              Folha de treino{' '}
              <select value={page} onChange={(e) => selectPage(book.id, Number(e.target.value))}>
                {Array.from({ length: book.pages - book.firstPractice + 1 }, (_, offset) => { const i = offset + book.firstPractice - 1; return (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} / {book.pages}
                  </option>
                )})}
              </select>
            </label>
            <button
              className="secondary-button"
              disabled={page <= book.firstPractice}
              onClick={() => selectPage(book.id, page - 1)}
            >
              Anterior
            </button>
            <button
              className="secondary-button"
              disabled={page >= book.pages}
              onClick={() => selectPage(book.id, page + 1)}
            >
              Próxima
            </button>
            <button
              className="text-button"
              onClick={() => {
                stopReplay()
                setShowHistory(!showHistory)
              }}
            >
              {showHistory ? 'Fechar histórico' : 'Tentativas da caligrafia'} (
              {data.attempts.length})
            </button>
          </div>
          {showHistory && (
            <div className="academy-history">
              {data.attempts.length === 0 ? (
                <p>Nenhuma tentativa salva.</p>
              ) : (
                data.attempts.slice(0, 100).map((attempt) => (
                  <div key={attempt.id}>
                    <span>
                      {attempt.exercise.title} · {BLOCK_NAMES[attempt.block]} ·{' '}
                      {new Date(attempt.createdAt).toLocaleString('pt-BR')}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => {
                        change({
                          ...archiveWorksheet(data),
                          selectedBook: attempt.exercise.bookId,
                          selectedPage: attempt.exercise.page,
                          draft: {
                            exercise: attempt.exercise,
                            block: 0,
                            strokes: attempt.strokes.map((s) => ({
                              ...s,
                              points: s.points.map((p) => ({ ...p })),
                            })),
                            redo: [],
                          },
                        })
                        setShowHistory(false)
                      }}
                    >
                      Reabrir
                    </button>
                  </div>
                ))
              )}
              {data.attempts.length > 100 && (
                <p>Exibindo as 100 mais recentes. Todas estão no backup.</p>
              )}
            </div>
          )}
          {loading && <p role="status">Preparando a folha…</p>}
          {!draft && preview && (
            <div className="academy-page-layout">
              <div
                className="academy-page"
                onPointerDown={(e) => {
                  if (e.button !== 0 || !e.isPrimary) return
                  e.currentTarget.setPointerCapture(e.pointerId)
                  drag.current = point(e)
                  setCrop([drag.current[0], drag.current[1], 0, 0])
                }}
                onPointerMove={updateCrop}
                onPointerUp={(e) => {
                  updateCrop(e)
                  drag.current = null
                }}
                onPointerCancel={() => {
                  drag.current = null
                  setCrop(FULL_PAGE)
                }}
              >
                <img
                  src={preview}
                  alt={`${book.title}, folha ${page}. Arraste para selecionar um exercício.`}
                  draggable={false}
                />
                <div
                  className="academy-crop"
                  style={{
                    left: `${crop[0] * 100}%`,
                    top: `${crop[1] * 100}%`,
                    width: `${crop[2] * 100}%`,
                    height: `${crop[3] * 100}%`,
                  }}
                />
              </div>
              <aside className="academy-crop-options">
                <h3>Pratique o exercício da folha</h3>
                <p>
                  Arraste sobre a página para isolar uma letra ou um movimento. Ajuste pelos
                  controles se preferir.
                </p>
                {(['Esquerda', 'Topo', 'Largura', 'Altura'] as const).map((label, i) => (
                  <label key={label}>
                    {label} ({Math.round(crop[i] * 100)}%)
                    <input
                      type="range"
                      min={i < 2 ? 0 : 1}
                      max={100}
                      value={crop[i] * 100}
                      onChange={(e) => {
                        const next: Crop = [...crop]
                        next[i] = Number(e.target.value) / 100
                        if (i < 2) next[i] = Math.min(next[i], 1 - next[i + 2])
                        else next[i] = Math.min(next[i], 1 - next[i - 2])
                        setCrop(next)
                      }}
                    />
                  </label>
                ))}
                <label>
                  Nome do exercício
                  <input
                    maxLength={150}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: S maiúsculo, ondas, linha 3"
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={crop[2] < 0.01 || crop[3] < 0.01}
                  onClick={startCrop}
                >
                  Praticar recorte
                </button>
                <button
                  className="secondary-button"
                  onClick={() => practice(defaultWorksheet(book, page))}
                >
                  Praticar folha inteira
                </button>
                <p>Selecione o trecho que deseja repetir.</p>
              </aside>
            </div>
          )}
          {!draft && data.exercises.filter((e) => e.bookId === book.id).length > 0 && (
            <div className="academy-saved">
              <h3>Meus trechos de treino</h3>
              {data.exercises
                .filter((e) => e.bookId === book.id)
                .map((e) => (
                  <button
                    className="secondary-button"
                    key={worksheetKey(e)}
                    onClick={() => practice(e)}
                  >
                    {e.title}
                  </button>
                ))}
            </div>
          )}
          {draft && (
            <section className="academy-practice" aria-label="Prática da caligrafia">
              <div className="academy-toolbar">
                <h3>{draft.exercise.title}</h3>
                <strong>Cobrir</strong>
                <button
                  className="text-button"
                  onClick={() => change({ ...archiveWorksheet(data), draft: undefined })}
                >
                  Voltar à folha
                </button>
              </div>
              <p>Cubra o exercício com a caneta. Seus traços são salvos automaticamente.</p>
              <div className="academy-toolbar">
                <button
                  className="secondary-button"
                  aria-pressed={tool === 'pen'}
                  onClick={() => setTool('pen')}
                >
                  Caneta
                </button>
                <button
                  className="secondary-button"
                  aria-pressed={tool === 'eraser'}
                  onClick={() => setTool('eraser')}
                >
                  Borracha
                </button>
                <button
                  className="secondary-button"
                  disabled={!draft.strokes.length || replay !== null}
                  onClick={() =>
                    updateDraft({
                      strokes: draft.strokes.slice(0, -1),
                      redo: [...draft.redo, draft.strokes.at(-1)!],
                    })
                  }
                >
                  Desfazer
                </button>
                <button
                  className="secondary-button"
                  disabled={!draft.redo.length || replay !== null}
                  onClick={() =>
                    updateDraft({
                      strokes: [...draft.strokes, draft.redo.at(-1)!],
                      redo: draft.redo.slice(0, -1),
                    })
                  }
                >
                  Refazer
                </button>
                <button
                  className="secondary-button"
                  disabled={!draft.strokes.length}
                  onClick={() => change(archiveWorksheet(data))}
                >
                  Limpar e guardar
                </button>
                <label>
                  <input
                    type="checkbox"
                    checked={testInput}
                    onChange={(e) => setTestInput(e.target.checked)}
                  />{' '}
                  Modo teste (dedo/mouse)
                </label>
                <PenPicker value={penType} onChange={setPenType} />
                <label>
                  Guia
                  <input
                    aria-label="Opacidade da referência"
                    type="range"
                    min=".1"
                    max=".8"
                    step=".05"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                  />
                </label>
              </div>
              <p role="status">{pointer}</p>
              {reference && (
                <div ref={stage} className="academy-stage">
                  <img className="academy-sizing-image" src={reference} alt="" aria-hidden="true" />
                  {reference && (
                    <img
                      className="academy-overlay"
                      src={reference}
                      alt="Modelo do exercício"
                      style={{ opacity }}
                    />
                  )}
                  <SignatureCanvas
                    key={key}
                    strokes={replay ?? draft.strokes}
                    color="#17213b"
                    lineWidth={pen.width}
                    penType={penType}
                    tool={tool}
                    testInput={testInput}
                    disabled={replay !== null}
                    sessionKey={`${key}:${draft.block}:${data.attempts.length}`}
                    onStrokeComplete={(s) =>
                      updateDraft({ strokes: [...draft.strokes, s], redo: [] })
                    }
                    onPointerKind={(kind, accepted) =>
                      setPointer(
                        accepted
                          ? `${kind === 'pen' ? 'Caneta' : kind === 'mouse' ? 'Mouse' : 'Toque'} detectado`
                          : 'Use a caneta ou ative Modo teste',
                      )
                    }
                  />
                </div>
              )}
              <div className="academy-toolbar">
                <button
                  className="primary-button"
                  disabled={
                    !reference ||
                    !draft.strokes.some((s) => s.tool !== 'eraser') ||
                    replay !== null
                  }
                  onClick={() => change(completeWorksheet(data))}
                >
                  Guardar prática
                </button>
                <button
                  className="secondary-button"
                  disabled={!draft.strokes.length}
                  onClick={() => (replay !== null ? stopReplay() : startReplay(draft.strokes))}
                >
                  {replay !== null ? 'Parar replay' : 'Rever meus traços'}
                </button>
                <button
                  className="secondary-button"
                  disabled={!draft.strokes.length}
                  onClick={exportInk}
                >
                  Exportar tinta PNG
                </button>
              </div>
              <label className="lesson-notes">
                Minha revisão
                <textarea
                  maxLength={3000}
                  value={entry.notes}
                  placeholder="Fluidez, proporção, inclinação e um ajuste para a próxima sessão."
                  onChange={(e) =>
                    onChange({
                      ...data,
                      progress: {
                        ...data.progress,
                        [key]: {
                          ...entry,
                          counts: [...entry.counts] as [number, number, number],
                          notes: e.target.value,
                          updatedAt: new Date().toISOString(),
                        },
                      },
                    })
                  }
                />
              </label>
            </section>
          )}
        </>
      )}
    </section>
  )
}
