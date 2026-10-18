# Assinatura Serpa

Estúdio de treino com caneta digital e curso pessoal de assinatura para Fellipe Serpa, destro. O curso mantém os três modelos originais: B4 (Serpa), A4 (Fellipe Serpa em uma linha) e A5-04 (em dois níveis).

## Curso

- 14 aulas completas, organizadas em quatro etapas: curta, completa em uma linha, completa em dois níveis e escolha/consistência.
- 42 blocos de prática com objetivo, observação da referência, preparação, repetições, tempo sugerido e instruções.
- Correções para dificuldades comuns, exercícios no papel, checklist pessoal, notas por aula e manutenção após o curso.
- Cada bloco abre o modelo e o modo corretos (Cobrir, Copiar ou Memória). As aulas 12–14 permitem escolher a completa favorita.
- A orientação acompanha o estúdio, com retorno à aula e avanço ao próximo bloco. A conclusão é manual; as aulas não são bloqueadas.
- Ao abrir outro bloco, o rascunho com tinta é copiado para o Histórico antes de limpar a área. A cópia preserva traços, cor, espessura, favorito e identificação da aula. Um rascunho vazio não gera tentativa.
- As aulas usam os arquivos originais. Referências alternativas permanecem disponíveis no treino livre. No modo Memória, as miniaturas também ficam ocultas até a revelação.

As imagens não permitem inferir a ordem original dos traços. O curso oferece sugestões de execução, sem inventar uma demonstração do autor. O Replay mostra apenas os movimentos registrados pelo próprio usuário. Não há nota automática de semelhança, promessa de prazo ou mudança de caligrafia geral.

## Borracha e prática por trechos

A barra junto à área de escrita contém Caneta, Borracha, Desfazer e Limpar área. A borracha remove somente tinta onde a caneta passa, preservando o papel e a referência. Cada passada pode ser desfeita/refeita; histórico, replay e PNG usam a mesma composição de tinta.

As aulas 1, 2, 5, 6, 8 e 9 abrem o trecho correspondente, recortado da imagem original, sem substituir a assinatura por outra fonte. O S da aula 1 aparece isolado. São 20 repetições por aula: 8 cobrindo, 8 copiando e 4 de memória. “Concluir repetição” salva uma tentativa no Histórico, soma uma repetição e limpa a área para a próxima. Vários traços podem compor uma única repetição. Não há avaliação automática da forma.

A contagem sobrevive ao recarregamento e ao backup. “Recomeçar série de 20” reinicia a contagem após confirmação, preservando as anotações e o histórico. Trocar de bloco não completa repetições automaticamente. As aulas de assinatura completa mantêm seus exercícios próprios.

## Dados e compatibilidade

Persistência local em IndexedDB, com fallback em localStorage. Sem login ou banco remoto. O backup JSON continua na versão 1; os novos campos são opcionais e backups anteriores continuam válidos:

- `courseJournal`: anotações, checklist, contagem por bloco (`repetitions`) e data por aula. Na importação, prevalece a entrada mais recente de cada aula.
- `draft.coursePractice`: aula, bloco e completa selecionada, para preservar o contexto após recarregar.
- `attempt.courseSessionId`: origem opcional da tentativa.
- `SignatureStroke.tool`: `pen` ou `eraser`; traços antigos sem o campo continuam sendo tinta.

A importação preserva o rascunho atual quando contém tinta e une tentativas por ID. Campos novos são validados antes da importação. O progresso não acompanha automaticamente uma troca de domínio, navegador ou aparelho: exporte e importe o backup em Ajustes.

## Desenvolvimento e verificação

Node.js 22.12+ e pnpm. O lockfile existente é mantido, sem novas dependências.

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc -p tsconfig.app.json --noEmit
pnpm lint
node --test tests/course.test.mjs
pnpm build
```

Os testes usam Node Test Runner e o carregador SSR do Vite. Cobrem renderização das 14 aulas, roteamento de todos os blocos/modelos, preservação do rascunho, compatibilidade com backups antigos, round trip dos campos novos, mesclagem e rejeição de dados inválidos. Os 11 testes também cobrem a série completa de 20, o contador no backup, operações de borracha e a preservação do fundo na composição. Isso não substitui a verificação com caneta física.

Conteúdo: `src/data/course.ts`. Interface: `CourseView.tsx` e `CoursePracticePanel.tsx`. Transição de exercício: `src/lib/course-practice.ts`. Persistência: `src/lib/signature-storage.ts`.

## Atualização no Skip

O código do curso está neste repositório, na branch `main`. Na integração GitHub do projeto Skip, sincronize a revisão mais recente e gere/abra a prévia. Não peça ao agente para recriar os modelos ou reescrever o curso.

Antes de atualizar, exporte um backup no app atual. Depois de sincronizar, confira na prévia:

1. Curso contém as 14 aulas detalhadas, 42 blocos e notas/checklists.
2. Aula 5 abre A4; aula 8 abre A5-04; aula 11 alterna A4, A5-04 e B4.
3. Aula 12 com A5-04 selecionada abre A5-04 → B4 → A5-04.
4. Um rascunho com tinta fica no Histórico ao abrir outro bloco.
5. Notas/checklists continuam após recarregar; exportação/importação preservam o curso.
6. Memória oculta tanto a referência principal quanto as miniaturas.
7. Na aula 1, conferir o S isolado e a contagem 8 + 8 + 4, usando “Concluir repetição”.
8. Usar Borracha sobre parte de um traço e Desfazer; conferir o PNG e o histórico.
9. No celular, conferir retrato/paisagem, caneta, pressão disponível e comportamento da palma.

A integração/sincronização no Skip e os testes com caneta física são etapas separadas da publicação do código no GitHub. Confira a prévia antes de publicar uma nova versão do site.
