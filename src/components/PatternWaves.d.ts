import type { CSSProperties } from 'react'

export interface PatternWavesProps {
  pixelBudget?: number
  preset?: 'silk' | 'ocean' | 'pond' | 'lines' | 'terminal' | 'mesh'
  pattern?: 'dot' | 'square' | 'plus' | 'line' | 'glyph'
  wave?: 'silk' | 'swell' | 'ripple'
  color?: string
  /** Optional highlight colour (e.g. Klein blue). Falls back to a tint of `color`. */
  accent?: string
  backgroundColor?: string
  spacing?: number
  markSize?: number
  depth?: number
  light?: number
  shine?: number
  contrast?: number
  speed?: number
  scale?: number
  direction?: number
  opacity?: number
  fade?: 'edges' | 'center' | 'bottom' | 'top' | 'none'
  fadeSize?: number
  characters?: string
  interactive?: boolean
  cursorSize?: number
  cursorStrength?: number
  intro?: boolean
  paused?: boolean
  className?: string
  style?: CSSProperties
}

declare const PatternWaves: (props: PatternWavesProps) => JSX.Element
export default PatternWaves
