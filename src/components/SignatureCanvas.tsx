import { useCallback, useEffect, useRef } from 'react'
import { PointerKind, SignaturePoint, SignatureStroke, makeId } from '@/data/signature'
import { drawGuidePoint, drawSignatureStrokes } from '@/lib/signature-drawing'
import { cn } from '@/lib/utils'

interface SignatureCanvasProps {
  strokes: SignatureStroke[]
  color: string
  lineWidth: number
  tool?: 'pen' | 'eraser'
  testInput: boolean
  disabled?: boolean
  guidePoint?: SignaturePoint | null
  sessionKey: string
  className?: string
  onStrokeComplete: (stroke: SignatureStroke) => void
  onPointerKind: (kind: PointerKind, accepted: boolean) => void
}

function asPointerKind(pointerType: string): PointerKind {
  if (pointerType === 'pen' || pointerType === 'mouse' || pointerType === 'touch')
    return pointerType
  return 'desconhecido'
}

export default function SignatureCanvas({
  strokes,
  color,
  lineWidth,
  testInput,
  tool = 'pen',
  disabled = false,
  guidePoint = null,
  sessionKey,
  className,
  onStrokeComplete,
  onPointerKind,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef(strokes)
  const guideRef = useRef(guidePoint)
  const activeStrokeRef = useRef<SignatureStroke | null>(null)
  const activePointerRef = useRef<number | null>(null)
  const timelineRef = useRef<{ eventBase: number; timelineBase: number } | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ratio = Math.min(window.devicePixelRatio || 1, 3)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    drawSignatureStrokes(
      context,
      activeStrokeRef.current
        ? [...strokesRef.current, activeStrokeRef.current]
        : strokesRef.current,
      width,
      height,
    )
    const lastColor = activeStrokeRef.current?.color ?? strokesRef.current.at(-1)?.color ?? color
    drawGuidePoint(context, guideRef.current, lastColor, width, height)
  }, [color])

  useEffect(() => {
    strokesRef.current = strokes
    guideRef.current = guidePoint
    redraw()
  }, [strokes, guidePoint, redraw])

  useEffect(() => {
    timelineRef.current = null
  }, [sessionKey])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 3)
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio))
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      redraw()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    return () => observer.disconnect()
  }, [redraw])

  const toPoint = useCallback((event: PointerEvent): SignaturePoint => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, t: 0 }
    const rect = canvas.getBoundingClientRect()
    if (!timelineRef.current) {
      const latestTime = strokesRef.current.reduce((latest, stroke) => {
        const strokeTime = stroke.points.at(-1)?.t ?? 0
        return Math.max(latest, strokeTime)
      }, 0)
      timelineRef.current = {
        eventBase: event.timeStamp,
        timelineBase: latestTime > 0 ? latestTime + 1 : 0,
      }
    }
    const point: SignaturePoint = {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
      t:
        timelineRef.current.timelineBase +
        Math.max(0, event.timeStamp - timelineRef.current.eventBase),
    }
    if (event.pointerType === 'pen' && event.pressure > 0) point.pressure = event.pressure
    return point
  }, [])

  const appendEvents = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!activeStrokeRef.current) return
      const nativeEvent = event.nativeEvent
      const samples =
        typeof nativeEvent.getCoalescedEvents === 'function'
          ? nativeEvent.getCoalescedEvents()
          : [nativeEvent]
      const events = samples.length > 0 ? samples : [nativeEvent]

      for (const sample of events) {
        const point = toPoint(sample)
        const previous = activeStrokeRef.current.points.at(-1)
        if (previous && previous.x === point.x && previous.y === point.y && previous.t === point.t)
          continue
        activeStrokeRef.current.points.push(point)
      }
      redraw()
    },
    [redraw, toPoint],
  )

  const finishStroke = useCallback(() => {
    const stroke = activeStrokeRef.current
    if (!stroke) return
    activeStrokeRef.current = null
    activePointerRef.current = null
    if (stroke.points.length > 0) onStrokeComplete(stroke)
    redraw()
  }, [onStrokeComplete, redraw])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const kind = asPointerKind(event.pointerType)
    const accepted =
      !disabled &&
      event.isPrimary &&
      event.button === 0 &&
      (kind === 'pen' || (testInput && (kind === 'mouse' || kind === 'touch')))
    onPointerKind(kind, accepted)
    if (!accepted) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointerRef.current = event.pointerId
    activeStrokeRef.current = {
      id: makeId('traco'),
      tool,
      color,
      width: tool === 'eraser' ? 20 : lineWidth,
      pointerType: kind,
      points: [toPoint(event.nativeEvent)],
    }
    redraw()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId || !activeStrokeRef.current) return
    if (event.pointerType === 'mouse' && event.buttons === 0) return
    event.preventDefault()
    appendEvents(event)
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    event.preventDefault()
    appendEvents(event)
    finishStroke()
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    finishStroke()
  }

  const handleLostCapture = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (activePointerRef.current !== event.pointerId) return
    finishStroke()
  }

  return (
    <canvas
      ref={canvasRef}
      className={cn('signature-canvas', disabled && 'is-disabled', className)}
      aria-label={
        tool === 'eraser'
          ? 'Área de escrita da assinatura — borracha ativa'
          : 'Área de escrita da assinatura'
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostCapture}
      onContextMenu={(event) => event.preventDefault()}
    />
  )
}
