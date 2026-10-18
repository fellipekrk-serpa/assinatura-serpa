import { useId } from 'react'
import type { CourseFocus } from '@/data/course-focus'
import { CustomReference } from '@/data/signature'
import { cn } from '@/lib/utils'

interface ReferenceImageProps {
  focus?: CourseFocus
  src: string
  alt: string
  custom?: CustomReference
  className?: string
  imageClassName?: string
  opacity?: number
  onLoad?: (width: number, height: number) => void
}

export default function ReferenceImage({
  focus,
  src,
  alt,
  custom,
  className,
  imageClassName,
  opacity = 1,
  onLoad,
}: ReferenceImageProps) {
  const maskId = useId()
  const frame = custom?.frame
  if (focus)
    return (
      <div className={cn('reference-image-frame', className)}>
        <svg
          role="img"
          aria-label={alt}
          viewBox={focus.bounds.join(' ')}
          className="reference-image-object"
          style={{ opacity }}
        >
          <defs>
            <clipPath id={`${maskId}-bounds`}>
              <rect
                x={focus.bounds[0]}
                y={focus.bounds[1]}
                width={focus.bounds[2]}
                height={focus.bounds[3]}
              />
            </clipPath>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1215" height="615">
              <path
                d={focus.path}
                stroke="white"
                strokeWidth="32"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              {focus.region && <path d={focus.region} fill="white" />}
            </mask>
          </defs>
          <image
            href={src}
            width="1215"
            height="615"
            clipPath={`url(#${maskId}-bounds)`}
            mask={focus.path || focus.region ? `url(#${maskId})` : undefined}
          />
        </svg>
      </div>
    )
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
