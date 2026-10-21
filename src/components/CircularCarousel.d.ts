import type { CSSProperties, MutableRefObject, ReactElement } from 'react'

export interface CircularCarouselItem {
  src: string
  alt?: string
  title?: string
  subtitle?: string
}

export interface CircularCarouselApi {
  focusIndex: (index: number) => void
  stepBy: (delta: number) => void
}

declare function CircularCarousel(props: {
  items?: CircularCarouselItem[]
  preset?: 'cylinder' | 'orbit' | 'wheel' | 'panorama'
  intro?: 'assemble' | 'rise' | 'spin' | 'none'
  cardWidth?: number
  aspectRatio?: number
  gap?: number
  curve?: number
  tilt?: number
  perspective?: number
  autoplay?: 'drift' | 'step' | 'off'
  speed?: number
  interval?: number
  direction?: 'left' | 'right'
  draggable?: boolean
  momentum?: number
  snap?: boolean
  /** one gesture (wheel, trackpad swipe or drag, any distance) moves exactly one card */
  oneStep?: boolean
  pauseOnHover?: boolean
  focusOnClick?: boolean
  parallax?: number
  stretch?: number
  depthFade?: number
  fadeColor?: string
  innerShade?: number
  cornerRadius?: number
  captions?: boolean
  onChange?: (index: number) => void
  onItemClick?: (item: CircularCarouselItem, index: number) => void
  apiRef?: MutableRefObject<CircularCarouselApi | null>
  className?: string
  style?: CSSProperties
}): ReactElement

export default CircularCarousel
