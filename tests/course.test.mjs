import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const server = await createServer({ mode: 'test', server: { middlewareMode: true }, appType: 'custom' })
after(() => server.close())
const course = await server.ssrLoadModule('/src/data/course.ts')
const signature = await server.ssrLoadModule('/src/data/signature.ts')
const storage = await server.ssrLoadModule('/src/lib/signature-storage.ts')
const practice = await server.ssrLoadModule('/src/lib/course-practice.ts')
const { default: CourseView } = await server.ssrLoadModule('/src/components/CourseView.tsx')
const focusModule = await server.ssrLoadModule('/src/data/course-focus.ts')
const drawing = await server.ssrLoadModule('/src/lib/signature-drawing.ts')
const { default: TrainStudio } = await server.ssrLoadModule('/src/components/TrainStudio.tsx')

const sampleStroke = () => ({ id: 'stroke-original', color: '#16130F', width: 3, pointerType: 'pen', points: [{ x: .1, y: .2, t: 0, pressure: .5 }, { x: .2, y: .3, t: 100, pressure: .7 }] })

test('14 complete lessons render with their original references and three exercises', () => {
  assert.deepEqual(course.COURSE_LESSONS.map(item => item.id), Array.from({ length: 14 }, (_, i) => i + 1))
  for (const lesson of course.COURSE_LESSONS) {
    assert.equal(lesson.steps.length, 3)
    assert.equal(lesson.checks.length, 3)
    const markup = renderToStaticMarkup(React.createElement(CourseView, { selectedId: lesson.id, journal: {}, completedSessions: [], onSelect() {}, onJournalChange() {}, onToggleSession() {}, onPractice() {} }))
    assert.match(markup, /Leve para o papel/)
    assert.match(markup, /Faça sua revisão/)
    assert.match(markup, /Praticar bloco 3/)
    assert.match(markup, /assets\//)
  }
})

test('every exercise opens the right model and mode, with correct chosen complete after B4', () => {
  for (const lesson of course.COURSE_LESSONS) for (let i = 0; i < 3; i++) {
    for (const chosen of ['a4', 'a5-04']) {
      const result = practice.startCoursePractice(signature.createDefaultData(), lesson.id, i, chosen)
      assert.equal(result.draft.modelId, lesson.steps[i].modelId ?? (lesson.id >= 12 ? chosen : lesson.modelId))
      assert.equal(result.draft.mode, lesson.steps[i].mode)
      assert.equal(result.draft.coursePractice.completeModel, chosen)
      assert.equal(result.draft.referenceVisible, true)
    }
  }
  assert.throws(() => practice.startCoursePractice(signature.createDefaultData(), 15, 0))
  assert.throws(() => practice.startCoursePractice(signature.createDefaultData(), 1, 3))
})

test('starting a new exercise archives current ink without changing original data or history', () => {
  const data = signature.createDefaultData()
  data.draft.strokes = [sampleStroke()]
  data.draft.coursePractice = { sessionId: 1, stepIndex: 0 }
  data.courseJournal = { 1: { notes: 'Preservar', checks: ['0'], updatedAt: '2026-10-17T10:00:00Z' } }
  const snapshot = structuredClone(data)
  const result = practice.startCoursePractice(data, 5, 1)
  assert.equal(result.draft.strokes.length, 0)
  assert.equal(result.attempts.length, 1)
  assert.equal(result.attempts[0].courseSessionId, 1)
  assert.deepEqual(result.attempts[0].strokes, data.draft.strokes)
  assert.notEqual(result.attempts[0].strokes[0].points, data.draft.strokes[0].points)
  assert.deepEqual(data, snapshot)
  const next = practice.startCoursePractice(result, 5, 2)
  assert.equal(next.attempts.length, 1, 'empty drafts are not archived')
  assert.deepEqual(next.courseJournal, data.courseJournal)
})

test('old v1 backups remain readable and new course progress survives round trip', () => {
  const old = signature.createDefaultData()
  delete old.courseJournal
  const restored = storage.parseBackup(storage.createBackupEnvelope(old))
  assert.deepEqual(restored.courseJournal, {})
  const data = practice.startCoursePractice(old, 12, 1, 'a5-04')
  data.courseJournal = { 12: { notes: 'Prefiro dois níveis', checks: ['0', '2'], updatedAt: '2026-10-17T11:00:00Z' } }
  data.completedSessions = [1, 2]
  const roundTrip = storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data))))
  assert.deepEqual(roundTrip.courseJournal, data.courseJournal)
  assert.deepEqual(roundTrip.draft.coursePractice, data.draft.coursePractice)
  assert.deepEqual(roundTrip.completedSessions, [1, 2])
})

test('backup merge keeps newest journal, current ink and deduplicates history', () => {
  const current = practice.startCoursePractice({ ...signature.createDefaultData(), draft: { ...signature.createDefaultData().draft, strokes: [sampleStroke()] } }, 1, 0)
  current.draft.strokes = [sampleStroke()]
  current.courseJournal = { 1: { notes: 'Mais recente', checks: ['1'], updatedAt: '2026-10-17T12:00:00Z' } }
  const imported = structuredClone(current)
  imported.courseJournal[1].notes = 'Antiga'
  imported.courseJournal[1].updatedAt = '2026-10-17T10:00:00Z'
  imported.courseJournal[2] = { notes: 'Outra aula', checks: [], updatedAt: '2026-10-17T11:00:00Z' }
  const merged = storage.mergeBackup(current, imported)
  assert.equal(merged.added, 0)
  assert.equal(merged.data.courseJournal[1].notes, 'Mais recente')
  assert.equal(merged.data.courseJournal[2].notes, 'Outra aula')
  assert.equal(merged.data.draft, current.draft)
  assert.deepEqual(storage.freshDataKeepingPreferences(merged.data).courseJournal, merged.data.courseJournal)
})

test('malformed course fields are rejected before import', () => {
  const invalid = [
    { courseJournal: { 15: { notes: '', checks: [], updatedAt: '2026-10-17' } } },
    { courseJournal: { 1: { notes: 'x'.repeat(3001), checks: [], updatedAt: '2026-10-17' } } },
    { courseJournal: { 1: { notes: '', checks: ['99'], updatedAt: '2026-10-17' } } },
    { courseJournal: { 1: { notes: '', checks: [], updatedAt: 'invalid' } } },
    { completedSessions: [1.5] },
  ]
  for (const fields of invalid) assert.throws(() => storage.validateAppData({ ...signature.createDefaultData(), ...fields }))
  const data = signature.createDefaultData()
  data.draft.coursePractice = { sessionId: 1, stepIndex: .5 }
  assert.throws(() => storage.validateAppData(data))
})

test('focused lessons require exactly 20 repetitions and keep the S isolated', () => {
  for (const id of [1, 2, 5, 6, 8, 9]) {
    assert.equal(focusModule.FOCUSED_REPETITIONS.reduce((a, b) => a + b, 0), 20)
    for (let block = 0; block < 3; block++) {
      assert.equal(focusModule.repetitionTarget({ sessionId: id, stepIndex: block }), [8, 8, 4][block])
      assert.match(course.getLesson(id).steps[block].instruction, /Não faça a assinatura completa/)
    }
  }
  const data = practice.startCoursePractice(signature.createDefaultData(), 1, 0)
  const props = { draft: data.draft, customReferences: {}, displayStrokes: [], replaying: false, testInput: false, memoryRevealed: false, timerMs: 0, pointerKind: 'desconhecido', pointerAccepted: null }
  const markup = renderToStaticMarkup(React.createElement(TrainStudio, props))
  assert.match(markup, /Borracha/)
  assert.match(markup, /Concluir repetição/)
  assert.match(markup, /Apenas S/)
  assert.match(markup, /viewBox="195 0 560 610"/)
  const memory = renderToStaticMarkup(React.createElement(TrainStudio, { ...props, draft: { ...data.draft, mode: 'memory' } }))
  assert.doesNotMatch(memory, /<image /)
  assert.match(memory, /Referência oculta durante a tentativa/)
})

test('twenty repetitions archive each attempt, persist across blocks, and never count strokes automatically', () => {
  let data = practice.startCoursePractice(signature.createDefaultData(), 1, 0)
  assert.equal(practice.completeCourseRepetition(data), data, 'empty attempt cannot count')
  data.courseJournal = { 1: { notes: 'Preservar nota', checks: ['0'], updatedAt: '2026-10-17T12:00:00Z' } }
  for (let block = 0; block < 3; block++) {
    data = practice.startCoursePractice(data, 1, block)
    for (let repetition = 0; repetition < [8, 8, 4][block]; repetition++) {
      data.draft.strokes = [sampleStroke(), { ...sampleStroke(), id: 'second-stroke' }]
      const previousCount = data.courseJournal[1].repetitions?.[block] ?? 0
      assert.equal(previousCount, repetition)
      data = practice.completeCourseRepetition(data)
      assert.equal(data.draft.strokes.length, 0)
      assert.equal(data.courseJournal[1].repetitions[block], repetition + 1)
      data = storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data))))
    }
    const full = { ...data, draft: { ...data.draft, strokes: [sampleStroke()] } }
    assert.equal(practice.completeCourseRepetition(full), full, 'do not exceed block target')
  }
  assert.equal(data.attempts.length, 20)
  assert.equal(data.courseJournal[1].notes, 'Preservar nota')
  assert.deepEqual(data.courseJournal[1].checks, ['0'])
  assert.deepEqual(data.courseJournal[1].repetitions, { 0: 8, 1: 8, 2: 4 })
})

test('eraser operations survive backup and can be removed and replayed with the existing undo stack', () => {
  const data = signature.createDefaultData()
  const ink = sampleStroke()
  const eraser = { ...sampleStroke(), id: 'erase', tool: 'eraser', width: 20 }
  data.draft.strokes = [ink, eraser]
  let restored = storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data))))
  assert.equal(restored.draft.strokes[1].tool, 'eraser')
  restored.draft.redoStack.push(restored.draft.strokes.pop())
  restored = storage.parseBackup(storage.createBackupEnvelope(restored))
  assert.deepEqual(restored.draft.strokes, [ink])
  assert.equal(restored.draft.redoStack[0].tool, 'eraser')
  restored.draft.strokes.push(restored.draft.redoStack.pop())
  assert.equal(restored.draft.strokes[1].tool, 'eraser')
})

test('eraser composites on an ink-only layer, leaving paper and reference untouched', () => {
  const operations = []
  const ink = { save() {}, restore() {}, setTransform() {}, beginPath() {}, arc() {}, fill() {}, moveTo() {}, quadraticCurveTo() {}, lineTo() {}, stroke() { operations.push(this.globalCompositeOperation) } }
  const targetCalls = []
  const context = { getTransform: () => ({ a: 2 }), drawImage: (...args) => targetCalls.push(args) }
  const previousDocument = globalThis.document
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ink }) }
  try {
    drawing.drawSignatureStrokes(context, [sampleStroke(), { ...sampleStroke(), tool: 'eraser' }, sampleStroke()], 900, 486)
    assert.deepEqual(operations, ['source-over', 'destination-out', 'source-over'])
    assert.equal(targetCalls.length, 1)
    assert.equal(targetCalls[0][0].width, 1800)
    assert.deepEqual(targetCalls[0].slice(1), [0, 0, 900, 486])
  } finally { globalThis.document = previousDocument }
})

test('malformed eraser and repetition data is rejected', () => {
  const data = signature.createDefaultData()
  for (const tool of ['delete', 'brush']) {
    data.draft.strokes = [{ ...sampleStroke(), tool }]
    assert.throws(() => storage.validateAppData(data))
  }
  data.draft.strokes = []
  for (const repetitions of [{ 0: 9 }, { 2: 5 }, { 3: 1 }, { 1: -1 }, { 1: 2.5 }]) {
    data.courseJournal = { 1: { notes: '', checks: [], updatedAt: '2026-10-18', repetitions } }
    assert.throws(() => storage.validateAppData(data))
  }
})
