import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileImage,
  Heart,
  ImagePlus,
  MoreHorizontal,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
} from 'lucide-react'
import {
  CustomReference,
  DraftState,
  INK_COLORS,
  ModelId,
  PointerKind,
  REFERENCE_MODELS,
  ReferenceFrame,
  SignaturePoint,
  SignatureStroke,
  TrainingMode,
} from '@/data/signature'
import ReferenceImage from '@/components/ReferenceImage'
import SignatureCanvas from '@/components/SignatureCanvas'
import { cn } from '@/lib/utils'

interface TrainStudioProps {
  draft: DraftState
  customReferences: Partial<Record<ModelId, CustomReference>>
  displayStrokes: SignatureStroke[]
  replaying: boolean
  replaySpeed: number
  replayGuide: SignaturePoint | null
  testInput: boolean
  pointerKind: PointerKind
  pointerAccepted: boolean | null
  memoryRevealed: boolean
  timerMs: number
  onSelectModel: (modelId: ModelId) => void
  onModeChange: (mode: TrainingMode) => void
  onOpacityChange: (opacity: number) => void
  onToggleReference: () => void
  onInkColorChange: (color: string) => void
  onLineWidthChange: (width: number) => void
  onStrokeComplete: (stroke: SignatureStroke) => void
  onPointerKind: (kind: PointerKind, accepted: boolean) => void
  onToggleTestInput: () => void
  onUndo: () => void
  onRedo: () => void
  onRequestClear: () => void
  onRestore: () => void
  onToggleFavorite: () => void
  onSaveAttempt: () => void
  onStartReplay: (speed: number) => void
  onStopReplay: () => void
  onExportPng: (withPaper: boolean) => void
  onReferenceUpload: (modelId: ModelId, file: File) => void
  onReferenceFrameChange: (modelId: ModelId, frame: ReferenceFrame) => void
  onRestoreDefaultReference: (modelId: ModelId) => void
}

const modeOptions: Array<{ id: TrainingMode; title: string; description: string }> = [
  { id: 'cover', title: 'Cobrir', description: 'Referência sob o traço' },
  { id: 'copy', title: 'Copiar', description: 'Referência fora do papel' },
  { id: 'memory', title: 'Memória', description: 'Oculta durante o treino' },
]

function formatTimer(milliseconds: number): string {
  const total = Math.floor(milliseconds / 1000)
  return `${Math.floor(total / 60)
    .toString()
    .padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`
}

function pointerLabel(kind: PointerKind): string {
  if (kind === 'pen') return 'Caneta detectada'
  if (kind === 'mouse') return 'Mouse detectado'
  if (kind === 'touch') return 'Toque detectado'
  return 'Aguardando entrada'
}

export default function TrainStudio({
  draft,
  customReferences,
  displayStrokes,
  replaying,
  replaySpeed,
  replayGuide,
  testInput,
  pointerKind,
  pointerAccepted,
  memoryRevealed,
  timerMs,
  onSelectModel,
  onModeChange,
  onOpacityChange,
  onToggleReference,
  onInkColorChange,
  onLineWidthChange,
  onStrokeComplete,
  onPointerKind,
  onToggleTestInput,
  onUndo,
  onRedo,
  onRequestClear,
  onRestore,
  onToggleFavorite,
  onSaveAttempt,
  onStartReplay,
  onStopReplay,
  onExportPng,
  onReferenceUpload,
  onReferenceFrameChange,
  onRestoreDefaultReference,
}: TrainStudioProps) {
  const [dimensions, setDimensions] = useState<
    Partial<Record<ModelId, { width: number; height: number }>>
  >({})
  const [moreOpen, setMoreOpen] = useState(false)
  const [referenceEditorOpen, setReferenceEditorOpen] = useState(false)
  const [editorFile, setEditorFile] = useState<File | null>(null)
  const [editorSource, setEditorSource] = useState<string | null>(null)
  const [editorDimensions, setEditorDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [editorFrame, setEditorFrame] = useState<ReferenceFrame>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  })
  const uploadInputRef = useRef<HTMLInputElement>(null)

  const selectedModel =
    REFERENCE_MODELS.find((model) => model.id === draft.modelId) ?? REFERENCE_MODELS[0]
  const selectedCustom = customReferences[draft.modelId]
  const selectedSource = selectedCustom?.dataUrl ?? selectedModel.asset
  const showCanvasReference = draft.mode === 'cover' && draft.referenceVisible
  const showExternalReference = draft.mode === 'copy' && draft.referenceVisible
  const showMemoryComparison = draft.mode === 'memory' && memoryRevealed
  const referenceVisibleForMode = draft.mode === 'memory' ? memoryRevealed : draft.referenceVisible

  const inputStatus = useMemo(() => {
    if (pointerAccepted === null)
      return testInput
        ? 'Mouse e toque liberados para teste'
        : 'Somente caneta digital no modo normal'
    if (pointerAccepted) return 'Entrada aceita nesta área'
    return testInput
      ? 'Entrada não reconhecida'
      : 'Entrada ignorada — ative Modo teste para mouse/toque'
  }, [pointerAccepted, testInput])

  useEffect(
    () => () => {
      if (editorSource?.startsWith('blob:')) URL.revokeObjectURL(editorSource)
    },
    [editorSource],
  )

  const beginReferenceUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (editorSource?.startsWith('blob:')) URL.revokeObjectURL(editorSource)
    setEditorFile(file)
    setEditorSource(URL.createObjectURL(file))
    setEditorDimensions(null)
    setEditorFrame({ zoom: 1, offsetX: 0, offsetY: 0 })
    setReferenceEditorOpen(true)
  }

  const openCurrentReferenceEditor = () => {
    setEditorFile(null)
    setEditorSource(selectedSource)
    setEditorDimensions(
      selectedCustom
        ? { width: selectedCustom.width, height: selectedCustom.height }
        : (dimensions[draft.modelId] ?? null),
    )
    setEditorFrame(selectedCustom?.frame ?? { zoom: 1, offsetX: 0, offsetY: 0 })
    setReferenceEditorOpen(true)
  }

  const applyReference = () => {
    if (editorFile) onReferenceUpload(draft.modelId, editorFile)
    if (!editorFile && selectedCustom) onReferenceFrameChange(draft.modelId, editorFrame)
    setReferenceEditorOpen(false)
  }

  return (
    <section className="train-screen" aria-labelledby="train-heading">
      <div className="train-intro">
        <div>
          <p className="eyebrow">Estúdio offline</p>
          <h1 id="train-heading">Treinar</h1>
          <p>Escolha um modelo e comece</p>
        </div>
        <div className="local-note">
          <Check size={15} /> Referências originais incluídas
        </div>
      </div>

      <div className="model-card-grid" aria-label="Modelos de assinatura">
        {REFERENCE_MODELS.map((model) => {
          const custom = customReferences[model.id]
          const source = custom?.dataUrl ?? model.asset
          const size = custom
            ? { width: custom.width, height: custom.height }
            : dimensions[model.id]
          return (
            <button
              className={cn('model-card', draft.modelId === model.id && 'is-selected')}
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              aria-pressed={draft.modelId === model.id}
            >
              <div className="model-card-top">
                <div>
                  <strong>{model.name}</strong>
                  <span>{model.subtitle}</span>
                </div>
                <span className="ready-badge">Pronto</span>
              </div>
              <ReferenceImage
                src={source}
                custom={custom}
                alt={`Miniatura da referência ${model.name}`}
                onLoad={(width, height) =>
                  setDimensions((current) => ({ ...current, [model.id]: { width, height } }))
                }
              />
              <div className="model-card-footer">
                <span>{custom ? 'Referência alternativa' : 'Original incluído'}</span>
                <span>{size ? `${size.width} × ${size.height} px` : 'Carregando…'}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mode-section">
        <div className="mode-heading">
          <div>
            <h2>Modo de treino</h2>
            <p>Escolha como a referência acompanha o exercício.</p>
          </div>
          <div className="reference-buttons">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) beginReferenceUpload(file)
                event.currentTarget.value = ''
              }}
            />
            <button className="text-button" onClick={() => uploadInputRef.current?.click()}>
              <Upload size={15} /> Enviar alternativa
            </button>
            {selectedCustom && (
              <button className="text-button" onClick={openCurrentReferenceEditor}>
                <ImagePlus size={15} /> Ajustar enquadramento
              </button>
            )}
          </div>
        </div>
        <div className="segment-control">
          {modeOptions.map((mode) => (
            <button
              key={mode.id}
              className={cn(draft.mode === mode.id && 'is-active')}
              onClick={() => onModeChange(mode.id)}
            >
              <strong>{mode.title}</strong>
              <span>{mode.description}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="studio-layout">
        <aside className="reference-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Referência ativa</p>
              <h2>{selectedModel.name}</h2>
            </div>
            <span className="ready-badge">Pronto</span>
          </div>
          <ReferenceImage
            src={selectedSource}
            custom={selectedCustom}
            alt={`Referência ${selectedModel.name}`}
          />
          <div className="opacity-control">
            <label htmlFor="reference-opacity">
              <span>Opacidade</span>
              <strong>{Math.round(draft.referenceOpacity * 100)}%</strong>
            </label>
            <input
              id="reference-opacity"
              type="range"
              min="0"
              max="100"
              value={Math.round(draft.referenceOpacity * 100)}
              onChange={(event) => onOpacityChange(Number(event.target.value) / 100)}
            />
          </div>
          <button className="secondary-button full-width" onClick={onToggleReference}>
            {referenceVisibleForMode ? <EyeOff size={17} /> : <Eye size={17} />}
            {draft.mode === 'memory'
              ? referenceVisibleForMode
                ? 'Ocultar comparação'
                : 'Revelar para comparar'
              : referenceVisibleForMode
                ? 'Ocultar referência'
                : 'Mostrar referência'}
          </button>
          <p className="panel-help">
            A imagem mantém a proporção e os traços originais. Não há replay inventado da
            referência.
          </p>
        </aside>

        <div className="canvas-column">
          {showExternalReference && (
            <div className="copy-reference-strip">
              <div>
                <span>Copie observando</span>
                <strong>{selectedModel.name}</strong>
              </div>
              <ReferenceImage
                src={selectedSource}
                custom={selectedCustom}
                alt={`Referência externa ${selectedModel.name}`}
                opacity={draft.referenceOpacity}
              />
            </div>
          )}

          <div className={cn('paper-frame', replaying && 'is-replaying')}>
            <div className="canvas-status-row">
              <div className={cn('pointer-status', pointerAccepted === false && 'is-warning')}>
                <span className="pointer-dot" /> {pointerLabel(pointerKind)}
                <small>{inputStatus}</small>
              </div>
              {(draft.mode === 'memory' || testInput) && (
                <span className="practice-timer">{formatTimer(timerMs)}</span>
              )}
            </div>
            {showCanvasReference && (
              <ReferenceImage
                src={selectedSource}
                custom={selectedCustom}
                alt="Referência sob a área de escrita"
                className="canvas-reference"
                opacity={draft.referenceOpacity}
              />
            )}
            <SignatureCanvas
              strokes={displayStrokes}
              color={draft.inkColor}
              lineWidth={draft.lineWidth}
              testInput={testInput}
              disabled={replaying}
              guidePoint={replayGuide}
              sessionKey={draft.startedAt}
              onStrokeComplete={onStrokeComplete}
              onPointerKind={onPointerKind}
            />
            {replaying && (
              <div className="replay-chip">
                <Sparkles size={14} /> Replay {replaySpeed}x
              </div>
            )}
            {draft.strokes.length === 0 && !replaying && (
              <div className="canvas-empty-hint">
                <PenHint />
                <span>Comece seu traço aqui</span>
              </div>
            )}
          </div>

          {showMemoryComparison && (
            <div className="memory-comparison">
              <div>
                <span>Referência revelada</span>
                <ReferenceImage
                  src={selectedSource}
                  custom={selectedCustom}
                  alt={`Comparação com ${selectedModel.name}`}
                />
              </div>
              <div>
                <span>Seu desenho permanece acima</span>
                <p>Compare visualmente sem nota automática.</p>
              </div>
            </div>
          )}

          <div className="tool-settings-row">
            <div className="ink-picker" aria-label="Cor da tinta">
              <span>Tinta</span>
              {INK_COLORS.map((ink) => (
                <button
                  key={ink.value}
                  className={cn(draft.inkColor === ink.value && 'is-active')}
                  style={{ '--ink-color': ink.value } as React.CSSProperties}
                  onClick={() => onInkColorChange(ink.value)}
                  aria-label={ink.name}
                  title={ink.name}
                />
              ))}
            </div>
            <label className="width-control">
              <span>
                Espessura <strong>{draft.lineWidth}px</strong>
              </span>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={draft.lineWidth}
                onChange={(event) => onLineWidthChange(Number(event.target.value))}
              />
              <i
                style={{
                  width: draft.lineWidth,
                  height: draft.lineWidth,
                  background: draft.inkColor,
                }}
              />
            </label>
            <button
              className={cn('test-input-button', testInput && 'is-active')}
              onClick={onToggleTestInput}
              aria-pressed={testInput}
            >
              <span className="test-input-icon">T</span>
              <span>
                <strong>Modo teste</strong>
                <small>{testInput ? 'Mouse e toque ativos' : 'Testar sem caneta'}</small>
              </span>
            </button>
          </div>

          <div className="toolbar" aria-label="Ferramentas do treino">
            <div className="tool-cluster">
              <button
                onClick={onUndo}
                disabled={draft.strokes.length === 0 || replaying}
                title="Desfazer (Ctrl/Cmd+Z)"
              >
                <Undo2 size={19} />
                <span>Desfazer</span>
              </button>
              <button
                onClick={onRedo}
                disabled={draft.redoStack.length === 0 || replaying}
                title="Refazer (Ctrl/Cmd+Shift+Z)"
              >
                <Redo2 size={19} />
                <span>Refazer</span>
              </button>
            </div>
            <div className="tool-divider" />
            <div className="tool-cluster">
              <button
                onClick={onRequestClear}
                disabled={draft.strokes.length === 0 || replaying}
                title="Limpar a tela"
              >
                <Trash2 size={19} />
                <span>Limpar</span>
              </button>
              <button
                onClick={onRestore}
                disabled={!draft.clearedBuffer || replaying}
                title="Restaurar o último conjunto limpo"
              >
                <RotateCcw size={19} />
                <span>Restaurar</span>
              </button>
            </div>
            <div className="tool-divider" />
            <div className="replay-control">
              {replaying ? (
                <button className="active-tool" onClick={onStopReplay}>
                  <Pause size={19} />
                  <span>Parar</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartReplay(replaySpeed)}
                  disabled={draft.strokes.length === 0}
                >
                  <Play size={19} />
                  <span>Replay</span>
                </button>
              )}
              <div className="speed-options" aria-label="Velocidade do replay">
                {[0.5, 1, 2].map((speed) => (
                  <button
                    key={speed}
                    className={cn(replaySpeed === speed && 'is-active')}
                    onClick={() => (replaying ? onStartReplay(speed) : onStartReplay(speed))}
                    disabled={draft.strokes.length === 0}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            <div className="tool-divider" />
            <div className="tool-cluster toolbar-actions">
              <button
                className={cn('favorite-tool', draft.favorite && 'is-active')}
                onClick={onToggleFavorite}
                title="Marcar próxima tentativa como favorita"
              >
                <Heart size={19} fill={draft.favorite ? 'currentColor' : 'none'} />
                <span>Favorita</span>
              </button>
              <button
                className="save-tool"
                onClick={onSaveAttempt}
                disabled={draft.strokes.length === 0 || replaying}
              >
                <Save size={19} />
                <span>Salvar tentativa</span>
              </button>
              <div className="menu-anchor">
                <button
                  onClick={() => setMoreOpen((value) => !value)}
                  disabled={draft.strokes.length === 0}
                >
                  <Download size={19} />
                  <span>Exportar</span>
                  <ChevronDown size={14} />
                </button>
                {moreOpen && (
                  <div className="action-menu">
                    <button
                      onClick={() => {
                        onExportPng(true)
                        setMoreOpen(false)
                      }}
                    >
                      <FileImage size={16} />
                      <span>
                        <strong>PNG com papel</strong>
                        <small>Inclui a referência visível</small>
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        onExportPng(false)
                        setMoreOpen(false)
                      }}
                    >
                      <FileImage size={16} />
                      <span>
                        <strong>PNG transparente</strong>
                        <small>Somente os seus traços</small>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mobile-toolbar">
            <button className={cn(testInput && 'is-active')} onClick={onToggleTestInput}>
              <span className="mobile-test-letter">T</span>
              <small>Teste</small>
            </button>
            <button onClick={onUndo} disabled={draft.strokes.length === 0}>
              <Undo2 />
              <small>Desfazer</small>
            </button>
            <button onClick={onRequestClear} disabled={draft.strokes.length === 0}>
              <Trash2 />
              <small>Limpar</small>
            </button>
            <button
              className={cn(replaying && 'is-active')}
              onClick={() => (replaying ? onStopReplay() : onStartReplay(replaySpeed))}
              disabled={draft.strokes.length === 0}
            >
              <Play />
              <small>{replaying ? 'Parar' : 'Replay'}</small>
            </button>
            <button
              className="primary-mobile"
              onClick={onSaveAttempt}
              disabled={draft.strokes.length === 0}
            >
              <Save />
              <small>Salvar</small>
            </button>
            <div className="menu-anchor">
              <button onClick={() => setMoreOpen((value) => !value)}>
                <MoreHorizontal />
                <small>Mais</small>
              </button>
              {moreOpen && (
                <div className="action-menu mobile-menu">
                  <button onClick={() => onExportPng(true)}>
                    <FileImage size={16} /> PNG com papel
                  </button>
                  <button onClick={() => onExportPng(false)}>
                    <FileImage size={16} /> PNG transparente
                  </button>
                  <button onClick={onRedo} disabled={draft.redoStack.length === 0}>
                    <Redo2 size={16} /> Refazer
                  </button>
                  <button onClick={onRestore} disabled={!draft.clearedBuffer}>
                    <RotateCcw size={16} /> Restaurar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {referenceEditorOpen && editorSource && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setReferenceEditorOpen(false)
          }
        >
          <div
            className="dialog-card reference-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-editor-title"
          >
            <button
              className="dialog-close"
              onClick={() => setReferenceEditorOpen(false)}
              aria-label="Fechar editor"
            >
              <X size={20} />
            </button>
            <p className="eyebrow">Alternativa não destrutiva</p>
            <h2 id="reference-editor-title">Enquadrar referência</h2>
            <p>
              A proporção da imagem é sempre preservada. O arquivo original incluído continua
              disponível.
            </p>
            <ReferenceImage
              src={editorSource}
              custom={{
                dataUrl: editorSource,
                fileName: editorFile?.name ?? selectedCustom?.fileName ?? 'referência',
                width: editorDimensions?.width ?? 1,
                height: editorDimensions?.height ?? 1,
                frame: editorFrame,
              }}
              alt="Prévia do enquadramento"
              className="editor-preview"
              onLoad={(width, height) => setEditorDimensions({ width, height })}
            />
            <label className="editor-slider">
              <span>
                Zoom <strong>{editorFrame.zoom.toFixed(2)}×</strong>
              </span>
              <input
                type="range"
                min="1"
                max="2"
                step="0.01"
                value={editorFrame.zoom}
                onChange={(event) =>
                  setEditorFrame((frame) => ({ ...frame, zoom: Number(event.target.value) }))
                }
              />
            </label>
            <label className="editor-slider">
              <span>
                Horizontal <strong>{editorFrame.offsetX}%</strong>
              </span>
              <input
                type="range"
                min="-30"
                max="30"
                value={editorFrame.offsetX}
                onChange={(event) =>
                  setEditorFrame((frame) => ({ ...frame, offsetX: Number(event.target.value) }))
                }
              />
            </label>
            <label className="editor-slider">
              <span>
                Vertical <strong>{editorFrame.offsetY}%</strong>
              </span>
              <input
                type="range"
                min="-30"
                max="30"
                value={editorFrame.offsetY}
                onChange={(event) =>
                  setEditorFrame((frame) => ({ ...frame, offsetY: Number(event.target.value) }))
                }
              />
            </label>
            <div className="dialog-actions">
              {selectedCustom && (
                <button
                  className="danger-link"
                  onClick={() => {
                    onRestoreDefaultReference(draft.modelId)
                    setReferenceEditorOpen(false)
                  }}
                >
                  Voltar ao original
                </button>
              )}
              <button className="secondary-button" onClick={() => setReferenceEditorOpen(false)}>
                Cancelar
              </button>
              <button
                className="primary-button"
                onClick={applyReference}
                disabled={!editorDimensions}
              >
                Usar referência
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function PenHint() {
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true">
      <path
        d="M35 8 44 17 20 41 9 44l3-11L35 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m30 13 9 9M12 33l8 8M8 47c7-1 11-3 16-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
