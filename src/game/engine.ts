import { dailySeed, nextRandom, randomSeed } from './rng'

export const SIZE = 4
export type Direction = 'left' | 'right' | 'up' | 'down'
export type Mode = 'classic' | 'daily'

export interface Tile {
  id: number
  value: number
  row: number
  col: number
  /** Spawned by the last move. */
  fresh?: boolean
  /** Created by merging two tiles in the last move. */
  merged?: boolean
  /** Absorbed by a merge; removed after the slide animation. */
  gone?: boolean
}

export interface GameState {
  mode: Mode
  /** UTC day index for daily runs, null for classic. */
  day: number | null
  tiles: Tile[]
  score: number
  moves: number
  rng: number
  nextId: number
  over: boolean
  won: boolean
}

const live = (tiles: Tile[]) => tiles.filter((t) => !t.gone)

function spawn(state: GameState, tiles: Tile[]): { tiles: Tile[]; rng: number; nextId: number } {
  const taken = new Set(live(tiles).map((t) => t.row * SIZE + t.col))
  const empty: number[] = []
  for (let i = 0; i < SIZE * SIZE; i++) if (!taken.has(i)) empty.push(i)
  if (empty.length === 0) return { tiles, rng: state.rng, nextId: state.nextId }

  const pick = nextRandom(state.rng)
  const valueRoll = nextRandom(pick.state)
  const cell = empty[Math.floor(pick.value * empty.length)]
  const tile: Tile = {
    id: state.nextId,
    value: valueRoll.value < 0.9 ? 2 : 4,
    row: Math.floor(cell / SIZE),
    col: cell % SIZE,
    fresh: true,
  }
  return { tiles: [...tiles, tile], rng: valueRoll.state, nextId: state.nextId + 1 }
}

function hasMoves(tiles: Tile[]): boolean {
  const cells = live(tiles)
  if (cells.length < SIZE * SIZE) return true
  const grid = new Map(cells.map((t) => [t.row * SIZE + t.col, t.value]))
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid.get(r * SIZE + c)
      if (c + 1 < SIZE && grid.get(r * SIZE + c + 1) === v) return true
      if (r + 1 < SIZE && grid.get((r + 1) * SIZE + c) === v) return true
    }
  }
  return false
}

/** Create a run. Daily runs use the day's shared seed; classic runs use a random one. */
export function newGame(mode: Mode, day: number | null = null): GameState {
  const rng = mode === 'daily' && day !== null ? dailySeed(day) : randomSeed()
  let state: GameState = { mode, day, tiles: [], score: 0, moves: 0, rng, nextId: 1, over: false, won: false }
  for (let i = 0; i < 2; i++) {
    const s = spawn(state, state.tiles)
    state = { ...state, tiles: s.tiles, rng: s.rng, nextId: s.nextId }
  }
  return state
}

const coords = (dir: Direction, lane: number, k: number): [number, number] => {
  switch (dir) {
    case 'left':
      return [lane, k]
    case 'right':
      return [lane, SIZE - 1 - k]
    case 'up':
      return [k, lane]
    case 'down':
      return [SIZE - 1 - k, lane]
  }
}

/** Apply a move. Returns the same state object when the move changes nothing. */
export function move(state: GameState, dir: Direction): GameState {
  if (state.over) return state

  const tiles = live(state.tiles)
  const grid = new Map(tiles.map((t) => [t.row * SIZE + t.col, t]))
  const out: Tile[] = []
  const absorbed: Tile[] = []
  let nextId = state.nextId
  let gained = 0
  let changed = false
  let won = state.won

  for (let lane = 0; lane < SIZE; lane++) {
    const placed: Tile[] = []
    let lastMerged = false
    for (let k = 0; k < SIZE; k++) {
      const [r, c] = coords(dir, lane, k)
      const tile = grid.get(r * SIZE + c)
      if (!tile) continue
      const last = placed[placed.length - 1]
      if (last && !lastMerged && last.value === tile.value) {
        const value = tile.value * 2
        const merged: Tile = { id: nextId++, value, row: last.row, col: last.col, merged: true }
        absorbed.push({ ...last, gone: true, fresh: false, merged: false })
        absorbed.push({ ...tile, row: last.row, col: last.col, gone: true, fresh: false, merged: false })
        placed[placed.length - 1] = merged
        gained += value
        if (value >= 2048) won = true
        lastMerged = true
        changed = true
      } else {
        const [nr, nc] = coords(dir, lane, placed.length)
        if (nr !== tile.row || nc !== tile.col) changed = true
        placed.push({ id: tile.id, value: tile.value, row: nr, col: nc })
        lastMerged = false
      }
    }
    out.push(...placed)
  }

  if (!changed) return state

  const base: GameState = { ...state, nextId, score: state.score + gained, moves: state.moves + 1, won }
  const spawned = spawn(base, [...out, ...absorbed])
  return {
    ...base,
    tiles: spawned.tiles,
    rng: spawned.rng,
    nextId: spawned.nextId,
    over: !hasMoves(spawned.tiles),
  }
}

/** Drop tiles that finished sliding into a merge. */
export function settle(state: GameState): GameState {
  if (!state.tiles.some((t) => t.gone)) return state
  return { ...state, tiles: live(state.tiles) }
}

/** Voluntarily end a run so its score can be submitted. */
export function endRun(state: GameState): GameState {
  return state.over ? state : { ...state, over: true }
}

export const highestTile = (state: GameState): number =>
  live(state.tiles).reduce((m, t) => Math.max(m, t.value), 0)
