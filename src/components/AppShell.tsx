import { ReactNode, useEffect } from 'react'
import { BookOpenCheck, Check, Grid2X2, PenTool, Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AppTab = 'train' | 'course' | 'history' | 'settings'

interface AppShellProps {
  activeTab: AppTab
  title: string
  saveStatus: 'saved' | 'saving' | 'error'
  savedAt: Date | null
  historyOpen: boolean
  onTabChange: (tab: AppTab) => void
  onCloseHistory: () => void
  children: ReactNode
  historyContent: ReactNode
}

const tabs: Array<{ id: AppTab; label: string; icon: typeof PenTool }> = [
  { id: 'train', label: 'Treinar', icon: PenTool },
  { id: 'course', label: 'Curso', icon: BookOpenCheck },
  { id: 'history', label: 'Histórico', icon: Grid2X2 },
  { id: 'settings', label: 'Ajustes', icon: Settings2 },
]

export default function AppShell({
  activeTab,
  title,
  saveStatus,
  savedAt,
  historyOpen,
  onTabChange,
  onCloseHistory,
  children,
  historyContent,
}: AppShellProps) {
  useEffect(() => {
    if (!historyOpen) return
    const handleKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onCloseHistory()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyOpen, onCloseHistory])

  const saveLabel =
    saveStatus === 'saving'
      ? 'Salvando…'
      : saveStatus === 'error'
        ? 'Falha ao salvar'
        : savedAt
          ? `Salvo às ${savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Salvo neste aparelho'

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-block">
            <span className="brand-script">Fellipe Serpa</span>
            <span className="brand-kicker">Estúdio de Traço</span>
          </div>
          <div className="screen-title">{title}</div>
          <nav className="header-nav" aria-label="Navegação de seções">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={cn('header-nav-link', activeTab === tab.id && 'is-active')}
                  onClick={() => onTabChange(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="header-actions">
            <span className={cn('save-badge', saveStatus)}>
              <span className="save-dot" />
              {saveLabel}
            </span>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <span>Salvo neste aparelho</span>
        <span>
          <Check size={13} /> Dados salvos neste navegador
        </span>
      </footer>

      <nav className="bottom-nav" aria-label="Navegação principal">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={cn(activeTab === tab.id && 'is-active')}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={21} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {historyOpen && (
        <div
          className="drawer-backdrop"
          onMouseDown={(event) => event.target === event.currentTarget && onCloseHistory()}
        >
          <aside
            className="history-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Histórico rápido"
          >
            <div className="drawer-header">
              <div>
                <p className="eyebrow">Acesso rápido</p>
                <h2>Histórico</h2>
              </div>
              <button
                className="icon-button"
                onClick={onCloseHistory}
                aria-label="Fechar histórico"
              >
                <X size={20} />
              </button>
            </div>
            <div className="drawer-scroll">{historyContent}</div>
          </aside>
        </div>
      )}
    </div>
  )
}
