/** Small deterministic PRNG utilities. State is a single uint32 so it can be persisted. */

/** Hash a string into a uint32 seed (xmur3). */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

/** Advance a mulberry32 stream. Returns a float in [0, 1) and the next state. */
export function nextRandom(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) >>> 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: next }
}

/** Seed shared by every player for a given UTC day index. */
export function dailySeed(day: number): number {
  return hashSeed(`arc-2048-daily:${day}`)
}

/** Seed for a fresh classic run. */
export function randomSeed(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]
}

/** Current UTC day index, measured from the Unix epoch (matches the contract). */
export function utcDay(now: number = Date.now()): number {
  return Math.floor(now / 86_400_000)
}
