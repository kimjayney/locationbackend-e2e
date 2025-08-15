#!/bin/bash

# 데이터베이스 데이터 확인 전용 스크립트
# 사용법: ./check-data.sh [device_id]

set -e

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_data() {
    echo -e "${PURPLE}[DATA]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 기기 ID 설정 (파라미터로 받거나 기본값 사용)
DEVICE_ID=${1:-"onRE0oc0ozN3ORrU"}

log_info "🔍 데이터베이스 데이터 확인 시작"
echo "확인 대상 기기: $DEVICE_ID"
echo ""

# 1. 테이블 목록 확인
log_info "📋 1. 테이블 목록 확인"
echo "----------------------------------------"
TABLES=$(wrangler d1 execute jennycoffee_location --command "SELECT name FROM sqlite_master WHERE type='table'")
echo "$TABLES"
echo ""

# 2. Devices 테이블 전체 확인
log_info "📋 2. Devices 테이블 전체 데이터"
echo "----------------------------------------"
DEVICES_ALL=$(wrangler d1 execute jennycoffee_location --command "SELECT id, is_enabled, authorization, created_at, expired_at, share_location, shareControlKey FROM Devices")
echo "$DEVICES_ALL"
echo ""

# 3. 특정 기기 정보 확인
log_info "📋 3. 특정 기기 정보 ($DEVICE_ID)"
echo "----------------------------------------"
DEVICE_INFO=$(wrangler d1 execute jennycoffee_location --command "SELECT * FROM Devices WHERE id = '$DEVICE_ID'")
if [ -z "$DEVICE_INFO" ] || [[ "$DEVICE_INFO" == *"0 rows"* ]]; then
    log_warning "기기를 찾을 수 없습니다: $DEVICE_ID"
else
    echo "$DEVICE_INFO"
fi
echo ""

# 4. 기기별 위치 테이블 존재 확인
log_info "📋 4. 기기별 위치 테이블 존재 확인"
echo "----------------------------------------"
LOCATION_TABLE=$(wrangler d1 execute jennycoffee_location --command "SELECT name FROM sqlite_master WHERE type='table' AND name = 'Locations_$DEVICE_ID'")
if [ -z "$LOCATION_TABLE" ] || [[ "$LOCATION_TABLE" == *"0 rows"* ]]; then
    log_warning "위치 테이블이 존재하지 않습니다: Locations_$DEVICE_ID"
else
    log_success "위치 테이블 존재: Locations_$DEVICE_ID"
fi
echo ""

# 5. 위치 데이터 확인
log_info "📋 5. 위치 데이터 확인 ($DEVICE_ID)"
echo "----------------------------------------"
LOCATIONS=$(wrangler d1 execute jennycoffee_location --command "SELECT * FROM Locations_$DEVICE_ID")
if [ -z "$LOCATIONS" ] || [[ "$LOCATIONS" == *"0 rows"* ]]; then
    log_warning "위치 데이터가 없습니다"
else
    echo "$LOCATIONS"
fi
echo ""

# 6. 감사 로그 확인
log_info "📋 6. 감사 로그 확인 ($DEVICE_ID)"
echo "----------------------------------------"
AUDIT_LOGS=$(wrangler d1 execute jennycoffee_location --command "SELECT id, query, created_at, device_id_v2 FROM AuditLogs WHERE device_id_v2 = '$DEVICE_ID' ORDER BY created_at DESC LIMIT 5")
if [ -z "$AUDIT_LOGS" ] || [[ "$AUDIT_LOGS" == *"0 rows"* ]]; then
    log_warning "감사 로그가 없습니다"
else
    echo "$AUDIT_LOGS"
fi
echo ""

# 7. 전체 감사 로그 수 확인
log_info "📋 7. 전체 감사 로그 통계"
echo "----------------------------------------"
AUDIT_COUNT=$(wrangler d1 execute jennycoffee_location --command "SELECT COUNT(*) as total_count FROM AuditLogs")
echo "전체 감사 로그 수: $AUDIT_COUNT"
echo ""

# 8. 최근 감사 로그 (최대 10개)
log_info "📋 8. 최근 감사 로그 (최대 10개)"
echo "----------------------------------------"
RECENT_AUDIT=$(wrangler d1 execute jennycoffee_location --command "SELECT id, device_id_v2, created_at, SUBSTR(query, 1, 100) as query_preview FROM AuditLogs ORDER BY created_at DESC LIMIT 10")
echo "$RECENT_AUDIT"
echo ""

# 9. 데이터 요약
log_info "📋 9. 데이터 요약"
echo "========================================"
echo "확인 대상 기기: $DEVICE_ID"
echo "테이블 수: $(echo "$TABLES" | grep -c "│")"
echo "전체 기기 수: $(echo "$DEVICES_ALL" | grep -c "│")"
echo "위치 데이터 수: $(echo "$LOCATIONS" | grep -c "│")"
echo "감사 로그 수: $(echo "$AUDIT_COUNT" | grep -o '[0-9]*')"
echo "========================================"

log_success "✅ 데이터 확인 완료!"
