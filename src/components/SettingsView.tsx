import { Database, Download, FileImage, ShieldCheck, Upload } from 'lucide-react'

interface SettingsViewProps {
  storageLabel: string
  attemptCount: number
  onExportBackup: () => void
  onImportBackup: () => void
  onExportHistory: () => void
  onResetDraft: () => void
}

export default function SettingsView({
  storageLabel,
  attemptCount,
  onExportBackup,
  onImportBackup,
  onExportHistory,
  onResetDraft,
}: SettingsViewProps) {
  return (
    <section className="settings-screen" aria-labelledby="settings-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Privacidade e arquivos</p>
          <h2 id="settings-heading">Ajustes</h2>
          <p>Controle seus dados locais e mantenha uma cópia de segurança.</p>
        </div>
      </div>

      <div className="privacy-card">
        <ShieldCheck size={28} />
        <div>
          <h3>Privado por padrão</h3>
          <p>
            Não há conta, servidor, analytics ou envio de assinaturas a terceiros. Tudo permanece
            neste navegador até você exportar um arquivo.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <article className="settings-card">
          <div className="settings-icon">
            <Database size={22} />
          </div>
          <div>
            <p className="settings-label">Armazenamento atual</p>
            <h3>{storageLabel}</h3>
            <p>
              {attemptCount} {attemptCount === 1 ? 'tentativa salva' : 'tentativas salvas'} neste
              aparelho.
            </p>
          </div>
        </article>
        <article className="settings-card">
          <div className="settings-icon">
            <Download size={22} />
          </div>
          <div>
            <p className="settings-label">Backup completo</p>
            <h3>Exportar JSON</h3>
            <p>Inclui rascunho, tentativas, curso, preferências e referências alternativas.</p>
            <button className="secondary-button" onClick={onExportBackup}>
              Baixar backup
            </button>
          </div>
        </article>
        <article className="settings-card">
          <div className="settings-icon">
            <Upload size={22} />
          </div>
          <div>
            <p className="settings-label">Restauração segura</p>
            <h3>Importar JSON</h3>
            <p>
              O arquivo é validado e novas tentativas são mescladas, sem sobrescrever as existentes.
            </p>
            <button className="secondary-button" onClick={onImportBackup}>
              Escolher arquivo
            </button>
          </div>
        </article>
        <article className="settings-card">
          <div className="settings-icon">
            <FileImage size={22} />
          </div>
          <div>
            <p className="settings-label">Somente tentativas</p>
            <h3>Exportar histórico</h3>
            <p>Gera um JSON com o histórico atual para arquivamento.</p>
            <button className="secondary-button" onClick={onExportHistory}>
              Baixar histórico
            </button>
          </div>
        </article>
      </div>

      <div className="danger-zone">
        <div>
          <h3>Descartar rascunho atual</h3>
          <p>Remove somente os traços em andamento. O histórico e o curso são preservados.</p>
        </div>
        <button className="danger-button" onClick={onResetDraft}>
          Descartar rascunho
        </button>
      </div>
    </section>
  )
}
