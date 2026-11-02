import { PEN_PRESETS, type PenType } from '@/data/pens'
import { WORKBOOKS, worksheetKey } from '@/data/academy'
import type { AcademyData } from '@/data/academy'
import { validWorksheet, mergeAcademy } from './academy-practice'
import { FOCUSED_REPETITIONS } from '@/data/course-focus'
import type { CourseJournal, CoursePractice } from '@/data/course'
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
const MAX_TOTAL_POINTS = 3_000_000

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

  databasePromise = databasePromise.catch((error) => {
    databasePromise = null
    throw error
  })
  return databasePromise
}

let lastSavedAt = 0
const RECOVERY_KEY = STATE_KEY + '-recovery'
type StoredData = AppData & { __savedAt: number }

function validStored(value: unknown): AppData | null {
  try {
    return value ? validateAppData(value) : null
  } catch {
    return null
  }
}
function savedTime(value: unknown): number {
  if (!isRecord(value)) return 0
  if (typeof value.__savedAt === 'number' && Number.isFinite(value.__savedAt))
    return value.__savedAt
  const data = validStored(value)
  return data ? Date.parse(data.draft.updatedAt) || 0 : 0
}
async function readIndexedDb(): Promise<unknown[]> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const primary = store.get(STATE_KEY),
      recovery = store.get(RECOVERY_KEY)
    tx.oncomplete = () => resolve([primary.result, recovery.result])
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Falha ao ler progresso'))
  })
}
async function writeIndexedDb(data: StoredData): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const previous = store.get(STATE_KEY)
    previous.onsuccess = () => {
      if (validStored(previous.result)) store.put(previous.result, RECOVERY_KEY)
      store.put(data, STATE_KEY)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error('Falha ao salvar progresso'))
  })
}
function readFallback(key: string): unknown {
  const text = localStorage.getItem(key)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    return { invalid: true }
  }
}
function writeFallback(data: StoredData): void {
  const previous = readFallback(FALLBACK_KEY)
  if (validStored(previous))
    localStorage.setItem(FALLBACK_KEY + '-recovery', JSON.stringify(previous))
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(data))
}
export async function loadAppData(): Promise<{
  data: AppData | null
  storage: StorageKind
  recovered?: boolean
}> {
  const candidates: { raw: unknown; storage: StorageKind; backup: boolean }[] = []
  let indexedReadFailed = false
  let readable = false,
    primaryStorage: StorageKind = 'indexeddb'
  try {
    const values = await readIndexedDb()
    readable = true
    values.forEach((raw, i) => candidates.push({ raw, storage: 'indexeddb', backup: i === 1 }))
  } catch {
    indexedReadFailed = true
    primaryStorage = 'localStorage'
  }
  try {
    for (const [i, key] of [FALLBACK_KEY, FALLBACK_KEY + '-recovery'].entries())
      candidates.push({ raw: readFallback(key), storage: 'localStorage', backup: i === 1 })
    readable = true
  } catch {
    /* IndexedDB may still be readable. */
  }
  const valid = candidates
    .filter((c) => validStored(c.raw))
    .sort((a, b) => savedTime(b.raw) - savedTime(a.raw))
  if (valid.length) {
    const chosen = valid[0]
    lastSavedAt = Math.max(lastSavedAt, savedTime(chosen.raw))
    return { data: validateAppData(chosen.raw), storage: chosen.storage, recovered: chosen.backup }
  }
  if (!readable || indexedReadFailed || candidates.some((c) => c.raw != null))
    throw new Error('Nenhuma cópia válida do progresso pôde ser lida')
  return { data: null, storage: primaryStorage }
}
async function persist(data: AppData): Promise<StorageKind> {
  const snapshot: StoredData = {
    ...data,
    __savedAt: (lastSavedAt = Math.max(Date.now(), lastSavedAt + 1)),
  }
  try {
    await writeIndexedDb(snapshot)
    return 'indexeddb'
  } catch {
    writeFallback(snapshot)
    return 'localStorage'
  }
}
export function persistAppData(data: AppData): Promise<StorageKind> {
  const snapshot = validateAppData(JSON.parse(JSON.stringify(data)))
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
  if (value.tool !== undefined && value.tool !== 'pen' && value.tool !== 'eraser')
    throw new Error('Ferramenta inválida no backup')
  if (value.penType !== undefined && !PEN_PRESETS.some((p) => p.id === value.penType))
    throw new Error('Tipo de caneta inválido no backup')
  const color = requireString(value.color, 'cor', 20)
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Cor de traço inválida no backup')
  return {
    id: requireString(value.id, 'id do traço', 120),
    ...(value.tool === undefined ? {} : { tool: value.tool as 'pen' | 'eraser' }),
    ...(value.penType === undefined ? {} : { penType: value.penType as PenType }),
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

function sessionId(value: unknown): number {
  const id = requireNumber(value, 'sessão', 1, 14)
  if (!Number.isInteger(id)) throw new Error('Sessão inválida no backup')
  return id
}

function coursePractice(value: unknown): CoursePractice | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error('Exercício inválido no backup')
  const stepIndex = requireNumber(value.stepIndex, 'bloco', 0, 2)
  if (!Number.isInteger(stepIndex)) throw new Error('Bloco inválido no backup')
  return {
    sessionId: sessionId(value.sessionId),
    stepIndex,
    completeModel: value.completeModel === undefined ? undefined : modelId(value.completeModel),
  }
}

function courseJournal(value: unknown): CourseJournal {
  if (value === undefined) return {}
  if (!isRecord(value) || Object.keys(value).length > 14)
    throw new Error('Diário inválido no backup')
  const result: CourseJournal = {}
  for (const [key, entry] of Object.entries(value)) {
    const id = sessionId(Number(key))
    if (
      String(id) !== key ||
      !isRecord(entry) ||
      typeof entry.notes !== 'string' ||
      entry.notes.length > 3000 ||
      !Array.isArray(entry.checks) ||
      entry.checks.length > 3 ||
      entry.checks.some((check) => !['0', '1', '2'].includes(check as string))
    )
      throw new Error('Anotação inválida no backup')
    const updatedAt = requireString(entry.updatedAt, 'data da anotação', 80)
    if (!Number.isFinite(Date.parse(updatedAt))) throw new Error('Data de anotação inválida')
    const repetitions: Partial<Record<string, number>> = {}
    if (entry.repetitions !== undefined) {
      if (!isRecord(entry.repetitions) || Object.keys(entry.repetitions).length > 3)
        throw new Error('Contagem inválida no backup')
      for (const [block, count] of Object.entries(entry.repetitions)) {
        if (!['0', '1', '2'].includes(block)) throw new Error('Bloco de contagem inválido')
        const value = requireNumber(count, 'repetições', 0, FOCUSED_REPETITIONS[Number(block)])
        if (!Number.isInteger(value)) throw new Error('Contagem deve ser inteira')
        repetitions[block] = value
      }
    }
    result[id] = {
      notes: entry.notes,
      checks: [...new Set(entry.checks as string[])],
      updatedAt,
      ...(entry.repetitions === undefined ? {} : { repetitions }),
    }
  }
  return result
}

function mergeCourseJournals(
  current: CourseJournal = {},
  imported: CourseJournal = {},
): CourseJournal {
  const merged = { ...current }
  for (const [id, entry] of Object.entries(imported)) {
    if (
      entry &&
      (!merged[Number(id)] ||
        Date.parse(entry.updatedAt) > Date.parse(merged[Number(id)]!.updatedAt))
    )
      merged[Number(id)] = entry
  }
  return merged
}

function draftState(value: unknown, counter: { total: number }): DraftState {
  if (!isRecord(value)) throw new Error('Rascunho inválido no backup')
  return {
    ...(value.penType === undefined ? {} : { penType: readPenType(value.penType) }),
    coursePractice: coursePractice(value.coursePractice),
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
    courseSessionId:
      value.courseSessionId === undefined ? undefined : sessionId(value.courseSessionId),
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
  const completedSessions = [...new Set(value.completedSessions.map(sessionId))]
  return {
    version: 1,
    ...(value.workspace === undefined ? {} : { workspace: readWorkspace(value.workspace) }),
    draft: draftState(value.draft, counter),
    courseJournal: courseJournal(value.courseJournal),
    academy: academyData(value.academy, counter),
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
      workspace: current.workspace ?? imported.workspace,
      draft: currentHasDraft ? current.draft : imported.draft,
      courseJournal: mergeCourseJournals(current.courseJournal, imported.courseJournal),
      academy: mergeAcademy(current.academy, imported.academy),
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
      penType: data.draft.penType,
      modelId: data.draft.modelId,
      mode: data.draft.mode,
      referenceOpacity: data.draft.referenceOpacity,
      referenceVisible: data.draft.referenceVisible,
      inkColor: data.draft.inkColor,
      lineWidth: data.draft.lineWidth,
    },
    completedSessions: data.completedSessions,
    courseJournal: data.courseJournal,
    academy: data.academy,
    customReferences: data.customReferences,
  }
}

function academyData(value: unknown, counter: { total: number }): AcademyData | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error('Curso de caligrafia inválido')
  const book = WORKBOOKS.find((b) => b.id === value.selectedBook)
  if (
    !book ||
    !Number.isInteger(value.selectedPage) ||
    Number(value.selectedPage) < 1 ||
    Number(value.selectedPage) > book.pages
  )
    throw new Error('Apostila ou página inválida')
  if (
    !Array.isArray(value.exercises) ||
    value.exercises.length > 10000 ||
    !Array.isArray(value.attempts) ||
    value.attempts.length > 10000 ||
    !isRecord(value.progress) ||
    Object.keys(value.progress).length > 10000
  )
    throw new Error('Catálogo de caligrafia inválido')
  const block = (v: unknown): number => {
    const n = requireNumber(v, 'bloco de caligrafia', 0, 2)
    if (!Number.isInteger(n)) throw new Error('Bloco deve ser inteiro')
    return n
  }
  const exercises = value.exercises.map(validWorksheet)
  const attempts = value.attempts.map((v) => {
    if (!isRecord(v)) throw new Error('Tentativa de caligrafia inválida')
    return {
      id: requireString(v.id, 'tentativa', 120),
      exercise: validWorksheet(v.exercise),
      block: block(v.block),
      createdAt: requireString(v.createdAt, 'data da tentativa', 80),
      strokes: strokeList(v.strokes, counter, 'traços de caligrafia'),
    }
  })
  let draft: AcademyData['draft']
  if (value.draft !== undefined) {
    if (!isRecord(value.draft)) throw new Error('Rascunho de caligrafia inválido')
    const d = value.draft
    draft = {
      exercise: validWorksheet(d.exercise),
      block: block(d.block),
      strokes: strokeList(d.strokes, counter, 'rascunho de caligrafia'),
      redo: strokeList(d.redo ?? [], counter, 'refazer caligrafia'),
    }
    if (draft.exercise.bookId !== book.id || draft.exercise.page !== value.selectedPage)
      throw new Error('Contexto da folha incompatível')
  }
  const progress: AcademyData['progress'] = {}
  for (const [key, v] of Object.entries(value.progress)) {
    if (
      !isRecord(v) ||
      !Array.isArray(v.counts) ||
      v.counts.length !== 3 ||
      typeof v.notes !== 'string' ||
      v.notes.length > 3000 ||
      typeof v.updatedAt !== 'string' ||
      !Number.isFinite(Date.parse(v.updatedAt))
    )
      throw new Error('Progresso de caligrafia inválido')
    const [bookId, page, crop] = key.split(':')
    const exercise = validWorksheet({
      bookId,
      page: Number(page),
      crop: crop?.split(',').map((n) => Number(n) / 10000),
      title: '',
    })
    if (worksheetKey(exercise) !== key) throw new Error('Identificador de exercício inválido')
    const counts = v.counts.map((n) => {
      if (!Number.isInteger(n) || n < 0 || !Number.isSafeInteger(n))
        throw new Error('Contagem de caligrafia inválida')
      return n
    }) as [number, number, number]
    progress[key] = { counts, notes: v.notes, updatedAt: v.updatedAt }
  }
  return {
    ...(value.preferences === undefined ? {} : { preferences: readPreferences(value.preferences) }),
    selectedBook: book.id,
    selectedPage: Number(value.selectedPage),
    exercises,
    attempts,
    draft,
    progress,
  }
}

function readPenType(value: unknown): PenType | undefined {
  if (value === undefined) return undefined
  if (!PEN_PRESETS.some((p) => p.id === value)) throw new Error('Tipo de caneta inválido')
  return value as PenType
}
function readPreferences(value: unknown): AcademyData['preferences'] {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error('Preferências inválidas')
  return {
    penType: readPenType(value.penType) ?? 'fine',
    opacity: requireNumber(value.opacity, 'opacidade', 0, 1),
  }
}
function readWorkspace(value: unknown): AppData['workspace'] {
  if (value === undefined) return undefined
  if (
    !isRecord(value) ||
    !['train', 'course', 'history', 'settings'].includes(String(value.tab)) ||
    !['academy', 'signature'].includes(String(value.courseSection))
  )
    throw new Error('Última tela inválida')
  return value as AppData['workspace']
}
