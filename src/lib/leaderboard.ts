import { parseAbi } from 'viem'
import { arcTestnet } from 'viem/chains'

export const LEADERBOARD_CHAIN_ID = arcTestnet.id

const rawAddress = import.meta.env.VITE_LEADERBOARD_ADDRESS as string | undefined
export const LEADERBOARD_ADDRESS = (rawAddress ?? '') as `0x${string}`

export const leaderboardAbi = parseAbi([
  'function submitClassic(uint32 score)',
  'function submitDaily(uint32 day, uint32 score)',
  'function currentDay() view returns (uint32)',
  'function getClassicTop() view returns (address[] players, uint32[] scores)',
  'function getDailyTop(uint32 day) view returns (address[] players, uint32[] scores)',
  'function getPlayerStatus(uint32 day, address player) view returns (uint32 classicBestScore, bool dailyDone, uint32 dailyScore)',
])

const EXPLORER_URL = (arcTestnet.blockExplorers?.default.url ?? 'https://explorer.testnet.arc.io').replace(/\/+$/, '')

export const explorerAddressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`
export const explorerTxUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`

export const shortAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

/** Map wallet / RPC errors to short, actionable copy. Returns null for a user cancel. */
export function parseSubmitError(error: unknown): string | null {
  const err = error as { code?: number; shortMessage?: string; message?: string } | null
  const message = `${err?.shortMessage ?? ''} ${err?.message ?? ''}`.toLowerCase()
  if (err?.code === 4001 || message.includes('user rejected') || message.includes('user denied')) return null
  if (message.includes('alreadysubmitted')) return 'You already submitted a score for this day.'
  if (message.includes('notpersonalbest')) return 'That score does not beat your classic best.'
  if (message.includes('invalidday')) return 'This daily challenge is closed for submissions.'
  if (message.includes('insufficient funds') || message.includes('exceeds balance')) {
    return 'Not enough USDC for gas. Use Get test USDC in the sidebar, then retry.'
  }
  if (message.includes('network') || message.includes('timeout')) return 'Network issue. Check your connection and retry.'
  return 'The submission did not go through. Please try again.'
}
