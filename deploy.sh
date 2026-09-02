#!/bin/bash
# deploy.sh - Mini PC production deployment
# IMPORTANT: Production is permanently pinned to the owner-approved invitation revision.

set -euo pipefail

REPO_DIR="$HOME/doljanchi-invitation"
LOG_FILE="$REPO_DIR/deploy.log"
IMAGE_NAME="doljanchi-invitation"
PROJECT_NAME="doljanchi-invitation"
FROZEN_SHA="fb901585f065adbe70210c45a7449c5aaa600a9a"
BUILD_DIR="$REPO_DIR/.frozen-production-build"
BGM_URL="https://cdn.pixabay.com/download/audio/2024/02/27/audio_f76c4a5d60.mp3?filename=lorenzobuczek-breton-lullaby-berceuse-bretonne-193499.mp3"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

log "🚀 Frozen invitation deployment started"
cd "$REPO_DIR"

# Fetch objects only. Never pull/reset/checkout main for production.
log "📥 Fetching owner-approved revision $FROZEN_SHA..."
git fetch --no-tags origin "$FROZEN_SHA"
git cat-file -e "$FROZEN_SHA^{commit}"

# Export the exact approved source into an isolated build context so future main changes
# cannot affect the live invitation even if this script is executed automatically.
log "🔒 Preparing immutable production source..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
git archive "$FROZEN_SHA" | tar -x -C "$BUILD_DIR"

# Restore the local BGM into the exact build context. The app also carries a remote
# source fallback so playback can recover even if this download is unavailable later.
mkdir -p "$BUILD_DIR/client/public/manus-storage"
curl -fL --retry 3 --retry-delay 2 --connect-timeout 15 \
  "$BGM_URL" \
  -o "$BUILD_DIR/client/public/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3"
test -s "$BUILD_DIR/client/public/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3"

# Keep server secrets/config local to the Mini PC while using the frozen compose definition.
if [ ! -f "$REPO_DIR/.env" ]; then
  log "❌ Missing $REPO_DIR/.env; refusing to deploy"
  exit 1
fi
cp "$REPO_DIR/.env" "$BUILD_DIR/.env"
chmod 600 "$BUILD_DIR/.env"

log "🔨 Building immutable Docker image..."
docker build -t "$IMAGE_NAME:latest" "$BUILD_DIR"

log "🔄 Restarting frozen production container..."
docker compose -p "$PROJECT_NAME" -f "$BUILD_DIR/docker-compose.yml" down
docker compose -p "$PROJECT_NAME" -f "$BUILD_DIR/docker-compose.yml" up -d

docker image prune -f
log "✅ Frozen invitation deployment complete: $FROZEN_SHA"
