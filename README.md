# Assinatura Serpa

Estúdio pessoal de caligrafia e assinatura para Fellipe Serpa, destro. Os exercícios da Academia Fena são a base; floreios e caneta-tinteiro são complementos. O percurso de assinatura mantém B4 (Serpa), A4 (Fellipe Serpa em uma linha) e A5-04 (em dois níveis).

## Caligrafia · Academia Fena

Em **Curso → Caligrafia**, o catálogo contém:

| Seção | Arquivos | Páginas dos PDFs |
|---|---:|---:|
| Base principal Fena | 8 | 227 |
| Bônus Fena, incluindo o Mega Pack | 19 | 426 |
| Complementos: floreios e caneta-tinteiro | 2 | 131 |

São 29 entradas e 784 páginas, incluindo capas e orientações. “Treinando as curvas 1” e “2” são arquivos idênticos na fonte: há 28 PDFs distintos e 769 páginas sem essa duplicação. Essas quantidades não são contagens de exercícios. Os bônus incluem atividades infantis de alfabetização, leitura e interpretação.

1. Use **Abrir original** para baixar as apostilas às quais você tem acesso.
2. Clique em **Carregar PDFs** e selecione um ou vários arquivos. O app reconhece cada original pelo SHA-256 e o guarda neste navegador. O PDF de Curvas carrega as duas entradas correspondentes.
3. Escolha qualquer página, incluindo as primeiras e últimas. Pratique a folha inteira ou selecione uma letra, linha ou movimento com o retângulo; nomeie o recorte para retomá-lo.
4. Cada folha/recorte tem sua própria série de 20: 8 cobrindo, 8 copiando e 4 de memória. Esse protocolo pertence ao aplicativo; não é apresentado como uma prescrição da Fena.
5. **Concluir repetição** guarda os traços, soma uma repetição e limpa a área. Trocar de folha ou bloco guarda a tinta sem contar uma repetição. Caneta, borracha, desfazer/refazer, replay dos próprios traços, PNG e notas ficam junto à prática.

Os exercícios são os das folhas originais. Não foram transcritos ou substituídos por fontes tipográficas. O catálogo é por apostila e página; recortes individuais são escolhidos pelo usuário, não identificados automaticamente. Não há correção automática da caligrafia nem demonstração inventada da ordem dos traços.

Os PDFs são lidos localmente com PDF.js, sem upload a um servidor do aplicativo. O repositório contém o catálogo, os links e os hashes, e não cópias das apostilas. As versões originais catalogadas são necessárias: PDFs recomprimidos ou alterados são rejeitados com orientação para baixar o original. Em outro aparelho/domínio, carregue os PDFs novamente e importe o backup do progresso em Ajustes.

## Curso de assinatura

- 14 aulas completas, organizadas em quatro etapas: curta, completa em uma linha, completa em dois níveis e escolha/consistência.
- 42 blocos de prática com objetivo, observação da referência, preparação, repetições, tempo sugerido e instruções.
- Correções para dificuldades comuns, exercícios no papel, checklist pessoal, notas por aula e manutenção após o curso.
- Cada bloco abre o modelo e o modo corretos (Cobrir, Copiar ou Memória). As aulas 12–14 permitem escolher a completa favorita.
- A orientação acompanha o estúdio, com retorno à aula e avanço ao próximo bloco. A conclusão é manual; as aulas não são bloqueadas.
- Ao abrir outro bloco, o rascunho com tinta é copiado para o Histórico antes de limpar a área. A cópia preserva traços, cor, espessura, favorito e identificação da aula. Um rascunho vazio não gera tentativa.
- As aulas usam os arquivos originais. Referências alternativas permanecem disponíveis no treino livre. No modo Memória, as miniaturas também ficam ocultas até a revelação.

As imagens não permitem inferir a ordem original dos traços. O curso oferece sugestões de execução, sem inventar uma demonstração do autor. O Replay mostra apenas os movimentos registrados pelo próprio usuário. Não há nota automática de semelhança, promessa de prazo para dominar os movimentos.

## Borracha e prática por trechos

A barra junto à área de escrita contém Caneta, Borracha, Desfazer e Limpar área. A borracha remove somente tinta onde a caneta passa, preservando o papel e a referência. Cada passada pode ser desfeita/refeita; histórico, replay e PNG usam a mesma composição de tinta.

As aulas 1, 2, 5, 6, 8 e 9 abrem o trecho correspondente, recortado da imagem original, sem substituir a assinatura por outra fonte. O S da aula 1 aparece isolado. São 20 repetições por aula: 8 cobrindo, 8 copiando e 4 de memória. “Concluir repetição” salva uma tentativa no Histórico, soma uma repetição e limpa a área para a próxima. Vários traços podem compor uma única repetição. Não há avaliação automática da forma.

A contagem sobrevive ao recarregamento e ao backup. “Recomeçar série de 20” reinicia a contagem após confirmação, preservando as anotações e o histórico. Trocar de bloco não completa repetições automaticamente. As aulas de assinatura completa mantêm seus exercícios próprios.

## Dados e compatibilidade

Persistência local em IndexedDB, com fallback em localStorage. Sem login ou banco remoto. O backup JSON continua na versão 1; os novos campos são opcionais e backups anteriores continuam válidos:

- `academy`: apostila/página selecionada, recortes salvos, contagens, notas, tentativas e rascunho da caligrafia. Os PDFs ficam em um IndexedDB separado e não entram no backup JSON.
- `courseJournal`: anotações, checklist, contagem por bloco (`repetitions`) e data por aula. Na importação, prevalece a entrada mais recente de cada aula.
- `draft.coursePractice`: aula, bloco e completa selecionada, para preservar o contexto após recarregar.
- `attempt.courseSessionId`: origem opcional da tentativa.
- `SignatureStroke.tool`: `pen` ou `eraser`; traços antigos sem o campo continuam sendo tinta.

A importação preserva o rascunho atual quando contém tinta e une tentativas por ID. Campos novos são validados antes da importação. O progresso não acompanha automaticamente uma troca de domínio, navegador ou aparelho: exporte e importe o backup em Ajustes.

## Desenvolvimento e verificação

Node.js 22.12+ e pnpm. PDF.js 5.6.205 foi acrescentado ao lockfile. O worker e as fontes auxiliares são servidos pelo próprio app, sem CDN.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm lint
pnpm test
pnpm build
```

Os testes usam Node Test Runner e o carregador SSR do Vite. Cobrem renderização das 14 aulas, roteamento de todos os blocos/modelos, preservação do rascunho, compatibilidade com backups antigos, round trip dos campos novos, mesclagem e rejeição de dados inválidos. Os testes também cobrem a série completa de 20, o contador no backup, operações de borracha e a preservação do fundo na composição. A suíte tem 19 testes, incluindo catálogo completo, seleção de páginas, recortes até a borda e contagens/backup da caligrafia. Isso não substitui a verificação da interface no Skip e com caneta física.

Conteúdo: `src/data/course.ts`. Interface: `CourseView.tsx` e `CoursePracticePanel.tsx`. Transição de exercício: `src/lib/course-practice.ts`. Persistência: `src/lib/signature-storage.ts`.

## Atualização no Skip

O código do curso está neste repositório, na branch `main`. Na integração GitHub do projeto Skip, sincronize a revisão mais recente e gere/abra a prévia. Não peça ao agente para recriar os modelos ou reescrever o curso.

Antes de atualizar, exporte um backup no app atual. Depois de sincronizar, confira na prévia:

1. Curso abre a seção Fena; conferir as oito apostilas principais, 19 bônus e dois complementos. Carregar um PDF, abrir a primeira/última folha, selecionar um recorte, concluir uma repetição e recarregar. A aba Minhas assinaturas mantém as 14 aulas detalhadas, 42 blocos e notas/checklists.
2. Aula 5 abre A4; aula 8 abre A5-04; aula 11 alterna A4, A5-04 e B4.
3. Aula 12 com A5-04 selecionada abre A5-04 → B4 → A5-04.
4. Um rascunho com tinta fica no Histórico ao abrir outro bloco.
5. Notas/checklists continuam após recarregar; exportação/importação preservam o curso.
6. Memória oculta tanto a referência principal quanto as miniaturas.
7. Na aula 1, conferir o S isolado e a contagem 8 + 8 + 4, usando “Concluir repetição”.
8. Usar Borracha sobre parte de um traço e Desfazer; conferir o PNG e o histórico.
9. No celular, conferir retrato/paisagem, caneta, pressão disponível e comportamento da palma.

A integração/sincronização no Skip e os testes com caneta física são etapas separadas da publicação do código no GitHub. Confira a prévia antes de publicar uma nova versão do site.

Evidências e limites desta ampliação: [docs/FRAVS-caligrafia.md](docs/FRAVS-caligrafia.md).
