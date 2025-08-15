#!/bin/bash

# 종합 테스트 스크립트 - 데이터 생성부터 확인까지
# 사용법: ./comprehensive-test.sh [local|production]

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

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 설정
ENV=${1:-local}
TEST_URL="http://localhost:8787"

log_info "🚀 단순화된 테스트 시작 (환경: $ENV)"
echo ""

# 1단계: 기본 API 테스트
log_info "📋 1단계: 기본 API 테스트"
echo "----------------------------------------"

# Healthcheck 테스트
log_info "1.1 /api/healthcheck 테스트"
HEALTH_RESPONSE=$(curl -s "$TEST_URL/api/healthcheck")
echo "   응답: $HEALTH_RESPONSE"
echo ""

# 2단계: 기기 등록
log_info "📋 2단계: 기기 등록"
echo "----------------------------------------"

# 테스트 데이터
TEST_DEVICE="test$(date +%s | tail -c 8)"
TEST_AUTH="auth$(date +%s | tail -c 8)"

# 기기 등록
log_info "2.1 기기 등록"
REGISTER_RESPONSE=$(curl -s "$TEST_URL/api/device/register?device=$TEST_DEVICE&authorization=$TEST_AUTH&shareControlKey=test123")
echo "   응답: $REGISTER_RESPONSE"
echo ""

# 3단계: 결과 요약
log_info "📋 3단계: 테스트 결과 요약"
echo "========================================"
echo "환경: $ENV"
echo "테스트 URL: $TEST_URL"
echo "테스트 기기: $TEST_DEVICE"
echo "테스트 인증: $TEST_AUTH"
echo "----------------------------------------"
echo "Healthcheck: $HEALTH_RESPONSE"
echo "기기 등록: $REGISTER_RESPONSE"
echo "========================================"

# 4단계: 성공/실패 판단 (단순화)
log_info "📋 4단계: 테스트 결과 판단"
echo "----------------------------------------"

SUCCESS_COUNT=0
TOTAL_TESTS=2

log_info "디버깅: TOTAL_TESTS = $TOTAL_TESTS"

# Healthcheck 확인
log_info "디버깅: Healthcheck 응답 = '$HEALTH_RESPONSE'"
if [[ "$HEALTH_RESPONSE" == *"success"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "Healthcheck: 통과 (SUCCESS_COUNT = $SUCCESS_COUNT)"
else
    log_error "Healthcheck: 실패"
fi

# 기기 등록 확인
log_info "디버깅: 기기 등록 응답 = '$REGISTER_RESPONSE'"
if [[ "$REGISTER_RESPONSE" == *"Success"* ]]; then
    ((SUCCESS_COUNT++))
    log_success "기기 등록: 통과 (SUCCESS_COUNT = $SUCCESS_COUNT)"
else
    log_error "기기 등록: 실패"
fi

echo ""
echo "========================================"
echo "테스트 결과: $SUCCESS_COUNT/$TOTAL_TESTS 통과"
echo "========================================"

log_info "디버깅: 최종 SUCCESS_COUNT = $SUCCESS_COUNT, TOTAL_TESTS = $TOTAL_TESTS"

if [ $SUCCESS_COUNT -eq $TOTAL_TESTS ]; then
    log_success "🎉 모든 테스트 통과!"
    log_info "디버깅: exit 0으로 종료"
    exit 0
else
    log_error "❌ 일부 테스트 실패"
    log_info "디버깅: exit 1로 종료"
    exit 1
fi
