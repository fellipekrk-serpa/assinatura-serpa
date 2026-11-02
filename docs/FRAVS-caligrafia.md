# Exercícios de caligrafia — entrega e validação

## Comportamento

O curso apresenta os treinos e a escrita dentro do aplicativo, sem nome do fornecedor na interface, links para originais ou importação de PDFs. As folhas são WebP estáticos em public/exercicios, carregados sob demanda. O acervo original e seus hashes continuam documentados em src/data/academy.ts. Os PDFs permanecem em Apostilas/ (fora do Git).

As capas iniciais ficam fora do seletor por firstPractice. A numeração de origem e as chaves de progresso são preservadas para manter tentativas e recortes existentes. As páginas integrais são preservadas na conversão; não se removeu conteúdo ou marca dentro das folhas. O total de 784 páginas de origem inclui orientações e as duas cópias de Curvas; não é uma contagem de exercícios independentes.

B4, A4 e A5-04 usam as imagens originais incorporadas pelo Vite (?inline). Não dependem de uma requisição externa separada. Falha de referência mostra um botão de recarregamento, em vez de uma caixa vazia.

## Verificação

- 19 testes de progresso, backup e assinaturas, mais teste de completude dos arquivos estáticos.
- TypeScript, lint, build e git diff --check.
- Navegador Edge: três assinaturas decodificadas; curso sem links externos e sem input de PDF; abertura de Coordenação; caneta simulada via CDP; conclusão e persistência após reload.
- Caneta física, pressão e rejeição da palma ainda dependem do aparelho.

## Reprodução

pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm lint
pnpm build

O build deve incluir public/exercicios em dist/exercicios. Não depende de servidor local especial, PDF.js no navegador ou fontes de PDF. O script scripts/render-exercises.py permite reproduzir as imagens com PyMuPDF e Pillow, recebendo como argumentos o diretório de dependências Python e um catálogo JSON (id, pages, sha256).

Resultado final: 20/20 testes, TypeScript, lint, build e diff check aprovados. Build servido em preview estático: três assinaturas inline decodificadas, todos os 29 primeiros exercícios com HTTP 200/image-webp, Coordenação folha 4 e troca direta para folha 5 renderizadas; zero pageerror, zero links externos e zero inputs de PDF. Acervo convertido: 784 WebP, 100.316.142 bytes.
