import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('course entry uses direct exercise studio, never the legacy PDF importer', () => {
 const route=readFileSync(new URL('../src/pages/Index.tsx',import.meta.url),'utf8')
 assert.ok(route.includes("import('@/components/ExerciseStudio')"))
 assert.ok(!route.includes("import('@/components/AcademyView')"))
 const studio=readFileSync(new URL('../src/components/ExerciseStudio.tsx',import.meta.url),'utf8')
 assert.ok(studio.includes('<SignatureCanvas'))
 assert.ok(!/drive\.google\.com|importWorkbook|installedWorkbooks|type="file"/.test(studio))
 const loader=readFileSync(new URL('../src/lib/exercise-sheets.ts',import.meta.url),'utf8')
 assert.ok(loader.includes("'exercicios/'"))
 assert.ok(!/pdfjs-dist|indexedDB/.test(loader))
})
