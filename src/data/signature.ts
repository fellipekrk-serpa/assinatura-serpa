import type { CourseJournal, CoursePractice } from './course'
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
  tool?: 'pen' | 'eraser'
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
  coursePractice?: CoursePractice
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
  courseSessionId?: number
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
  courseJournal?: CourseJournal
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
