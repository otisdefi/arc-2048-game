import { useAccount, useReadContract } from 'wagmi'
import { ExternalLink, Trophy } from 'lucide-react'
import type { Mode } from '@/game/engine'
import { LEADERBOARD_ADDRESS, LEADERBOARD_CHAIN_ID, leaderboardAbi, shortAddress } from '@/lib/leaderboard'
import { buildAddressExplorerUrl } from '@/onchain-facts'

interface LeaderboardProps {
  mode: Mode
  day: number | null
}

export function Leaderboard({ mode, day }: LeaderboardProps) {
  const { address } = useAccount()
  const common = {
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    chainId: LEADERBOARD_CHAIN_ID,
    query: { refetchInterval: 15_000 },
  } as const

  const classic = useReadContract({ ...common, functionName: 'getClassicTop', query: { ...common.query, enabled: mode === 'classic' } })
  const daily = useReadContract({
    ...common,
    functionName: 'getDailyTop',
    args: [day ?? 0],
    query: { ...common.query, enabled: mode === 'daily' && day !== null },
  })

  const active = mode === 'classic' ? classic : daily
  const [players, scores] = active.data ?? [[], []]
  const rows = players.map((player, i) => ({ player, score: scores[i] }))

  return (
    <section className="glass-card rounded-3xl p-5" aria-label={mode === 'classic' ? 'Classic leaderboard' : 'Daily leaderboard'}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: 'var(--ink)' }} />
          <h2 className="display text-base font-bold" style={{ color: 'var(--ink)' }}>
            {mode === 'classic' ? 'Classic top 10' : 'Today top 10'}
          </h2>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--subtle)' }}>
          Arc Testnet
        </span>
      </div>

      {active.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl" style={{ background: 'rgba(18,45,69,0.06)' }} />
          ))}
        </div>
      ) : active.isError ? (
        <div className="flex items-center justify-between rounded-xl p-3 text-sm" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
          <span>Could not load scores.</span>
          <button type="button" onClick={() => void active.refetch()} className="min-h-11 rounded-full px-4 font-semibold underline">
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl p-4 text-center text-sm text-pretty" style={{ background: 'rgba(255,255,255,0.46)', color: 'var(--muted)' }}>
          No scores yet. Finish a run and be the first on the board.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((row, i) => {
            const mine = address?.toLowerCase() === row.player.toLowerCase()
            return (
              <li
                key={`${row.player}-${i}`}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2"
                style={{
                  background: mine ? 'rgba(133,177,237,0.28)' : 'rgba(255,255,255,0.46)',
                  border: `1px solid ${mine ? 'var(--focus)' : 'rgba(255,255,255,0.56)'}`,
                }}
              >
                <span className="display w-6 text-sm font-bold tabular-nums" style={{ color: i < 3 ? 'var(--ink)' : 'var(--subtle)' }}>
                  {i + 1}
                </span>
                <a
                  href={buildAddressExplorerUrl(LEADERBOARD_CHAIN_ID, row.player)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono flex flex-1 items-center gap-1.5 text-xs hover:underline"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {shortAddress(row.player)}
                  <ExternalLink size={11} aria-hidden />
                </a>
                {mine && (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ background: 'var(--accent)', color: '#fff' }}>
                    You
                  </span>
                )}
                <span className="display text-base font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                  {row.score.toLocaleString('en-US')}
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
