#!/usr/bin/env bash
# Produce a Vercel Build Output API bundle (.vercel/output) for this site, then
# deploy it with:  bunx vercel deploy --prebuilt
#
# Why Build Output API instead of Vercel's Vite/framework detection:
#  - TanStack Start emits a host-agnostic fetch handler (dist/server/server.js)
#    that dynamic-imports its own ./assets chunks and externalizes node deps.
#    Letting Vercel trace/detect that is fragile.
#  - Bundling it into one self-contained file (deps + dynamic chunks inlined) in a
#    single render.func removes all tracing/detection risk. vercel-entry.ts adapts
#    the Node (req,res) launcher to the web fetch handler.
set -euo pipefail
cd "$(dirname "$0")"
umask 002

echo "[1/3] vite build (light — safe under the sandbox memory cap)"
# The workspace starts as sources only (deps live with the image's pre-built
# placeholder copy); no-op once node_modules is current.
bun install
bun run build

OUTDIR="${1:-vercel-out}"

echo "[2/3] assemble $OUTDIR (Build Output API v3)"
rm -rf "$OUTDIR"
mkdir -p "$OUTDIR/functions/render.func"
cp -R dist/client "$OUTDIR/static"
rm -f "$OUTDIR/static/index.html"

echo "[3/3] bundle SSR handler + deps into the render function"
# Embed runtime env vars directly into the bundle via --define flags
DEFINE_ARGS=""
if [ -n "${DATABASE_URL:-}" ]; then
  DEFINE_ARGS="$DEFINE_ARGS --define 'process.env.DATABASE_URL:\"$DATABASE_URL\"'"
fi
if [ -n "${JWT_SECRET:-}" ]; then
  DEFINE_ARGS="$DEFINE_ARGS --define 'process.env.JWT_SECRET:\"$JWT_SECRET\"'"
fi
eval bun build vercel-entry.ts --target node \
  --outfile "$OUTDIR/functions/render.func/index.mjs" $DEFINE_ARGS

cat > "$OUTDIR/functions/render.func/.vc-config.json" <<JSON
{ "runtime": "nodejs22.x", "handler": "index.mjs", "launcherType": "Nodejs", "supportsResponseStreaming": true }
JSON
cat > "$OUTDIR/config.json" <<'JSON'
{ "version": 3, "routes": [ { "handle": "filesystem" }, { "src": "/(.*)", "dest": "/render" } ] }
JSON

echo "done -> $OUTDIR ready"
