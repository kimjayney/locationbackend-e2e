# Location Backend E2E

Cloudflare Workers를 사용한 위치 기반 백엔드 서비스

## 🚀 빠른 시작

### 개발 서버 실행
```bash
npm run start
```

### 배포
```bash
# 로컬 환경 배포
npm run deploy

# Production 환경 배포
npm run deploy:prod
```

## 🧪 테스트

### 기본 테스트
```bash
# 로컬 환경 테스트
npm run test:local

# Production 환경 테스트
npm run test:prod
```

### 배포 + 테스트 (한 번에)
```bash
# 로컬 환경 배포 + 테스트
npm run deploy:test:local

# Production 환경 배포 + 테스트
npm run deploy:test:prod
```

### 종합 테스트 (데이터 생성부터 확인까지)
```bash
# 로컬 환경 종합 테스트
npm run comprehensive:local

# Production 환경 종합 테스트
npm run comprehensive:prod
```

### 데이터베이스 데이터 확인
```bash
# 기본 기기 데이터 확인
npm run check:data

# 특정 기기 데이터 확인
npm run check:data:device [device_id]
```

## 🔄 CI/CD (GitHub Actions)

### **자동 배포 및 테스트**

Main 브랜치에 push할 때마다 자동으로:
1. ✅ **로컬 환경 테스트 실행**
2. ✅ **Production 환경 배포**
3. ✅ **Production 환경 테스트 실행**
4. ✅ **데이터베이스 검증**

### **워크플로우 파일**
- `.github/workflows/deploy-on-main.yml` - 자동 배포 및 테스트
- `.github/workflows/test-on-push.yml` - 테스트 전용

### **설정 방법**
1. GitHub Secrets 설정:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
2. Main 브랜치에 push하면 자동 실행
3. [GitHub Actions 설정 가이드](.github/README.md) 참조

## 📁 스크립트 파일

- `deploy-test.sh` - 배포 후 자동 테스트 실행
- `test-only.sh` - 테스트만 실행
- `comprehensive-test.sh` - 종합 테스트 (API + 데이터베이스)
- `check-data.sh` - 데이터베이스 데이터 확인

## 🔧 수동 실행

```bash
# 배포 + 테스트
./deploy-test.sh [local|production]

# 테스트만
./test-only.sh [local|production]

# 종합 테스트
./comprehensive-test.sh [local|production]

# 데이터 확인
./check-data.sh [device_id]
```

## 🌐 API 엔드포인트

- `/api/healthcheck` - 서비스 상태 확인
- `/api/update` - 위치 정보 업데이트
- `/api/device/register` - 기기 등록
- `/api/view` - 위치 정보 조회
- `/api/sharestatus` - 공유 상태 확인
- `/api/sharecontrol` - 공유 제어

## 📊 환경별 URL

- **로컬**: `https://locationbackend.rainclab.workers.dev`
- **Production**: `https://jayneycoffee.api.location.rainclab.net`

## 🗄️ 데이터베이스 확인 (로컬)

### 테이블 구조
- `Devices` - 기기 정보
- `Locations_{device_id}` - 기기별 위치 데이터
- `AuditLogs` - 감사 로그

### 데이터 확인 명령어
```bash
# 테이블 목록
wrangler d1 execute jennycoffee_location --command "SELECT name FROM sqlite_master WHERE type='table'"

# 기기 정보
wrangler d1 execute jennycoffee_location --command "SELECT * FROM Devices"

# 위치 데이터
wrangler d1 execute jennycoffee_location --command "SELECT * FROM Locations_{device_id}"

# 감사 로그
wrangler d1 execute jennycoffee_location --command "SELECT * FROM AuditLogs"
```
