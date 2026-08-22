#!/bin/bash
# deploy.sh - 미니PC에서 실행되는 자동 배포 스크립트
# 위치: ~/doljanchi-invitation/deploy.sh

set -e

REPO_DIR="$HOME/doljanchi-invitation"
LOG_FILE="$REPO_DIR/deploy.log"
IMAGE_NAME="doljanchi-invitation"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "🚀 배포 시작"

cd "$REPO_DIR"

# 최신 코드 pull
log "📥 git pull..."
git pull origin main

# Docker 이미지 빌드
log "🔨 Docker 이미지 빌드..."
docker build -t "$IMAGE_NAME:latest" .

# 컨테이너 재시작
log "🔄 컨테이너 재시작..."
docker compose down
docker compose up -d

# 오래된 이미지 정리
docker image prune -f

log "✅ 배포 완료"
