# 로컬에서 GitHub Actions 실행하기

## 🚀 act를 사용한 로컬 GitHub Actions 실행

### **1. 사전 요구사항**

#### **필수 도구:**
- ✅ **act**: GitHub Actions 로컬 실행 도구
- ✅ **Docker**: 컨테이너 실행 환경
- ✅ **Node.js**: 애플리케이션 실행 환경

#### **설치 방법:**
```bash
# act 설치
brew install act

# Docker Desktop 설치 (macOS)
# https://www.docker.com/products/docker-desktop/ 에서 다운로드

# Node.js 확인
node --version
npm --version
```

### **2. Docker Desktop 시작**

1. **Docker Desktop 실행**
   - Applications 폴더에서 Docker Desktop 실행
   - 또는 Spotlight (Cmd+Space)에서 "Docker" 검색

2. **Docker 상태 확인**
   ```bash
   docker ps
   # 정상 실행 시 빈 테이블 출력
   ```

### **3. 로컬 GitHub Actions 실행**

#### **A. 로컬 테스트 워크플로우 실행**
```bash
# 로컬 테스트만 실행
npm run act:local

# 또는 직접 실행
act workflow_dispatch -W .github/workflows/local-test.yml
```

#### **B. 테스트 워크플로우 실행**
```bash
# 테스트 워크플로우 실행
npm run act:test

# 또는 직접 실행
act workflow_dispatch -W .github/workflows/test-on-push.yml
```

#### **C. 배포 워크플로우 실행**
```bash
# 배포 워크플로우 실행
npm run act:deploy

# 또는 직접 실행
act workflow_dispatch -W .github/workflows/deploy-on-main.yml
```

### **4. 워크플로우별 설명**

#### **local-test.yml**
- **목적**: 로컬 환경에서만 테스트 실행
- **사용**: `npm run act:local`
- **내용**: 의존성 설치 → 종합 테스트 실행

#### **test-on-push.yml**
- **목적**: 테스트 전용 워크플로우
- **사용**: `npm run act:test`
- **내용**: 기본 테스트 + 종합 테스트

#### **deploy-on-main.yml**
- **목적**: 전체 배포 및 테스트 워크플로우
- **사용**: `npm run act:deploy`
- **내용**: 테스트 → 배포 → 검증

### **5. 로컬 실행 시 주의사항**

#### **환경 변수:**
- `.secrets` 파일에 더미 값 사용
- 실제 Cloudflare 배포는 로컬에서 실행하지 않음

#### **Docker 권한:**
- Docker Desktop이 실행 중이어야 함
- 컨테이너 실행 권한 필요

#### **리소스 사용:**
- Docker 컨테이너로 실행되므로 메모리/CPU 사용량 증가
- 로컬 테스트 후 컨테이너 정리 권장

### **6. 문제 해결**

#### **Docker 연결 오류:**
```bash
# Docker Desktop 실행 상태 확인
docker ps

# Docker 서비스 재시작
# Docker Desktop에서 Restart 클릭
```

#### **act 실행 오류:**
```bash
# act 버전 확인
act --version

# Docker 상태 확인
docker info

# 컨테이너 정리
docker system prune -f
```

#### **권한 오류:**
```bash
# Docker 그룹 확인
groups

# Docker 소켓 권한 확인
ls -la /var/run/docker.sock
```

### **7. 로컬 실행 vs GitHub 실행**

| 구분 | 로컬 실행 | GitHub 실행 |
|------|-----------|-------------|
| **환경** | Docker 컨테이너 | GitHub Runner |
| **속도** | 빠름 | 보통 |
| **리소스** | 로컬 리소스 사용 | GitHub 리소스 사용 |
| **보안** | 로컬 환경 | GitHub 보안 환경 |
| **용도** | 개발/테스트 | 실제 배포 |

### **8. 권장 사용법**

1. **개발 중**: `npm run act:local` - 빠른 테스트
2. **코드 검증**: `npm run act:test` - 전체 테스트
3. **배포 전**: `npm run act:deploy` - 전체 워크플로우 검증
4. **실제 배포**: GitHub에 push하여 자동 실행

## 🎯 결론

로컬에서 GitHub Actions를 실행하면:
- ✅ **빠른 피드백**: 코드 변경 후 즉시 테스트
- ✅ **오프라인 개발**: 인터넷 없이도 워크플로우 테스트
- ✅ **디버깅 용이**: 상세한 로그와 오류 확인
- ✅ **개발 효율성**: GitHub push 전에 문제 사전 발견

**Docker Desktop을 시작한 후 `npm run act:local`로 시작해보세요!** 🚀
