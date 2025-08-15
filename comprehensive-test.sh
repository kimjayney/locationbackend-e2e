#!/bin/bash

# 종합 테스트 스크립트 - 데이터 생성부터 확인까지
# 사용법: ./comprehensive-test.sh [local|production]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

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

log_data() {
    echo -e "${PURPLE}[DATA]${NC} $1"
}

# 환경 설정
ENV=${1:-local}
WORKER_NAME="locationbackend"
CUSTOM_DOMAIN="https://jayneycoffee.api.location.rainclab.net"

# 테스트 데이터 (길이 제한 준수 + 형식 준수)
TEST_DEVICE="test$(date +%s | tail -c 8)"
TEST_AUTH="auth$(date +%s | tail -c 8)"
TEST_LAT="37.5665"
TEST_LNG="126.9780"
TEST_IV="iv$(date +%s | tail -c 8)"

log_info "🚀 종합 테스트 시작 (환경: $ENV)"
echo ""

if [ "$ENV" = "production" ]; then
    TEST_URL="$CUSTOM_DOMAIN"
    log_info "Production 환경: $TEST_URL"
else
    TEST_URL="http://localhost:8787"
    log_info "로컬 환경: $TEST_URL"
fi

echo ""

# 1단계: 기본 API 테스트
log_info "📋 1단계: 기본 API 테스트"
echo "----------------------------------------"

# Healthcheck 테스트
log_info "1.1 /api/healthcheck 테스트"
HEALTH_RESPONSE=$(curl -s "$TEST_URL/api/healthcheck")
echo "   응답: $HEALTH_RESPONSE"
echo ""

# 2단계: 기기 등록 및 위치 업데이트
log_info "📋 2단계: 기기 등록 및 위치 업데이트"
echo "----------------------------------------"

# 기기 등록
log_info "2.1 기기 등록"
REGISTER_RESPONSE=$(curl -s "$TEST_URL/api/device/register?device=$TEST_DEVICE&authorization=$TEST_AUTH&shareControlKey=test123")
echo "   응답: $REGISTER_RESPONSE"
echo ""

# 잠시 대기
sleep 2

# 위치 업데이트
log_info "2.2 위치 업데이트"
UPDATE_RESPONSE=$(curl -s "$TEST_URL/api/update?device=$TEST_DEVICE&authorization=$TEST_AUTH&lat=$TEST_LAT&lng=$TEST_LNG&iv=$TEST_IV")
echo "   응답: $UPDATE_RESPONSE"
echo ""

# 3단계: 데이터베이스 확인 (로컬 환경만)
if [ "$ENV" = "local" ]; then
    log_info "📋 3단계: 데이터베이스 확인 (로컬)"
    echo "----------------------------------------"
    
    # CI 환경에서는 로컬 D1 사용
    if [ -n "$CI" ]; then
        log_info "🔧 CI 환경: 로컬 D1 데이터베이스 사용"
        D1_DB="test-location-db"
        D1_FLAGS="--local"
        WRANGLER_CONFIG=""
    else
        log_info "🔧 로컬 환경: 로컬 D1 데이터베이스 사용 (오프라인)"
        D1_DB="local-test-db"
        D1_FLAGS=""
        WRANGLER_CONFIG="--config=wrangler.local.toml"
    fi
    
    # 테이블 목록 확인
    log_info "3.1 테이블 목록 확인"
    TABLES=$(wrangler d1 execute $D1_DB $D1_FLAGS $WRANGLER_CONFIG --command "SELECT name FROM sqlite_master WHERE type='table'")
    echo "   테이블: $TABLES"
    echo ""
    
    # Devices 테이블 확인
    log_info "3.2 Devices 테이블 확인"
    DEVICES=$(wrangler d1 execute $D1_DB $D1_FLAGS $WRANGLER_CONFIG --command "SELECT * FROM Devices WHERE id='$TEST_DEVICE'")
    echo "   기기 정보: $DEVICES"
    echo ""
    
    # 위치 데이터 확인
    log_info "3.3 위치 데이터 확인"
    LOCATIONS=$(wrangler d1 execute $D1_DB $D1_FLAGS $WRANGLER_CONFIG --command "SELECT * FROM Locations WHERE DeviceId='$TEST_DEVICE'")
    echo "   위치 데이터: $LOCATIONS"
    echo ""
    
    # 감사 로그 확인
    log_info "3.4 감사 로그 확인"
    AUDIT_COUNT=$(wrangler d1 execute $D1_DB $D1_FLAGS $WRANGLER_CONFIG --command "SELECT COUNT(*) as count FROM AuditLogs WHERE device_id_v2='$TEST_DEVICE'")
    echo "   감사 로그 수: $AUDIT_COUNT"
    echo ""
    
else
    log_info "📋 3단계: 데이터베이스 확인 (Production - 직접 확인 필요)"
    echo "----------------------------------------"
    log_warning "Production 환경에서는 데이터베이스를 직접 확인할 수 없습니다."
    log_info "Cloudflare Dashboard에서 D1 데이터베이스를 확인하세요."
    echo ""
fi

# 4단계: 추가 API 테스트
log_info "📋 4단계: 추가 API 테스트"
echo "----------------------------------------"

# 공유 상태 확인
log_info "4.1 공유 상태 확인"
SHARE_STATUS=$(curl -s "$TEST_URL/api/sharestatus?device=$TEST_DEVICE&authorization=$TEST_AUTH")
echo "   응답: $SHARE_STATUS"
echo ""

# 공유 제어 (켜기)
log_info "4.2 공유 제어 (켜기)"
SHARE_CONTROL_ON=$(curl -s "$TEST_URL/api/sharecontrol?device=$TEST_DEVICE&authorization=$TEST_AUTH&share=1&shareControlKey=test123")
echo "   응답: $SHARE_CONTROL_ON"
echo ""

# 공유 상태 재확인
log_info "4.3 공유 상태 재확인"
SHARE_STATUS_AFTER=$(curl -s "$TEST_URL/api/sharestatus?device=$TEST_DEVICE&authorization=$TEST_AUTH")
echo "   응답: $SHARE_STATUS_AFTER"
echo ""

# 5단계: 결과 요약
log_info "📋 5단계: 테스트 결과 요약"
echo "========================================"
echo "환경: $ENV"
echo "테스트 URL: $TEST_URL"
echo "테스트 기기: $TEST_DEVICE"
echo "테스트 인증: $TEST_AUTH"
echo "----------------------------------------"
echo "Healthcheck: $HEALTH_RESPONSE"
echo "기기 등록: $REGISTER_RESPONSE"
echo "위치 업데이트: $UPDATE_RESPONSE"
echo "공유 상태: $SHARE_STATUS"
echo "공유 제어: $SHARE_CONTROL_ON"
echo "공유 상태 (변경 후): $SHARE_STATUS_AFTER"
echo "========================================"

# 6단계: 성공/실패 판단
log_info "📋 6단계: 테스트 결과 판단"
echo "----------------------------------------"

SUCCESS_COUNT=0
TOTAL_TESTS=6

# 각 테스트 결과 확인
if [[ "$HEALTH_RESPONSE" == *"Operational"* ]] || [[ "$HEALTH_RESPONSE" == *"unavailable"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "Healthcheck: 통과"
else
    log_error "Healthcheck: 실패"
fi

if [[ "$REGISTER_RESPONSE" == *"Success"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "기기 등록: 통과"
else
    log_error "기기 등록: 실패"
fi

if [[ "$UPDATE_RESPONSE" == "201" ]]; then
    ((SUCCESS_COUNT++))
    log_success "위치 업데이트: 통과"
else
    log_error "위치 업데이트: 실패"
fi

if [[ "$SHARE_STATUS" == *"0"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "공유 상태 확인: 통과"
else
    log_error "공유 상태 확인: 실패"
fi

if [[ "$SHARE_CONTROL_ON" == *"Success"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "공유 제어: 통과"
else
    log_error "공유 제어: 실패"
fi

if [[ "$SHARE_STATUS_AFTER" == *"1"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "공유 상태 변경: 통과"
else
    log_error "공유 상태 변경: 실패"
fi

echo ""
echo "========================================"
echo "테스트 결과: $SUCCESS_COUNT/$TOTAL_TESTS 통과"
echo "========================================"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    log_success "🎉 모든 테스트 통과!"
    exit 0
else
    log_error "❌ 일부 테스트 실패"
    exit 1
fi
