import { useRef } from 'react'
import { motion } from 'framer-motion'
import { SIZE, type Direction, type Tile } from '@/game/engine'

const TILE_STYLE: Record<number, { bg: string; fg: string }> = {
  2: { bg: '#eef1f6', fg: '#122d45' },
  4: { bg: '#dfe7f2', fg: '#122d45' },
  8: { bg: '#c7d8ef', fg: '#122d45' },
  16: { bg: '#a9c4ec', fg: '#122d45' },
  32: { bg: '#85b1ed', fg: '#0d1b2f' },
  64: { bg: '#5f98e2', fg: '#ffffff' },
  128: { bg: '#3f7fd0', fg: '#ffffff' },
  256: { bg: '#2468b8', fg: '#ffffff' },
  512: { bg: '#1a5290', fg: '#ffffff' },
  1024: { bg: '#1b3f6b', fg: '#ffffff' },
  2048: { bg: '#122d45', fg: '#ffcd83' },
}

const styleFor = (value: number) => TILE_STYLE[value] ?? { bg: '#0d1b2f', fg: '#ffcd83' }

const fontSize = (value: number) => {
  const digits = String(value).length
  if (digits <= 2) return 'clamp(1.5rem, 8.5vw, 2.25rem)'
  if (digits === 3) return 'clamp(1.25rem, 7vw, 1.9rem)'
  if (digits === 4) return 'clamp(1.05rem, 5.8vw, 1.55rem)'
  return 'clamp(0.85rem, 4.6vw, 1.25rem)'
}

function TileView({ tile }: { tile: Tile }) {
  const { bg, fg } = styleFor(tile.value)
  const position = { x: `${tile.col * 100}%`, y: `${tile.row * 100}%` }
  const appears = tile.fresh || tile.merged
  return (
    <motion.div
      className="absolute left-0 top-0 h-1/4 w-1/4 p-1 sm:p-1.5"
      initial={{ ...position, scale: appears ? 0 : 1, opacity: appears ? 0 : 1 }}
      animate={{
        ...position,
        scale: 1,
        opacity: tile.gone ? 0 : 1,
        zIndex: tile.merged ? 2 : 1,
      }}
      transition={{
        x: { type: 'spring', stiffness: 700, damping: 46 },
        y: { type: 'spring', stiffness: 700, damping: 46 },
        scale: { type: 'spring', stiffness: 520, damping: 26, delay: appears ? 0.08 : 0 },
        opacity: { duration: 0.1, delay: appears ? 0.08 : 0 },
      }}
    >
      <div
        className="display flex h-full w-full items-center justify-center rounded-xl font-bold tabular-nums"
        style={{
          background: bg,
          color: fg,
          fontSize: fontSize(tile.value),
          boxShadow:
            tile.value >= 2048
              ? '0 0 0 2px #ffcd83, 0 6px 18px rgba(18,45,69,0.28)'
              : 'inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(18,45,69,0.10)',
        }}
      >
        {tile.value}
      </div>
    </motion.div>
  )
}

interface BoardProps {
  tiles: Tile[]
  onMove: (dir: Direction) => void
  disabled?: boolean
}

export function Board({ tiles, onMove, disabled }: BoardProps) {
  const touch = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: React.PointerEvent) => {
    touch.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || disabled) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) onMove(dx > 0 ? 'right' : 'left')
    else onMove(dy > 0 ? 'down' : 'up')
  }

  return (
    <div
      role="application"
      aria-label="2048 board. Use arrow keys or swipe to move tiles."
      className="relative aspect-square w-full touch-none select-none rounded-3xl p-1.5 sm:p-2"
      style={{
        background: 'rgba(18,45,69,0.10)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: 'inset 0 2px 8px rgba(18,45,69,0.08)',
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (touch.current = null)}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {Array.from({ length: SIZE * SIZE }, (_, i) => (
            <div key={i} className="p-1 sm:p-1.5">
              <div className="h-full w-full rounded-xl" style={{ background: 'rgba(255,255,255,0.45)' }} />
            </div>
          ))}
        </div>
        {tiles.map((tile) => (
          <TileView key={tile.id} tile={tile} />
        ))}
      </div>
    </div>
  )
}
