# NSE Bot Dashboard

Vercel-ready frontend for
[`RakheebShaik-web/NSE-bot`](https://github.com/RakheebShaik-web/NSE-bot).

The bot writes `dashboard-data/latest.json` after every backtest. This app reads
that feed through `/api/data` and displays portfolio metrics, equity, drawdown,
yearly performance, all trades, current signals and factor weights.

## Vercel

Import this repository into Vercel. The default public feed works without
configuration. To use another feed, set:

```text
DASHBOARD_DATA_URL=https://example.com/latest.json
```

## Local development

```bash
pnpm install
pnpm dev
```

The dashboard shows a clearly-labelled illustrative fallback until the bot has
produced its first real `dashboard-data/latest.json`.
