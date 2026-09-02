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
HERO_REL="client/public/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png"
BGM_REL="client/public/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3"
# The original AI-generated MP3 was never preserved. Use a stable public-domain
# Chopin waltz recording for the intended luxury-hotel / banquet-hall mood.
BGM_URL="https://commons.wikimedia.org/wiki/Special:Redirect/file/Waltz_Op._69_no._1_in_A_flat_major.mp3"

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

# The original cake hero is a real Git blob in the approved revision. Extract it
# explicitly so a public-asset copy regression can never silently remove it.
log "🎂 Restoring original cake hero from frozen Git blob..."
mkdir -p "$(dirname "$BUILD_DIR/$HERO_REL")"
git show "$FROZEN_SHA:$HERO_REL" > "$BUILD_DIR/$HERO_REL"
test -s "$BUILD_DIR/$HERO_REL"

# The first AI-generated BGM was not preserved as a Git blob. Restore a stable,
# public-domain classical waltz matching the original luxury hotel direction.
log "🎼 Restoring luxury-hotel BGM..."
mkdir -p "$(dirname "$BUILD_DIR/$BGM_REL")"
curl -fL --retry 3 --retry-delay 2 --connect-timeout 15 \
  "$BGM_URL" \
  -o "$BUILD_DIR/$BGM_REL"
test -s "$BUILD_DIR/$BGM_REL"

# Keep server secrets/config local to the Mini PC while using the frozen compose definition.
if [ ! -f "$REPO_DIR/.env" ]; then
  log "❌ Missing $REPO_DIR/.env; refusing to deploy"
  exit 1
fi
cp "$REPO_DIR/.env" "$BUILD_DIR/.env"
chmod 600 "$BUILD_DIR/.env"

log "🔨 Building immutable Docker image..."
docker build -t "$IMAGE_NAME:latest" "$BUILD_DIR"

# Refuse to deploy unless both assets actually made it through Vite into the runtime image.
log "🔎 Verifying cake hero and BGM inside Docker image..."
docker run --rm --entrypoint sh "$IMAGE_NAME:latest" -c \
  'test -s /app/dist/public/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png && test -s /app/dist/public/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3'

log "🔄 Restarting frozen production container..."
docker compose -p "$PROJECT_NAME" -f "$BUILD_DIR/docker-compose.yml" down
docker compose -p "$PROJECT_NAME" -f "$BUILD_DIR/docker-compose.yml" up -d

# Verify the exact public URLs before declaring success.
log "🌐 Verifying live static assets..."
for attempt in 1 2 3 4 5; do
  if curl -fsS --max-time 5 "http://127.0.0.1:3001/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png" >/dev/null \
    && curl -fsS --max-time 5 "http://127.0.0.1:3001/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3" >/dev/null; then
    log "✅ Cake hero and BGM are publicly reachable"
    break
  fi
  if [ "$attempt" -eq 5 ]; then
    log "❌ Static asset verification failed; refusing to report deployment success"
    exit 1
  fi
  sleep 2
done

docker image prune -f
log "✅ Frozen invitation deployment complete: $FROZEN_SHA"
