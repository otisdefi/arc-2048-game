import { useEffect, useRef, useState } from 'react'
import { RotateCcw, Flag } from 'lucide-react'
import { useGame } from '@/game/useGame'
import { highestTile, type Mode } from '@/game/engine'
import { Board } from './Board'
import { SubmitPanel } from './SubmitPanel'
import { Leaderboard } from './Leaderboard'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-inner min-w-[84px] rounded-2xl px-4 py-2 text-right">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--subtle)' }}>
        {label}
      </div>
      <div className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
        {value.toLocaleString('en-US')}
      </div>
    </div>
  )
}

const ghostBtn =
  'glass-pill flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50'

export function GameScreen({ mode }: { mode: Mode }) {
  const { state, best, day, slide, restart, finish } = useGame(mode)
  const [confirmRestart, setConfirmRestart] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  const onRestart = () => {
    if (state.over || state.score === 0 || confirmRestart) {
      clearTimeout(timer.current)
      setConfirmRestart(false)
      restart()
      return
    }
    setConfirmRestart(true)
    timer.current = setTimeout(() => setConfirmRestart(false), 3000)
  }

  const dayLabel =
    day !== null
      ? new Date(day * 86_400_000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
      : null

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--subtle)' }}>
            {mode === 'daily' ? `Daily challenge, ${dayLabel} UTC` : 'Classic'}
          </p>
          <p className="text-sm text-pretty" style={{ color: 'var(--muted)' }}>
            {state.won ? 'You reached 2048. Keep going.' : `Best tile ${highestTile(state)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Stat label="Score" value={state.score} />
          <Stat label="Best" value={best} />
        </div>
      </div>

      <div className="relative">
        <Board tiles={state.tiles} onMove={slide} disabled={state.over} />
        {state.over && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-3xl"
            style={{ background: 'rgba(249,249,252,0.62)', backdropFilter: 'blur(3px)' }}
          >
            <p className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
              Run over
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onRestart} className={`${ghostBtn} flex-1`} style={{ color: 'var(--ink)' }}>
          <RotateCcw size={15} aria-hidden />
          {confirmRestart ? 'Tap again to restart' : mode === 'daily' ? 'Replay today' : 'New game'}
        </button>
        <button
          type="button"
          onClick={finish}
          disabled={state.over || state.score === 0}
          className={`${ghostBtn} flex-1`}
          style={{ color: 'var(--ink)' }}
        >
          <Flag size={15} aria-hidden />
          End run
        </button>
      </div>

      <SubmitPanel game={state} />
      <Leaderboard mode={mode} day={day} />
    </div>
  )
}
