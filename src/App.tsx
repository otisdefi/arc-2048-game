import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import type { Mode } from '@/game/engine'
import { GameScreen } from '@/components/GameScreen'
import { shortAddress } from '@/lib/leaderboard'

const TABS: { id: Mode; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'daily', label: 'Daily' },
]

export default function App() {
  const [mode, setMode] = useState<Mode>('classic')

  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          style={{ position: 'absolute', top: '6%', left: '4%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(133,177,237,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          style={{ position: 'absolute', bottom: '8%', right: '6%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,205,131,0.20) 0%, transparent 70%)', filter: 'blur(58px)' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-md px-4 pb-24 pt-6">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Arc 2048
          </h1>
          <ConnectKitButton.Custom>
            {({ isConnected, show, address }) => (
              <button
                type="button"
                onClick={show}
                className="min-h-11 rounded-full px-5 text-xs font-semibold transition active:scale-[0.97]"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {isConnected && address ? shortAddress(address) : 'Connect'}
              </button>
            )}
          </ConnectKitButton.Custom>
        </header>

        <div role="tablist" aria-label="Game mode" className="glass-pill mb-5 grid grid-cols-2 rounded-full p-1">
          {TABS.map((tab) => {
            const active = tab.id === mode
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className="min-h-11 rounded-full text-sm font-semibold transition"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--ink-2)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <main>
          <GameScreen key={mode} mode={mode} />
        </main>
      </div>
    </div>
  )
}
