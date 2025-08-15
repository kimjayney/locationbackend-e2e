# GitHub Actions 설정 가이드

## 🚀 자동 배포 및 테스트 설정

### **1. GitHub Secrets 설정**

GitHub 저장소의 **Settings > Secrets and variables > Actions**에서 다음 시크릿을 설정해야 합니다:

#### **필수 Secrets:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 계정 ID

#### **CLOUDFLARE_API_TOKEN 생성 방법:**
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 접속
2. **My Profile** > **API Tokens** 클릭
3. **Create Token** 클릭
4. **Custom token** 선택
5. **Permissions** 설정:
   - **Account** > **Workers Scripts** > **Edit**
   - **Zone** > **Workers Routes** > **Edit**
6. **Account Resources** > **Include** > **Specific account** > 계정 선택
7. **Zone Resources** > **Include** > **All zones**
8. **Create Token** 클릭하여 토큰 생성

#### **CLOUDFLARE_ACCOUNT_ID 확인 방법:**
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 접속
2. 우측 상단의 계정 정보에서 **Account ID** 확인

### **2. 워크플로우 동작 방식**

#### **Main 브랜치 Push 시:**
1. ✅ **코드 체크아웃**
2. ✅ **Node.js 18 설정**
3. ✅ **의존성 설치**
4. ✅ **Wrangler 설치**
5. ✅ **Cloudflare 인증 설정**
6. ✅ **로컬 환경 테스트 실행**
7. ✅ **Production 환경 배포**
8. ✅ **배포 완료 대기 (10초)**
9. ✅ **Production 환경 테스트 실행**
10. ✅ **데이터베이스 데이터 검증**
11. ✅ **배포 및 테스트 요약**

#### **Pull Request 시:**
1. ✅ **코드 체크아웃**
2. ✅ **Node.js 18 설정**
3. ✅ **의존성 설치**
4. ✅ **기본 테스트 실행**
5. ✅ **종합 테스트 실행**

### **3. 수동 실행**

GitHub Actions 탭에서 **workflow_dispatch**를 통해 수동으로 실행할 수 있습니다.

### **4. 모니터링**

- **Actions 탭**: 모든 워크플로우 실행 기록 확인
- **실시간 로그**: 각 단계별 상세 로그 확인
- **성공/실패 알림**: GitHub에서 자동으로 알림

### **5. 문제 해결**

#### **일반적인 오류:**
- **인증 실패**: API 토큰과 계정 ID 확인
- **테스트 실패**: 로컬에서 먼저 테스트 실행
- **배포 실패**: wrangler.toml 설정 확인

#### **디버깅:**
- GitHub Actions 로그에서 상세 오류 메시지 확인
- 로컬에서 동일한 명령어 실행하여 문제 파악
