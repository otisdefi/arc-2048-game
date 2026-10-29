# Arc 2048

A 2048 game with two modes and onchain top-10 leaderboards on Arc Testnet. Classic is a regular random run. Daily is a challenge where everyone gets the same tile sequence each UTC day, and each wallet can post one score per day.

Built with [Arc Studio](https://studio.arc.io)

## Tech stack

- React, Vite, TypeScript, Tailwind CSS
- wagmi, viem, ConnectKit
- Solidity (Foundry) leaderboard contract on Arc Testnet

## Development

Prerequisites: [Bun](https://bun.sh) and [Foundry](https://getfoundry.sh).

```bash
bun install
bun run dev
```

Other commands:

```bash
bun run check            # lint and typecheck
bun run contracts:build  # compile the contract
bun run contracts:test   # run contract tests
```

### Environment variables

- `VITE_LEADERBOARD_ADDRESS`: address of the deployed leaderboard contract on Arc Testnet.

## Notes

Scores are reported by the player's browser, so the leaderboards are for fun and cannot prove a run was played fairly. Gas on Arc Testnet is paid in USDC.
