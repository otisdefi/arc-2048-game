import { useEffect, useRef } from 'react'
import { useAccount, useReadContract, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import type { GameState } from '@/game/engine'
import { LEADERBOARD_ADDRESS, LEADERBOARD_CHAIN_ID, leaderboardAbi, parseSubmitError } from '@/lib/leaderboard'
import { buildTxExplorerUrl } from '@/onchain-facts'

const primaryBtn =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

export function SubmitPanel({ game }: { game: GameState }) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChain, isPending: switching } = useSwitchChain()
  const queryClient = useQueryClient()
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash, chainId: LEADERBOARD_CHAIN_ID })

  const isDaily = game.mode === 'daily'
  const day = game.day ?? 0

  const today = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'currentDay',
    chainId: LEADERBOARD_CHAIN_ID,
  })
  const status = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'getPlayerStatus',
    args: address ? [day, address] : undefined,
    chainId: LEADERBOARD_CHAIN_ID,
    query: { enabled: Boolean(address) },
  })

  // Reset the transaction when a new run starts.
  const lastMoves = useRef(game.moves)
  useEffect(() => {
    if (game.moves < lastMoves.current) reset()
    lastMoves.current = game.moves
  }, [game.moves, reset])

  const confirmed = receipt.isSuccess
  useEffect(() => {
    if (!confirmed) return
    toast.success('Score submitted onchain')
    void queryClient.invalidateQueries()
  }, [confirmed, queryClient])

  const failure = error ? parseSubmitError(error) : null
  const [bestOnchain, dailyDone, dailyScore] = status.data ?? [0, false, 0]
  const todayIndex = today.data
  const dayOpen = !isDaily || todayIndex === undefined || day === todayIndex || day === todayIndex - 1

  const beatsBest = game.score > bestOnchain
  const submitted = confirmed || (isDaily && dailyDone)

  let blocker: string | null = null
  if (!game.over) blocker = null
  else if (game.score === 0) blocker = 'A score of zero cannot be submitted.'
  else if (isDaily && dailyDone) blocker = `You already posted ${dailyScore.toLocaleString('en-US')} for this daily challenge.`
  else if (isDaily && !dayOpen) blocker = 'This daily challenge has closed for submissions.'
  else if (!isDaily && !beatsBest && isConnected && status.isSuccess)
    blocker = `Your classic best onchain is ${bestOnchain.toLocaleString('en-US')}. Beat it to post a new score.`

  const submit = () => {
    if (isDaily) {
      writeContract({ address: LEADERBOARD_ADDRESS, abi: leaderboardAbi, functionName: 'submitDaily', args: [day, game.score], chainId: LEADERBOARD_CHAIN_ID })
    } else {
      writeContract({ address: LEADERBOARD_ADDRESS, abi: leaderboardAbi, functionName: 'submitClassic', args: [game.score], chainId: LEADERBOARD_CHAIN_ID })
    }
  }

  if (!game.over) {
    return (
      <p className="px-2 text-center text-xs text-pretty" style={{ color: 'var(--subtle)' }}>
        {isDaily
          ? 'Everyone plays the same tile sequence today. When your run ends, you can post one score for the day.'
          : 'When your run ends, post your score to the classic leaderboard.'}
      </p>
    )
  }

  const wrongChain = isConnected && chainId !== LEADERBOARD_CHAIN_ID
  const busy = isPending || (Boolean(hash) && receipt.isLoading)

  return (
    <section className="glass-card relative overflow-hidden rounded-3xl p-5" aria-live="polite">
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'var(--spectral)' }} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--subtle)' }}>
        {isDaily ? 'Daily result' : 'Run complete'}
      </p>
      <p className="display mt-1 text-4xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
        {game.score.toLocaleString('en-US')}
      </p>

      <div className="mt-4 space-y-3">
        {submitted ? (
          <div className="flex items-center gap-2 rounded-xl p-3 text-sm font-medium" style={{ background: 'rgba(26,128,71,0.10)', color: 'var(--success)' }}>
            <Check size={16} aria-hidden />
            <span>{confirmed ? 'Score posted to the leaderboard.' : blocker}</span>
          </div>
        ) : blocker ? (
          <p className="rounded-xl p-3 text-sm text-pretty" style={{ background: 'rgba(255,255,255,0.46)', color: 'var(--muted)' }}>
            {blocker}
          </p>
        ) : !isConnected ? (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button type="button" onClick={show} className={primaryBtn} style={{ background: 'var(--accent)' }}>
                Connect wallet to submit
              </button>
            )}
          </ConnectKitButton.Custom>
        ) : wrongChain ? (
          <button
            type="button"
            disabled={switching}
            onClick={() => switchChain({ chainId: LEADERBOARD_CHAIN_ID })}
            className={primaryBtn}
            style={{ background: 'var(--accent)' }}
          >
            {switching ? 'Switching...' : 'Switch to Arc Testnet'}
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={submit} className={primaryBtn} style={{ background: 'var(--accent)' }}>
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {isPending ? 'Confirm in wallet...' : busy ? 'Confirming onchain...' : isDaily ? 'Submit daily score (final)' : 'Submit classic score'}
          </button>
        )}

        {failure && (
          <p className="rounded-xl p-3 text-sm text-pretty" style={{ background: 'rgba(186,43,76,0.08)', color: 'var(--danger)' }}>
            {failure}
          </p>
        )}

        {hash && (
          <a
            href={buildTxExplorerUrl(LEADERBOARD_CHAIN_ID, hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium hover:underline"
            style={{ color: 'var(--accent-hover)' }}
          >
            View transaction <ExternalLink size={12} aria-hidden />
          </a>
        )}
      </div>
    </section>
  )
}
