import type { SignatureStroke } from './signature'

export interface Workbook {
  id: string
  title: string
  group: 'base' | 'bonus' | 'complement'
  pages: number
  driveId: string
  sha256: string
  firstPractice: number
}

// Counts are PDF pages (including introductions), never advertised as exercise counts.
export const WORKBOOKS: Workbook[] = [
  {
    id: 'coordenacao',
    title: 'Coordenação motora',
    group: 'base',
    pages: 15,
    firstPractice: 4,
    driveId: '1Cad7BN3DbwRS95J6AHsQefTVurfzJPBE',
    sha256: 'e956f24a02a8a4b465770f07d2d5c0fd9aab436a5a7e679d5f235d35332119b1',
  },
  {
    id: 'cursivo',
    title: 'Alfabeto cursivo',
    group: 'base',
    pages: 29,
    firstPractice: 4,
    driveId: '1LxFvITWZc97j0dX076EqEq7CjuTsB8U-',
    sha256: 'd717e7be6436e676de53b0a6cd8ae33060d6a57d59f9627d79591e96301efe71',
  },
  {
    id: 'geral',
    title: 'Caligrafia geral',
    group: 'base',
    pages: 51,
    firstPractice: 7,
    driveId: '1dgMtINziTTZzdfO3eTs0W_aIbvKOliNE',
    sha256: 'c5c2ac0f3e94df4f7ec3b94959e31ec927e3b46c70988eb7272a44281f9a7fc1',
  },
  {
    id: 'antiga',
    title: 'Caligrafia antiga 2.0',
    group: 'base',
    pages: 53,
    firstPractice: 8,
    driveId: '1YzSG6LiMhK6Y3KseN3zFeiziFFQjher0',
    sha256: '52901548a7bd959b4f56bd5cd949ba4b0e6c6709be49e5e4f4957211e25ed28e',
  },
  {
    id: 'inglesa',
    title: 'Caligrafia antiga · Inglesa',
    group: 'base',
    pages: 16,
    firstPractice: 5,
    driveId: '1CVVJc5_0bE7hekNmMEfW8OKTJ98dnhCh',
    sha256: 'd95802e4760b8e2aa4527841f667e17445248c74de58f69578a153d470bb6d92',
  },
  {
    id: 'gotico',
    title: 'Alfabeto gótico',
    group: 'base',
    pages: 16,
    firstPractice: 2,
    driveId: '1B74jFO14Y1gwXMqvD8ft8YqoK57R-2Ys',
    sha256: '7389b72198058e9f554b1272b5914ff31250bcebf98abcfcee4bc75225f771a3',
  },
  {
    id: 'gotico-nomes',
    title: 'Gótica · Nomes e frases',
    group: 'base',
    pages: 17,
    firstPractice: 2,
    driveId: '1AQyMJBurzHyOrusgIaYV8yot_oF0GKrV',
    sha256: 'cc261d534f49d759b933f4357888be3b87216084d99ae5ab45d254eb8d24695d',
  },
  {
    id: 'lettering',
    title: 'Lettering',
    group: 'base',
    pages: 30,
    firstPractice: 3,
    driveId: '1aaXHHuuETghHGMuxXCZr1up7B6R6SPxQ',
    sha256: 'a4478dcfd11b11de5bbc558ce8f82acd1e10809356f4c961ca1858bd284ba590',
  },
  {
    id: 'floreios',
    title: 'Floreios',
    group: 'complement',
    pages: 115,
    firstPractice: 7,
    driveId: '1EEj9X0wyGp4s7aDokySdqDLN7emOhp7t',
    sha256: '6c623bce2919edc939fc5cb57543f3945bcb174fa026299f69a70d78f4c13237',
  },
  {
    id: 'tinteiro',
    title: 'Caneta-tinteiro',
    group: 'complement',
    pages: 16,
    firstPractice: 8,
    driveId: '1yhjrx9mDH3fu-UL1bjY2oJEWlCxe6804',
    sha256: '6a8b46006e12c286f79295c511899f98d6fad091808a53b7ca4ae7a9218a547c',
  },
  {
    id: 'bonus-10',
    title: 'Caligrafia Nota 1000',
    group: 'bonus',
    pages: 35,
    firstPractice: 1,
    driveId: '1WHnMj9IBQp6F9pDXIYF5gk64nYkg6kiP',
    sha256: 'aeadbb17ea27b0b570d1eaefee7ac557ebbf013fb553d925026457dddc296f15',
  },
  {
    id: 'bonus-11',
    title: 'Gabarito · Jutai Côrte',
    group: 'bonus',
    pages: 1,
    firstPractice: 1,
    driveId: '1EJUyMwqxoXs0m8p3P6_81PbY8lIZfPjY',
    sha256: '88b46d2dc267cfcdf509d9caafe718b3e13450bd8e9949c91e09278963490ca0',
  },
  {
    id: 'bonus-12',
    title: 'Reforço · Materiais pedagógicos I',
    group: 'bonus',
    pages: 28,
    firstPractice: 1,
    driveId: '1tnsQn-4dIA0ZSxEZdTmTmq9FeMHti0bp',
    sha256: '8c812e7d8198f613ecd5c9dd8f55b2c4979c92f830e1c9f438bf5bc70c6c3544',
  },
  {
    id: 'bonus-13',
    title: 'Reforço · Materiais pedagógicos II',
    group: 'bonus',
    pages: 8,
    firstPractice: 1,
    driveId: '1opSjOT69VygmDm6nya2VsoQwWmpZ0Aln',
    sha256: 'b98a3779d573558c4f85d006c0903dca986a87224be2b1a3436de6cf10331401',
  },
  {
    id: 'bonus-14',
    title: 'Bastão sílabas simples',
    group: 'bonus',
    pages: 28,
    firstPractice: 1,
    driveId: '1kkKKxh7G29baP9Yn2Sco2i_f7-AWxyWL',
    sha256: 'dcac11ce80b6f3ff400155c14bd7077bee4485bebb9b8f64a41a4f36d1e3c845',
  },
  {
    id: 'bonus-15',
    title: 'Fichas de leitura (sílabas complexas)',
    group: 'bonus',
    pages: 46,
    firstPractice: 1,
    driveId: '1ht4gLaTMcuN93cnUy2zgytI_R_gj35Dd',
    sha256: '6fb583c7526efac00d2fb5565a6b691b815a54557206d8a9a6c53b81633fc85d',
  },
  {
    id: 'bonus-16',
    title: 'Treinando as curvas 1',
    group: 'bonus',
    pages: 15,
    firstPractice: 1,
    driveId: '1Uwm_5bPzZfLDtZ3r1twR3qjunbxUSMHJ',
    sha256: '3e7cd145eb816cd7203ef2ecdd90a0f1a0fecd81a50ae9cd5c66ae04aa7abde6',
  },
  {
    id: 'bonus-17',
    title: 'Bastão complexas',
    group: 'bonus',
    pages: 30,
    firstPractice: 1,
    driveId: '1SRQaU6ZRYXV_dyEcQ_URbBrH4TfOlWqL',
    sha256: '84a6e544844d7f552b2b6a55cec05f291c4eacfbec2fbebe6429cd9deae97f6b',
  },
  {
    id: 'bonus-18',
    title: 'Complexas cursiva',
    group: 'bonus',
    pages: 30,
    firstPractice: 1,
    driveId: '1dvLv2StCqAdjjmitbtbYYs251zd_6zA5',
    sha256: '884a5b0689e6d052e742dab22c27f7408ad464ad4b284ffc8910a8130e1b80d8',
  },
  {
    id: 'bonus-19',
    title: 'Consciência silábica',
    group: 'bonus',
    pages: 28,
    firstPractice: 1,
    driveId: '1GoFiZ3HnoTHb9fORh1vZk5TPvwSSpXtq',
    sha256: 'fa85b24a3f1bdf05006b15a29c691a75a50a417d0f86889e062aafbc96fcfc89',
  },
  {
    id: 'bonus-20',
    title: 'Fichas leitura e escrita',
    group: 'bonus',
    pages: 12,
    firstPractice: 1,
    driveId: '1aWvd-akpz2awrqBDND1EjIwOm1Ze7P7J',
    sha256: 'bad1d74118db0b45b95dc258646e3bacdddbdd6b969e033e5dc3f60349bcd071',
  },
  {
    id: 'bonus-21',
    title: 'Interpretação de Frases',
    group: 'bonus',
    pages: 13,
    firstPractice: 1,
    driveId: '1BHtXzS8k-WaYLbkn4_KACcn8tFZeGHp7',
    sha256: '60dc7cb3cced4d9dfa833343d65c9921781b7440f7d7558f7315b93f97d15cbc',
  },
  {
    id: 'bonus-22',
    title: 'Sílabas simples cursiva',
    group: 'bonus',
    pages: 28,
    firstPractice: 1,
    driveId: '1z2psn1W0NOS-WEVCs2CldhePolpmM3f6',
    sha256: 'ec0b8b08c8c1656518c582af23ace69d99d9210a9bb9aaf32b404a5d240d1ef1',
  },
  {
    id: 'bonus-23',
    title: 'Treinando as curvas 2',
    group: 'bonus',
    pages: 15,
    firstPractice: 1,
    driveId: '1L3jlqJgTSGUD31UFbxb-7UIqMd_JOxEq',
    sha256: '3e7cd145eb816cd7203ef2ecdd90a0f1a0fecd81a50ae9cd5c66ae04aa7abde6',
  },
  {
    id: 'bonus-24',
    title: 'Fluência leitora',
    group: 'bonus',
    pages: 10,
    firstPractice: 1,
    driveId: '1sF0sahJaiL3nimnHbO8MsP8W-td_-0nN',
    sha256: '149a4f9d13afea5063aa09f31b12d4d0a084cd9591c30f8e09ff9c186a73c4e8',
  },
  {
    id: 'bonus-25',
    title: 'Interpretação de textos 2',
    group: 'bonus',
    pages: 40,
    firstPractice: 1,
    driveId: '1NXZ5_FgmbwW4Xx8b9bROePZfYQE8WQUI',
    sha256: 'f9187a77cbd7fcd92c723bbc5fbde5d9aa1ced0a7b6f7d47d918c7c3db3c7cc1',
  },
  {
    id: 'bonus-26',
    title: 'Interpretação de Textos',
    group: 'bonus',
    pages: 9,
    firstPractice: 1,
    driveId: '1R6besNfsqWO4sH95o4u5g-e4deh_rpOd',
    sha256: 'c0c2c4afb31b86f5afba54c3a62e253af9a151efc0af2319d0c6381bc5db497f',
  },
  {
    id: 'bonus-27',
    title: 'Interpretação diversos gêneros',
    group: 'bonus',
    pages: 40,
    firstPractice: 1,
    driveId: '1Ziq8vJfI8RqS-7-g3gRENoUM86GquYIf',
    sha256: 'c318d6cc998549ffd8f47f8e93a5ea0a520a8938cfcc88693d565f77c307bb99',
  },
  {
    id: 'bonus-28',
    title: 'Leitura e interpretação',
    group: 'bonus',
    pages: 10,
    firstPractice: 1,
    driveId: '1OtHb5jDtcFZWIAr6cLh7PpI5KwhdR7ht',
    sha256: '86d7a895698386600e93042a885402d591d70fec754b7c68c35b7eb0de87b686',
  },
]

export type Crop = [number, number, number, number] // x,y,width,height, normalized to PDF page
export const FULL_PAGE: Crop = [0, 0, 1, 1]
export const BLOCK_TARGETS = [8, 8, 4] as const
export const BLOCK_NAMES = ['Cobrir', 'Copiar', 'Memória'] as const
export interface Worksheet {
  bookId: string
  page: number
  crop: Crop
  title: string
}
export interface WorksheetDraft {
  exercise: Worksheet
  strokes: SignatureStroke[]
  redo: SignatureStroke[]
  block: number
}
export interface WorksheetAttempt {
  id: string
  exercise: Worksheet
  strokes: SignatureStroke[]
  block: number
  createdAt: string
}
export interface WorksheetProgress {
  counts: [number, number, number]
  notes: string
  updatedAt: string
}
export interface AcademyData {
  selectedBook: string
  selectedPage: number
  exercises: Worksheet[]
  progress: Record<string, WorksheetProgress>
  attempts: WorksheetAttempt[]
  draft?: WorksheetDraft
}
export function createAcademyData(): AcademyData {
  return { selectedBook: 'coordenacao', selectedPage: 4, exercises: [], progress: {}, attempts: [] }
}
export function worksheetKey(exercise: Worksheet): string {
  const [x, y, width, height] = exercise.crop
  const left = Math.round(x * 10000),
    top = Math.round(y * 10000)
  const bounds = [
    left,
    top,
    Math.round((x + width) * 10000) - left,
    Math.round((y + height) * 10000) - top,
  ]
  return `${exercise.bookId}:${exercise.page}:${bounds.join(',')}`
}
export function defaultWorksheet(book: Workbook, page: number): Worksheet {
  return { bookId: book.id, page, crop: [...FULL_PAGE], title: `${book.title} · folha ${page}` }
}
