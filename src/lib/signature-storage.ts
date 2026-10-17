import {
  AppData,
  CustomReference,
  DraftState,
  ModelId,
  PointerKind,
  SavedAttempt,
  SignaturePoint,
  SignatureStroke,
  TrainingMode,
  createDefaultData,
} from '@/data/signature'

const DATABASE_NAME = 'assinatura-serpa'
const STORE_NAME = 'dados'
const STATE_KEY = 'estado-principal'
const FALLBACK_KEY = 'assinatura-serpa-fallback-v1'
const MAX_TOTAL_POINTS = 300_000

export type StorageKind = 'indexeddb' | 'localStorage'

interface BackupEnvelope {
  kind: 'assinatura-serpa-backup'
  version: 1
  exportedAt: string
  data: AppData
}

let databasePromise: Promise<IDBDatabase> | null = null
let saveQueue: Promise<StorageKind> = Promise.resolve('indexeddb')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function openDatabase(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponível'))
  if (databasePromise) return databasePromise

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Não foi possível abrir o armazenamento local'))
    request.onblocked = () =>
      reject(new Error('O armazenamento local está bloqueado por outra aba'))
  })

  return databasePromise
}

async function readIndexedDb(): Promise<unknown> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(STATE_KEY)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Falha ao ler os dados locais'))
  })
}

async function writeIndexedDb(data: AppData): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(data, STATE_KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Falha ao salvar os dados locais'))
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('O salvamento local foi interrompido'))
  })
}

function readFallback(): unknown {
  const value = localStorage.getItem(FALLBACK_KEY)
  return value ? JSON.parse(value) : null
}

function writeFallback(data: AppData): void {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(data))
}

export async function loadAppData(): Promise<{ data: AppData | null; storage: StorageKind }> {
  try {
    const stored = await readIndexedDb()
    if (!stored) return { data: null, storage: 'indexeddb' }
    return { data: validateAppData(stored), storage: 'indexeddb' }
  } catch {
    const stored = readFallback()
    return { data: stored ? validateAppData(stored) : null, storage: 'localStorage' }
  }
}

async function persist(data: AppData): Promise<StorageKind> {
  try {
    await writeIndexedDb(data)
    return 'indexeddb'
  } catch {
    writeFallback(data)
    return 'localStorage'
  }
}

export function persistAppData(data: AppData): Promise<StorageKind> {
  const snapshot = JSON.parse(JSON.stringify(data)) as AppData
  saveQueue = saveQueue.catch(() => 'indexeddb' as const).then(() => persist(snapshot))
  return saveQueue
}

export function createBackupEnvelope(data: AppData): BackupEnvelope {
  return {
    kind: 'assinatura-serpa-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
}

function requireString(value: unknown, field: string, maxLength = 240): string {
  if (typeof value !== 'string' || !value || value.length > maxLength) {
    throw new Error(`Campo inválido no backup: ${field}`)
  }
  return value
}

function requireNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Número inválido no backup: ${field}`)
  }
  return value
}

function modelId(value: unknown): ModelId {
  if (value === 'b4' || value === 'a4' || value === 'a5-04') return value
  throw new Error('Modelo desconhecido no backup')
}

function trainingMode(value: unknown): TrainingMode {
  if (value === 'cover' || value === 'copy' || value === 'memory') return value
  throw new Error('Modo de treino desconhecido no backup')
}

function pointerKind(value: unknown): PointerKind {
  if (value === 'pen' || value === 'mouse' || value === 'touch' || value === 'desconhecido')
    return value
  return 'desconhecido'
}

function signaturePoint(value: unknown, counter: { total: number }): SignaturePoint {
  if (!isRecord(value)) throw new Error('Ponto de traço inválido no backup')
  counter.total += 1
  if (counter.total > MAX_TOTAL_POINTS)
    throw new Error('O backup excede o limite de 300 mil pontos')

  const point: SignaturePoint = {
    x: requireNumber(value.x, 'x', 0, 1),
    y: requireNumber(value.y, 'y', 0, 1),
    t: requireNumber(value.t, 'tempo', 0, 86_400_000),
  }
  if (value.pressure !== undefined) point.pressure = requireNumber(value.pressure, 'pressão', 0, 1)
  return point
}

function signatureStroke(value: unknown, counter: { total: number }): SignatureStroke {
  if (
    !isRecord(value) ||
    !Array.isArray(value.points) ||
    value.points.length === 0 ||
    value.points.length > 20_000
  ) {
    throw new Error('Traço inválido ou grande demais no backup')
  }
  const color = requireString(value.color, 'cor', 20)
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Cor de traço inválida no backup')
  return {
    id: requireString(value.id, 'id do traço', 120),
    points: value.points.map((point) => signaturePoint(point, counter)),
    color,
    width: requireNumber(value.width, 'espessura', 1, 20),
    pointerType: pointerKind(value.pointerType),
  }
}

function strokeList(value: unknown, counter: { total: number }, field: string): SignatureStroke[] {
  if (!Array.isArray(value) || value.length > 4_000)
    throw new Error(`Lista inválida no backup: ${field}`)
  return value.map((stroke) => signatureStroke(stroke, counter))
}

function draftState(value: unknown, counter: { total: number }): DraftState {
  if (!isRecord(value)) throw new Error('Rascunho inválido no backup')
  return {
    strokes: strokeList(value.strokes, counter, 'traços do rascunho'),
    redoStack: strokeList(value.redoStack ?? [], counter, 'itens para refazer'),
    clearedBuffer:
      value.clearedBuffer === null || value.clearedBuffer === undefined
        ? null
        : strokeList(value.clearedBuffer, counter, 'buffer de restauração'),
    modelId: modelId(value.modelId),
    mode: trainingMode(value.mode),
    referenceOpacity: requireNumber(value.referenceOpacity, 'opacidade', 0, 1),
    referenceVisible: Boolean(value.referenceVisible),
    inkColor: requireString(value.inkColor, 'cor da tinta', 20),
    lineWidth: requireNumber(value.lineWidth, 'espessura da tinta', 1, 12),
    favorite: Boolean(value.favorite),
    startedAt: requireString(value.startedAt, 'início do rascunho', 80),
    updatedAt: requireString(value.updatedAt, 'atualização do rascunho', 80),
  }
}

function savedAttempt(value: unknown, counter: { total: number }): SavedAttempt {
  if (!isRecord(value)) throw new Error('Tentativa inválida no backup')
  return {
    id: requireString(value.id, 'id da tentativa', 120),
    name: requireString(value.name, 'nome da tentativa', 100),
    modelId: modelId(value.modelId),
    createdAt: requireString(value.createdAt, 'data da tentativa', 80),
    duration: requireNumber(value.duration, 'duração', 0, 86_400_000),
    strokes: strokeList(value.strokes, counter, 'traços da tentativa'),
    favorite: Boolean(value.favorite),
    inkColor: requireString(value.inkColor, 'cor da tentativa', 20),
    lineWidth: requireNumber(value.lineWidth, 'espessura da tentativa', 1, 12),
  }
}

function customReference(value: unknown): CustomReference {
  if (!isRecord(value) || !isRecord(value.frame))
    throw new Error('Referência personalizada inválida no backup')
  const dataUrl = requireString(value.dataUrl, 'imagem personalizada', 8_000_000)
  if (!dataUrl.startsWith('data:image/'))
    throw new Error('Formato de imagem personalizada inválido')
  return {
    dataUrl,
    fileName: requireString(value.fileName, 'nome da imagem', 200),
    width: requireNumber(value.width, 'largura da imagem', 1, 20_000),
    height: requireNumber(value.height, 'altura da imagem', 1, 20_000),
    frame: {
      zoom: requireNumber(value.frame.zoom, 'zoom da imagem', 1, 2),
      offsetX: requireNumber(value.frame.offsetX, 'posição horizontal', -50, 50),
      offsetY: requireNumber(value.frame.offsetY, 'posição vertical', -50, 50),
    },
  }
}

export function validateAppData(value: unknown): AppData {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.attempts) ||
    value.attempts.length > 1_000
  ) {
    throw new Error('Este arquivo não é um backup válido do Assinatura Serpa')
  }
  const counter = { total: 0 }
  const references: Partial<Record<ModelId, CustomReference>> = {}
  if (isRecord(value.customReferences)) {
    for (const id of ['b4', 'a4', 'a5-04'] as ModelId[]) {
      if (value.customReferences[id] !== undefined)
        references[id] = customReference(value.customReferences[id])
    }
  }
  if (!Array.isArray(value.completedSessions) || value.completedSessions.length > 14) {
    throw new Error('Sessões do curso inválidas no backup')
  }
  const completedSessions = [
    ...new Set(value.completedSessions.map((item) => requireNumber(item, 'sessão', 1, 14))),
  ]
  return {
    version: 1,
    draft: draftState(value.draft, counter),
    attempts: value.attempts.map((attempt) => savedAttempt(attempt, counter)),
    completedSessions,
    customReferences: references,
  }
}

export function parseBackup(value: unknown): AppData {
  if (!isRecord(value)) throw new Error('O conteúdo do arquivo JSON é inválido')
  if (value.kind === 'assinatura-serpa-backup') return validateAppData(value.data)
  return validateAppData(value)
}

export function mergeBackup(current: AppData, imported: AppData): { data: AppData; added: number } {
  const existingIds = new Set(current.attempts.map((attempt) => attempt.id))
  const additions = imported.attempts.filter((attempt) => !existingIds.has(attempt.id))
  const currentHasDraft = current.draft.strokes.length > 0
  return {
    added: additions.length,
    data: {
      version: 1,
      draft: currentHasDraft ? current.draft : imported.draft,
      attempts: [...current.attempts, ...additions].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
      completedSessions: [
        ...new Set([...current.completedSessions, ...imported.completedSessions]),
      ].sort((a, b) => a - b),
      customReferences: { ...imported.customReferences, ...current.customReferences },
    },
  }
}

export function freshDataKeepingPreferences(data: AppData): AppData {
  const fresh = createDefaultData()
  return {
    ...fresh,
    draft: {
      ...fresh.draft,
      modelId: data.draft.modelId,
      mode: data.draft.mode,
      referenceOpacity: data.draft.referenceOpacity,
      referenceVisible: data.draft.referenceVisible,
      inkColor: data.draft.inkColor,
      lineWidth: data.draft.lineWidth,
    },
    completedSessions: data.completedSessions,
    customReferences: data.customReferences,
  }
}
