import { getCourseFocus, FOCUSED_REPETITIONS } from './course-focus'
import type { ModelId, TrainingMode } from './signature'

export interface CourseStep {
  title: string
  mode: TrainingMode
  modelId?: ModelId
  minutes: number
  repetitions: string
  instruction: string
}
export interface CourseLesson {
  id: number
  phase: string
  title: string
  modelId: ModelId
  objective: string
  observe: string
  technique: string[]
  steps: CourseStep[]
  corrections: { problem: string; action: string }[]
  checks: string[]
  paper: string
  repeat: string
}
export interface LessonJournal {
  repetitions?: Partial<Record<string, number>>
  notes: string
  checks: string[]
  updatedAt: string
}
export type CourseJournal = Partial<Record<number, LessonJournal>>
export interface CoursePractice {
  sessionId: number
  stepIndex: number
  completeModel?: ModelId
}
export const MODE_LABELS: Record<TrainingMode, string> = {
  cover: 'Cobrir',
  copy: 'Copiar',
  memory: 'Memória',
}
const step = (
  title: string,
  mode: TrainingMode,
  minutes: number,
  repetitions: string,
  instruction: string,
  modelId?: ModelId,
): CourseStep => ({ title, mode, minutes, repetitions, instruction, modelId })

export const COURSE_LESSONS: CourseLesson[] = [
  {
    id: 1,
    phase: '01 · Assinatura curta',
    title: 'O gesto do S',
    modelId: 'b4',
    objective:
      'Encontrar um S amplo e confortável que você consiga repetir sem redesenhar o contorno.',
    observe:
      'Olhe o S da B4: altura, largura das curvas e ponto de saída para as letras pequenas. Observe o conjunto antes dos detalhes.',
    technique: [
      'Faça três movimentos no ar para reconhecer a curva, com a mão relaxada.',
      'Experimente uma trajetória confortável para o S. A imagem mostra a forma final; a ordem dos traços será a que funcionar para você.',
      'Desenhe cada tentativa uma vez. Uma pequena diferença entre repetições é esperada; evite retocar a mesma linha.',
    ],
    steps: [
      step(
        'Conhecer a curva',
        'cover',
        3,
        '6 S isolados',
        'Cubra somente o S. Depois de cada tentativa, observe a curva, limpe a área e recomece.',
      ),
      step(
        'Soltar o movimento',
        'copy',
        4,
        '6 S isolados',
        'Olhe o modelo e reproduza o S no centro da área. Compare a largura e a altura, sem corrigir por cima.',
      ),
      step(
        'Lembrar o gesto',
        'memory',
        3,
        '3 S isolados',
        'Faça o S sem consultar a referência. Revele apenas ao terminar cada tentativa; escolha uma para salvar.',
      ),
    ],
    corrections: [
      {
        problem: 'Curva feita de pequenos pedaços.',
        action:
          'Aumente o tamanho e tente uma passagem mais contínua; não aumente a velocidade à força.',
      },
      {
        problem: 'S cada vez mais apertado.',
        action:
          'Volte a observar sua largura. Mova também o antebraço, deixando espaço para a curva.',
      },
    ],
    checks: [
      'Fiz curvas sem retoques.',
      'Reconheço a altura e a largura do S.',
      'Consigo repetir o gesto com conforto.',
    ],
    paper:
      'Faça 5 S com sua caneta habitual, em tamanho confortável. Compare o movimento, não a espessura com a tela.',
    repeat: 'Se você ainda desenha por pequenos pedaços, repita o bloco Copiar antes de seguir.',
  },
  {
    id: 2,
    phase: '01 · Assinatura curta',
    title: 'Construir “erpa”',
    modelId: 'b4',
    objective: 'Dar ritmo ao bloco pequeno de Serpa e preparar sua ligação com o S.',
    observe:
      'Compare a altura do e, r e a com a extensão do p. Observe os espaços claros dentro e entre as letras.',
    technique: [
      'Leia o bloco como “erpa”, sem transformar as letras em bolinhas iguais.',
      'Ensaiar “er” e “pa” separadamente ajuda a encontrar as passagens; depois una os dois blocos.',
      'Mantenha as letras pequenas subordinadas ao S. Não acrescente voltas que não existem no modelo.',
    ],
    steps: [
      step(
        'Reconhecer as passagens',
        'cover',
        3,
        '3 “er” + 3 “pa”',
        'Cubra cada grupo separadamente. Observe onde a direção muda e onde a caneta pode continuar.',
      ),
      step(
        'Unir o bloco',
        'copy',
        4,
        '6 “erpa”',
        'Escreva o bloco inteiro. Compare o espaço entre r e p e a saída do a.',
      ),
      step(
        'Fixar o ritmo',
        'memory',
        3,
        '3 “erpa”',
        'Faça o bloco sem olhar. Revele a referência depois e salve uma tentativa com o nome “Sessão 2 — erpa”.',
      ),
    ],
    corrections: [
      {
        problem: 'As letras viraram um emaranhado.',
        action:
          'Amplie o bloco e abra um pouco os espaços. Reduza novamente só quando reconhecer as ligações.',
      },
      {
        problem: 'O p domina o conjunto.',
        action:
          'Compare sua extensão com o modelo e ajuste somente esse detalhe na tentativa seguinte.',
      },
    ],
    checks: [
      'Mantenho espaços entre as letras.',
      'O p tem proporção parecida entre tentativas.',
      'Faço “erpa” sem reconstruir cada letra.',
    ],
    paper:
      'Escreva 5 blocos “erpa” com pressão confortável. Escolha aquele com melhor ritmo, sem exigir um traço idêntico ao digital.',
    repeat: 'Se os espaços se fecham, repita Copiar em tamanho maior.',
  },
  {
    id: 3,
    phase: '01 · Assinatura curta',
    title: 'Juntar a B4',
    modelId: 'b4',
    objective: 'Unir o S, o bloco pequeno e a finalização em uma assinatura reconhecível.',
    observe:
      'Veja como o S se relaciona com “erpa” e quanto espaço a finalização ocupa. Preserve o desenho original da B4.',
    technique: [
      'Pense em três partes: inicial, corpo pequeno e saída. Planeje antes de tocar a tela.',
      'Use levantadas de caneta quando forem confortáveis; não é obrigatório fazer toda a assinatura em um único traço.',
      'Faça a finalização uma vez. Não use um floreio extra para disfarçar uma ligação difícil.',
    ],
    steps: [
      step(
        'Montar o conjunto',
        'cover',
        3,
        '4 assinaturas',
        'Cubra a B4 inteira, procurando uma sequência de movimentos que você consiga repetir.',
      ),
      step(
        'Copiar com ritmo',
        'copy',
        4,
        '5 assinaturas',
        'Mantenha a mesma sequência. Observe apenas a ligação entre o S e o corpo pequeno em cada repetição.',
      ),
      step(
        'Primeira versão livre',
        'memory',
        3,
        '3 assinaturas',
        'Salve a primeira e a última, com nomes diferentes. Compare no Histórico a proporção do conjunto.',
      ),
    ],
    corrections: [
      {
        problem: 'Parada longa depois do S.',
        action:
          'Ensaie só a saída do S com a entrada do e, três vezes, antes de voltar ao conjunto.',
      },
      {
        problem: 'Finalização desproporcional.',
        action: 'Observe onde ela termina no modelo e planeje esse limite antes de começar.',
      },
    ],
    checks: [
      'Tenho uma sequência confortável.',
      'O corpo pequeno cabe junto ao S.',
      'A finalização não muda muito a cada tentativa.',
    ],
    paper:
      'Faça 5 B4 completas. Uma levantada de caneta planejada vale mais que uma ligação forçada.',
    repeat: 'Se uma ligação trava sempre, isole essa passagem e retorne à assinatura completa.',
  },
  {
    id: 4,
    phase: '01 · Assinatura curta',
    title: 'Reduzir com controle',
    modelId: 'b4',
    objective: 'Usar a B4 em tamanhos diferentes sem comprimir suas letras.',
    observe:
      'Compare a proporção entre altura e largura. Reduzir significa diminuir o conjunto, incluindo espaços e finalização.',
    technique: [
      'Faça uma B4 confortável e use-a como tamanho de referência pessoal.',
      'Na tentativa seguinte, imagine uma área de aproximadamente três quartos da largura anterior; depois tente metade.',
      'Os tamanhos são relativos na tela. Use uma régua no papel para testar medidas reais.',
    ],
    steps: [
      step(
        'Tamanho confortável',
        'copy',
        3,
        '3 assinaturas grandes',
        'Faça três B4 no mesmo tamanho, sem preencher obrigatoriamente toda a tela.',
      ),
      step(
        'Tamanho intermediário',
        'copy',
        4,
        '4 assinaturas médias',
        'Reduza o conjunto para cerca de 75% da largura anterior, mantendo a relação entre S e letras pequenas.',
      ),
      step(
        'Tamanho pequeno',
        'memory',
        3,
        '3 assinaturas pequenas',
        'Tente cerca de metade da largura inicial. Se as letras se fecharem, volte ao tamanho intermediário.',
      ),
    ],
    corrections: [
      {
        problem: 'Só as letras pequenas diminuem.',
        action: 'Reduza também o S e a finalização; compare primeiro a silhueta.',
      },
      {
        problem: 'Traços se juntam no tamanho menor.',
        action: 'Use uma linha mais fina na tela e aumente um pouco o espaço escolhido.',
      },
    ],
    checks: [
      'Preservo a forma em dois tamanhos.',
      'O S e o corpo diminuem juntos.',
      'Identifico meu menor tamanho confortável.',
    ],
    paper:
      'Desenhe caixas de 7, 5 e 3,5 cm de largura e tente duas B4 em cada uma. Ajuste a caixa se precisar; não force um tamanho inviável.',
    repeat: 'Fique no tamanho intermediário se o menor exigir retoques ou apertar sua mão.',
  },
  {
    id: 5,
    phase: '02 · Completa em uma linha',
    title: 'F e “ellipe”',
    modelId: 'a4',
    objective: 'Construir o primeiro nome da A4, preservando os dois l de Fellipe.',
    observe:
      'Observe o F destacado e a sequência menor “ellipe”. Compare os dois l e a posição do p dentro do nome.',
    technique: [
      'Separe mentalmente F / elli / pe para estudar, sem transformar isso em três paradas obrigatórias.',
      'Pratique os dois l como movimentos distintos dentro do mesmo ritmo.',
      'O ponto do i pode ser colocado depois do corpo do nome; escolha uma ordem confortável e repita-a.',
    ],
    steps: [
      step(
        'Inicial e corpo',
        'cover',
        3,
        '3 F + 3 “ellipe”',
        'Cubra os dois trechos separadamente. Não pratique o sobrenome ainda.',
      ),
      step(
        'Primeiro nome inteiro',
        'copy',
        4,
        '5 “Fellipe”',
        'Junte o nome preservando o contraste de tamanho entre F e corpo.',
      ),
      step(
        'Lembrar o nome',
        'memory',
        3,
        '3 “Fellipe”',
        'Escreva sem olhar e depois confira a sequência com dois l. Salve a tentativa mais confortável.',
      ),
    ],
    corrections: [
      {
        problem: 'Um dos l desaparece.',
        action:
          'Ensaie “elli” em tamanho maior e confira os dois movimentos antes de voltar ao nome.',
      },
      {
        problem: 'F grande demais para o restante.',
        action: 'Compare a largura total do nome e reduza a inicial na próxima tentativa.',
      },
    ],
    checks: [
      'Preservo Fellipe com dois l.',
      'A inicial e o corpo têm proporções consistentes.',
      'Tenho uma ordem estável para o ponto do i.',
    ],
    paper: 'Faça 5 primeiros nomes, mantendo a mesma ordem dos gestos usada na tela.',
    repeat: 'Volte ao trecho “elli” se os dois l ainda se confundem.',
  },
  {
    id: 6,
    phase: '02 · Completa em uma linha',
    title: 'O Serpa da A4',
    modelId: 'a4',
    objective: 'Aprender o sobrenome específico da A4, sem transplantar automaticamente a B4.',
    observe:
      'Compare o S, a inclinação do corpo e a saída do Serpa da A4. A assinatura curta é outra composição.',
    technique: [
      'Use a referência A4 durante toda esta sessão.',
      'Estude a inicial e o corpo separadamente, depois reúna-os mantendo o espaço previsto para Fellipe à esquerda.',
      'Observe o final do sobrenome e mantenha esse limite nas repetições.',
    ],
    steps: [
      step(
        'Estudar o sobrenome',
        'cover',
        3,
        '3 S + 3 “erpa”',
        'Cubra apenas o sobrenome da A4. Observe as diferenças em relação à B4.',
      ),
      step(
        'Unir Serpa',
        'copy',
        4,
        '5 sobrenomes',
        'Reproduza o Serpa da A4, com o mesmo sentido de inclinação do primeiro nome.',
      ),
      step(
        'Fixar a forma',
        'memory',
        3,
        '3 sobrenomes',
        'Faça o sobrenome e depois revele a referência. Revise a proporção do S, não cada pixel.',
      ),
    ],
    corrections: [
      {
        problem: 'O sobrenome cresce a cada repetição.',
        action: 'Defina mentalmente a altura e a largura antes de começar.',
      },
      {
        problem: 'Aparece a B4 no lugar da A4.',
        action: 'Volte ao modo Cobrir e compare a inicial e a finalização das duas referências.',
      },
    ],
    checks: [
      'Reconheço o Serpa específico da A4.',
      'Mantenho a inclinação do conjunto.',
      'A saída do sobrenome tem limite estável.',
    ],
    paper: 'Faça 5 sobrenomes da A4 deixando espaço à esquerda para o primeiro nome.',
    repeat: 'Se as duas versões se misturam, repita esta sessão antes de juntar os nomes.',
  },
  {
    id: 7,
    phase: '02 · Completa em uma linha',
    title: 'A4 completa',
    modelId: 'a4',
    objective: 'Executar Fellipe Serpa em uma linha com espaçamento e ritmo previsíveis.',
    observe:
      'Compare o tamanho dos dois nomes e o intervalo entre eles. Esse espaço faz parte do desenho.',
    technique: [
      'Planeje onde Fellipe termina e Serpa começa antes de apoiar a caneta.',
      'Uma pausa curta entre nomes é aceitável. Evite interromper o corpo de cada nome para conferir a imagem.',
      'Mantenha as iniciais em destaque sem aumentar os floreios a cada repetição.',
    ],
    steps: [
      step(
        'Reconhecer a composição',
        'cover',
        3,
        '3 A4 completas',
        'Cubra os dois nomes. Observe o intervalo entre eles e o espaço total ocupado.',
      ),
      step(
        'Criar continuidade',
        'copy',
        4,
        '5 A4 completas',
        'Copie com a referência ao lado. Escolha um único ajuste por tentativa: intervalo, altura ou finalização.',
      ),
      step(
        'Assinar sem referência',
        'memory',
        3,
        '3 A4 completas',
        'Salve uma tentativa inicial e uma final. No Histórico, compare a silhueta e use Replay para observar suas próprias pausas.',
      ),
    ],
    corrections: [
      {
        problem: 'Nomes colados ou muito afastados.',
        action:
          'Ensaie só o final de Fellipe e o início de Serpa, mantendo um intervalo planejado.',
      },
      {
        problem: 'Assinatura desce ao longo da linha.',
        action:
          'Imagine uma linha de apoio para as letras pequenas e observe o ponto final antes de começar.',
      },
    ],
    checks: [
      'Mantenho espaço semelhante entre os nomes.',
      'Fellipe conserva os dois l.',
      'Consigo fazer a completa sem consultar a imagem no meio.',
    ],
    paper:
      'Assine 5 vezes em uma folha sem pauta. Escolha uma versão que seja bonita e confortável de repetir.',
    repeat:
      'Retome a sessão 5 ou 6 se o problema estiver dentro de um nome; repita esta se estiver no conjunto.',
  },
  {
    id: 8,
    phase: '03 · Completa em dois níveis',
    title: 'O nível superior da A5-04',
    modelId: 'a5-04',
    objective: 'Posicionar Fellipe no nível superior e reservar espaço para Serpa.',
    observe:
      'Veja a largura e a posição de Fellipe dentro da A5-04 inteira. O primeiro nome precisa deixar espaço para o segundo nível.',
    technique: [
      'Observe a composição completa, mas pratique somente Fellipe nesta sessão.',
      'Preserve a versão do F desta referência, sem copiar por hábito o F da A4.',
      'Planeje a posição do primeiro nome dentro da área total, em vez de centralizá-lo sozinho.',
    ],
    steps: [
      step(
        'Encontrar o nível',
        'cover',
        3,
        '4 primeiros nomes',
        'Cubra apenas Fellipe no nível superior. Deixe a parte inferior sem tinta.',
      ),
      step(
        'Posicionar sem guia',
        'copy',
        4,
        '5 primeiros nomes',
        'Reproduza Fellipe na região superior da área, reservando o espaço de Serpa.',
      ),
      step(
        'Recordar o posicionamento',
        'memory',
        3,
        '3 primeiros nomes',
        'Faça o nível superior sem olhar. Revele e confira tanto a forma quanto a posição.',
      ),
    ],
    corrections: [
      {
        problem: 'Primeiro nome ocupa a área inteira.',
        action: 'Planeje a altura dos dois níveis antes de iniciar o F.',
      },
      {
        problem: 'Fellipe vira a versão da A4.',
        action: 'Compare as iniciais e volte a cobrir o modelo A5-04.',
      },
    ],
    checks: [
      'Preservo os dois l de Fellipe.',
      'Deixo espaço para o nível inferior.',
      'Uso o desenho próprio da A5-04.',
    ],
    paper:
      'Faça 5 primeiros nomes dentro de retângulos altos o suficiente para receber Serpa depois.',
    repeat: 'Repita Copiar se você precisa deslocar ou encolher o nome depois de pronto.',
  },
  {
    id: 9,
    phase: '03 · Completa em dois níveis',
    title: 'O encaixe de Serpa',
    modelId: 'a5-04',
    objective: 'Colocar o sobrenome no nível inferior sem fechar os espaços da composição.',
    observe:
      'Olhe onde o S começa em relação ao primeiro nome e onde termina a finalização. Observe os espaços entre os dois níveis.',
    technique: [
      'Pratique Serpa imaginando Fellipe acima, mesmo quando não o desenhar.',
      'Compare a posição horizontal do S com o início do primeiro nome.',
      'Preserve cruzamentos presentes na referência; evite criar novos cruzamentos por falta de espaço.',
    ],
    steps: [
      step(
        'Reconhecer o encaixe',
        'cover',
        3,
        '4 sobrenomes',
        'Cubra somente Serpa da A5-04 e confira a posição de sua inicial.',
      ),
      step(
        'Reservar o espaço',
        'copy',
        4,
        '5 sobrenomes',
        'Faça Serpa na região inferior, com espaço suficiente para Fellipe acima.',
      ),
      step(
        'Lembrar a posição',
        'memory',
        3,
        '3 sobrenomes',
        'Reproduza o sobrenome e compare o início e o final com a composição original.',
      ),
    ],
    corrections: [
      {
        problem: 'Níveis encostam sem espaço.',
        action: 'Aumente um pouco a área total e ensaie a distância vertical antes de reduzir.',
      },
      {
        problem: 'Serpa parece solto do conjunto.',
        action:
          'Compare sua posição horizontal com Fellipe; não alinhe automaticamente ambos pela margem esquerda.',
      },
    ],
    checks: [
      'Sei onde o S começa abaixo de Fellipe.',
      'Preservo espaços entre os níveis.',
      'A finalização cabe na composição.',
    ],
    paper:
      'Complete com Serpa os primeiros nomes da sessão anterior. Compare o encaixe em 5 conjuntos.',
    repeat: 'Se o encaixe variar muito, repita o sobrenome com a referência ao lado.',
  },
  {
    id: 10,
    phase: '03 · Completa em dois níveis',
    title: 'A5-04 completa',
    modelId: 'a5-04',
    objective: 'Executar os dois níveis como uma composição planejada e repetível.',
    observe:
      'Veja o contorno externo da assinatura e os espaços internos. A relação entre os níveis importa tanto quanto as letras.',
    technique: [
      'Como ponto de partida, faça Fellipe e depois Serpa. Ajuste as levantadas de caneta ao seu conforto.',
      'Antes de começar, imagine a largura total e a distância entre níveis.',
      'Escolha uma sequência para pontos e finalizações e mantenha-a durante a sessão.',
    ],
    steps: [
      step(
        'Montar os dois níveis',
        'cover',
        3,
        '3 A5-04 completas',
        'Cubra o conjunto sem tentar ligar à força todos os traços.',
      ),
      step(
        'Repetir o encaixe',
        'copy',
        4,
        '5 A5-04 completas',
        'Compare o espaço entre níveis em cada tentativa. Corrija o posicionamento na próxima, sem retocar a anterior.',
      ),
      step(
        'Executar de memória',
        'memory',
        3,
        '3 A5-04 completas',
        'Salve a primeira e a última. Use o Histórico para comparar a composição e a fluidez percebida.',
      ),
    ],
    corrections: [
      {
        problem: 'O segundo nível fica sem espaço.',
        action:
          'Comece o primeiro nome um pouco mais acima e planeje a altura total antes de escrever.',
      },
      {
        problem: 'Muitas correções na finalização.',
        action:
          'Ensaie a saída isoladamente três vezes e volte ao conjunto com uma única passagem.',
      },
    ],
    checks: [
      'Repito uma sequência confortável.',
      'Mantenho a distância entre níveis.',
      'Consigo fazer a completa sem consertar por cima.',
    ],
    paper: 'Faça 5 A5-04 completas. Observe se a composição cabe em uma área prática para seu uso.',
    repeat:
      'Retorne à sessão 8 ou 9 se um nível estiver instável; repita esta para melhorar o encaixe.',
  },
  {
    id: 11,
    phase: '04 · Escolha e consistência',
    title: 'Comparar as completas',
    modelId: 'a4',
    objective: 'Escolher entre A4 e A5-04 com base em preferência visual, conforto e repetição.',
    observe:
      'Compare suas tentativas, não só as imagens ideais. A melhor candidata é aquela que você gosta e consegue repetir.',
    technique: [
      'Dê às duas completas a mesma quantidade de tentativas e condições semelhantes.',
      'Avalie forma, conforto e consistência separadamente. Não escolha só pela tentativa mais bonita.',
      'Use B4 como referência de versão curta, sem exigir que uma completa tenha a mesma rapidez.',
    ],
    steps: [
      step(
        'Rever a A4',
        'memory',
        3,
        '3 A4 completas',
        'Salve as três com nomes A4 — 1, 2 e 3. Faça cada uma sem consultar a imagem durante o gesto.',
        'a4',
      ),
      step(
        'Rever a A5-04',
        'memory',
        4,
        '3 A5-04 completas',
        'Salve as três com nomes A5-04 — 1, 2 e 3, nas mesmas condições.',
        'a5-04',
      ),
      step(
        'Rever a curta',
        'memory',
        3,
        '3 B4',
        'Faça a B4 e depois compare no Histórico. Registre nas notas qual completa prefere e o motivo.',
        'b4',
      ),
    ],
    corrections: [
      {
        problem: 'Escolha baseada em uma única tentativa.',
        action:
          'Observe as três de cada completa; procure o padrão que aparece com mais frequência.',
      },
      {
        problem: 'Um modelo parece mais lento porque foi menos treinado.',
        action: 'Repita sua sessão de conjunto antes de comparar novamente.',
      },
    ],
    checks: [
      'Comparei três tentativas de cada completa.',
      'Considerei conforto além da aparência.',
      'Registrei minha favorita provisória nas notas.',
    ],
    paper: 'Faça 3 A4 e 3 A5-04 com a mesma caneta. Confira se sua preferência continua no papel.',
    repeat:
      'Se ainda estiver em dúvida, mantenha ambas e repita a comparação após outra sessão curta.',
  },
  {
    id: 12,
    phase: '04 · Escolha e consistência',
    title: 'Completa favorita + curta',
    modelId: 'a4',
    objective: 'Consolidar uma assinatura completa principal e a B4 curta.',
    observe:
      'Observe os detalhes que distinguem a completa escolhida da B4. Preserve cada composição sem misturá-las.',
    technique: [
      'Selecione sua completa preferida abaixo antes de iniciar.',
      'Diga mentalmente qual versão fará e só então apoie a caneta.',
      'Ao terminar, anote a completa escolhida e o detalhe que deseja estabilizar. A escolha pode ser revista.',
    ],
    steps: [
      step(
        'Fixar a completa',
        'copy',
        3,
        '4 completas',
        'Use sua completa escolhida. Faça uma por vez e confira a silhueta geral.',
      ),
      step(
        'Fixar a curta',
        'memory',
        4,
        '4 B4',
        'Faça a versão curta sem trazer para ela os floreios da completa.',
        'b4',
      ),
      step(
        'Retornar à completa',
        'memory',
        3,
        '3 completas',
        'Volte à completa escolhida. Veja se a mudança de modelo alterou suas iniciais ou a finalização.',
      ),
    ],
    corrections: [
      {
        problem: 'Uma versão recebe detalhes da outra.',
        action:
          'Observe a referência por alguns segundos antes de começar e repita um bloco só desse modelo.',
      },
      {
        problem: 'A completa muda de desenho a cada sessão.',
        action:
          'Anote os elementos que quer manter: iniciais, espaço entre nomes ou níveis e finalização.',
      },
    ],
    checks: [
      'Escolhi uma completa para priorizar.',
      'Distingo seus detalhes dos da B4.',
      'Repito ambas sem acrescentar novos floreios.',
    ],
    paper: 'Alterne 3 pares: uma completa, uma B4. Deixe espaço entre as tentativas para comparar.',
    repeat: 'Se os modelos se misturam, faça blocos separados antes de voltar à alternância.',
  },
  {
    id: 13,
    phase: '04 · Escolha e consistência',
    title: 'Espaço real de assinatura',
    modelId: 'a4',
    objective: 'Adaptar a completa escolhida e a B4 a espaços menores com controle.',
    observe:
      'Observe o espaço disponível antes de começar. Uma assinatura pode caber em largura e ainda precisar de mais altura, especialmente a A5-04.',
    technique: [
      'Selecione sua completa preferida para os dois primeiros exercícios.',
      'Reduza todas as partes juntas. Se precisar apertar as letras, aumente a área ou use um tamanho intermediário.',
      'Na tela, compare tamanhos relativos. A etapa no papel é a referência para centímetros.',
    ],
    steps: [
      step(
        'Completa confortável',
        'copy',
        3,
        '3 completas',
        'Use um tamanho confortável como referência para a redução.',
      ),
      step(
        'Completa menor',
        'memory',
        4,
        '4 completas',
        'Use cerca de três quartos da largura anterior. Depois tente menor apenas se mantiver o conforto.',
      ),
      step(
        'Curta em espaço menor',
        'memory',
        3,
        '3 B4',
        'Pratique a versão curta em tamanho reduzido, preservando os espaços do corpo pequeno.',
        'b4',
      ),
    ],
    corrections: [
      {
        problem: 'A assinatura ultrapassa o espaço.',
        action:
          'Planeje onde a finalização termina antes de começar; reduza o conjunto, não apenas a saída.',
      },
      {
        problem: 'Redução causa tensão e retoques.',
        action: 'Volte ao tamanho intermediário e mantenha o movimento confortável.',
      },
    ],
    checks: [
      'Planejo largura e altura antes do gesto.',
      'Mantenho a composição em espaço menor.',
      'Conheço um tamanho confortável no papel.',
    ],
    paper:
      'Faça caixas de 8 e 6 cm para a completa, com altura suficiente para o modelo. Faça caixas de 5 e 3,5 cm para a B4. Experimente duas vezes em cada área e ajuste quando necessário.',
    repeat: 'Repita em tamanho intermediário se a menor versão perder seus elementos principais.',
  },
  {
    id: 14,
    phase: '04 · Escolha e consistência',
    title: 'Sua série de 10 tentativas',
    modelId: 'a4',
    objective: 'Definir uma referência pessoal repetível e um plano simples de manutenção.',
    observe:
      'Procure semelhanças entre as dez tentativas: silhueta, iniciais, espaços e finalização. Não procure cópias pixel a pixel.',
    technique: [
      'Selecione a completa escolhida. Use a mesma caneta, modo e tamanho nas dez tentativas.',
      'Salve cada assinatura separadamente, de “Final 01” a “Final 10”. Não descarte uma tentativa só porque ficou diferente.',
      'Após a série, favorite três que representem seu gesto habitual. Compare com uma versão antiga e anote o próximo ajuste.',
    ],
    steps: [
      step(
        'Tentativas 01 a 03',
        'memory',
        3,
        '3 completas',
        'Faça e salve cada tentativa antes de limpar. Dê os nomes Final 01, Final 02 e Final 03.',
      ),
      step(
        'Tentativas 04 a 06',
        'memory',
        3,
        '3 completas',
        'Mantenha o mesmo tamanho e ritmo. Salve Final 04, Final 05 e Final 06 sem retocar.',
      ),
      step(
        'Tentativas 07 a 10',
        'memory',
        4,
        '4 completas',
        'Salve Final 07 a Final 10. Abra o Histórico, favorite três e registre o que ficou consistente.',
      ),
    ],
    corrections: [
      {
        problem: 'Só uma tentativa parece boa.',
        action:
          'Identifique o detalhe mais variável e retome a sessão correspondente antes de repetir a série.',
      },
      {
        problem: 'Todas mudam por excesso de correção.',
        action:
          'Escolha um único detalhe para ajustar na próxima sessão; conclua cada gesto sem retoque.',
      },
    ],
    checks: [
      'Salvei as dez tentativas separadamente.',
      'Escolhi três que representam meu gesto habitual.',
      'Registrei minha versão principal e um próximo ajuste.',
    ],
    paper:
      'Faça outra série de 10 no papel, sem copiar por cima. Marque três que você conseguiria repetir no dia a dia.',
    repeat:
      'Se ainda não houver um padrão confortável, retome a aula do detalhe mais instável. Concluir o percurso não exige perfeição.',
  },
]

// Focused lessons teach only their named fragment, for a total of 20 repetitions.
for (const lesson of COURSE_LESSONS) {
  const focus = getCourseFocus(lesson.id)
  if (!focus) continue
  lesson.steps = lesson.steps.map((exercise, index) => ({
    ...exercise,
    title: `${['Cobrir', 'Copiar', 'Lembrar'][index]}: ${focus.label}`,
    repetitions: `${FOCUSED_REPETITIONS[index]} repetições de ${focus.label}`,
    instruction: `${['Cubra', 'Copie', 'Faça de memória'][index]} apenas ${focus.label}, uma vez por tentativa. Não faça a assinatura completa. Toque em “Concluir repetição” depois de cada tentativa para guardá-la e preparar a próxima.`,
  }))
}

export function getLesson(id: number) {
  return COURSE_LESSONS.find((lesson) => lesson.id === id)
}
export function practiceModel(
  lesson: CourseLesson,
  stepIndex: number,
  selectedModel?: ModelId,
): ModelId {
  return (
    lesson.steps[stepIndex].modelId ??
    (lesson.id >= 12 && selectedModel !== 'b4' && selectedModel ? selectedModel : lesson.modelId)
  )
}
