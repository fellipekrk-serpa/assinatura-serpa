import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
const server = await createServer({mode:'test',server:{middlewareMode:true},appType:'custom'})
after(()=>server.close())
const { pointWidth } = await server.ssrLoadModule('/src/lib/signature-drawing.ts')
const { PEN_PRESETS } = await server.ssrLoadModule('/src/data/pens.ts')
const storage = await server.ssrLoadModule('/src/lib/signature-storage.ts')
const { createDefaultData } = await server.ssrLoadModule('/src/data/signature.ts')
const base = {id:'pressure',color:'#17213b',width:3,pointerType:'pen',points:[{x:.2,y:.3,t:0,pressure:.1},{x:.7,y:.3,t:10,pressure:.9}]}
test('fixed pens ignore pressure; flex grows continuously; ultra-flex has a wider range',()=>{
  const width=(penType,p)=>pointWidth({...base,penType},{x:0,y:0,t:0,pressure:p})
  for(const p of PEN_PRESETS.filter(p=>!p.id.includes('flex'))) assert.equal(width(p.id,.1),width(p.id,.9))
  for(const type of ['flex','ultra-flex']) for(let p=0;p<.99;p+=.05) assert.ok(width(type,p+.05)>width(type,p))
  assert.ok(width('ultra-flex',1)>width('flex',1))
  assert.ok(width('ultra-flex',0)<width('flex',0))
  assert.equal(pointWidth({...base,penType:'flex'},{x:0,y:0,t:0}),3)
  assert.equal(pointWidth({...base,penType:'ultra-flex',tool:'eraser'},{pressure:.1}),3)
  assert.equal(pointWidth(base,{pressure:.5}),3*(.45+.5*.95))
})
test('every pen and pressure sample survives backup roundtrip; invalid presets rejected',()=>{
  const data=createDefaultData()
  data.draft.strokes=PEN_PRESETS.map(p=>({...base,penType:p.id,width:p.width}))
  const restored=storage.parseBackup(JSON.parse(JSON.stringify(storage.createBackupEnvelope(data))))
  assert.deepEqual(restored.draft.strokes,data.draft.strokes)
  data.draft.strokes[0].penType='invalid'
  assert.throws(()=>storage.parseBackup(data))
})
