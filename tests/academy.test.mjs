import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const server = await createServer({mode:'test',server:{middlewareMode:true},appType:'custom'})
after(()=>server.close())
const academy = await server.ssrLoadModule('/src/data/academy.ts')
const practice = await server.ssrLoadModule('/src/lib/academy-practice.ts')
const storage = await server.ssrLoadModule('/src/lib/signature-storage.ts')
const signature = await server.ssrLoadModule('/src/data/signature.ts')
const stroke = () => ({id:'stroke',color:'#17213b',width:3,pointerType:'pen',points:[{x:.1,y:.2,t:0},{x:.4,y:.5,t:100}]})
const worksheet = academy.defaultWorksheet(academy.WORKBOOKS[0],4)

test('eight Fena books cover all 227 pages; two complements cover 131, with no missing page',()=>{
  const base=academy.WORKBOOKS.filter(b=>b.group==='base'),extras=academy.WORKBOOKS.filter(b=>b.group==='complement')
  assert.equal(base.length,8);assert.equal(base.reduce((n,b)=>n+b.pages,0),227)
  assert.equal(extras.length,2);assert.equal(extras.reduce((n,b)=>n+b.pages,0),131)
  const bonus=academy.WORKBOOKS.filter(b=>b.group==='bonus')
  assert.equal(bonus.length,19);assert.equal(bonus.reduce((n,b)=>n+b.pages,0),426)
  assert.equal(new Set(academy.WORKBOOKS.map(b=>b.id)).size,29)
  assert.equal(new Set(academy.WORKBOOKS.map(b=>b.sha256)).size,28)
  for(const book of academy.WORKBOOKS){
    assert.match(book.sha256,/^[a-f0-9]{64}$/)
    for(let page=1;page<=book.pages;page++)assert.equal(practice.validWorksheet(academy.defaultWorksheet(book,page)).page,page)
  }
})
test('20 repetitions archive each complete attempt and advance through 8+8+4 exactly once',()=>{
  let data=practice.beginWorksheet(academy.createAcademyData(),worksheet)
  for(let i=0;i<20;i++){
    assert.equal(data.draft.block,i<8?0:i<16?1:2)
    data.draft.strokes=[stroke(),{...stroke(),id:'second-stroke'}]
    data=practice.completeWorksheet(data)
    assert.equal(data.attempts.length,i+1);assert.equal(data.draft.strokes.length,0)
  }
  assert.deepEqual(data.progress[academy.worksheetKey(worksheet)].counts,[8,8,4])
  data.draft.strokes=[stroke()];assert.equal(practice.completeWorksheet(data),data)
})
test('empty and eraser-only drafts do not count; navigating preserves ink without counting it',()=>{
  let data=practice.beginWorksheet(academy.createAcademyData(),worksheet)
  assert.equal(practice.completeWorksheet(data),data)
  data.draft.strokes=[{...stroke(),tool:'eraser'}];assert.equal(practice.completeWorksheet(data),data)
  data.draft.strokes=[stroke()];const original=structuredClone(data)
  const next=practice.beginWorksheet(data,academy.defaultWorksheet(academy.WORKBOOKS[1],8))
  assert.equal(next.attempts.length,1);assert.deepEqual(next.progress,{})
  assert.equal(next.attempts[0].exercise.bookId,'coordenacao');assert.deepEqual(data,original)
})
test('crop identity separates progress on the same page and invalid/outside crops are rejected',()=>{
  const e={...worksheet,crop:[.1,.2,.3,.4],title:'S'}
  assert.notEqual(academy.worksheetKey(e),academy.worksheetKey(worksheet))
  for(const crop of [[0,0,0,1],[.8,0,.4,1],[0,-1,1,1],[0,0,NaN,1],[0,0,1,2]])
    assert.throws(()=>practice.validWorksheet({...e,crop}))
  assert.throws(()=>practice.validWorksheet({...e,page:16}))
  assert.throws(()=>practice.validWorksheet({...e,bookId:'unknown'}))
})
test('old backups load, and new ink, eraser, crops, notes and progress survive round-trip',()=>{
  const data=signature.createDefaultData();assert.equal(storage.parseBackup(storage.createBackupEnvelope(data)).academy,undefined)
  const exercise={...worksheet,crop:[.1,.2,.3,.4],title:'S maiúsculo'}
  let training=practice.beginWorksheet(academy.createAcademyData(),exercise)
  training.exercises=[exercise];training.draft.strokes=[stroke(),{...stroke(),tool:'eraser'}]
  training=practice.completeWorksheet(training)
  training.progress[academy.worksheetKey(exercise)].notes='Curva mais fluida'
  data.academy=training
  assert.deepEqual(storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data)))).academy,training)
  assert.deepEqual(storage.freshDataKeepingPreferences(data).academy,training)
})
test('backup merge keeps current draft, deduplicates attempts, restores imported draft context',()=>{
  let a=practice.beginWorksheet(academy.createAcademyData(),worksheet);a.draft.strokes=[stroke()]
  a=practice.completeWorksheet(a)
  let b=practice.beginWorksheet(academy.createAcademyData(),academy.defaultWorksheet(academy.WORKBOOKS[2],10))
  b.draft.strokes=[stroke()]
  const merged=practice.mergeAcademy(a,b);assert.equal(merged.draft.exercise.bookId,'coordenacao')
  assert.equal(practice.mergeAcademy(merged,a).attempts.length,1)
  const empty=academy.createAcademyData();const restored=practice.mergeAcademy(empty,b)
  assert.equal(restored.selectedBook,'geral');assert.equal(restored.selectedPage,10)
  const full=signature.createDefaultData();full.academy=restored;assert.doesNotThrow(()=>storage.parseBackup(full))
})
test('malformed progress and draft context cannot overwrite saved app data',()=>{
  const data=signature.createDefaultData();data.academy=practice.beginWorksheet(academy.createAcademyData(),worksheet)
  data.academy.progress[academy.worksheetKey(worksheet)]={counts:[9,0,0],notes:'',updatedAt:new Date().toISOString()}
  assert.throws(()=>storage.parseBackup(data))
  data.academy.progress={};data.academy.selectedBook='inglesa';assert.throws(()=>storage.parseBackup(data))
})

test('a crop touching the page edge survives progress-key rounding and backup import',()=>{
  const exercise={...worksheet,crop:[.12345,.23455,.87655,.76545],title:'Recorte até a borda'}
  let training=practice.beginWorksheet(academy.createAcademyData(),exercise)
  training.draft.strokes=[stroke()]
  training=practice.completeWorksheet(training)
  const data=signature.createDefaultData();data.academy=training
  assert.deepEqual(storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data)))).academy,training)
})
