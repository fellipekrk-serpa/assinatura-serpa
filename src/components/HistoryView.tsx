import { useMemo, useState } from 'react'
import { ArrowLeft, Heart, Layers3, PenTool, Play, Trash2, Upload } from 'lucide-react'
import { ModelId, REFERENCE_MODELS, SavedAttempt, formatDuration } from '@/data/signature'
import AttemptThumbnail from '@/components/AttemptThumbnail'
import ReferenceImage from '@/components/ReferenceImage'
import { cn } from '@/lib/utils'

interface HistoryViewProps {
  attempts: SavedAttempt[]
  onLoad: (attempt: SavedAttempt, replay: boolean) => void
  onDelete: (attempt: SavedAttempt) => void
  onToggleFavorite: (attempt: SavedAttempt) => void
  onBackToTrain?: () => void
}

type ModelFilter = 'all' | ModelId

export default function HistoryView({
  attempts,
  onLoad,
  onDelete,
  onToggleFavorite,
  onBackToTrain,
}: HistoryViewProps) {
  const [modelFilter, setModelFilter] = useState<ModelFilter>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [compareId, setCompareId] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      attempts.filter(
        (attempt) =>
          (modelFilter === 'all' || attempt.modelId === modelFilter) &&
          (!favoritesOnly || attempt.favorite),
      ),
    [attempts, favoritesOnly, modelFilter],
  )

  const comparing = attempts.find((attempt) => attempt.id === compareId) ?? null
  const compareModel = REFERENCE_MODELS.find((model) => model.id === comparing?.modelId)

  return (
    <section className="history-screen" aria-labelledby="history-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Arquivo local</p>
          <h2 id="history-heading">Histórico completo</h2>
          <p>Suas tentativas ficam somente neste aparelho.</p>
        </div>
        <div className="history-heading-actions">
          {onBackToTrain && (
            <button className="secondary-button" onClick={onBackToTrain}>
              <ArrowLeft size={16} /> Voltar para Treinar
            </button>
          )}
          <span className="count-pill">
            {attempts.length} {attempts.length === 1 ? 'tentativa' : 'tentativas'}
          </span>
        </div>
      </div>

      <div className="history-filters" aria-label="Filtros do histórico">
        <button
          className={cn('chip', modelFilter === 'all' && 'is-active')}
          onClick={() => setModelFilter('all')}
        >
          Todos
        </button>
        {REFERENCE_MODELS.map((model) => (
          <button
            key={model.id}
            className={cn('chip', modelFilter === model.id && 'is-active')}
            onClick={() => setModelFilter(model.id)}
          >
            {model.name}
          </button>
        ))}
        <button
          className={cn('chip', favoritesOnly && 'is-active')}
          onClick={() => setFavoritesOnly((value) => !value)}
        >
          <Heart size={15} fill={favoritesOnly ? 'currentColor' : 'none'} /> Favoritas
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Upload size={30} />
          </div>
          <h3>Nenhuma tentativa encontrada</h3>
          <p>Desenhe na aba Treinar e use “Salvar tentativa” para criar sua primeira versão.</p>
          {onBackToTrain && (
            <button
              className="primary-button"
              style={{ marginTop: '16px' }}
              onClick={onBackToTrain}
            >
              <PenTool size={16} /> Ir para o Treino
            </button>
          )}
        </div>
      ) : (
        <div className="attempt-grid">
          {filtered.map((attempt) => {
            const model = REFERENCE_MODELS.find((item) => item.id === attempt.modelId)
            return (
              <article className="attempt-card" key={attempt.id}>
                <AttemptThumbnail strokes={attempt.strokes} />
                <div className="attempt-card-body">
                  <div className="attempt-card-title">
                    <div>
                      <h3>{attempt.name}</h3>
                      <p>
                        {model?.name} ·{' '}
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(attempt.createdAt))}
                      </p>
                    </div>
                    <button
                      className="icon-button small"
                      aria-label={
                        attempt.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
                      }
                      onClick={() => onToggleFavorite(attempt)}
                    >
                      <Heart size={18} fill={attempt.favorite ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <p className="attempt-meta">
                    {attempt.strokes.length} {attempt.strokes.length === 1 ? 'traço' : 'traços'} ·{' '}
                    {formatDuration(attempt.duration)}
                  </p>
                  <div className="attempt-actions">
                    <button className="small-action" onClick={() => onLoad(attempt, false)}>
                      Carregar
                    </button>
                    <button className="small-action" onClick={() => onLoad(attempt, true)}>
                      <Play size={14} /> Replay
                    </button>
                    <button className="small-action" onClick={() => setCompareId(attempt.id)}>
                      <Layers3 size={14} /> Comparar
                    </button>
                    <button
                      className="small-action danger"
                      onClick={() => onDelete(attempt)}
                      aria-label={`Excluir ${attempt.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {comparing && compareModel && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setCompareId(null)}
        >
          <div
            className="dialog-card compare-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="compare-title"
          >
            <button
              className="dialog-close"
              onClick={() => setCompareId(null)}
              aria-label="Fechar comparação"
            >
              ×
            </button>
            <p className="eyebrow">Comparação visual</p>
            <h2 id="compare-title">{comparing.name}</h2>
            <p>Observe lado a lado. A escolha da melhor tentativa é sempre sua.</p>
            <div className="comparison-grid">
              <div>
                <span>Referência · {compareModel.name}</span>
                <ReferenceImage src={compareModel.asset} alt={`Referência ${compareModel.name}`} />
              </div>
              <div>
                <span>Sua tentativa</span>
                <AttemptThumbnail strokes={comparing.strokes} />
              </div>
            </div>
            <button className="secondary-button full-width" onClick={() => setCompareId(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
