# Caligrafia Fena e complementos — evidências

## Objetivo e entrega

Ampliar a prática para a caligrafia geral usando os exercícios originais da Academia Fena como base. Floreios e caneta-tinteiro entram como complementos. As assinaturas existentes continuam disponíveis no percurso próprio.

O aplicativo oferece todas as páginas dos arquivos catalogados, prática da folha inteira e recorte manual de qualquer exercício. Cada folha/recorte tem contagem 8 + 8 + 4, notas, arquivo das tentativas, borracha, desfazer/refazer e replay dos traços do usuário. O protocolo de repetição é do aplicativo, não uma atribuição à Fena. O catálogo não transforma automaticamente cada letra ou linha em uma aula pronta.

## Fontes conferidas

Consulta à área autenticada de https://academia.fenaeducacao.com.br/ e aos PDFs vinculados nas seções de apostilas e bônus. O catálogo em `src/data/academy.ts` registra os IDs do Drive, a quantidade de páginas e o SHA-256 de cada arquivo efetivamente lido.

| Grupo | Entradas | Páginas por arquivo |
|---|---:|---:|
| Apostilas principais Fena | 8 | 227 |
| Bônus Fena: quatro arquivos avulsos e Mega Pack de 15 | 19 | 426 |
| Floreios e manual de caneta-tinteiro | 2 | 131 |
| Total | 29 | 784 |

“Treinando as curvas 1” e “2” têm o mesmo SHA-256 e as mesmas 15 páginas. O carregamento de um deles habilita ambos. O acervo tem 28 arquivos distintos, correspondendo a 769 páginas sem essa duplicação. Capas e orientações entram nessas quantidades; páginas não são contadas como exercícios. Os bônus contêm também alfabetização e leitura infantil.

Complementos fornecidos pelo usuário:

- Floreios: https://drive.google.com/file/d/1EEj9X0wyGp4s7aDokySdqDLN7emOhp7t/view
- Pasta do manual: https://drive.google.com/drive/folders/1wtoRNjFgGNKfK8HpuugjAW1v9iR6CaMj

Os PDFs foram usados para conferir o catálogo e a renderização; não foram incorporados ao repositório. No app, o usuário baixa e carrega seus originais uma vez por navegador. A leitura e o armazenamento são locais. O backup de progresso não contém os PDFs.

## Verificação observada

- **PASS — catálogo:** 29 entradas, hashes conferidos nos bytes dos PDFs, quantidades de páginas lidas dos documentos; todas as páginas são selecionáveis no modelo de dados.
- **PASS — PDF.js:** 784 páginas renderizadas em canvas no Node com PDF.js 5.6.205, `isEvalSupported: false`, `useSystemFonts: false` e fontes auxiliares locais. O teste executou as duas entradas duplicadas. A renderização usa resolução reduzida para verificar todos os documentos; não constitui inspeção visual detalhada de cada glifo.
- **PASS — fontes auxiliares:** o teste inicial revelou ausência dessas fontes; a versão final as inclui no build e no servidor de desenvolvimento. Depois da correção, restaram dois avisos do PDF.js sobre instruções TrueType no PDF de tinteiro (`undefined function: 21`, `invalid function id: 136`), sem falha de renderização. A fidelidade visual desse arquivo no aparelho ainda deve ser conferida.
- **PASS — 19 testes:** regressão das 14 aulas de assinatura; 20 repetições exatas por exercício; troca de página preservando tinta; recortes inválidos rejeitados; recorte até a borda com arredondamento; backups antigos; round trip do progresso, borracha e notas; mesclagem e rejeição de dados inválidos.
- **PASS — compilação e análise:** TypeScript sem emissão, `pnpm lint`, `pnpm build` e `git diff --check`.
- **NOT VERIFIED — interface no navegador:** a prévia local retornou `ERR_HTTP_RESPONSE_CODE_FAILURE` no navegador disponível nesta sessão. Não há evidência de teste ponta a ponta de seleção/importação/desenho nessa interface.
- **NOT VERIFIED — Skip e caneta física:** sincronização/publicação no Skip, pressão da caneta e comportamento da palma dependem da prévia e do aparelho de destino.

## Reprodução e próxima validação

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm lint
pnpm build
```

Após sincronizar o GitHub no Skip: carregar Coordenação, abrir uma folha, recortar um movimento e completar uma repetição com a caneta. Recarregar e conferir tinta/progresso; exportar/importar o backup; testar Copiar, Memória, borracha e troca de página. Conferir também um PDF de bônus, o de floreios e o de tinteiro. Essa validação é necessária antes de afirmar que o fluxo completo foi comprovado no dispositivo.

O escopo entregue não inclui compra de cursos extras, correção automática da escrita, alteração dos modelos de assinatura nem sincronização remota dos dados pessoais.

## Retomada local — 02/11/2026

Repositório recuperado no computador. As 29 entradas foram baixadas diretamente dos IDs do Drive do catálogo para `Apostilas/`; SHA-256 de todos os arquivos conferido. São 28 conteúdos distintos. A pasta é ignorada pelo Git e não entra no build.

O servidor Vite serve um catálogo local e as folhas sob `/apostilas/`; o aplicativo descobre as apostilas e verifica o hash antes de renderizar. O cartão disponível abre diretamente a prática com caneta. O fluxo manual continua disponível quando não existe acervo local. Para iniciar neste computador: `pnpm exec vite --host 127.0.0.1 --port 8080 --strictPort`. A versão hospedada não recebe os PDFs com esta alteração.

Validação desta retomada: instalação com lockfile congelado; 19 testes aprovados; TypeScript, lint, build e diff check aprovados. Edge headless: abertura direta da folha 4 de Coordenação sem importação; eventos de caneta via CDP; repetição concluída e persistida após reload; borracha sem contagem indevida; desfazer e troca para folha 5; nenhum pageerror. Caneta física/pressão/palma não verificadas.
