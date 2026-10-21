export interface DeckItem {
  src: string
  alt: string
}

/**
 * Phone-only stacked deck. Every card is the same element and only its transform,
 * opacity and blur change, so a switch is a single synchronised slide: the card in
 * front is the close-up (sharp), the neighbours peek out behind it (blurred).
 * Tap a neighbour, or use the arrows, to move one step; tap the front card to open it.
 */
export default function MobileDeck({
  items,
  index,
  onPick,
  activeHref,
}: {
  items: DeckItem[]
  index: number
  onPick: (i: number) => void
  activeHref?: string
}) {
  const n = items.length

  return (
    <div className="deck">
      {items.map((it, i) => {
        // shortest signed offset on the loop, so the deck wraps both ways
        let off = i - index
        if (off > n / 2) off -= n
        if (off < -n / 2) off += n
        const abs = Math.abs(off)
        const active = off === 0
        const hidden = abs > 1
        const open = () => {
          if (!active) return onPick(i)
          if (!activeHref) return
          if (activeHref.startsWith('http')) window.open(activeHref, '_blank', 'noopener')
          // internal targets use the route veil, same as the desktop close-up
          else window.dispatchEvent(new CustomEvent('veil-navigate', { detail: activeHref }))
        }
        return (
          <div
            key={it.alt + i}
            role="button"
            tabIndex={hidden ? -1 : 0}
            aria-label={it.alt}
            aria-current={active ? 'true' : undefined}
            data-cursor
            className={`deck-card ${active ? 'deck-active' : ''}`}
            onClick={open}
            onKeyDown={e => { if (e.key === 'Enter') open() }}
            style={{
              transform: `translate(-50%, -50%) translateX(${off * 40}%) scale(${active ? 1 : 0.86})`,
              zIndex: 10 - abs,
              opacity: hidden ? 0 : active ? 1 : 0.8,
              pointerEvents: hidden ? 'none' : 'auto',
            }}
          >
            {/* keyed by state: a card that comes forward replays its own drawing (the About card) */}
            <img key={active ? 'on' : 'off'} src={it.src} alt="" draggable={false} />
          </div>
        )
      })}
    </div>
  )
}
