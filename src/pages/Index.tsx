import { getCourseFocus } from '@/data/course-focus'
import CoursePracticePanel from '@/components/CoursePracticePanel'
import { startCoursePractice, completeCourseRepetition } from '@/lib/course-practice'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart, Play, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import AppShell, { AppTab } from '@/components/AppShell'
import AttemptThumbnail from '@/components/AttemptThumbnail'
import CourseView from '@/components/CourseView'
import HistoryView from '@/components/HistoryView'
import SettingsView from '@/components/SettingsView'
import TrainStudio from '@/components/TrainStudio'
import {
  AppData,
  CustomReference,
  DraftState,
  ModelId,
  PointerKind,
  REFERENCE_MODELS,
  ReferenceFrame,
  SavedAttempt,
  SignaturePoint,
  SignatureStroke,
  TrainingMode,
  cloneStrokes,
  createDefaultData,
  makeId,
  strokesDuration,
} from '@/data/signature'
import { downloadBlob, exportSignaturePng } from '@/lib/signature-drawing'
import {
  StorageKind,
  createBackupEnvelope,
  freshDataKeepingPreferences,
  loadAppData,
  mergeBackup,
  parseBackup,
  persistAppData,
} from '@/lib/signature-storage'

interface ReplayState {
  active: boolean
  speed: number
  strokes: SignatureStroke[]
  guide: SignaturePoint | null
  token: number
}

interface ConfirmState {
  title: string
  description: string
  actionLabel: string
  destructive?: boolean
  onConfirm: () => void
}

interface SaveDialogState {
  open: boolean
  name: string
}

function fileStamp(): string {
  const date = new Date()
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado'))
    reader.readAsText(file)
  })
}

function readImageAsDataUrl(
  file: File,
): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (file.size > 6_000_000) {
      reject(new Error('A imagem deve ter no máximo 6 MB'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem'))
    reader.onload = () => {
      const dataUrl = String(reader.result)
      const image = new Image()
      image.onload = () =>
        resolve({ dataUrl, width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error('O arquivo selecionado não é uma imagem válida'))
      image.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}

const Index = () => {
  const [data, setData] = useState<AppData>(createDefaultData)
  const [hydrated, setHydrated] = useState(false)
  const [activeTab, setActiveTab] = useState<AppTab>('train')
  const [selectedLesson, setSelectedLesson] = useState(1)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [storageKind, setStorageKind] = useState<StorageKind>('indexeddb')
  const [testInput, setTestInput] = useState(false)
  const [pointerKind, setPointerKind] = useState<PointerKind>('desconhecido')
  const [pointerAccepted, setPointerAccepted] = useState<boolean | null>(null)
  const [memoryRevealed, setMemoryRevealed] = useState(false)
  const [timerMs, setTimerMs] = useState(0)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [saveDialog, setSaveDialog] = useState<SaveDialogState>({ open: false, name: '' })
  const [replay, setReplay] = useState<ReplayState>({
    active: false,
    speed: 1,
    strokes: [],
    guide: null,
    token: 0,
  })
  const importInputRef = useRef<HTMLInputElement>(null)
  const stateRef = useRef(data)
  const saveRevisionRef = useRef(0)
  const replayFrameRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = data
  }, [data])

  useEffect(() => {
    let cancelled = false
    loadAppData()
      .then(({ data: stored, storage }) => {
        if (cancelled) return
        setStorageKind(storage)
        if (stored) {
          setData(stored)
          setSavedAt(new Date(stored.draft.updatedAt))
          if (stored.draft.strokes.length > 0) toast.success('Sessão anterior restaurada')
        }
        setHydrated(true)
      })
      .catch(() => {
        if (cancelled) return
        setHydrated(true)
        setSaveStatus('error')
        toast.error('Não foi possível recuperar os dados deste navegador')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const revision = ++saveRevisionRef.current
    setSaveStatus('saving')
    persistAppData(data)
      .then((storage) => {
        if (revision !== saveRevisionRef.current) return
        setStorageKind(storage)
        setSavedAt(new Date())
        setSaveStatus('saved')
        if (storage === 'localStorage') {
          toast.warning('IndexedDB indisponível; usando armazenamento local alternativo', {
            id: 'storage-fallback',
          })
        }
      })
      .catch(() => {
        if (revision !== saveRevisionRef.current) return
        setSaveStatus('error')
        toast.error('O armazenamento está cheio ou indisponível. Exporte um backup.')
      })
  }, [data, hydrated])

  const updateDraft = useCallback((updater: (draft: DraftState) => DraftState) => {
    setData((current) => ({
      ...current,
      draft: { ...updater(current.draft), updatedAt: new Date().toISOString() },
    }))
  }, [])

  useEffect(() => {
    const active = data.draft.mode === 'memory' || testInput
    if (!active) {
      setTimerMs(0)
      return
    }
    const started = performance.now() - timerMs
    const interval = window.setInterval(() => setTimerMs(performance.now() - started), 250)
    return () => window.clearInterval(interval)
    // The timer intentionally resumes from the current visual value when either mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.draft.mode, testInput])

  const stopReplay = useCallback(() => {
    if (replayFrameRef.current !== null) cancelAnimationFrame(replayFrameRef.current)
    replayFrameRef.current = null
    setReplay((current) => ({
      ...current,
      active: false,
      strokes: [],
      guide: null,
      token: current.token + 1,
    }))
  }, [])

  const startReplay = useCallback(
    (speed: number, source?: SignatureStroke[]) => {
      if (replayFrameRef.current !== null) cancelAnimationFrame(replayFrameRef.current)
      const strokes = cloneStrokes(source ?? stateRef.current.draft.strokes)
      if (strokes.length === 0) return

      const firstTime = Math.min(
        ...strokes.flatMap((stroke) => stroke.points.map((point) => point.t)),
      )
      const lastTime = Math.max(
        ...strokes.flatMap((stroke) => stroke.points.map((point) => point.t)),
      )
      const activeReplay = replay.active && !source
      const currentTimelineTime = replay.guide?.t ?? firstTime
      const token = Date.now()
      setReplay({
        active: true,
        speed,
        strokes: activeReplay ? replay.strokes : [],
        guide: activeReplay ? replay.guide : null,
        token,
      })
      const started = performance.now() - Math.max(0, currentTimelineTime - firstTime) / speed

      const animate = (now: number) => {
        const elapsed = (now - started) * speed
        const cutoff = firstTime + elapsed
        const visible = strokes.flatMap((stroke) => {
          if ((stroke.points[0]?.t ?? Infinity) > cutoff) return []
          const points = stroke.points.filter((point) => point.t <= cutoff)
          return points.length > 0 ? [{ ...stroke, points }] : []
        })
        const guide = visible.at(-1)?.points.at(-1) ?? null
        setReplay((current) =>
          current.token === token
            ? { ...current, active: true, speed, strokes: visible, guide }
            : current,
        )
        if (cutoff < lastTime) replayFrameRef.current = requestAnimationFrame(animate)
        else {
          replayFrameRef.current = null
          setReplay((current) =>
            current.token === token
              ? { ...current, active: false, speed, strokes: [], guide: null }
              : current,
          )
        }
      }
      replayFrameRef.current = requestAnimationFrame(animate)
    },
    [replay.active, replay.guide, replay.strokes],
  )

  useEffect(
    () => () => {
      if (replayFrameRef.current !== null) cancelAnimationFrame(replayFrameRef.current)
    },
    [],
  )

  const undo = useCallback(() => {
    if (replay.active) return
    updateDraft((draft) => {
      if (draft.strokes.length === 0) return draft
      const removed = draft.strokes.at(-1)!
      return {
        ...draft,
        strokes: draft.strokes.slice(0, -1),
        redoStack: [...draft.redoStack, removed],
      }
    })
  }, [replay.active, updateDraft])

  const redo = useCallback(() => {
    if (replay.active) return
    updateDraft((draft) => {
      if (draft.redoStack.length === 0) return draft
      const restored = draft.redoStack.at(-1)!
      return {
        ...draft,
        strokes: [...draft.strokes, restored],
        redoStack: draft.redoStack.slice(0, -1),
      }
    })
  }, [replay.active, updateDraft])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, textarea, select')) return
      if (event.key.toLowerCase() === 't') {
        event.preventDefault()
        setTestInput((value) => !value)
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [redo, undo])

  const requestClear = () => {
    if (data.draft.strokes.length === 0) return
    setConfirmState({
      title: 'Limpar a tela?',
      description:
        'Os traços atuais serão retirados, mas poderão ser recuperados pelo botão Restaurar.',
      actionLabel: 'Limpar tela',
      destructive: true,
      onConfirm: () => {
        updateDraft((draft) => ({
          ...draft,
          clearedBuffer: cloneStrokes(draft.strokes),
          strokes: [],
          redoStack: [],
        }))
        setConfirmState(null)
        toast.success('Tela limpa. Você ainda pode restaurar os traços.')
      },
    })
  }

  const restoreCleared = () => {
    updateDraft((draft) =>
      draft.clearedBuffer
        ? {
            ...draft,
            strokes: cloneStrokes(draft.clearedBuffer),
            clearedBuffer: null,
            redoStack: [],
          }
        : draft,
    )
    toast.success('Traços restaurados')
  }

  const openSaveAttempt = () => {
    const now = new Date()
    const suggested = `${data.draft.coursePractice ? `Sessão ${data.draft.coursePractice.sessionId} · ` : ''}Versão ${data.attempts.length + 1} — ${now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    setSaveDialog({ open: true, name: suggested })
  }

  const saveAttempt = () => {
    const name = saveDialog.name.trim()
    if (!name || data.draft.strokes.length === 0) return
    const attempt: SavedAttempt = {
      courseSessionId: data.draft.coursePractice?.sessionId,
      id: makeId('tentativa'),
      name,
      modelId: data.draft.modelId,
      createdAt: new Date().toISOString(),
      duration: strokesDuration(data.draft.strokes),
      strokes: cloneStrokes(data.draft.strokes),
      favorite: data.draft.favorite,
      inkColor: data.draft.inkColor,
      lineWidth: data.draft.lineWidth,
    }
    setData((current) => ({ ...current, attempts: [attempt, ...current.attempts] }))
    setSaveDialog({ open: false, name: '' })
    toast.success('Versão salva', {
      action: { label: 'Ver histórico', onClick: () => setActiveTab('history') },
    })
  }

  const loadAttempt = (attempt: SavedAttempt, shouldReplay: boolean) => {
    const perform = () => {
      stopReplay()
      setData((current) => ({
        ...current,
        draft: {
          ...current.draft,
          strokes: cloneStrokes(attempt.strokes),
          coursePractice: undefined,
          redoStack: [],
          clearedBuffer: null,
          modelId: attempt.modelId,
          inkColor: attempt.inkColor,
          lineWidth: attempt.lineWidth,
          favorite: attempt.favorite,
          startedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }))
      setActiveTab('train')
      setHistoryDrawerOpen(false)
      if (shouldReplay) window.setTimeout(() => startReplay(1, attempt.strokes), 120)
      else
        toast.success('Versão carregada', {
          action: { label: 'Reproduzir', onClick: () => startReplay(1, attempt.strokes) },
          duration: 5_000,
        })
    }

    if (data.draft.strokes.length > 0) {
      setConfirmState({
        title: 'Carregar esta versão?',
        description:
          'O rascunho atual será substituído. Se ele for importante, salve-o no histórico antes.',
        actionLabel: 'Carregar versão',
        onConfirm: () => {
          setConfirmState(null)
          perform()
        },
      })
    } else perform()
  }

  const deleteAttempt = (attempt: SavedAttempt) => {
    setConfirmState({
      title: `Excluir “${attempt.name}”?`,
      description: 'Esta ação remove a tentativa deste navegador e não pode ser desfeita.',
      actionLabel: 'Excluir tentativa',
      destructive: true,
      onConfirm: () => {
        setData((current) => ({
          ...current,
          attempts: current.attempts.filter((item) => item.id !== attempt.id),
        }))
        setConfirmState(null)
        toast.success('Tentativa excluída')
      },
    })
  }

  const toggleAttemptFavorite = (attempt: SavedAttempt) => {
    setData((current) => ({
      ...current,
      attempts: current.attempts.map((item) =>
        item.id === attempt.id ? { ...item, favorite: !item.favorite } : item,
      ),
    }))
  }

  const exportPng = async (withPaper: boolean) => {
    try {
      const model = REFERENCE_MODELS.find((item) => item.id === data.draft.modelId)!
      const custom = data.draft.coursePractice
        ? undefined
        : data.customReferences[data.draft.modelId]
      const includeReference =
        withPaper && data.draft.mode === 'cover' && data.draft.referenceVisible
      const blob = await exportSignaturePng({
        strokes: data.draft.strokes,
        withPaper,
        referenceSource: includeReference ? (custom?.dataUrl ?? model.asset) : undefined,
        referenceOpacity: data.draft.referenceOpacity,
        referenceFrame: custom?.frame,
        referenceFocus: getCourseFocus(data.draft.coursePractice?.sessionId),
      })
      downloadBlob(blob, `assinatura-fellipe-serpa-${fileStamp()}.png`)
      toast.success(withPaper ? 'PNG com papel exportado' : 'PNG transparente exportado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível exportar o PNG')
    }
  }

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(createBackupEnvelope(data), null, 2)], {
      type: 'application/json',
    })
    downloadBlob(blob, `backup-assinatura-${dateStamp()}.json`)
    toast.success('Backup JSON exportado')
  }

  const exportHistory = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            kind: 'assinatura-serpa-historico',
            version: 1,
            exportedAt: new Date().toISOString(),
            attempts: data.attempts,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    )
    downloadBlob(blob, `historico-assinatura-${dateStamp()}.json`)
    toast.success('Histórico exportado')
  }

  const importBackup = async (file: File) => {
    try {
      if (file.size > 15_000_000) throw new Error('O backup deve ter no máximo 15 MB')
      const text = await readFileAsText(file)
      const parsed = JSON.parse(text) as unknown
      const imported = parseBackup(parsed)
      const merged = mergeBackup(data, imported)
      setData(merged.data)
      toast.success(
        `Backup restaurado com sucesso · ${merged.added} ${merged.added === 1 ? 'tentativa adicionada' : 'tentativas adicionadas'}`,
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'O arquivo de backup é inválido')
    }
  }

  const uploadReference = async (modelId: ModelId, file: File) => {
    try {
      const image = await readImageAsDataUrl(file)
      const reference: CustomReference = {
        dataUrl: image.dataUrl,
        fileName: file.name,
        width: image.width,
        height: image.height,
        frame: { zoom: 1, offsetX: 0, offsetY: 0 },
      }
      setData((current) => ({
        ...current,
        customReferences: { ...current.customReferences, [modelId]: reference },
      }))
      toast.success('Referência alternativa salva neste aparelho')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível importar a referência')
    }
  }

  const restoreDefaultReference = (modelId: ModelId) => {
    setData((current) => {
      const next = { ...current.customReferences }
      delete next[modelId]
      return { ...current, customReferences: next }
    })
    toast.success('Referência original restaurada')
  }

  const frameReference = (modelId: ModelId, frame: ReferenceFrame) => {
    setData((current) => {
      const existing = current.customReferences[modelId]
      if (!existing) return current
      return {
        ...current,
        customReferences: { ...current.customReferences, [modelId]: { ...existing, frame } },
      }
    })
  }

  const resetDraft = () => {
    if (data.draft.strokes.length === 0) {
      toast.info('O rascunho já está vazio')
      return
    }
    setConfirmState({
      title: 'Descartar o rascunho?',
      description: 'O histórico, o curso e suas referências alternativas serão preservados.',
      actionLabel: 'Descartar rascunho',
      destructive: true,
      onConfirm: () => {
        stopReplay()
        setData((current) => freshDataKeepingPreferences(current))
        setConfirmState(null)
        toast.success('Rascunho descartado')
      },
    })
  }

  const beginCoursePractice = (id: number, stepIndex: number, modelId: ModelId) => {
    const hadInk = data.draft.strokes.length > 0
    stopReplay()
    setData((current) => startCoursePractice(current, id, stepIndex, modelId))
    setSelectedLesson(id)
    setMemoryRevealed(false)
    setTimerMs(0)
    setActiveTab('train')
    setHistoryDrawerOpen(false)
    if (hadInk) toast.success('Rascunho anterior guardado no Histórico')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selectTab = (tab: AppTab) => {
    setActiveTab(tab)
    setHistoryDrawerOpen(false)
  }

  const drawerHistory = (
    <div className="drawer-attempts">
      {data.attempts.length === 0 ? (
        <div className="drawer-empty">
          <p>Nenhuma versão salva ainda.</p>
          <span>Desenhe e clique em “Salvar tentativa”.</span>
        </div>
      ) : (
        data.attempts.slice(0, 20).map((attempt) => (
          <article key={attempt.id} className="drawer-attempt">
            <AttemptThumbnail strokes={attempt.strokes} />
            <div>
              <strong>{attempt.name}</strong>
              <span>{REFERENCE_MODELS.find((model) => model.id === attempt.modelId)?.name}</span>
            </div>
            <button
              onClick={() => loadAttempt(attempt, true)}
              aria-label={`Reproduzir ${attempt.name}`}
            >
              <Play size={16} />
            </button>
            <button onClick={() => toggleAttemptFavorite(attempt)} aria-label="Favoritar">
              <Heart size={16} fill={attempt.favorite ? 'currentColor' : 'none'} />
            </button>
            <button onClick={() => deleteAttempt(attempt)} aria-label="Excluir">
              <Trash2 size={16} />
            </button>
          </article>
        ))
      )}
      {data.attempts.length > 0 && (
        <button
          className="secondary-button full-width"
          onClick={() => {
            selectTab('history')
          }}
        >
          Abrir histórico completo
        </button>
      )}
    </div>
  )

  const title =
    activeTab === 'train'
      ? 'Treinar'
      : activeTab === 'course'
        ? 'Curso'
        : activeTab === 'history'
          ? 'Histórico'
          : 'Ajustes'

  return (
    <AppShell
      activeTab={activeTab}
      title={title}
      saveStatus={saveStatus}
      savedAt={savedAt}
      historyOpen={historyDrawerOpen}
      onTabChange={selectTab}
      onCloseHistory={() => setHistoryDrawerOpen(false)}
      historyContent={drawerHistory}
    >
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void importBackup(file)
          event.currentTarget.value = ''
        }}
      />

      {!hydrated ? (
        <div className="loading-screen">
          <span className="loading-mark">FS</span>
          <p>Preparando seu estúdio…</p>
        </div>
      ) : activeTab === 'train' ? (
        <>
          <CoursePracticePanel
            draft={data.draft}
            onReturn={(id) => {
              setSelectedLesson(id)
              setActiveTab('course')
            }}
            onNext={beginCoursePractice}
            onExit={() => updateDraft((draft) => ({ ...draft, coursePractice: undefined }))}
          />
          <TrainStudio
            lessonJournal={
              data.draft.coursePractice
                ? data.courseJournal?.[data.draft.coursePractice.sessionId]
                : undefined
            }
            onRestartRepetitions={() => {
              const context = data.draft.coursePractice
              if (!context) return
              setConfirmState({
                title: 'Recomeçar as 20 repetições?',
                description:
                  'A contagem desta aula volta a zero. Suas tentativas e anotações continuam guardadas.',
                actionLabel: 'Recomeçar série',
                onConfirm: () => {
                  stopReplay()
                  setData((current) => {
                    const entry = current.courseJournal?.[context.sessionId] ?? {
                      notes: '',
                      checks: [],
                      updatedAt: '',
                    }
                    const next = startCoursePractice(
                      current,
                      context.sessionId,
                      0,
                      context.completeModel,
                    )
                    next.courseJournal = {
                      ...current.courseJournal,
                      [context.sessionId]: {
                        ...entry,
                        repetitions: {},
                        updatedAt: new Date().toISOString(),
                      },
                    }
                    return next
                  })
                  setMemoryRevealed(false)
                  setTimerMs(0)
                  setConfirmState(null)
                },
              })
            }}
            onCompleteRepetition={() => {
              setData((current) => completeCourseRepetition(current))
              setMemoryRevealed(false)
              setTimerMs(0)
            }}
            draft={data.draft}
            customReferences={data.draft.coursePractice ? {} : data.customReferences}
            displayStrokes={replay.active ? replay.strokes : data.draft.strokes}
            replaying={replay.active}
            replaySpeed={replay.speed}
            replayGuide={replay.guide}
            testInput={testInput}
            pointerKind={pointerKind}
            pointerAccepted={pointerAccepted}
            memoryRevealed={memoryRevealed}
            timerMs={timerMs}
            onSelectModel={(modelId) =>
              updateDraft((draft) => ({
                ...draft,
                modelId,
                coursePractice: modelId === draft.modelId ? draft.coursePractice : undefined,
              }))
            }
            onModeChange={(mode: TrainingMode) => {
              updateDraft((draft) => ({
                ...draft,
                mode,
                coursePractice: mode === draft.mode ? draft.coursePractice : undefined,
              }))
              setMemoryRevealed(false)
              if (mode === 'memory') setTimerMs(0)
            }}
            onOpacityChange={(referenceOpacity) =>
              updateDraft((draft) => ({ ...draft, referenceOpacity }))
            }
            onToggleReference={() => {
              if (data.draft.mode === 'memory') setMemoryRevealed((value) => !value)
              else updateDraft((draft) => ({ ...draft, referenceVisible: !draft.referenceVisible }))
            }}
            onInkColorChange={(inkColor) => updateDraft((draft) => ({ ...draft, inkColor }))}
            onLineWidthChange={(lineWidth) => updateDraft((draft) => ({ ...draft, lineWidth }))}
            onStrokeComplete={(stroke) =>
              updateDraft((draft) => ({
                ...draft,
                strokes: [...draft.strokes, stroke],
                redoStack: [],
              }))
            }
            onPointerKind={(kind, accepted) => {
              setPointerKind(kind)
              setPointerAccepted(accepted)
            }}
            onToggleTestInput={() => {
              setTestInput((value) => !value)
              setTimerMs(0)
              setPointerAccepted(null)
            }}
            onUndo={undo}
            onRedo={redo}
            onRequestClear={requestClear}
            onRestore={restoreCleared}
            onToggleFavorite={() =>
              updateDraft((draft) => ({ ...draft, favorite: !draft.favorite }))
            }
            onSaveAttempt={openSaveAttempt}
            onStartReplay={startReplay}
            onStopReplay={stopReplay}
            onExportPng={(withPaper) => void exportPng(withPaper)}
            onReferenceUpload={(modelId, file) => void uploadReference(modelId, file)}
            onReferenceFrameChange={frameReference}
            onRestoreDefaultReference={restoreDefaultReference}
          />
        </>
      ) : activeTab === 'course' ? (
        <CourseView
          journal={data.courseJournal ?? {}}
          defaultCompleteModel={data.draft.coursePractice?.completeModel ?? 'a4'}
          selectedId={selectedLesson}
          onSelect={setSelectedLesson}
          onJournalChange={(id, entry) =>
            setData((current) => ({
              ...current,
              courseJournal: { ...current.courseJournal, [id]: entry },
            }))
          }
          completedSessions={data.completedSessions}
          onToggleSession={(id) =>
            setData((current) => ({
              ...current,
              completedSessions: current.completedSessions.includes(id)
                ? current.completedSessions.filter((session) => session !== id)
                : [...current.completedSessions, id].sort((a, b) => a - b),
            }))
          }
          onPractice={beginCoursePractice}
        />
      ) : activeTab === 'history' ? (
        <HistoryView
          attempts={data.attempts}
          onLoad={loadAttempt}
          onDelete={deleteAttempt}
          onToggleFavorite={toggleAttemptFavorite}
          onBackToTrain={() => selectTab('train')}
        />
      ) : (
        <SettingsView
          storageLabel={
            storageKind === 'indexeddb'
              ? 'IndexedDB neste navegador'
              : 'Armazenamento local alternativo'
          }
          attemptCount={data.attempts.length}
          onExportBackup={exportBackup}
          onImportBackup={() => importInputRef.current?.click()}
          onExportHistory={exportHistory}
          onResetDraft={resetDraft}
        />
      )}

      {confirmState && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setConfirmState(null)}
        >
          <div
            className="dialog-card compact-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2 id="confirm-title">{confirmState.title}</h2>
            <p>{confirmState.description}</p>
            <div className="dialog-actions">
              <button className="secondary-button" onClick={() => setConfirmState(null)}>
                Cancelar
              </button>
              <button
                className={confirmState.destructive ? 'danger-button' : 'primary-button'}
                onClick={confirmState.onConfirm}
              >
                {confirmState.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {saveDialog.open && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setSaveDialog({ open: false, name: '' })
          }
        >
          <form
            className="dialog-card compact-dialog"
            onSubmit={(event) => {
              event.preventDefault()
              saveAttempt()
            }}
          >
            <p className="eyebrow">Histórico local</p>
            <h2>Salvar tentativa</h2>
            <p>Escolha um nome para encontrar esta versão depois.</p>
            <label className="text-field">
              <span>Nome da versão</span>
              <input
                autoFocus
                maxLength={100}
                value={saveDialog.name}
                onChange={(event) =>
                  setSaveDialog((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label className="favorite-check">
              <input
                type="checkbox"
                checked={data.draft.favorite}
                onChange={() => updateDraft((draft) => ({ ...draft, favorite: !draft.favorite }))}
              />
              <Heart size={17} fill={data.draft.favorite ? 'currentColor' : 'none'} /> Marcar como
              favorita
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSaveDialog({ open: false, name: '' })}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={!saveDialog.name.trim()}>
                Salvar no Histórico
              </button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  )
}

export default Index
