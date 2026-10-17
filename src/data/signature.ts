import b4Original from '@/assets/b4-original-b4ac8.png'
import a4Original from '@/assets/a4-original-6f2c4.png'
import a504Original from '@/assets/a5-04-b8077.png'

export type ModelId = 'b4' | 'a4' | 'a5-04'
export type TrainingMode = 'cover' | 'copy' | 'memory'
export type PointerKind = 'pen' | 'mouse' | 'touch' | 'desconhecido'

export interface SignaturePoint {
  x: number
  y: number
  t: number
  pressure?: number
}

export interface SignatureStroke {
  id: string
  points: SignaturePoint[]
  color: string
  width: number
  pointerType: PointerKind
}

export interface ReferenceFrame {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface CustomReference {
  dataUrl: string
  fileName: string
  width: number
  height: number
  frame: ReferenceFrame
}

export interface DraftState {
  strokes: SignatureStroke[]
  redoStack: SignatureStroke[]
  clearedBuffer: SignatureStroke[] | null
  modelId: ModelId
  mode: TrainingMode
  referenceOpacity: number
  referenceVisible: boolean
  inkColor: string
  lineWidth: number
  favorite: boolean
  startedAt: string
  updatedAt: string
}

export interface SavedAttempt {
  id: string
  name: string
  modelId: ModelId
  createdAt: string
  duration: number
  strokes: SignatureStroke[]
  favorite: boolean
  inkColor: string
  lineWidth: number
}

export interface AppData {
  version: 1
  draft: DraftState
  attempts: SavedAttempt[]
  completedSessions: number[]
  customReferences: Partial<Record<ModelId, CustomReference>>
}

export interface ReferenceModel {
  id: ModelId
  name: string
  subtitle: string
  asset: string
}

export const REFERENCE_MODELS: ReferenceModel[] = [
  {
    id: 'b4',
    name: 'B4 original',
    subtitle: 'Serpa',
    asset: b4Original,
  },
  {
    id: 'a4',
    name: 'A4 original',
    subtitle: 'Fellipe Serpa em uma linha',
    asset: a4Original,
  },
  {
    id: 'a5-04',
    name: 'A5-04',
    subtitle: 'Fellipe Serpa em dois níveis',
    asset: a504Original,
  },
]

export const COURSE_SESSIONS = [
  {
    id: 1,
    model: 'B4',
    title: 'O gesto do S',
    description: 'Pratique apenas o gesto amplo do S, com movimento contínuo e leve.',
  },
  {
    id: 2,
    model: 'B4',
    title: 'Construir “erpa”',
    description: 'Treine o bloco “erpa”, observando ritmo e ligação entre letras.',
  },
  {
    id: 3,
    model: 'B4',
    title: 'Juntar a assinatura',
    description: 'Una o S ao restante sem interromper o ritmo geral.',
  },
  {
    id: 4,
    model: 'B4',
    title: 'Reduzir com controle',
    description: 'Repita a B4 em espaços menores, sem perder a proporção.',
  },
  {
    id: 5,
    model: 'A4',
    title: 'F e “ellipe”',
    description: 'Isole o F e depois conecte “ellipe” em uma linha fluida.',
  },
  {
    id: 6,
    model: 'A4',
    title: 'S e “erpa”',
    description: 'Trabalhe o segundo nome, mantendo altura e inclinação consistentes.',
  },
  {
    id: 7,
    model: 'A4',
    title: 'Conjunto em uma linha',
    description: 'Pratique a A4 completa e observe o espaço entre os nomes.',
  },
  {
    id: 8,
    model: 'A5-04',
    title: 'Nível superior',
    description: 'Estude Fellipe e seus traços superiores sem executar a parte inferior.',
  },
  {
    id: 9,
    model: 'A5-04',
    title: 'Encaixe inferior',
    description: 'Pratique o encaixe de Serpa abaixo, preservando respiro entre níveis.',
  },
  {
    id: 10,
    model: 'A5-04',
    title: 'Conjunto em dois níveis',
    description: 'Reúna as duas partes em um único gesto planejado.',
  },
  {
    id: 11,
    model: 'Todos',
    title: 'Comparar as completas',
    description: 'Faça uma tentativa de cada modelo e compare forma, escala e ritmo.',
  },
  {
    id: 12,
    model: 'Todos',
    title: 'Completa favorita + curta',
    description: 'Alterne sua assinatura completa favorita e a versão curta B4.',
  },
  {
    id: 13,
    model: 'Todos',
    title: 'Espaços menores',
    description: 'Pratique em três tamanhos progressivamente menores, também no papel.',
  },
  {
    id: 14,
    model: 'Todos',
    title: 'Avaliar 10 tentativas',
    description: 'Produza 10 tentativas e escolha manualmente as que melhor representam seu gesto.',
  },
] as const

export const INK_COLORS = [
  { name: 'Tinta Preta', value: '#16130F' },
  { name: 'Tinta Azul', value: '#1D3A6E' },
  { name: 'Tinta Sépia', value: '#5B3A21' },
] as const

export function createDefaultData(): AppData {
  const now = new Date().toISOString()
  return {
    version: 1,
    draft: {
      strokes: [],
      redoStack: [],
      clearedBuffer: null,
      modelId: 'b4',
      mode: 'cover',
      referenceOpacity: 0.3,
      referenceVisible: true,
      inkColor: '#16130F',
      lineWidth: 3,
      favorite: false,
      startedAt: now,
      updatedAt: now,
    },
    attempts: [],
    completedSessions: [],
    customReferences: {},
  }
}

export function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function cloneStrokes(strokes: SignatureStroke[]): SignatureStroke[] {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }))
}

export function strokesDuration(strokes: SignatureStroke[]): number {
  const times = strokes.flatMap((stroke) => stroke.points.map((point) => point.t))
  if (times.length < 2) return 0
  return Math.max(...times) - Math.min(...times)
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.round(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes}min ${seconds.toString().padStart(2, '0')}s` : `${seconds}s`
}
