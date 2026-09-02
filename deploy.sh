#!/bin/bash
# deploy.sh - Mini PC production deployment
# IMPORTANT: Production is permanently pinned to the owner-approved invitation revision.

set -euo pipefail

REPO_DIR="$HOME/doljanchi-invitation"
LOG_FILE="$REPO_DIR/deploy.log"
IMAGE_NAME="doljanchi-invitation"
PROJECT_NAME="doljanchi-invitation"
FROZEN_SHA="e1a25f6647d0d86de12808ecdfba07b2572a184a"
BUILD_DIR="$REPO_DIR/.frozen-production-build"
HERO_REL="client/public/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png"
BGM_REL="client/public/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3"
# The original AI-generated MP3 was never preserved. Use the elegant public-domain
# Blue Danube waltz recording (CC0 via Wikimedia Commons / Musopen) for a refined
# luxury-hotel banquet mood.
BGM_URL="https://upload.wikimedia.org/wikipedia/commons/transcoded/9/91/Strauss%2C_An_der_sch%C3%B6nen_blauen_Donau.ogg/Strauss%2C_An_der_sch%C3%B6nen_blauen_Donau.ogg.mp3"

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

# Restore the approved luxury-hotel waltz locally so playback does not depend on a
# third-party request after the site has loaded.
log "🎼 Restoring Blue Danube luxury-hotel waltz..."
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

# Verify the exact public URLs before declaring success. The server preserves the full
# nested /manus-storage path, and the client uses cache-busting query strings for mobile.
log "🌐 Verifying live static assets..."
for attempt in 1 2 3 4 5 6 7 8; do
  if curl -fsS --max-time 5 "http://127.0.0.1:3001/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png?v=20260903-mobile-hero-2" >/dev/null \
    && curl -fsS --max-time 5 "http://127.0.0.1:3001/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3?v=20260903-blue-danube-2" >/dev/null; then
    log "✅ Mobile cake hero and Blue Danube BGM are publicly reachable"
    break
  fi
  if [ "$attempt" -eq 8 ]; then
    log "❌ Static asset verification failed; container logs follow"
    docker logs --tail 80 "$PROJECT_NAME" 2>&1 | tee -a "$LOG_FILE" || true
    exit 1
  fi
  sleep 2
done

docker image prune -f
log "✅ Frozen invitation deployment complete: $FROZEN_SHA"
