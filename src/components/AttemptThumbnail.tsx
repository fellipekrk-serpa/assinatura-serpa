import { useCallback, useEffect, useRef } from 'react'
import { SignatureStroke } from '@/data/signature'
import { drawSignatureStrokes } from '@/lib/signature-drawing'
import { cn } from '@/lib/utils'

interface AttemptThumbnailProps {
  strokes: SignatureStroke[]
  className?: string
}

export default function AttemptThumbnail({ strokes, className }: AttemptThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const pixelWidth = Math.max(1, Math.round(width * ratio))
    const pixelHeight = Math.max(1, Math.round(height * ratio))
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = '#FCFAF3'
    context.fillRect(0, 0, width, height)
    drawSignatureStrokes(context, strokes, width, height)
  }, [strokes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    draw()
    return () => observer.disconnect()
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      className={cn('attempt-thumbnail', className)}
      aria-label="Miniatura real da tentativa"
    />
  )
}
