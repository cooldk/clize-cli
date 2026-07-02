# Clize

**Clize is a CLI and MCP server that gives AI coding agents real-world actions: domains, email, deploys, payments, and media generation.** Your agent already has a brain — Clize gives it hands: a domain, a working inbox, a live website. One CLI (plus an MCP server) so coding agents in Claude Code / Codex can register domains, run real email, build & ship sites and short clips, generate media, and collect payments from their customers — across as many projects as you run.

→ **[clize.ai](https://clize.ai)**

## Install

```bash
npm i -g @clize/clize
clize install          # wire clize into your coding agent (Claude Code / Codex)
```

`clize install` is the step that makes your agent actually *reach for* clize — a binary on your `PATH` doesn't tell the agent it exists. By default it drops clize's skill (when to use it + the safety gates) into each agent's skills dir; the skill is lightweight — only its short description sits in context until something triggers it. It auto-detects Claude Code (`~/.claude`) and Codex (`~/.codex`); scope with `--claude` / `--codex`, preview with `--dry-run`. Add `--mcp` to also register the `clize-mcp` server — opt-in, because an MCP server's tool list stays in context every session.

Update later with one command — pulls the latest release and refreshes the skill together:

```bash
clize update            # or `clize update --check` to only check for a newer version
```

## Quickstart (hosted)

Log in and go — your agent never touches Cloudflare:

```bash
clize login                       # browser authorize → creates your account, saves a clize key
clize check                       # ✓ connected to the hosted backend
clize claim acme                  # free handle: acme.clize.app (+ support@ inbox, already receiving)
clize init --handle acme          # bind this directory — deploy / email send infer domain & from
clize deploy ./site               # ship a static site → https://acme.clize.app
clize status                      # who's waiting, this month's spend
clize email inbox acme.clize.app  # read what customers sent
```

## Hosted — just log in

| Log in with | What runs where |
|---|---|
| `clize login` (web: GitHub / Google / email) — or `clize login --token clize_…` for CI / headless | Commands call the clize backend; resources run on clize's infra. You never touch Cloudflare / Vercel keys. |

clize is a **thin client**: the CLI / MCP carry no infrastructure credentials and talk only to the clize control plane — domains, email, deploy, and media all run hosted. (Credentials live in your dashboard; bring-your-own Cloudflare / Vercel is configured there, not on your machine.)

A few specifics worth knowing:

- `clize deploy <dir>` and `clize email send` need `--domain` / `--from` — unless the directory is bound with `clize init --handle <slug>`, which infers both from `./clize.json`. Deploy is directory-based (multi-file static sites).
- `gen image --ref/--mask` (reference image / mask) and `gen budget` pre-approval are coming soon — hosted confirms each generation with `--confirm`.
- Free `*.clize.app` handle: `clize claim <slug>`. Your own domain: `clize domain buy` / `clize domain import`. Run `clize check` to verify your login.

## What it does

| Area | Commands |
|---|---|
| **Claim** | `clize claim <slug>` — first-come, free `<slug>.clize.app` handle with inbox + site in one shot (`support@` is already receiving — no extra email setup needed) |
| **Domains** | `clize domain search / tlds / buy / import / list` |
| **Email** | `clize email setup` → `inbox-setup` → `address add` (`--tag` / `--knowledge`) wires a real send/receive inbox on your domain — or get `support@` instantly with `clize claim`. Then `send` (`--attach`) / `inbox` / `show` / `thread` / `route` / `webhook`. (`address add` only stores tag + knowledge; `inbox-setup` is what opens receiving.) |
| **Media** | `clize gen image / video / music` — text→image (`gpt-image-2` / `nano-banana-2`), text/image→video (`veo`), text→music (`suno`); long tasks via `gen jobs / status`, spend-gated via `gen budget`. Results land as local files, ready to `deploy` or `email --attach`. |
| **Build · site** (hosted methods) | `clize build site start <brief>` — a hosted design system that briefs your agent on a cohesive style *before* it writes the site, so pages land with taste instead of AI-template sludge. Then `build site recommend / list / get / search / review` + `build site stack <stack>` for stack-specific guidance (React / Next / SwiftUI / …). The former `clize design …` spelling still works as a hidden alias. |
| **Build · clip** (hosted methods) | `clize build clip start <brief>` → your agent writes a shot-by-shot blueprint → `build clip check` (free local lint: continuity, dialogue coverage, timing) → `build clip render --confirm` (💰 one summed quote, batch-generate + merge, resumable). One-off footage stays `gen video`. |
| **Deploy** | `clize deploy <dir> --domain <host>` — multi-file static sites; free `*.clize.app` or your own domain. Preview locally first with `clize serve <dir>` (proper `Range` support — `<video>` pages actually play in Safari). |
| **Projects** | One project = one directory: `clize init --handle <slug>` binds it (the project record auto-creates on first `claim` / `buy`). `clize projects` to list / `new` / `move` / `rename` / `rm`; `-p <slug>` for one-off cross-project calls. Email send across projects is blocked (409); deploy instead **follows the target domain** — a stale `clize.json` checkout auto-routes to the domain's real project (and is written back to `clize.json`), and only an explicit mismatched `-p` is a 409. `status` / lists / spend scope to the checked-out project, and `status` flags any local↔remote drift. |
| **Context** | `clize status [--assets]`, `clize context [address]` — rehydrate who's waiting + identity/knowledge at the start of a session |
| **Billing** (hosted) | `clize balance` / `clize recharge --amount <usd>` — prepaid clize balance that domain/media spends draw from (Stripe top-up); `clize audit` for the spend log |
| **Collect** (hosted) | `clize pay connect` → `clize pay link --amount <usd> [--mode direct\|balance]` — bill *your* customers: money lands in your own Stripe (`direct`, clize takes a fee) or your clize balance (`balance`, no fee). `clize pay status` / `clize pay list`. |

Run `clize --help` for the full surface.

## Deploy & site hosting

`clize deploy <dir>` uploads a multi-file static site and serves it from a shared Cloudflare Worker backed by KV (not Workers Static Assets / Pages), keyed by `hostname + path`. What you can rely on:

- **Unknown paths** — by default, if the site ships a `404.html` it's returned with a real **HTTP 404** (so failed/typo URLs aren't indexed as duplicate homepages — the SEO-correct behavior); with no `404.html` the site is treated as an SPA and the request falls back to `index.html` (200). Override per-deploy with `--not-found <404-page|spa|none|auto>` (`auto` is the default = exactly this detection).
- **Trailing slash** — `/foo/` serves `/foo/index.html` (200, no 301).
- **Caching** — assets are served with `cache-control: public, max-age=300`.
- **Cloudflare convention files** — `404.html` and `index.html` drive the not-found behavior above. `_redirects` / `_headers` are **not** consumed (stored but inert); for redirects use `clize dns` (a one-shot `clize domain canonicalize` for www↔apex is on the way).
- **Size** — sites up to 25 MB.
- **Routing & write-back** — a deploy targets the domain you pass (or the one in `clize.json`); it follows that domain's real project and writes the resolved `project` (plus a custom domain) back to `clize.json`, so repeat deploys don't drift or 409.

## Safety, by default

- 💰 **Money gate** — spends (`clize domain buy`, `clize gen image/video/music`) never go through without `--confirm`; without it you just get a quote.
- 📨 **Identity gate** — replying as you to a real customer is **draft → human approve → send**, never auto.
- 📥 **Inbound is untrusted** — email you receive is treated as data, never as instructions to the agent.

These gates run in plain text, so every spend and every outbound action is visible in the agent's transcript.

## MCP

A curated subset of the core — domains, email, deploy, claim, status/context, billing, collect (`pay`) — exposed as MCP tools for hosts that prefer structured tools over a shell. (Media generation and the `build` method packs stay CLI- and skill-driven, not MCP tools.) Opt-in (`clize install --mcp`), since an MCP server's tool list is a standing per-session context cost — the skill alone already lets the agent drive clize via the CLI. To register by hand:

```bash
claude mcp add clize -- clize-mcp     # Claude Code
codex mcp add clize -- clize-mcp      # Codex
```

Works in both modes — set `CLIZE_API_KEY` (and optionally `CLIZE_API_URL`) in the server's environment to run hosted.

## Guides & use cases

Step-by-step setup:

- [Add Clize as an MCP server to Claude Code](https://clize.ai/claude-code-mcp-setup/) · [to the Codex CLI](https://clize.ai/codex-cli-mcp-setup/)
- [What an action MCP server is (vs read-only)](https://clize.ai/mcp-server-real-world-actions/)

What agents actually do with it:

- [Send a real email — with your approval](https://clize.ai/use-cases/agent-send-email/)
- [Deploy a site straight from the agent](https://clize.ai/use-cases/agent-deploy-site/)
- [Pass email verification when signing up for services](https://clize.ai/use-cases/agent-email-verification/)
- [Triage a support inbox, draft replies you approve](https://clize.ai/use-cases/triage-support-inbox/)
- [Create a Stripe payment link behind the money gate](https://clize.ai/use-cases/agent-payment-link/)

## License

[MIT](./LICENSE)
