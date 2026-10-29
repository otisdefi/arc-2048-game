import { useCallback, useEffect, useMemo, useState } from 'react'
import { endRun, move, newGame, settle, type Direction, type GameState, type Mode } from './engine'
import { utcDay } from './rng'

const BEST_KEY = 'arc2048:best'

function load(key: string, mode: Mode, day: number | null): GameState | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (parsed.mode !== mode || parsed.day !== day || !Array.isArray(parsed.tiles)) return null
    return settle(parsed)
  } catch {
    return null
  }
}

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
}

export function useGame(mode: Mode) {
  const day = useMemo(() => (mode === 'daily' ? utcDay() : null), [mode])
  const storageKey = mode === 'daily' ? `arc2048:daily:${day}` : 'arc2048:classic'
  const [state, setState] = useState<GameState>(() => load(storageKey, mode, day) ?? newGame(mode, day))
  const [storedBest] = useState(() => Number(localStorage.getItem(BEST_KEY) ?? 0))
  const best = Math.max(storedBest, state.score)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  useEffect(() => {
    localStorage.setItem(BEST_KEY, String(best))
  }, [best])

  // Remove tiles absorbed by a merge once the slide animation has played.
  useEffect(() => {
    if (!state.tiles.some((t) => t.gone)) return
    const timer = setTimeout(() => setState((s) => settle(s)), 140)
    return () => clearTimeout(timer)
  }, [state.tiles])

  const slide = useCallback((dir: Direction) => setState((s) => move(s, dir)), [])
  const restart = useCallback(() => setState(newGame(mode, day)), [mode, day])
  const finish = useCallback(() => setState((s) => endRun(s)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const dir = KEY_TO_DIR[e.key]
      if (!dir) return
      e.preventDefault()
      slide(dir)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide])

  return { state, best, day, slide, restart, finish }
}
