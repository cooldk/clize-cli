# Clize

**Clize is a CLI and MCP server that gives AI coding agents real-world actions: domains, email, deploys, payments, and media generation.** Your agent already has a brain — Clize gives it hands: a domain, a working inbox, a live website. One CLI (plus an MCP server) so coding agents in Claude Code / Codex can register domains, run real email, build & ship sites and short clips, generate media, and collect payments from their customers — across as many projects as you run.

→ **[clize.ai](https://clize.ai)**

## Install

```bash
npm i -g @clize/clize
clize install          # wire clize into your coding agent (Claude Code / Codex)
```

`clize install` is the step that makes your agent actually *reach for* clize — a binary on your `PATH` doesn't tell the agent it exists. By default it drops clize's skill (when to use it + the safety gates) into each agent's skills dir; the skill is lightweight — only its short description sits in context until something triggers it. It auto-detects Claude Code (`~/.claude`), Codex (`~/.codex`) and Pi (`~/.pi`); Codex and Pi share the open `~/.agents/skills` directory, so any agent that reads it gets the skill too. Scope with `--claude` / `--codex` / `--pi`, preview with `--dry-run`. Add `--mcp` to also register the `clize-mcp` server — opt-in, because an MCP server's tool list stays in context every session.

Update later with one command — pulls the latest release and refreshes the skill together:

```bash
clize update            # or `clize update --check` to only check for a newer version
```

If something looks stale after an update, `clize doctor` prints what's installed vs what's actually running — CLI version (and the upgrade command that works for your install manager: volta / pnpm / asdf / …), skill drift, and control-plane reachability.

Output is English by default. `CLIZE_LANG=zh` (or a `zh*` system locale) switches the CLI, the MCP tool descriptions and the control plane's messages to Chinese; the dictionary lives in `src/i18n/zh.ts`.

## Quickstart (hosted)

Log in and go — your agent never touches Cloudflare:

```bash
clize login                              # browser authorize; the first login creates your account
clize claim acme --email                 # free identity: acme.clize.app + support@acme.clize.app
clize init --handle acme                 # bind this directory (deploy / send / inbox infer the rest)
clize email inbox --wait-for "verify"    # give the new inbox a minute, then the agent signs up with support@acme.clize.app and reads the code here
clize status                             # who is waiting (real people + codes only), this month's spend
clize email send --to a@b.com --subject "Re: …" --text "…"   # queued for a one-tap approval in the console; --confirm sends now
clize deploy ./site                      # ship a static site → https://acme.clize.app
```

## Examples you can run (recorded 2026-10-01, with timings, costs and what failed)

| Example | What it does | Cost |
| --- | --- | --- |
| [01 · first verification email](examples/01-first-verification-email/) | install → claim an address with an inbox → read a verification code → queue a reply a person must approve | $0 |
| [02 · HTML → HTTPS → your domain](examples/02-html-to-https-site/) | a three-file folder to `https://<slug>.clize.app`, then a domain and a mailbox on it | $0 (+ the domain, quoted first) |
| [03 · one SEO loop](examples/03-seo-check-loop/) | `clize seo check` on a real site → two changes tied to numbers → publish → dated re-read | $0 |

Each one is Clize's own account and site (self-use), not a customer story.

## Hosted — just log in

| Log in with | What runs where |
|---|---|
| `clize login` (web: GitHub / Google / email) — or `clize login --token clize_…` for CI / headless | Commands call the clize backend; resources run on clize's infra. You never touch Cloudflare / Vercel keys. |

clize is a **thin client**: the CLI / MCP carry no infrastructure credentials and talk only to the clize control plane — domains, email, deploy, and media all run hosted. (Credentials live in your dashboard; bring-your-own Cloudflare / Vercel is configured there, not on your machine.)

A few specifics worth knowing:

- `clize deploy <dir>` and `clize email send` need `--domain` / `--from` — unless the directory is bound with `clize init --handle <slug>`, which infers both from `./clize.json`. Deploy is directory-based (multi-file static sites).
- `gen image --ref/--mask` (image-to-image / inpainting / multi-image composition) work hosted — reference-image caps follow the upstream model: 16 for `gpt-image-2`, 14 for `nano-banana-2` (video/`veo` takes 3); each ≤10 MB, ≤80 MB total. `gpt-image-2` runs as an async task (heavy multi-ref jobs take minutes — no sync-pipe timeouts): the CLI waits by default (`--timeout`, default 300 s), or use `--async` and collect with `gen status <id>`; one image per task (`--n` > 1 → split), `--mask` inpainting is `nano-banana-2` only. `gen budget` pre-approval isn't hosted yet: every generation confirms individually with `--confirm`.
- Free `*.clize.app` handle: `clize claim <slug>`. Your own domain: `clize domain buy` / `clize domain import`. Run `clize check` to verify your login.
- Free-tier quotas (anti-abuse, per tenant): 3 handles · 5 mailboxes · 10 claim attempts/day · 30 outbound emails/day · 20 deploys/day · 500 MB per site. Any top-up lifts you to the trusted tier (10 · 30 · 30 · 200 · 100 · 5 GB). Over-limit calls return a plain 429 — nothing is charged.
- A deploy target is a free handle or a whole domain in your account; a subdomain of your domain (`blog.example.com`) is not a separate deploy target today. Names bought with `clize domain buy` are registered with Clize's registrant contact at the underlying registrar — to be the registrant of record, register elsewhere and `clize domain import`. Some ccTLDs (`.de .fr .es .jp .kr .com.br .uk .eu`) are not registrable through Clize; `clize domain tlds` lists the 555 that are.

## What it does

| Area | Commands |
|---|---|
| **Identity** | `clize claim <slug> --email` — a first-come, free identity for your agent: `<slug>.clize.app` (site placeholder) plus a receiving `support@<slug>.clize.app`. Without `--email` you get the name and the site only (`clize email setup <handle>` opens the inbox later) — inbound is opt-in because each inbox costs 4 DNS records in the shared `clize.app` zone, and that zone is the whole platform's free-handle capacity |
| **Domains** | `clize domain search / tlds / buy / import / list`; `clize domain check <domain>` runs six layers in repair order — registry delegation (public DoH) → Cloudflare zone → worker binding → content → **edge AI-crawler policy** (Cloudflare `ai_bots_protection`; new zones default to blocking AI crawlers from 2026-09-15, and a blocked edge beats any robots.txt) → **http→https** (a real `http://` request must get a 301 to https; clize turns on Cloudflare's Always Use HTTPS on every zone it deploys to, imports or registers, and `domain canonicalize` does too) |
| **Email** | The mailbox your agent signs up for services with and reads verification codes from (`clize email inbox [domain] --wait-for <text>` polls until the mail arrives), and the inbox real people write to. `clize email address add <addr>` opens a mailbox in one step (object + receiving) on any domain you own — as many per domain as you need (`ops@`, `sales@`, one per agent or per person); `--forward me@gmail.com` copies mail to a personal inbox, `--owner <member>` makes it someone's private mailbox. `support@<slug>.clize.app` is available on any claimed handle via `clize email setup <handle>` (or `clize claim <slug> --email`). Read with `inbox` (triaged: promos / notices / spam are filtered, `--all` shows everything) / `show` / `thread` / `search`, correct triage with `mark`, send with `send` (`--attach`). Mail is stored permanently and indexed. **Multi-user**: `clize members invite alice@corp.com --mailbox alice@<domain>` lets a person log in and use their own mailbox; owners/admins see every mailbox in the account. **Per-agent keys**: `clize email key create --scope read,send --address ops@<domain>`. Command reference: [clize.ai/docs/commands](https://clize.ai/docs/commands/). |
| **Outbox** | Interactive `clize email send` without `--confirm` lands in an outbox instead of vanishing as a draft: a person approves or rejects it in the console (Home → needs you → Inbox), or from the digest email's signed one-tap link; `clize email pending` lists what is waiting and `status` counts it. A **standing allowlist** (a recipient or `@domain`, weekly cap 5) can be set only in the console — approvals and the allowlist are refused to CLI-issued keys, so a prompt injection cannot grant itself an exemption. Sends to allowlisted recipients within the cap go out without `--confirm`. |
| **Send API** (server-callable) | `POST /v1/email/send` — transactional email from a long-running backend (fly.io / cron), Resend/Postmark-shaped, sending from a domain already in Clize (no second email vendor). Auth is a **scoped send key** (`clize_sk_…`: send-only, lockable to specific domains) — `clize email key create/list/revoke`. No `--confirm` (the human-review gate stays on interactive `email send`). Idempotency-Key, HMAC-signed delivery webhooks (bounce/complaint), RFC 8058 one-click unsubscribe + suppression lists (`email delivery-webhook / suppressions / messages`). Walkthrough: [sending from a backend with a scoped key](https://clize.ai/inbox/replit/) · [webhooks and delivery events](https://clize.ai/inbox/inbound-email-webhook/). |
| **Media** | `clize gen image / video / music` — text→image (`gpt-image-2` / `nano-banana-2`, with `--ref` / `--mask` for image-to-image and inpainting), text/image→video (`veo`), text→music (`suno`); long tasks via `gen jobs / status`. Every spend is gated by `--confirm` (`gen budget` pre-approval for hosted is on the roadmap). Results land as local files, ready to `deploy` or `email --attach`. |
| **Build · site** (hosted methods) | `clize build site start <brief>` — a hosted design system that briefs your agent on a cohesive style *before* it writes the site, so pages land with taste instead of AI-template sludge. Then `build site recommend / list / get / search / review` + `build site stack <stack>` for stack-specific guidance (React / Next / SwiftUI / …). The former `clize design …` spelling still works as a hidden alias. `clize build site check <dir> [--live <origin>]` is the free pre-ship lint: doorway-shaped near-duplicates (≥60% shared visible text) and thin pages, `_redirects` targets (probed live with `--live`), hreflang reciprocity, FAQ text vs JSON-LD, canonical/noindex conflicts, sitemap membership — errors exit non-zero. Since 0.41.0 it also reports three GEO **warnings** (never errors): a comparison page whose first 200 words do not name your own product, a comparison page with no `<table>`, a content page with no visible date or one over 12 months old. |
| **Build · clip** (hosted methods) | `clize build clip start <brief>` → your agent writes a shot-by-shot blueprint → `build clip check` (free local lint: continuity, dialogue coverage, timing) → `build clip render --confirm` (💰 one summed quote, batch-generate + merge, resumable). One-off footage stays `gen video`. |
| **Deploy** | `clize deploy <dir> --domain <host>` — multi-file static sites; free `*.clize.app` or your own domain. Preview locally first with `clize serve <dir>` (proper `Range` support — `<video>` pages actually play in Safari). Deploy runs the same guards as `build site check` before uploading — doorway-shaped near-duplicates block the upload (`--allow-similar` to override), and after upload every `_redirects` rule is probed live; the result rides along in the deploy output as `guards` (including the three GEO warnings from `build site check`). Deploy only adds or overwrites: a live path missing from `<dir>` stays online and is listed under `orphans` in the receipt; `--prune` removes every such path (`--prune-under <prefix>` limits it to one subtree), and `clize site paths` / `clize site rm <path...>` list and remove single live paths. |
| **SEO / GEO** (hosted data) | `clize seo keywords <seeds...>` / `competitors <domains...>` / `serp <keyword>` — research data with **no key, no signup, no upstream account**: search volume + difficulty + intent (difficulty banded by what you can actually attack), what competitors live on, and who occupies a results page (an `official_wall` / `definition_wall` / `listicle_window` / `open` verdict from a rule engine, plus the listicles worth pitching). Since 0.40.0 `serp` also reports **who the AI Overview quotes** (`aiOverviewCitations`, each with the sentence the engine lifted) and **which questions Google hangs on the page** (`questions`: People Also Ask + related searches; `--questions-depth 1|2` clicks the box open for more), and keyword rows in `competitors` / `check` carry `question: true` when they are question-shaped. `serp <keyword> --engine chatgpt,gemini,aimode,perplexity` asks the AI engines the same question and returns, per engine, who it cited, which brands it named and the sub-questions it searched — one upstream call and one charge line per engine (about $0.02 each), one keyword at a time, cached 30 days: **a sample, never a monitor** (there is no "were you cited" field and no schedule). `competitors <domain> --ai` reads a stored library of real AI answers for which questions cited that domain and which of its pages — ChatGPT (US / English) and Google AI Overview only, about $1 per domain. `clize geo "<question>"` is the GEO entry — the same results-page read with the AI face on by default (alias of `seo serp <question> --engine chatgpt,aimode`). Then `clize seo check --domain <d>` measures **your** site once, **in seconds**: Search Console positions for your keyword list (impression-weighted average over the window, plus the words Search Console has *not* seen yet — listed by name, at no cost), traffic by source with **AI engines listed separately**, clicks/impressions (new queries flow back into the list), the delta since the last window (position *and* impressions), **your pages** — impressions vs the previous window, live HTTP status and Google's index status per page, so a lost or un-indexed page shows up as a page instead of as a mysterious keyword dip — and **`signals`** — the words where demand and delivery disagree, labelled (`pre_emergence` / `authority_limited` / `demand_no_surface`). **Measuring makes no upstream data calls and costs nothing**; the only metered part is pricing keywords you have never priced (~$0.10 for forty, reused for a month). For one keyword's exact position and who is ahead of you, `seo serp <keyword>` answers on demand. The research commands skip the per-call `--confirm` — the trade is that **every response opens with that call's charge in plain words** (`this call: $0.0648 (keywords, 37 words, en-US)`, and a cache hit says so and costs $0), plus `clize seo spend` — free — which itemizes every charge so the numbers in a write-up are copied, never hand-tallied. A single monthly cap guards against runaway loops and you can raise it yourself (`--cap`, $25 by default, sized so normal use never reaches it — your balance is the hard wall). The page side also lists what to prune: `cells.retire` (pages zero for two windows, with `ageSource` and a per-directory `prune:` line), `cells.defects.canonical` (noindex + canonical contradictions and the like), and `gsc.pages.batches` with an index-refusal line when Google has read a batch and declined it — facts, never actions. The commands return **facts only**; how to read them — and where the keywords to test come from in the first place — lives in the `clize-seo` skill. Example: [one real SEO loop on clize.ai](https://clize.ai/seo/#real-loop). |
| **Projects** | One project = one directory: `clize init --handle <slug>` binds it (the project record auto-creates on first `claim` / `buy`). `clize projects` to list / `new` / `move` / `rename` / `rm`; `-p <slug>` for one-off cross-project calls. Email send across projects is blocked (409); deploy instead **follows the target domain** — a stale `clize.json` checkout auto-routes to the domain's real project (and is written back to `clize.json`), and only an explicit mismatched `-p` is a 409. `status` / lists / spend scope to the checked-out project, and `status` flags any local↔remote drift. |
| **Context** | `clize status [--assets]`, `clize context [address]` — rehydrate who's waiting + identity/knowledge at the start of a session |
| **Billing** (hosted) | `clize balance` / `clize recharge --amount <usd>` — prepaid clize balance that domain/media spends draw from (Stripe top-up); `clize audit` for the spend log |
| **Collect** (hosted) | `clize pay link --amount <usd>` — bill *your* customers, zero config: by default money lands in your clize balance (no fee — **balance funds are spendable on clize only, not withdrawable**). Direct payout to your own Stripe (`direct`, clize takes a fee) is **not yet enabled on the platform**; once it is, connecting Stripe on the web dashboard switches payments over automatically. Until then `--mode direct` is refused and every payment lands in your balance. `clize pay status` / `clize pay list`. |
| **Shop & forms** (hosted) | `clize shop` — turn a deployed site into a storefront that takes real money: products live in a `_catalog.json` you deploy, carts check out via Stripe with **server-side pricing** against your deployed catalog (clients can't forge prices); one-time or subscriptions, shipping-address collection, `direct` or `balance` payout like `pay`. clize holds the order layer — `clize shop orders / todo / fulfill / notify / refund / shipments / events / webhook / hook test` (paid → sourced → shipped → delivered, 17TRACK tracking, buyer self-service at `/orders`; signed fulfillment webhooks with per-store secrets, delivery bookkeeping, automatic retries and `--replay`; `shop hook test` proves your endpoint before the first sale; the success page gets `?order=cs_…` and a public status endpoint) — while the catalog ships with your site and stock, tax and shipping stay with you. `clize data webhook` forwards form / waitlist submissions to your endpoint (clize doesn't store them). clize is the shell, the order ledger and the payment wiring, not a Shopify. |

Run `clize --help` for the full surface.

## Deploy & site hosting

`clize deploy <dir>` uploads a multi-file static site and serves it from a shared Cloudflare Worker backed by KV for small hot files and R2 for large assets (not Workers Static Assets / Pages), keyed by `hostname + path`. What you can rely on:

- **Unknown paths** — by default, if the site ships a `404.html` it's returned with a real **HTTP 404** (so failed/typo URLs aren't indexed as duplicate homepages — the SEO-correct behavior); with no `404.html` the site is treated as an SPA and the request falls back to `index.html` (200). Override per-deploy with `--not-found <404-page|spa|none|auto>` (`auto` is the default = exactly this detection).
- **Trailing slash** — `/foo/` serves `/foo/index.html` (200, no 301).
- **Caching** — assets are served with `cache-control: public, max-age=300`.
- **Removal** — `deploy` never deletes on its own: a live path that is missing from the directory stays online, and the receipt lists such paths under `orphans` (KV pages and small files, R2 assets alike). `clize deploy <dir> --prune` removes every orphan after the upload, `--prune-under <prefix>` limits that to one subtree (for sites where several machines each own a subtree), `clize site paths [domain]` lists every live path with its layer, and `clize site rm <path...>` removes single paths (`/dir/` means `/dir/index.html`; sitemap.xml / llms.txt follow). Removed paths can still be served from the edge cache for up to 5 minutes.
- **Cloudflare convention files** — `404.html` and `index.html` drive the not-found behavior above. **`_redirects` is consumed** (Cloudflare Pages format: `from to [status]`, `*`/`:splat` and `:name` placeholders, status default 302, 3xx redirect with the query preserved, other statuses rewrite to a site file, external targets redirect only); real files always win over rules (so to 301 a page that once shipped, remove it first with `clize site rm` or `deploy --prune`, then add the rule), the file itself is never served, and `deploy` probes every rule live after upload (`guards.redirects`). `_headers` is still stored but inert.
- **Size** — large assets (≥128 KB) are stored in R2, small hot files in KV, so single files stream up to ~90 MB and a site can technically reach 5 GB. Free-tier policy caps: **500 MB per site** and 2 GB uploaded per day; any top-up lifts you to the trusted tier (5 GB per site, 20 GB/day). Uploads are content-hash deduplicated — redeploys only send changed files.
- **Routing & write-back** — a deploy targets the domain you pass (or the one in `clize.json`); it follows that domain's real project and writes the resolved `project` (plus a custom domain) back to `clize.json`, so repeat deploys don't drift or 409.

## Safety, by default

- 💰 **Money gate** — spends (`clize domain buy`, `clize gen image/video/music`) never go through without `--confirm`; without it you just get a quote.
- 📨 **Identity gate** — replying as you to a real customer is **draft → human approve → send**, never auto.
- 📥 **Inbound is untrusted** — email you receive is treated as data, never as instructions to the agent.

These gates run in plain text, so every spend and every outbound action is visible in the agent's transcript.

## MCP

A curated subset of the core — claim, domains & DNS, email (including the approval outbox), deploy, shop & forms, status/context, billing, collect (`pay`) — exposed as **33 MCP tools** for hosts that prefer structured tools over a shell. (Media generation, SEO/GEO and the `build` method packs stay CLI- and skill-driven, not MCP tools: an agent that can run a shell reaches them through `clize`.) Opt-in (`clize install --mcp`), since an MCP server's tool list is a standing per-session context cost — the skill alone already lets the agent drive clize via the CLI. To register by hand:

```bash
claude mcp add clize -- clize-mcp     # Claude Code
codex mcp add clize -- clize-mcp      # Codex
```

Works in both modes — set `CLIZE_API_KEY` (and optionally `CLIZE_API_URL`) in the server's environment to run hosted.

### One product line at a time — `clize-mcp --profile`

All 33 tools sit in context every session, even when all you wanted was the inbox. `--profile <line>` starts the same server with only that line's tools **registered** — absent from `tools/list` rather than registered-then-hidden, so the ones you skip cost the host nothing:

```bash
claude mcp add inbox -- clize-mcp --profile inbox      # 14 tools instead of 33
```

A profile only subtracts: tool names, arguments and behaviour are identical across profiles, so switching one doesn't make the agent relearn the surface. `serverInfo.name` becomes `clize-<line>` so the host shows which line is connected. Without `--profile` nothing changes — all 33 tools, `serverInfo.name` = `clize`, which is what `clize install --mcp` still registers. An unknown value exits non-zero listing the valid ones instead of quietly serving the full set (a silent fallback would hand you 33 tools while you believed you had installed a subset).

Every product line installs the same package, `@clize/clize`, and picks its tool subset with `--profile`:

| Product line | `--profile` | Tools (each profile includes `status` / `balance` / `recharge`) |
|---|---|---|
| **Agent Inbox** — a real inbox agents send from and receive into ([clize.ai/inbox/](https://clize.ai/inbox/)) | `inbox` | 14 — `claim`, `email setup / address add / inbox (with wait-for) / thread / search / show / mark / send / pending`, `context` |
| **Agent Storefront** — your agent runs a real store | `storefront` | 15 — `pay`, `shop status / orders / order / todo / fulfill / notify / refund / events / shipments / webhook`, `data webhook` |
| **Sites by Clize** — a marketing site that actually ships | `sites` | 5 — `claim`, `deploy` |
| **Agent Domains** — domains an agent can buy, point and monitor | `domains` | 9 — `domain search / buy / ns`, `dns list / set / rm` |

`deploy` lives only in `sites`, and media / `build` have no MCP tools at all — for the whole surface, run the server with no `--profile`. A profile is a **context budget, not a permission boundary**: the money / identity / untrusted-inbound gates are unchanged, and to actually restrict what a key can do use a scoped key ([scoped keys](https://clize.ai/docs/commands/)). Installing the CLI stays `npm i -g @clize/clize` — npm does not link a dependency's binaries onto your `PATH`, so the per-line packages are for discovery and for `npx`:

```bash
claude mcp add inbox -- npx -y -p @clize/clize clize-mcp --profile inbox
```

The MCP registry lists one server, `ai.clize/clize`; a line is a `--profile`, not a separate package.

## Guides & use cases

Step-by-step setup:

- [Add Clize as an MCP server to Claude Code](https://clize.ai/claude-code-mcp-setup/) · [to the Codex CLI](https://clize.ai/codex-cli-mcp-setup/)
- [What an action MCP server is (vs read-only)](https://clize.ai/mcp-server-real-world-actions/)

What agents actually do with it:

- [Send a real email — released from an approval outbox](https://clize.ai/use-cases/agent-send-email/)
- [Put an HTML file online from the agent — with a recorded real run](https://clize.ai/sites/host-html-file/#real-run)
- [Pass email verification when signing up for services — install to first code, timed](https://clize.ai/use-cases/agent-email-verification/#real-run)
- [Triage a support inbox, draft replies you approve](https://clize.ai/use-cases/triage-support-inbox/)
- [Create a Stripe payment link behind the money gate](https://clize.ai/use-cases/agent-payment-link/)
- [Register a domain programmatically — the five steps, a real quote and the limits](https://clize.ai/domains/programmatic-domain-registration/#how-to)
- [One real SEO loop on our own site: the check, the two changes, the re-read dates](https://clize.ai/seo/#real-loop)

## License

[MIT](https://github.com/cooldk/clize-cli/blob/main/LICENSE)
