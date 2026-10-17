import { CustomReference } from '@/data/signature'
import { cn } from '@/lib/utils'

interface ReferenceImageProps {
  src: string
  alt: string
  custom?: CustomReference
  className?: string
  imageClassName?: string
  opacity?: number
  onLoad?: (width: number, height: number) => void
}

export default function ReferenceImage({
  src,
  alt,
  custom,
  className,
  imageClassName,
  opacity = 1,
  onLoad,
}: ReferenceImageProps) {
  const frame = custom?.frame
  return (
    <div className={cn('reference-image-frame', className)}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={cn('reference-image-object', imageClassName)}
        style={{
          opacity,
          transform: frame
            ? `translate(${frame.offsetX}%, ${frame.offsetY}%) scale(${frame.zoom})`
            : undefined,
        }}
        onLoad={(event) =>
          onLoad?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)
        }
      />
    </div>
  )
}
