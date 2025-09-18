# GitHub Actions 설정 가이드
 
GitHub 저장소의 **Settings > Secrets and variables > Actions**에서 다음 시크릿을 설정해야 합니다:

#### **필수 Secrets:**
- `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare 계정 ID
 
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
  

#### **디버깅:**
- GitHub Actions 로그에서 상세 오류 메시지 확인
- 로컬에서 동일한 명령어 실행하여 문제 파악
