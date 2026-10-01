#!/usr/bin/env bash
# Give an AI agent its own inbox and wait for its first verification email.
# Usage: SLUG=yourname ./run.sh            (needs Node 18+; the first `clize login` opens a browser)
# Cost: $0 on the free tier (5 mailboxes, 30 sent emails a day).
set -euo pipefail
: "${SLUG:?set SLUG to the handle you want, e.g. SLUG=acme-agent}"

npm i -g @clize/clize
clize install --claude            # or --codex / --pi / --openclaw; add --mcp for the MCP server too
clize check || clize login        # first login creates the account

clize claim "$SLUG" --email       # → https://$SLUG.clize.app + support@$SLUG.clize.app
clize init --handle "$SLUG"       # bind this folder so inbox/send/deploy need no arguments

# A freshly opened mailbox can miss mail for its first ~30 s (measured 2026-10-01). Give it a minute.
echo "Waiting 60 s before using support@$SLUG.clize.app anywhere…"; sleep 60

echo "Now sign up for a service with support@$SLUG.clize.app (or let your agent do it)."
echo "Waiting up to 5 minutes for a mail containing \"verif\"…"
out=$(clize email inbox --wait-for "verif" --timeout 300)
echo "$out"
if [ "$out" = "[]" ]; then
  echo "Nothing arrived. A timeout returns [] (exit 0): ask the service for a new code rather than waiting longer." >&2
  exit 1
fi
