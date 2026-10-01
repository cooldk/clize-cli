# 03 · One SEO loop on a real site: check → decide → change → publish → re-read

**What this shows:** an agent reads real Search Console and traffic data for a site with `clize seo check`, makes changes that each trace back to a number, ships them, and writes down when it will look again.
**Recorded:** 1 October 2026 on clize.ai — Clize's own site (self-use case). Write-up: [clize.ai/seo/#real-loop](https://clize.ai/seo/#real-loop).
**Cost of the loop:** $0. `clize seo check` is free; no paid research call was needed this time.

## 0 · One-time setup (2 minutes, a person does it)

1. `npm i -g @clize/clize && clize install && clize login`
2. In Google Search Console → your property → Settings → Users and permissions, add the service-account email that the first `clize seo check --domain yoursite.com` prints, as a **Restricted** user. Re-run the check.

Agent SEO is CLI-only: the commands are not part of the Clize MCP server, so the agent needs to be able to run shell commands.

## 1 · Read

```console
$ clize seo check --domain clize.ai > check.json        # a few seconds; free
$ node summarize.mjs check.json
```

What the recorded read said (Search Console window 1–28 Sep 2026 vs 4–31 Aug; traffic is Cloudflare RUM, adaptively sampled — estimates, not counts):

| Fact | Value |
| --- | --- |
| Impressions / clicks, whole property | 2,497 / 16 — every click on a brand query |
| Non-brand impressions / clicks | 1,755 / 0 (81% past position 50; brand split done against Search Console daily rows) |
| Closest queries | `programmatic domain registration` pos 5.1 (23 impr.) · `how to register domains programmatically` pos 12.3 (21) — one comparison page |
| AI referrals, last 7 days | 5, all ChatGPT: 4 to `/domains/nameserver-change-not-propagating/`, 1 to `/seo/llms-txt-validator/` |
| That NS page in Google | 1 impression in 28 days |
| Pages in the sitemap | 243 |

## 2 · Decide (each change names its number)

1. **The page AI sends people to must keep its promise.** We used the NS checker by hand and found two gaps: when DNS was healthy it stopped there (the page is for people whose site is still down), and its call to action promised `clize domain check yourdomain.com`, which returns 403 for domains that are not in a Clize account. → The tool now adds a "the fault is above DNS" note with `curl -sI https://<host>/`, and the call to action says which domains the command covers. Eight languages, tool tests 43/43.
2. **Answer the how-to query the comparison page sits at 12 for.** The page only compared registrar APIs. → Added the five steps, a real quote (`.com` $12.55, nothing bought) and the limits, near the top. Title and H1 unchanged — they earned the impressions.

Not done, on purpose: no new pages for the 285 "missing cells" the check listed; the sample here is too small to justify multiplying anything.

## 3 · Publish

The site is static; ours deploys to Cloudflare Pages with its own script, and changed URLs are pinged to IndexNow (HTTP 200 for 56 URLs). A Clize-hosted site would use `clize deploy ./site`.

## 4 · Re-read — dates written down before any result exists

| When | What | Window |
| --- | --- | --- |
| 8, 15, 22, 29 Oct 2026 | AI referrals per page (`traffic.pages`) | 7 days |
| ~1 Nov 2026 | the two queries' position and impressions | 2–29 Oct vs 4 Sep–1 Oct (28 days; Search Console finalises ~2–3 days late) |

At 21–23 impressions a month a single window can move on noise alone, so the follow-up reports the numbers, not a verdict.
