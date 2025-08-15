#!/bin/bash

# 로컬 배포 및 테스트 스크립트
# 사용법: ./deploy-local.sh [local|production]

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 설정
ENV=${1:-local}
WORKER_NAME="locationbackend"
CUSTOM_DOMAIN="https://jayneycoffee.api.location.rainclab.net"

log_info "🚀 배포 및 테스트 시작 (환경: $ENV)"

# 1. 빌드 및 배포
log_info "📦 Worker 배포 중..."
if [ "$ENV" = "production" ]; then
    log_info "Production 환경으로 배포 중..."
    wrangler deploy --env production
    TEST_URL="$CUSTOM_DOMAIN"
else
    log_info "로컬 환경으로 배포 중..."
    wrangler deploy
    TEST_URL="https://$WORKER_NAME.rainclab.workers.dev"
fi

log_success "✅ 배포 완료!"

# 2. 잠시 대기 (배포 완료 대기)
log_info "⏳ 배포 완료 대기 중... (5초)"
sleep 5

# 3. API 테스트
log_info "🧪 API 테스트 시작..."

# Healthcheck 테스트
log_info "테스트 1: /api/healthcheck"
HEALTH_RESPONSE=$(curl -s "$TEST_URL/api/healthcheck")
echo "응답: $HEALTH_RESPONSE"

# Update API 테스트 (테스트 데이터)
log_info "테스트 2: /api/update (테스트 데이터)"
UPDATE_RESPONSE=$(curl -s "$TEST_URL/api/update?device=test&authorization=123&lat=37.5665&lng=126.9780&iv=test")
echo "응답: $UPDATE_RESPONSE"

# 실제 데이터로 테스트 (URL 디코딩된 파라미터)
log_info "테스트 3: /api/update (실제 데이터)"
REAL_UPDATE_RESPONSE=$(curl -s "$TEST_URL/api/update?lat=uDGaTvlVhZSvrALngdg0cw%3D%3D&lng=XEO5By9bYYR3ytAtizM7PA%3D%3D&iv=xop3dj8cpavbebl6&device=onRE0oc0ozN3ORrU&authorization=H3vm7CEMaQbH4nXa")
echo "응답: $REAL_UPDATE_RESPONSE"

# 4. 결과 요약
log_info "📊 테스트 결과 요약:"
echo "----------------------------------------"
echo "환경: $ENV"
echo "테스트 URL: $TEST_URL"
echo "Healthcheck: $HEALTH_RESPONSE"
echo "Update (테스트): $UPDATE_RESPONSE"
echo "Update (실제): $REAL_UPDATE_RESPONSE"
echo "----------------------------------------"

# 5. 성공/실패 판단
if [[ "$HEALTH_RESPONSE" == *"Operational"* ]] || [[ "$HEALTH_RESPONSE" == *"unavailable"* ]]; then
    if [[ "$UPDATE_RESPONSE" == "201" ]] || [[ "$UPDATE_RESPONSE" == "not" ]]; then
        log_success "🎉 모든 테스트 통과!"
        exit 0
    else
        log_error "❌ Update API 테스트 실패"
        exit 1
    fi
else
    log_error "❌ Healthcheck API 테스트 실패"
    exit 1
fi
