# Retomada e proteção do progresso

A tela, seção, folha, traços, caneta e opacidade voltam ao reabrir. Mouse/dedo continuam desativados ao reabrir para evitar marcas acidentais.

O salvamento mantém uma cópia anterior válida. A leitura compara o armazenamento principal e o alternativo pela data de salvamento. Quando nenhuma cópia pode ser lida com segurança, a gravação fica pausada e os dados existentes são preservados. Essa cópia local não substitui o backup exportado em Ajustes nem protege contra apagar os dados do navegador.

Todas as páginas foram mantidas; revisão de páginas adiada por decisão de Serpa.

## Verificação

- npm test: 23 testes de curso, canetas, backups e integridade das 784 folhas.
- npx tsc --noEmit -p tsconfig.app.json e npm run build.
- Com Playwright instalado: node scripts/verify-published.mjs URL verifica B4, exercício interno, sete canetas, desenho e restauração após recarga em navegador isolado.
- Com servidor Vite: node scripts/verify-recovery.mjs http://127.0.0.1:5187 testa corrupção, recuperação anterior, fallback recente e pausa de salvamento.
- Workflow Verificar treino executa verificações locais em push main e PR. A checagem do preview ocorre por execução manual do workflow ou evento deployment_status de sucesso. Se Skip não emitir esse evento, sua sincronização não inicia a checagem por si só.
- BROWSER_PATH permite navegador instalado; PLAYWRIGHT_MODULE permite instalação existente de Playwright.

## Evidência em 02/11/2026

PASS: 23 testes, TypeScript, build, fluxo de escrita e retomada, recuperação no navegador.
FAIL no preview antes da sincronização: seletor Tipo de caneta ausente; versão anterior ainda publicada.
Pressão física da caneta não verificada neste incremento; curva de pressão coberta por testes automatizados.
