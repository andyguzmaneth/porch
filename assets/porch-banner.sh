#!/usr/bin/env bash
# Porch startup banner. Amber on an interactive TTY; plain text otherwise
# (the Redis rule: no color art in logs / non-TTY / NO_COLOR).
here="$(cd "$(dirname "$0")" && pwd)"
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  printf '\033[38;2;242;169;59m'      # amber
  cat "$here/porch-banner.txt"
  printf '\033[0m'
else
  cat "$here/porch-banner.txt"
fi
