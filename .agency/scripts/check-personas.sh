#!/usr/bin/env bash
# check-personas.sh — Design Agency gate for the "≥1 net-new persona per ask" rule.
#
# The /SDLC-design orchestrator (Design Director) MUST run this before PRESENTing options.
# It reads the persona ledger and verifies the relevant ask row declares at least one
# net-new persona (a non-empty "Net-new (this ask)" column). Exits non-zero on failure
# so the orchestrator stops and adds a fresh lens instead of shipping look-alike options.
#
# Usage:
#   check-personas.sh [LEDGER] [--ask "<ask text>"]
#     LEDGER       path to design-personas.md (default: state/design-personas.md)
#     --ask TEXT   check the row whose "Ask" contains TEXT (default: latest data row)
#
# Exit: 0 ok · 1 gate failed · 2 usage/IO error
set -euo pipefail

LEDGER="state/design-personas.md"
ASK=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ask) ASK="${2:-}"; shift 2 ;;
    --ask=*) ASK="${1#--ask=}"; shift ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) LEDGER="$1"; shift ;;
  esac
done

[ -f "$LEDGER" ] || { echo "✗ ledger not found: $LEDGER" >&2; exit 2; }

# Pull data rows from the Roster table: markdown rows with >=4 pipe-delimited cells,
# excluding the header (| Date |), the separator (|---|), and the _e.g._ example row.
# bash 3.2 (macOS) has no mapfile/negative-index, so we loop and track last + match.
COUNT=0
TARGET=""
LAST=""
while IFS= read -r r; do
  COUNT=$((COUNT + 1))
  LAST="$r"
  if [ -n "$ASK" ]; then
    case "$r" in *"$ASK"*) TARGET="$r" ;; esac
  fi
done < <(grep -E '^\|' "$LEDGER" \
  | grep -vE '^\|[[:space:]]*Date' \
  | grep -vE '^\|[[:space:]]*-' \
  | grep -viE '_e\.g\._|_\(none')

if [ "$COUNT" -eq 0 ]; then
  # No design asks recorded yet. With --ask (a live /SDLC-design run presenting options) this is a
  # failure — the ask must be logged first. Without --ask (a maintainer/`make check` run on a
  # clean ledger) there is simply nothing to enforce yet, so the gate is idle and passes.
  if [ -z "$ASK" ]; then
    echo "✓ no design asks recorded yet — persona gate idle (enforced per-ask during /SDLC-design runs)."
    exit 0
  fi
  echo "✗ no design asks recorded in $LEDGER — append this ask's roster row before presenting." >&2
  exit 1
fi

# Choose the row to check: matching --ask, else the last (most recent) data row.
if [ -n "$ASK" ]; then
  [ -n "$TARGET" ] || { echo "✗ no ledger row matches ask: \"$ASK\" — append it before presenting." >&2; exit 1; }
else
  TARGET="$LAST"
fi

# Column 4 = "Net-new (this ask)". Split on '|' (cell 1 is empty due to leading pipe).
IFS='|' read -r _ c_date c_ask c_fielded c_netnew _rest <<< "$TARGET"
trim() { echo "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//'; }
netnew="$(trim "${c_netnew:-}")"
askname="$(trim "${c_ask:-}")"

if [ -z "$netnew" ] || [ "$netnew" = "—" ] || [ "$netnew" = "-" ]; then
  echo "✗ GATE FAILED: ask \"$askname\" declares no net-new persona." >&2
  echo "  Field at least one fresh lens (not used in a prior row) and fill the" >&2
  echo "  'Net-new (this ask)' column before presenting options." >&2
  exit 1
fi

echo "✓ ask \"$askname\" fields net-new persona(s): $netnew"
