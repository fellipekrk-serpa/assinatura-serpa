import type { CourseFocus } from '@/data/course-focus'
import { ReferenceFrame, SignaturePoint, SignatureStroke } from '@/data/signature'

function pointWidth(stroke: SignatureStroke, point: SignaturePoint): number {
  if (stroke.tool === 'eraser' || point.pressure === undefined) return stroke.width
  return stroke.width * (0.45 + point.pressure * 0.95)
}

function drawInkOperations(
  context: CanvasRenderingContext2D,
  strokes: SignatureStroke[],
  width: number,
  height: number,
): void {
  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'

  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue
    context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
    context.strokeStyle = stroke.color
    context.fillStyle = stroke.color

    if (stroke.points.length === 1) {
      const point = stroke.points[0]
      const radius = pointWidth(stroke, point) / 2
      context.beginPath()
      context.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2)
      context.fill()
      continue
    }

    for (let index = 1; index < stroke.points.length; index += 1) {
      const previous = stroke.points[index - 1]
      const current = stroke.points[index]
      const next = stroke.points[index + 1]
      context.lineWidth = (pointWidth(stroke, previous) + pointWidth(stroke, current)) / 2
      context.beginPath()
      context.moveTo(previous.x * width, previous.y * height)
      if (next) {
        context.quadraticCurveTo(
          current.x * width,
          current.y * height,
          ((current.x + next.x) / 2) * width,
          ((current.y + next.y) / 2) * height,
        )
      } else {
        context.lineTo(current.x * width, current.y * height)
      }
      context.stroke()
    }
  }
  context.restore()
}

export function drawSignatureStrokes(
  context: CanvasRenderingContext2D,
  strokes: SignatureStroke[],
  width: number,
  height: number,
): void {
  if (!strokes.some((stroke) => stroke.tool === 'eraser')) {
    drawInkOperations(context, strokes, width, height)
    return
  }
  // Erase only ink. Paper and the reference must survive in previews and exported PNGs.
  const layer = document.createElement('canvas')
  const ratio = Math.max(1, Math.abs(context.getTransform().a))
  layer.width = Math.max(1, Math.ceil(width * ratio))
  layer.height = Math.max(1, Math.ceil(height * ratio))
  const ink = layer.getContext('2d')
  if (!ink) return
  ink.setTransform(ratio, 0, 0, ratio, 0, 0)
  drawInkOperations(ink, strokes, width, height)
  context.drawImage(layer, 0, 0, width, height)
}

export function drawGuidePoint(
  context: CanvasRenderingContext2D,
  point: SignaturePoint | null,
  color: string,
  width: number,
  height: number,
): void {
  if (!point) return
  context.save()
  context.fillStyle = color
  context.shadowColor = color
  context.shadowBlur = 8
  context.beginPath()
  context.arc(point.x * width, point.y * height, 4, 0, Math.PI * 2)
  context.fill()
  context.restore()
}

export function drawReferenceContained(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  frame?: ReferenceFrame,
  focus?: CourseFocus,
): void {
  if (focus) {
    const [x, y, w, h] = focus.bounds
    const scale = Math.min(width / w, height / h)
    context.save()
    context.translate((width - w * scale) / 2, (height - h * scale) / 2)
    context.scale(scale, scale)
    context.translate(-x, -y)
    // Draw the same SVG clipping geometry used by ReferenceImage.
    if (focus.path || focus.region) {
      const mask = document.createElement('canvas')
      mask.width = image.naturalWidth
      mask.height = image.naturalHeight
      const maskContext = mask.getContext('2d')!
      maskContext.lineWidth = 32
      maskContext.lineCap = 'round'
      maskContext.lineJoin = 'round'
      if (focus.path) maskContext.stroke(new Path2D(focus.path))
      if (focus.region) maskContext.fill(new Path2D(focus.region))
      maskContext.globalCompositeOperation = 'source-in'
      maskContext.drawImage(image, 0, 0)
      context.drawImage(mask, 0, 0)
    } else {
      context.beginPath()
      context.rect(x, y, w, h)
      context.clip()
      context.drawImage(image, 0, 0)
    }
    context.restore()
    return
  }
  const imageRatio = image.naturalWidth / image.naturalHeight
  const frameRatio = width / height
  let drawWidth = width
  let drawHeight = height
  if (imageRatio > frameRatio) drawHeight = width / imageRatio
  else drawWidth = height * imageRatio

  const zoom = frame?.zoom ?? 1
  const offsetX = ((frame?.offsetX ?? 0) / 100) * width
  const offsetY = ((frame?.offsetY ?? 0) / 100) * height
  drawWidth *= zoom
  drawHeight *= zoom

  context.save()
  context.beginPath()
  context.rect(0, 0, width, height)
  context.clip()
  context.drawImage(
    image,
    (width - drawWidth) / 2 + offsetX,
    (height - drawHeight) / 2 + offsetY,
    drawWidth,
    drawHeight,
  )
  context.restore()
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem de referência'))
    image.src = source
  })
}

export async function exportSignaturePng(options: {
  strokes: SignatureStroke[]
  withPaper: boolean
  referenceSource?: string
  referenceOpacity: number
  referenceFrame?: ReferenceFrame
  referenceFocus?: CourseFocus
}): Promise<Blob> {
  const width = 1800
  const height = 972
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Seu navegador não conseguiu criar a imagem PNG')

  if (options.withPaper) {
    context.fillStyle = '#FCFAF3'
    context.fillRect(0, 0, width, height)
    if (options.referenceSource) {
      const image = await loadImage(options.referenceSource)
      context.save()
      context.globalAlpha = options.referenceOpacity
      drawReferenceContained(
        context,
        image,
        width,
        height,
        options.referenceFrame,
        options.referenceFocus,
      )
      context.restore()
    }
  }

  const scale = width / 900
  const scaledStrokes = options.strokes.map((stroke) => ({
    ...stroke,
    width: stroke.width * scale,
  }))
  drawSignatureStrokes(context, scaledStrokes, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível gerar o arquivo PNG'))
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
